import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon, FileTextIcon, DownloadIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Template {
  id: number;
  name: string;
  description: string;
  file_path: string;
  created_at: string;
  created_by: {
    id: number;
    name: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Report Templates',
    href: '/report-templates',
  },
];

export default function Index({ templates }: { templates: Template[] }) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleDelete = () => {
    if (confirmDelete) {
      router.delete(route('report-templates.destroy', confirmDelete), {
        onSuccess: () => setConfirmDelete(null),
      });
    }
  };

  // Check if any templates have missing creator information
  const hasIncompleteTemplates = templates.some(
    template => !template.created_by
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Report Templates" />
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Report Templates</h1>
          <Link href={route('report-templates.create')}>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No templates</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new template.</p>
              <div className="mt-6">
                <Link href={route('report-templates.create')}>
                  <Button>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                </Link>
              </div>
            </div>
          ) : hasIncompleteTemplates ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Loading template data...</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>
                    Created by {template.created_by?.name || 'Unknown'} on{' '}
                    {new Date(template.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {template.description || 'No description provided.'}
                  </p>
                </CardContent>
                <Separator />
                <CardFooter className="flex justify-between py-4">
                  <div className="flex space-x-2">
                    <Link href={route('report-templates.download', template.id)}>
                      <Button variant="outline" size="sm">
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </Link>
                    <Link href={route('report-templates.edit', template.id)}>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDelete(template.id)}
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
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