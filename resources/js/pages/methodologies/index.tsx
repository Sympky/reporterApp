import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import axios from 'axios';

type Methodology = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: {
    id: number;
    name: string;
  } | null;
  updated_by: {
    id: number;
    name: string;
  } | null;
};

interface PageProps {
  methodologies: Methodology[];
}

export default function MethodologiesIndex({ methodologies }: PageProps) {
  const [items, setItems] = useState(methodologies);

  // Setup breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Methodologies', href: '/methodologies' },
  ];

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this methodology?')) {
      try {
        await axios.delete(`/methodologies/${id}`);
        setItems(items.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting methodology:', error);
        alert('Failed to delete methodology');
      }
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Methodologies" />
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Methodologies</h1>
          <Link href="/methodologies/create">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Methodology
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No methodologies found. Create your first methodology!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((methodology) => (
              <Card key={methodology.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{methodology.title}</CardTitle>
                    <div className="flex space-x-2">
                      <Link href={`/methodologies/${methodology.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(methodology.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {methodology.content.length > 100 
                      ? methodology.content.substring(0, 100) + '...' 
                      : methodology.content}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-gray-500 mt-2">
                    <div>
                      Created: {new Date(methodology.created_at).toLocaleString()} by {methodology.created_by?.name || 'Unknown'}
                    </div>
                    <div>
                      Updated: {new Date(methodology.updated_at).toLocaleString()} by {methodology.updated_by?.name || 'Unknown'}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href={`/methodologies/${methodology.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
} 