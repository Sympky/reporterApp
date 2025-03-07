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
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { projectColumns } from '@/components/projectColumns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';

// Define the Project interface similar to how we have it for clients
type Project = {
  id: number;
  client_id: number;
  name: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
  vulnerability_count: number;
  client_name: string;
};

interface PageProps {
  projects?: Project[];
  clients?: {
    id: number;
    name: string;
  }[];
}

// EditProjectDialog component
export function EditProjectDialog({ project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, setData, put, errors } = useForm({
    id: project.id,
    client_id: project.client_id,
    name: project.name,
    description: project.description || '',
    status: project.status || '',
    due_date: project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setData(id as any, value);
  };

  const handleSelectChange = (id: string, value: string) => {
    setData(id as any, value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    put(`/projects/${project.id}`, {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        toast.success('Project updated successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while updating the project.');
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
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select
                  value={String(data.client_id)}
                  onValueChange={(value) => handleSelectChange('client_id', value)}
                >
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {(usePage().props as PageProps).clients?.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client_id && <p className="text-red-500 text-sm">{errors.client_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={data.description}
                onChange={handleChange as any}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={data.status || ''}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={data.due_date}
                  onChange={handleChange}
                />
                {errors.due_date && <p className="text-red-500 text-sm">{errors.due_date}</p>}
              </div>
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

// DeleteProjectButton component
export function DeleteProjectButton({ project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setIsSubmitting(true);
    setError(null);

    fetch(`/api/projects/${project.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete project');
        }
        setIsSubmitting(false);
        setIsOpen(false);
        toast.success('Project deleted successfully!');
        window.location.reload();
      })
      .catch((err) => {
        setIsSubmitting(false);
        setError(err.message || 'An error occurred while deleting the project.');
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
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {project.name}?
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

// CreateProjectDialog component
export function CreateProjectDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, setData, post, errors, reset } = useForm({
    client_id: '',
    name: '',
    description: '',
    status: 'Not Started',
    due_date: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setData(id as any, value);
  };

  const handleSelectChange = (id: string, value: string) => {
    setData(id as any, value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    post('/projects', {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        reset();
        toast.success('Project created successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while creating the project.');
        }
      },
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Project
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Add a new project</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select
                  value={data.client_id}
                  onValueChange={(value) => handleSelectChange('client_id', value)}
                >
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {(usePage().props as PageProps).clients?.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client_id && <p className="text-red-500 text-sm">{errors.client_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={data.description}
                onChange={handleChange as any}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={data.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={data.due_date}
                  onChange={handleChange}
                />
                {errors.due_date && <p className="text-red-500 text-sm">{errors.due_date}</p>}
              </div>
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
                {isSubmitting ? 'Creating...' : 'Create Project'}
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
    title: 'Projects',
    href: '/projects',
  },
];

// Main Projects Index Component
export default function ProjectsIndex() {
  const { projects = [] } = usePage().props as PageProps;
  
  // Create a wrapper component to populate the actions column
  const ProjectColumns = [...projectColumns];
  
  // Override the actions cell to use our actual components
  const actionsColumn = ProjectColumns.find(col => col.id === 'actions');
  if (actionsColumn) {
    actionsColumn.cell = ({ row }) => {
      const project = row.original;
      return (
        <div className="flex space-x-2">
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          <EditProjectDialog project={project as unknown as Project} />
          <DeleteProjectButton project={project as unknown as Project} />
        </div>
      );
    };
  }
  
  // Convert projects to match the expected type for the DataTable
  const formattedProjects = projects.map(project => ({
    id: project.id,
    client_id: project.client_id,
    client_name: project.client_name,
    name: project.name,
    status: project.status || '', // Convert null to empty string
    due_date: project.due_date || '', // Convert null to empty string
    vulnerability_count: project.vulnerability_count,
    description: project.description // Keep this for our dialog components
  }));
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Projects" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Projects</h1>
          <CreateProjectDialog />
        </div>
        
        <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border">
          <DataTable columns={ProjectColumns} data={formattedProjects} />
        </div>
      </div>
    </AppLayout>
  );
} 