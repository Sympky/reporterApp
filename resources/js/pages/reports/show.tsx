import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, DownloadIcon, PencilIcon, RefreshCwIcon, CheckCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface Report {
  id: number;
  title: string;
  client_name: string;
  project_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  file_path: string | null;
  file_url: string | null;
  template_id: number;
  template_name: string;
  vulnerabilities: Vulnerability[];
}

interface Vulnerability {
  id: number;
  name: string;
  description: string;
  severity: string;
  cvss_score: number;
  status: string;
  remediation: string;
  references: string;
}

interface PageProps {
  report: Report;
}

export default function Show() {
  const { report } = usePage().props as PageProps;
  const [isGenerating, setIsGenerating] = useState(false);
  // Unused: const [activeTab, setActiveTab] = useState<string>('overview');
  // Unused: const [copied, setCopied] = useState(false);
  // Unused: const { csrf_token } = usePage().props as unknown;

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Reports',
      href: '/reports',
    },
    {
      title: report.title,
      href: `/reports/${report.id}`,
      current: true,
    },
  ];

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      await axios.post(`/reports/${report.id}/generate`);
      toast.success('Report generated successfully');
      router.reload();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Unused: const copyToClipboard = () => {
  //   navigator.clipboard.writeText(window.location.href);
  //   // Unused: setCopied(true);
  //   // Unused: setTimeout(() => setCopied(false), 2000);
  // };

  return (
    <AppLayout>
      <Head title={`Report: ${report.title}`} />
      <div className="container py-6">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator />}
                {breadcrumb.current ? (
                  <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={breadcrumb.href}>{breadcrumb.title}</Link>
                  </BreadcrumbLink>
                )}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center mt-4 mb-6">
          <h1 className="text-3xl font-bold">{report.title}</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/reports">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Reports
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/reports/${report.id}/edit`}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
                <CardDescription>
                  Created on {new Date(report.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Client</p>
                    <p>{report.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Project</p>
                    <p>{report.project_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Template</p>
                    <p>{report.template_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="capitalize">{report.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p>{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p>{new Date(report.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Report File</CardTitle>
                <CardDescription>Download or regenerate the report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.file_path ? (
                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                      <Link href={report.file_url || '#'} target="_blank">
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download Report
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={generateReport}
                      disabled={isGenerating}
                    >
                      <RefreshCwIcon className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                      {isGenerating ? 'Regenerating...' : 'Regenerate Report'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-4">
                      The report file hasn't been generated yet or generation failed. Click the "Regenerate" button to create the report file.
                    </p>
                    <Button
                      onClick={generateReport}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 