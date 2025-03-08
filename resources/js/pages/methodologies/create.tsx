import { useState, FormEvent } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type BreadcrumbItem } from '@/types';
import { ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CreateMethodology() {
  const [activeTab, setActiveTab] = useState('write');

  // Setup breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Methodologies', href: '/methodologies' },
    { title: 'Create', href: '/methodologies/create' },
  ];

  const { data, setData, post, processing, errors, reset } = useForm({
    title: '',
    content: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post('/methodologies', {
      onSuccess: () => reset(),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Methodology" />
      
      <div className="container py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/methodologies">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Methodologies
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create Methodology</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Methodology Details</CardTitle>
              <CardDescription>
                Create a new methodology. You can use Markdown to format your content.
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={data.title}
                    onChange={e => setData('title', e.target.value)}
                    required
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  
                  <div className="w-full">
                    <div className="flex mb-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <button
                        type="button"
                        className={`flex-1 px-4 py-2 text-center rounded-md ${activeTab === 'write' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                        onClick={() => setActiveTab('write')}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        className={`flex-1 px-4 py-2 text-center rounded-md ${activeTab === 'preview' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                        onClick={() => setActiveTab('preview')}
                      >
                        Preview
                      </button>
                    </div>
                    
                    {activeTab === 'write' ? (
                      <Textarea
                        id="content"
                        value={data.content}
                        onChange={e => setData('content', e.target.value)}
                        rows={20}
                        placeholder="# Methodology Title

## Section 1
This is an example methodology. You can use **Markdown** formatting.

- List item 1
- List item 2

## Section 2
More content here..."
                        required
                      />
                    ) : (
                      <div className="border rounded-md p-4 min-h-[300px]">
                        <div className="markdown">
                          {data.content ? (
                            <ReactMarkdown>
                              {data.content}
                            </ReactMarkdown>
                          ) : (
                            <p className="text-gray-400 italic">Nothing to preview yet.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end space-x-2">
                <Link href="/methodologies">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={processing}>Create Methodology</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 