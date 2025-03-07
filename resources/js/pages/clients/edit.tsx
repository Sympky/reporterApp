import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { useState, FormEvent } from 'react';
import { toast } from 'sonner';

// Define the Client type
type Client = {
  id: number;
  name: string;
  description: string | null;
  emails: string | null;
  phone_numbers: string | null;
  addresses: string | null;
  website_urls: string | null;
  other_contact_info: string | null;
  notes: string | null;
};

// Helper function to ensure we have valid JSON arrays
const ensureJsonArray = (value: string | null | undefined): string => {
  if (!value) {
    return '[]';
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return value;
    }
    return JSON.stringify([value]);
  } catch (e) {
    return value ? JSON.stringify([value]) : '[]';
  }
};

interface PageProps {
  client: Client;
}

export default function EditClient({ client }: PageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Clients', href: '/clients' },
    { title: `Edit: ${client.name}`, href: `/clients/${client.id}/edit` },
  ];

  // Setup form
  const { data, setData, errors, put } = useForm({
    name: client.name,
    description: client.description || '',
    emails: ensureJsonArray(client.emails),
    phone_numbers: ensureJsonArray(client.phone_numbers),
    addresses: client.addresses || '',
    website_urls: ensureJsonArray(client.website_urls),
    other_contact_info: ensureJsonArray(client.other_contact_info),
    notes: client.notes || '',
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(name as any, value);
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    put(`/clients/${client.id}`, {
      onSuccess: () => {
        setIsSubmitting(false);
        toast.success('Client updated successfully');
      },
      onError: () => {
        setIsSubmitting(false);
        toast.error('Failed to update client');
      }
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Client: ${client.name}`} />
      
      <div className="container py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href={`/clients/${client.id}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Client
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Client</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                Edit client details
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Client Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={handleChange}
                      required
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={data.description}
                      onChange={handleChange}
                      rows={3}
                    />
                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emails">Email Addresses</Label>
                    <Textarea
                      id="emails"
                      name="emails"
                      value={data.emails}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter email addresses as JSON array, e.g. [\"email@example.com\"]"
                    />
                    {errors.emails && <p className="text-sm text-red-500">{errors.emails}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone_numbers">Phone Numbers</Label>
                    <Textarea
                      id="phone_numbers"
                      name="phone_numbers"
                      value={data.phone_numbers}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter phone numbers as JSON array, e.g. [\"+1234567890\"]"
                    />
                    {errors.phone_numbers && <p className="text-sm text-red-500">{errors.phone_numbers}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="addresses">Addresses</Label>
                    <Textarea
                      id="addresses"
                      name="addresses"
                      value={data.addresses}
                      onChange={handleChange}
                      rows={3}
                    />
                    {errors.addresses && <p className="text-sm text-red-500">{errors.addresses}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website_urls">Websites</Label>
                    <Textarea
                      id="website_urls"
                      name="website_urls"
                      value={data.website_urls}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter website URLs as JSON array, e.g. [\"https://example.com\"]"
                    />
                    {errors.website_urls && <p className="text-sm text-red-500">{errors.website_urls}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="other_contact_info">Other Contact Information</Label>
                    <Textarea
                      id="other_contact_info"
                      name="other_contact_info"
                      value={data.other_contact_info}
                      onChange={handleChange}
                      rows={3}
                    />
                    {errors.other_contact_info && <p className="text-sm text-red-500">{errors.other_contact_info}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={data.notes}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Add any additional notes, observations, or reminders about this client"
                    />
                    {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Link href={`/clients/${client.id}`}>
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