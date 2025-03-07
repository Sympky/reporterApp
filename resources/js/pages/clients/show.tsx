import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ColumnDef } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define the types for Client and Project
type Client = {
  id: number;
  name: string;
  description: string | null;
  emails: string | null;
  phone_numbers: string | null;
  addresses: string | null;
  website_urls: string | null;
  other_contact_info: string | null;
};

type Project = {
  id: number;
  client_id: number;
  name: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
  vulnerability_count: number;
};

interface PageProps {
  client: Client;
  projects: Project[];
}

// Helper function to format array values from JSON string
const formatArrayValue = (value: unknown): string => {
  if (!value) return '';
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      return value;
    } catch (e) {
      return value;
    }
  }
  
  return String(value);
};

// Define columns for the projects table
const projectColumns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Project Name",
    cell: ({ row }) => {
      const project = row.original;
      return (
        <Link 
          href={`/projects/${project.id}`}
          className="text-primary hover:underline"
        >
          {project.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string | null;
      return status ? (
        <Badge 
          variant={
            status === "Completed" ? "success" : 
            status === "In Progress" ? "warning" : 
            status === "Not Started" ? "destructive" : 
            "outline"
          }
        >
          {status}
        </Badge>
      ) : '-';
    },
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => {
      const dueDate = row.getValue("due_date") as string | null;
      return dueDate ? new Date(dueDate).toLocaleDateString() : '-';
    },
  },
  {
    accessorKey: "vulnerability_count",
    header: "Vulnerabilities",
    cell: ({ row }) => {
      const count = row.getValue("vulnerability_count") as number;
      return count || 0;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const project = row.original;
      return (
        <div className="flex space-x-2">
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline" size="sm">
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      );
    },
  },
];

// Add Project Dialog Component
function AddProjectDialog({ clientId }: { clientId: number }) {
  const [open, setOpen] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({
    client_id: clientId,
    name: '',
    description: '',
    status: 'Not Started',
    due_date: '',
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post('/projects', {
      onSuccess: () => {
        setOpen(false);
        reset();
        // Reload the page to show the new project
        window.location.reload();
      },
      onError: (errors) => {
        console.error('Failed to add project:', errors);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Create a new project for this client. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
              />
              {errors.name && (
                <div className="text-sm text-red-500">{errors.name}</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                rows={3}
              />
              {errors.description && (
                <div className="text-sm text-red-500">{errors.description}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                {errors.status && (
                  <div className="text-sm text-red-500">{errors.status}</div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={data.due_date}
                  onChange={(e) => setData('due_date', e.target.value)}
                />
                {errors.due_date && (
                  <div className="text-sm text-red-500">{errors.due_date}</div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              Save Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientShow({ client, projects }: PageProps) {
  return (
    <AppLayout>
      <Head title={`Client: ${client.name}`} />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <div className="text-sm text-muted-foreground mt-1">
              Client details and projects
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/clients/${client.id}/edit`}>
              <Button variant="outline">
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit Client
              </Button>
            </Link>
            <AddProjectDialog clientId={client.id} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Basic client details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-semibold text-sm">Description</div>
                <div>{client.description || 'No description provided'}</div>
              </div>
              <div>
                <div className="font-semibold text-sm">Email Addresses</div>
                <div>{formatArrayValue(client.emails) || 'None provided'}</div>
              </div>
              <div>
                <div className="font-semibold text-sm">Phone Numbers</div>
                <div>{formatArrayValue(client.phone_numbers) || 'None provided'}</div>
              </div>
              <div>
                <div className="font-semibold text-sm">Addresses</div>
                <div>{formatArrayValue(client.addresses) || 'None provided'}</div>
              </div>
              <div>
                <div className="font-semibold text-sm">Websites</div>
                <div>{formatArrayValue(client.website_urls) || 'None provided'}</div>
              </div>
              <div>
                <div className="font-semibold text-sm">Other Contact Information</div>
                <div>{formatArrayValue(client.other_contact_info) || 'None provided'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projects Summary</CardTitle>
              <CardDescription>Overview of client projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Total Projects</div>
                  <div className="text-2xl font-bold">{projects.length}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Active Projects</div>
                  <div className="text-2xl font-bold">
                    {projects.filter(p => p.status === 'In Progress').length}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <div className="text-2xl font-bold">
                    {projects.filter(p => p.status === 'Completed').length}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Total Vulnerabilities</div>
                  <div className="text-2xl font-bold">
                    {projects.reduce((sum, project) => sum + (project.vulnerability_count || 0), 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Projects</CardTitle>
            <CardDescription>All projects for {client.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={projectColumns} 
              data={projects} 
              placeholder="No projects found."
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 