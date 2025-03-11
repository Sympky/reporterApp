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
  template_id?: number | null;
  generation_method?: 'from_scratch' | 'from_template';
  generate_from_scratch?: boolean; // For backward compatibility
  clients: Client[];
  projects: Project[];
}

export default function SelectClientProject({ 
  template_id, 
  generation_method = 'from_scratch',
  generate_from_scratch = false, 
  clients, 
  projects 
}: Props) {
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
  
  // Prioritize generation_method over the older generate_from_scratch flag
  // This ensures backward compatibility while moving forward with the new approach
  const effectiveGenerationMethod = generation_method || (generate_from_scratch ? 'from_scratch' : 'from_template');
  
  const { data, setData, post, processing, errors } = useForm({
    template_id: template_id?.toString() || '',
    client_id: '',
    project_id: '',
    generation_method: effectiveGenerationMethod,
    generate_from_scratch: effectiveGenerationMethod === 'from_scratch', // For backward compatibility
  });

  // Ensure consistency between template_id and generation_method
  useEffect(() => {
    // If template_id is provided, enforce from_template generation method
    if (template_id) {
      setData('generation_method', 'from_template');
      setData('generate_from_scratch', false);
    }
  }, [setData, template_id]);
  
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
  }, [data.client_id, data.project_id, projects, setData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure consistency between template_id and generation_method
    if (data.template_id && data.template_id !== '') {
      setData('generation_method', 'from_template');
      setData('generate_from_scratch', false);
    } else {
      setData('generation_method', 'from_scratch');
      setData('generate_from_scratch', true);
    }
    
    // Submit after a short delay to ensure state is updated
    setTimeout(() => {
      // Use post data but also include query parameters for better direct access
      const url = route('reports.add-details') + 
        `?template_id=${data.template_id}&client_id=${data.client_id}&project_id=${data.project_id}` +
        `&generation_method=${data.generation_method}` +
        `&generate_from_scratch=${data.generation_method === 'from_scratch' ? '1' : '0'}`; // For backward compatibility
      
      post(url);
    }, 0);
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
            Back to generation method selection
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create New Report</h1>
          <p className="text-gray-500">Step 2 of 3: Select the client and project for your report</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Client & Project</CardTitle>
              <CardDescription>
                Choose the client and project for this report.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="client-select" className="block mb-2">Client</Label>
                  <Select 
                    value={data.client_id} 
                    onValueChange={(value) => setData('client_id', value)}
                  >
                    <SelectTrigger id="client-select" className="w-full">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.client_id && (
                    <div className="text-red-500 text-sm mt-1">{errors.client_id}</div>
                  )}
                </div>

                <div>
                  <Label htmlFor="project-select" className="block mb-2">Project</Label>
                  <Select 
                    value={data.project_id} 
                    onValueChange={(value) => setData('project_id', value)}
                    disabled={!data.client_id || filteredProjects.length === 0}
                  >
                    <SelectTrigger id="project-select" className="w-full">
                      <SelectValue placeholder={!data.client_id ? "Select a client first" : "Select a project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.project_id && (
                    <div className="text-red-500 text-sm mt-1">{errors.project_id}</div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 rounded-md p-4 mt-4">
                <h3 className="font-medium mb-2">Generation Method:</h3>
                <p className="text-sm">
                  {data.generation_method === 'from_scratch' 
                    ? 'Generate from scratch (creating a new document)' 
                    : 'Use template (filling in data to a template)'}
                  
                  {data.generation_method === 'from_template' && data.template_id && (
                    <span className="font-medium"> - Template ID: {data.template_id}</span>
                  )}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={route('reports.create')}>
                <Button variant="outline" type="button">
                  Back
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