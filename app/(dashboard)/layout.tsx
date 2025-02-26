import { FileText, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6" />
              <span className="font-bold">Home</span>
            </Link>
            <Link href="/job-parser" className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span className="font-bold">Job Parser</span>
            </Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
