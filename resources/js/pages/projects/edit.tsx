import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { toast } from 'sonner';

// Define the Client type
type Client = {
  id: number;
  name: string;
};

// Define the Project type
type Project = {
  id: number;
  client_id: number;
  name: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
  notes: string | null;
  client: Client;
};

interface PageProps {
  project: Project;
  clients: Client[];
}

export default function EditProject({ project, clients }: PageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: `Edit: ${project.name}`, href: `/projects/${project.id}/edit` },
  ];

  // Setup form
  const { data, setData, errors, put } = useForm({
    client_id: project.client_id,
    name: project.name,
    description: project.description || '',
    status: project.status || 'Not Started',
    due_date: project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : '',
    notes: project.notes || '',
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(name as keyof typeof data, value);
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setData(name as keyof typeof data, value);
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    put(`/projects/${project.id}`, {
      onSuccess: () => {
        setIsSubmitting(false);
        toast.success('Project updated successfully');
      },
      onError: () => {
        setIsSubmitting(false);
        toast.error('Failed to update project');
      }
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Project: ${project.name}`} />
      
      <div className="container py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Project
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Project</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Edit project details
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Client</Label>
                    <Select
                      value={data.client_id.toString()}
                      onValueChange={(value) => handleSelectChange('client_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.client_id && <p className="text-sm text-red-500">{errors.client_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={handleChange}
                      required
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={data.description}
                    onChange={handleChange}
                    rows={5}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={data.notes}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Add any additional notes, observations, or reminders about this project"
                  />
                  {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={data.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={data.due_date}
                      onChange={handleChange}
                    />
                    {errors.due_date && <p className="text-sm text-red-500">{errors.due_date}</p>}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 