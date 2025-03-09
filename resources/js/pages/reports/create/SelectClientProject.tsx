import { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Client {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
  client_id: number;
}

interface Props {
  template_id: number;
  generate_from_scratch?: boolean;
  clients: Client[];
  projects: Project[];
}

export default function SelectClientProject({ template_id, generate_from_scratch = false, clients, projects }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Reports',
      href: '/reports',
    },
    {
      title: 'Create Report',
      href: '/reports/create',
    },
    {
      title: 'Select Client & Project',
      href: '#',
    },
  ];

  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  
  const { data, setData, post, processing, errors } = useForm({
    template_id: template_id?.toString() || '',
    client_id: '',
    project_id: '',
    generate_from_scratch: generate_from_scratch,
  });

  useEffect(() => {
    // When client_id changes, filter the projects
    if (data.client_id) {
      const clientProjects = projects.filter(
        (project) => project.client_id === parseInt(data.client_id)
      );
      setFilteredProjects(clientProjects);
      
      // Reset project selection if the current selection doesn't belong to the selected client
      const projectBelongsToClient = clientProjects.some(
        (project) => project.id.toString() === data.project_id
      );
      
      if (!projectBelongsToClient) {
        setData('project_id', '');
      }
    } else {
      setFilteredProjects([]);
      setData('project_id', '');
    }
  }, [data.client_id, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use post data but also include query parameters for better direct access
    const url = route('reports.add-details') + 
      `?template_id=${data.template_id}&client_id=${data.client_id}&project_id=${data.project_id}` +
      `&generate_from_scratch=${data.generate_from_scratch ? '1' : '0'}`;
    
    post(url);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Report - Select Client & Project" />
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link 
            href={route('reports.create')} 
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to template selection
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create New Report</h1>
          <p className="text-gray-500">Step 2 of 3: Select client and project</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Choose Client and Project</CardTitle>
              <CardDescription>
                Select the client and project for which this report will be generated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select 
                  value={data.client_id} 
                  onValueChange={(value) => setData('client_id', value)}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <SelectItem value="no-clients" disabled>
                        No clients available
                      </SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.client_id && (
                  <p className="text-sm text-red-500">{errors.client_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select 
                  value={data.project_id} 
                  onValueChange={(value) => setData('project_id', value)}
                  disabled={!data.client_id || filteredProjects.length === 0}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder={!data.client_id ? "Select a client first" : "Select a project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProjects.length === 0 ? (
                      <SelectItem value="no-projects" disabled>
                        {!data.client_id ? "Select a client first" : "No projects available for this client"}
                      </SelectItem>
                    ) : (
                      filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.project_id && (
                  <p className="text-sm text-red-500">{errors.project_id}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={route('reports.create')}>
                <Button variant="outline" type="button">
                  Previous Step
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={processing || !data.client_id || !data.project_id}
                className="flex items-center"
              >
                Next Step
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
} 