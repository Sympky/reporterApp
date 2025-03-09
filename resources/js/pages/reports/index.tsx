import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusIcon, FileTextIcon, DownloadIcon, PencilIcon, TrashIcon, RefreshCwIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Report {
  id: number;
  name: string;
  client: {
    id: number;
    name: string;
  };
  project: {
    id: number;
    name: string;
  };
  reportTemplate: {
    id: number;
    name: string;
  };
  status: string;
  generated_file_path: string | null;
  created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Reports',
    href: '/reports',
  },
];

export default function Index({ reports }: { reports: Report[] }) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'generated':
        return <Badge variant="secondary">Generated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      router.delete(route('reports.destroy', confirmDelete), {
        onSuccess: () => setConfirmDelete(null),
      });
    }
  };

  const handleRegenerate = (reportId: number) => {
    router.post(route('reports.regenerate', reportId));
  };
  
  // Check if the reports array has any items without required relationships
  const hasIncompleteReports = reports.some(
    report => !report.client || !report.project || !report.reportTemplate
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Reports" />
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Reports</h1>
          <Link href={route('reports.create')}>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
            <CardDescription>
              View and manage your generated reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No reports</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new report.</p>
                <div className="mt-6">
                  <Link href={route('reports.create')}>
                    <Button>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      New Report
                    </Button>
                  </Link>
                </div>
              </div>
            ) : hasIncompleteReports ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading report data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          <Link href={route('reports.show', report.id)} className="hover:underline">
                            {report.name}
                          </Link>
                        </TableCell>
                        <TableCell>{report.client?.name || 'Unknown client'}</TableCell>
                        <TableCell>{report.project?.name || 'Unknown project'}</TableCell>
                        <TableCell>{report.reportTemplate?.name || 'Unknown template'}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {report.generated_file_path && (
                              <Link href={route('reports.download', report.id)}>
                                <Button variant="outline" size="sm">
                                  <DownloadIcon className="w-4 h-4" />
                                  <span className="sr-only">Download</span>
                                </Button>
                              </Link>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRegenerate(report.id)}
                              title="Regenerate Report"
                            >
                              <RefreshCwIcon className="w-4 h-4" />
                              <span className="sr-only">Regenerate</span>
                            </Button>
                            <Link href={route('reports.edit', report.id)}>
                              <Button variant="outline" size="sm">
                                <PencilIcon className="w-4 h-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDelete(report.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone, and any generated files will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 