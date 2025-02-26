import { NextRequest, NextResponse } from "next/server";
import { emailParserSchema, type EmailParserResponse } from "@/validations/email-parser.schema";
import OpenAI from "openai";

// Type guard for non-null string
const isString = (value: string | null | undefined): value is string => {
  return typeof value === 'string';
};

// Helper function to parse job requirements using OpenAI
const parseJobRequirements = async (content: string, apiKey: string) => {
  const openai = new OpenAI({
    apiKey,
  });

  const prompt = `
    Extract the following information from this job description:
    1. A list of required technical skills and technologies
    2. Years of experience required (if specified)
    3. Employment type (e.g., full-time, part-time, contract)

    Format the response as JSON with these fields:
    {
      "skills": ["skill1", "skill2"],
      "experienceYears": number,
      "employmentType": "type"
    }

    Job Description:
    ${content}
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts structured information from job descriptions. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      skills: response.skills || [],
      experienceYears: response.experienceYears || 0,
      employmentType: response.employmentType?.toLowerCase().replace(/\s+/g, '-') || 'not-specified',
    };
  } catch (error) {
    console.error("OpenAI parsing error:", error);
    // Fallback to basic parsing if OpenAI fails
    return {
      skills: [],
      experienceYears: 0,
      employmentType: 'not-specified',
    };
  }
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { 
        success: false, 
        error: "OpenAI API key not configured" 
      },
      { status: 500 }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    
    // Validate input
    const validatedData = emailParserSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid input: " + validatedData.error.errors[0].message 
        },
        { status: 400 }
      );
    }

    const { subject, content } = validatedData.data;

    // Parse job requirements using OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!isString(apiKey)) {
      throw new Error("OpenAI API key not configured");
    }
    const { skills, experienceYears, employmentType } = await parseJobRequirements(content, apiKey);

    // Return success response
    const response: EmailParserResponse = {
      success: true,
      data: {
        skills,
        experienceYears,
        employmentType,
        rawContent: content,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Error processing email:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    );
  }
}
