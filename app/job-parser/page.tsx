import { JobRequirementsParser } from '@/components/JobRequirementsParser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function JobParserPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Job Requirements Parser</h1>
        <p className="text-muted-foreground">
          Parse job requirements from job descriptions or emails to extract key information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Example Format</CardTitle>
          <CardDescription>
            The parser works best with text in the following format:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm">
{`We are looking for a Software Engineer with the following qualifications:

Skills:
- JavaScript, TypeScript
- React, Node.js
- AWS, Docker

Requirements:
- 5 years of experience
- Full-time position`}
          </pre>
        </CardContent>
      </Card>

      <JobRequirementsParser />
    </div>
  );
}
