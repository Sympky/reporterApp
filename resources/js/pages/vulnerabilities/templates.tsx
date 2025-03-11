import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { useForm, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, PencilIcon, TrashIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { Template, templateColumns } from '@/components/templateColumns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { type BreadcrumbItem } from '@/types';

// Type definition for Template (already defined in templateColumns.tsx)
type Template = {
  id: number;
  name: string;
  description: string;
  severity: string;
  cvss: number | null;
  cve: string;
  remediation: string | null;
  impact: string | null;
  references: string | null;
  tags: string | null;
};

// Type definition for the page props
interface PageProps {
  templates?: Template[];
  projects?: {
    id: number;
    name: string;
    client_name: string;
  }[];
}

// EditTemplateDialog component
export function EditTemplateDialog({ template }: { template: Template }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, setData, put, errors } = useForm({
    id: template.id,
    name: template.name,
    description: template.description,
    severity: template.severity,
    cvss: template.cvss?.toString() || '',
    cve: template.cve || '',
    recommendations: template.remediation || '',
    impact: template.impact || '',
    references: template.references || '',
    tags: template.tags || '[]',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setData(id as keyof typeof data, value);
  };

  const handleSelectChange = (id: string, value: string) => {
    setData(id as keyof typeof data, value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    put(`/vulnerability-templates/${template.id}`, {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        toast.success('Template updated successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while updating the template.');
        }
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
      >
        <PencilIcon className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Vulnerability Template</DialogTitle>
            <DialogDescription>Update vulnerability template details</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Title</Label>
              <Input
                id="name"
                value={data.name}
                onChange={handleChange}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={data.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={data.severity}
                  onValueChange={(value) => handleSelectChange('severity', value)}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.severity && <p className="text-red-500 text-sm">{errors.severity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvss">CVSS Score (0-10)</Label>
                <Input
                  id="cvss"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={data.cvss}
                  onChange={handleChange}
                />
                {errors.cvss && <p className="text-red-500 text-sm">{errors.cvss}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cve">CVE ID</Label>
              <Input
                id="cve"
                value={data.cve}
                onChange={handleChange}
              />
              {errors.cve && <p className="text-red-500 text-sm">{errors.cve}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Remediation</Label>
              <textarea
                id="recommendations"
                value={data.recommendations}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.recommendations && <p className="text-red-500 text-sm">{errors.recommendations}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impact</Label>
              <textarea
                id="impact"
                value={data.impact}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.impact && <p className="text-red-500 text-sm">{errors.impact}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="references">References</Label>
              <Input
                id="references"
                value={data.references}
                onChange={handleChange}
                placeholder="URL or reference information"
              />
              {errors.references && <p className="text-red-500 text-sm">{errors.references}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={typeof data.tags === 'string' && data.tags.startsWith('[') ? 
                  JSON.parse(data.tags).join(', ') : 
                  data.tags}
                onChange={(e) => {
                  // Convert comma-separated string to JSON array
                  const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                  setData('tags', JSON.stringify(tagsArray));
                }}
                placeholder="Example: sql-injection, xss, authentication"
              />
              {errors.tags && <p className="text-red-500 text-sm">{errors.tags}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                ref={closeRef}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// DeleteTemplateButton component
export function DeleteTemplateButton({ template }: { template: Template }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setIsSubmitting(true);
    setError(null);

    fetch(`/api/vulnerability-templates/${template.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete template');
        }
        setIsSubmitting(false);
        setIsOpen(false);
        toast.success('Template deleted successfully!');
        window.location.reload();
      })
      .catch((err) => {
        setIsSubmitting(false);
        setError(err.message || 'An error occurred while deleting the template.');
      });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 text-red-500"
      >
        <TrashIcon className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{template.name}"?
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ApplyTemplateButton component
export function ApplyTemplateButton({ template }: { template: Template }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, setData, post, errors, reset } = useForm({
    template_id: template.id,
    project_id: '',
    discovered_at: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setData(id as keyof typeof data, value);
  };

  const handleSelectChange = (id: string, value: string) => {
    setData(id as keyof typeof data, value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    post('/vulnerability-templates/apply', {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        reset();
        toast.success('Template applied to project successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while applying the template.');
        }
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 text-green-500"
      >
        <ArrowRightCircleIcon className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply Template to Project</DialogTitle>
            <DialogDescription>
              Apply "{template.name}" to a specific project
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">Select Project</Label>
              <Select
                value={data.project_id}
                onValueChange={(value) => handleSelectChange('project_id', value)}
              >
                <SelectTrigger id="project_id">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {(usePage().props as PageProps).projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name} ({project.client_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.project_id && <p className="text-red-500 text-sm">{errors.project_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discovered_at">Discovery Date</Label>
              <Input
                id="discovered_at"
                type="date"
                value={data.discovered_at}
                onChange={handleChange}
              />
              {errors.discovered_at && <p className="text-red-500 text-sm">{errors.discovered_at}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                ref={closeRef}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Applying...' : 'Apply Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// CreateTemplateDialog component
export function CreateTemplateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, setData, post, errors, reset } = useForm({
    name: '',
    description: '',
    severity: 'medium',
    cvss: '',
    cve: '',
    recommendations: '',
    impact: '',
    references: '',
    tags: '[]',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setData(id as keyof typeof data, value);
  };

  const handleSelectChange = (id: string, value: string) => {
    setData(id as keyof typeof data, value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    post('/vulnerability-templates', {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        reset();
        toast.success('Template created successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while creating the template.');
        }
      },
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Template
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Vulnerability Template</DialogTitle>
            <DialogDescription>Add a new reusable vulnerability template</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Title</Label>
              <Input
                id="name"
                value={data.name}
                onChange={handleChange}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={data.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={data.severity}
                  onValueChange={(value) => handleSelectChange('severity', value)}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.severity && <p className="text-red-500 text-sm">{errors.severity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvss">CVSS Score (0-10)</Label>
                <Input
                  id="cvss"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={data.cvss}
                  onChange={handleChange}
                />
                {errors.cvss && <p className="text-red-500 text-sm">{errors.cvss}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cve">CVE ID</Label>
              <Input
                id="cve"
                value={data.cve}
                onChange={handleChange}
              />
              {errors.cve && <p className="text-red-500 text-sm">{errors.cve}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Remediation</Label>
              <textarea
                id="recommendations"
                value={data.recommendations}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.recommendations && <p className="text-red-500 text-sm">{errors.recommendations}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impact</Label>
              <textarea
                id="impact"
                value={data.impact}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.impact && <p className="text-red-500 text-sm">{errors.impact}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="references">References</Label>
              <Input
                id="references"
                value={data.references}
                onChange={handleChange}
                placeholder="URL or reference information"
              />
              {errors.references && <p className="text-red-500 text-sm">{errors.references}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags_input"
                value={typeof data.tags === 'string' && data.tags.startsWith('[') ? 
                  JSON.parse(data.tags).join(', ') : 
                  data.tags}
                onChange={(e) => {
                  // Convert comma-separated string to JSON array
                  const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                  setData('tags', JSON.stringify(tagsArray));
                }}
                placeholder="Example: sql-injection, xss, authentication"
              />
              {errors.tags && <p className="text-red-500 text-sm">{errors.tags}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                ref={closeRef}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Vulnerability Templates',
    href: '/vulnerability-templates',
  },
];

// Main Templates Index Component
export default function TemplatesIndex() {
  const { templates = [] } = usePage().props as PageProps;
  
  // Create a wrapper component to populate the actions column
  const TemplateColumns = [...templateColumns];
  
  // Override the actions cell to use our actual components
  const actionsColumn = TemplateColumns.find(col => col.id === 'actions');
  if (actionsColumn) {
    actionsColumn.cell = ({ row }) => {
      const template = row.original;
      return (
        <div className="flex items-center space-x-2">
          <EditTemplateDialog template={template as unknown as Template} />
          <ApplyTemplateButton template={template as unknown as Template} />
          <DeleteTemplateButton template={template as unknown as Template} />
        </div>
      );
    };
  }
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Vulnerability Templates" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Vulnerability Templates</h1>
            <p className="text-muted-foreground">Reusable vulnerability templates that can be applied to any project</p>
          </div>
          <CreateTemplateDialog />
        </div>
        
        <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border">
          <DataTable columns={TemplateColumns} data={templates} />
        </div>
      </div>
    </AppLayout>
  );
} 