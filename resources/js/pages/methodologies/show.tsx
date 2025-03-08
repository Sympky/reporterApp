import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';
import { ChevronLeft, PencilIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Methodology = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: {
    id: number;
    name: string;
  } | null;
  updated_by: {
    id: number;
    name: string;
  } | null;
};

interface PageProps {
  methodology: Methodology;
}

export default function ShowMethodology({ methodology }: PageProps) {
  // Setup breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Methodologies', href: '/methodologies' },
    { title: methodology.title, href: `/methodologies/${methodology.id}` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Methodology: ${methodology.title}`} />
      
      <div className="container py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/methodologies">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Methodologies
            </Button>
          </Link>
          <Link href={`/methodologies/${methodology.id}/edit`}>
            <Button variant="outline" size="sm">
              <PencilIcon className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{methodology.title}</CardTitle>
              <CardDescription>
                Created: {new Date(methodology.created_at).toLocaleString()} by {methodology.created_by?.name || 'Unknown'}
                <br />
                Updated: {new Date(methodology.updated_at).toLocaleString()} by {methodology.updated_by?.name || 'Unknown'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="markdown">
                <ReactMarkdown>
                  {methodology.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 