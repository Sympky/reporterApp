import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusIcon, FileTextIcon, DownloadIcon, PencilIcon, TrashIcon, RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Report {
  id: number;
  name: string;
  client?: {
    id: number;
    name: string;
  } | null;
  project?: {
    id: number;
    name: string;
  } | null;
  reportTemplate?: {
    id: number;
    name: string;
  } | null;
  status: string;
  generated_file_path: string | null;
  file_exists?: boolean;
  created_at: string;
  generate_from_scratch?: boolean;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Reports',
    href: '/reports',
  },
];

export default function Index({ reports, pagination, error }: { reports: Report[], pagination: Pagination, error: any }) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const { csrf_token } = usePage().props as any;
  
  // Debug logging
  console.log('Reports data received:', reports);
  console.log('Reports count:', reports?.length || 0);
  console.log('Pagination:', pagination);
  console.log('Error:', error);
  
  // Ensure reports is always an array
  const safeReports = Array.isArray(reports) ? reports : [];
  
  // Pagination data
  const { current_page, per_page, total } = pagination || { current_page: 1, per_page: 10, total: 0 };
  const totalPages = Math.ceil(total / per_page);
  
  // Function to handle page change
  const changePage = (page: number) => {
    router.get(route('reports.index'), { page, per_page }, {
      preserveState: true,
      preserveScroll: true,
      only: ['reports', 'pagination']
    });
  };
  
  // Function to handle items per page change
  const changePerPage = (newPerPage: string) => {
    router.get(route('reports.index'), { page: 1, per_page: newPerPage }, {
      preserveState: true,
      preserveScroll: false,
      only: ['reports', 'pagination']
    });
  };
  
  // Function to handle file download
  const downloadReport = (reportId: number) => {
    // Open in a new window which will force download
    window.open(`/reports/${reportId}/download`, '_blank');
  };

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
  
  // Check if the reports array is empty
  const isLoading = safeReports.length === 0 && total === 0;

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
            {isLoading ? (
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
                    {safeReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          <Link href={route('reports.show', report.id)} className="hover:underline">
                            {report.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {report.client ? (
                            <Link href={route('clients.show', report.client.id)} className="hover:underline">
                              {report.client.name}
                            </Link>
                          ) : (
                            'Unknown client'
                          )}
                        </TableCell>
                        <TableCell>
                          {report.project ? (
                            <Link href={route('projects.show', report.project.id)} className="hover:underline">
                              {report.project.name}
                            </Link>
                          ) : (
                            'Unknown project'
                          )}
                        </TableCell>
                        <TableCell>
                          {report.generate_from_scratch 
                            ? <Badge variant="outline">Generated From Scratch</Badge>
                            : (report.reportTemplate?.name ?? 'Unknown template')
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {report.file_exists && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => downloadReport(report.id)}
                              >
                                <DownloadIcon className="w-4 h-4" />
                                <span className="sr-only">Download</span>
                              </Button>
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

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-6 pt-6">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{safeReports.length}</span> of{' '}
                      <span className="font-medium">{total}</span> reports
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">Items per page</span>
                      <Select 
                        value={per_page.toString()} 
                        onValueChange={changePerPage}
                      >
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue placeholder={per_page.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(current_page - 1)}
                      disabled={current_page <= 1}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      <span className="sr-only">Previous Page</span>
                    </Button>
                    <div className="text-sm">
                      Page {current_page} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(current_page + 1)}
                      disabled={current_page >= totalPages}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                      <span className="sr-only">Next Page</span>
                    </Button>
                  </div>
                </div>
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