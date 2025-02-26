/// <reference types="jest" />

import { POST } from "@/app/api/email-parser/route";
import { NextRequest } from "next/server";

// Mock NextRequest
jest.mock('next/server', () => {
  const mockRequest = {
    json: jest.fn(),
    cookies: new Map(),
    geo: {},
    ip: '',
    nextUrl: new URL('http://localhost:3000'),
    url: 'http://localhost:3000',
    headers: new Headers()
  };

  return {
    NextRequest: jest.fn().mockImplementation(() => mockRequest),
    NextResponse: {
      json: jest.fn().mockImplementation((body, init) => ({
        status: init?.status || 200,
        json: async () => body,
      })),
    },
  };
});

const mockRequest = jest.requireMock('next/server').NextRequest();
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

// Extend PrismaClient type for mocking
type MockPrismaClient = {
  email: {
    create: jest.Mock;
  };
  jobRequirementsParsed: {
    create: jest.Mock;
  };
};

// Mock NextAuth and authOptions
jest.mock("next-auth");
jest.mock("@/lib/auth", () => ({
  authOptions: {}
}));
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

// Mock Prisma
const mockPrisma: MockPrismaClient = {
  email: {
    create: jest.fn(),
  },
  jobRequirementsParsed: {
    create: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock Upstash Redis
const mockLimit = jest.fn();
jest.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    }),
  },
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: mockLimit
  }))
}));

describe("Email Parser API", () => {
  const mockSession: Session = {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockEmail = {
    subject: "Software Engineer Position",
    content: `
      We are looking for a Software Engineer with the following qualifications:
      
      Skills:
      - JavaScript, TypeScript
      - React, Node.js
      - AWS, Docker
      
      Requirements:
      - 5 years of experience
      - Full-time position
    `,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
  });

  it("should successfully parse email and return requirements", async () => {
    const createdEmail = {
      id: "test-email-id",
      userId: mockSession.user.id,
      ...mockEmail,
    };

    const parsedRequirements = {
      id: "test-parsed-id",
      emailId: createdEmail.id,
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "AWS", "Docker"],
      experienceYears: 5,
      employmentType: "full-time",
      rawContent: mockEmail.content,
    };

    // Mock Prisma responses
    mockPrisma.email.create.mockResolvedValue(createdEmail);
    mockPrisma.jobRequirementsParsed.create.mockResolvedValue(parsedRequirements);

    mockRequest.json.mockResolvedValueOnce(mockEmail);
    const request = new NextRequest("http://localhost:3000/api/email-parser");

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      skills: expect.arrayContaining(["JavaScript", "TypeScript", "React", "Node.js", "AWS", "Docker"]),
      experienceYears: 5,
      employmentType: "full-time",
    });
  });

  it("should return 401 when user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    mockRequest.json.mockResolvedValueOnce(mockEmail);
    const request = new NextRequest("http://localhost:3000/api/email-parser");

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 for invalid input", async () => {
    mockRequest.json.mockResolvedValueOnce({ subject: "", content: "" });
    const request = new NextRequest("http://localhost:3000/api/email-parser");

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Invalid input");
  });

  it("should handle rate limiting", async () => {
    mockLimit.mockResolvedValueOnce({ success: false });

    mockRequest.json.mockResolvedValueOnce(mockEmail);
    const request = new NextRequest("http://localhost:3000/api/email-parser");

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Too many requests");
  });

  it("should handle server errors", async () => {
    mockPrisma.email.create.mockRejectedValueOnce(new Error("Database error"));

    mockRequest.json.mockResolvedValueOnce(mockEmail);
    const request = new NextRequest("http://localhost:3000/api/email-parser");

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Internal server error");
  });

  it("should handle parsing edge cases with mixed content", async () => {
    const edgeCaseEmail = {
      subject: "Job Position",
      content: `
        Looking for someone.
        Experience: Some experience needed
        Type: Hybrid
        Skills mentioned somewhere: python
      `,
    };

    const createdEmail = {
      id: "test-email-id",
      userId: mockSession.user.id,
      ...edgeCaseEmail,
    };

    const parsedRequirements = {
      id: "test-parsed-id",
      emailId: createdEmail.id,
      skills: ["python"],
      experienceYears: 0,
      employmentType: "not-specified",
      rawContent: edgeCaseEmail.content,
    };

    mockPrisma.email.create.mockResolvedValue(createdEmail);
    mockPrisma.jobRequirementsParsed.create.mockResolvedValue(parsedRequirements);

    mockRequest.json.mockResolvedValueOnce(edgeCaseEmail);
    const request = new NextRequest("http://localhost:3000/api/email-parser");

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      skills: ["python"],
      experienceYears: 0,
      employmentType: "not-specified",
      rawContent: expect.any(String),
    });
  });
});
