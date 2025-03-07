// resources/js/pages/Clients/Index.tsx
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, Link } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { PlusIcon, PencilIcon, TrashIcon, XCircleIcon, PlusCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';

// Definirea tipului pentru client
type Client = {
  id: number;
  name: string;
  description: string | null;
  emails: string | null;
  phone_numbers: string | null;
  addresses: string | null;
  website_urls: string | null;
  project_name?: string | null;
  status?: string | null;
  due_date?: string | null;
  other_contact_info?: string | null;
};

interface PageProps {
  clients?: Client[];
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

// Definirea coloanelor pentru tabel
const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Nume Client",
    cell: ({ row }) => {
      const client = row.original;
      return (
        <Link 
          href={`/clients/${client.id}`}
          className="hover:underline text-primary font-medium"
        >
          {client.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "emails", 
    header: "Email-uri",
    cell: ({ row }) => formatArrayValue(row.getValue("emails")),
  },
  {
    accessorKey: "phone_numbers",
    header: "Telefoane",
    cell: ({ row }) => formatArrayValue(row.getValue("phone_numbers")),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex space-x-2">
          <Link href={`/clients/${client.id}`}>
            <Button variant="outline" size="sm">
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          <EditClientDialog client={client} />
          <DeleteClientButton client={client} />
        </div>
      );
    },
  },
];

// Componenta pentru dialogul de editare client
function EditClientDialog({ client }: { client: Client }) {
  // Remove all refs, we don't need them

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

  const initialFormData = {
    name: client.name || '',
    description: client.description || '',
    emails: ensureJsonArray(client.emails),
    phone_numbers: ensureJsonArray(client.phone_numbers),
    addresses: client.addresses || '',
    website_urls: ensureJsonArray(client.website_urls),
    other_contact_info: ensureJsonArray(client.other_contact_info),
  };
  
  const { data, setData: originalSetData, put, processing, errors } = useForm(initialFormData);
  
  // Wrap setData to add debugging
  const setData = <K extends keyof typeof data>(key: K, value: any) => {
    originalSetData(key, value);
    // Verify data was updated
    setTimeout(() => {
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Explicitly blur the active element to trigger any onBlur handlers
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Short delay to ensure all state updates have processed
    setTimeout(() => {
      // Submit the form
      put(`/clients/${client.id}`, {
        onSuccess: () => {
          window.location.reload();
        },
        onError: (errors) => {
        }
      });
    }, 100);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editare Client</DialogTitle>
          <DialogDescription>
            Modificați informațiile clientului și apăsați butonul Salvează.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Nume</label>
            <input
              type="text"
              id="name"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Descriere</label>
            <textarea
              id="description"
              value={data.description || ''}
              onChange={e => setData('description', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          
          <MultipleValueInput
            label="Email-uri"
            id="emails"
            value={data.emails}
            onChange={value => setData('emails', value)}
            placeholder="Adaugă adresă de email..."
          />
          
          <MultipleValueInput
            label="Numere de telefon"
            id="phone_numbers"
            value={data.phone_numbers}
            onChange={value => setData('phone_numbers', value)}
            placeholder="Adaugă număr de telefon..."
          />
          
          <div>
            <label htmlFor="addresses" className="block text-sm font-medium">Adrese</label>
            <textarea
              id="addresses"
              value={data.addresses || ''}
              onChange={e => setData('addresses', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          
          <MultipleValueInput
            label="URL-uri Website"
            id="website_urls"
            value={data.website_urls}
            onChange={value => setData('website_urls', value)}
            placeholder="Adaugă URL website..."
          />
          
          <MultipleValueInput
            label="Alte informații de contact"
            id="other_contact_info"
            value={data.other_contact_info}
            onChange={value => setData('other_contact_info', value)}
            placeholder="Adaugă alte informații de contact..."
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={processing}>
              Salvează
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Componenta pentru butonul de ștergere client
function DeleteClientButton({ client }: { client: Client }) {
  const handleDelete = () => {
    if (confirm(`Ești sigur că vrei să ștergi clientul ${client.name}?`)) {
      axios.delete(`/clients/${client.id}`).then(() => {
        window.location.reload();
      }).catch(error => {
        if (error.response && error.response.status === 422) {
          alert(error.response.data.message);
        } else {
          alert("A apărut o eroare la ștergerea clientului.");
        }
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDelete}>
      <TrashIcon className="h-4 w-4 text-red-500" />
    </Button>
  );
}

// Componenta pentru dialogul de creare client
function CreateClientDialog() {
  const initialFormData = {
    name: '',
    description: '',
    emails: '[]',
    phone_numbers: '[]',
    addresses: '',
    website_urls: '[]',
    other_contact_info: '[]',
  };
  
  const { data, setData, post, processing, errors, reset } = useForm(initialFormData);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Explicitly blur the active element to trigger any onBlur handlers
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Short delay to ensure all state updates have processed
    setTimeout(() => {
      post('/clients', {
        onSuccess: () => {
          reset();
          window.location.reload();
        },
        onError: (errors) => {
        }
      });
    }, 100);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Adaugă Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adaugă Client Nou</DialogTitle>
          <DialogDescription>
            Completați informațiile clientului nou și apăsați butonul Salvează.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Nume</label>
            <input
              type="text"
              id="name"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Descriere</label>
            <textarea
              id="description"
              value={data.description}
              onChange={e => setData('description', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          
          <MultipleValueInput
            label="Email-uri"
            id="create-emails"
            value={data.emails}
            onChange={value => setData('emails', value)}
            placeholder="Adaugă adresă de email..."
          />
          
          <MultipleValueInput
            label="Numere de telefon"
            id="create-phone_numbers"
            value={data.phone_numbers}
            onChange={value => setData('phone_numbers', value)}
            placeholder="Adaugă număr de telefon..."
          />
          
          <div>
            <label htmlFor="create-addresses" className="block text-sm font-medium">Adrese</label>
            <textarea
              id="create-addresses"
              value={data.addresses}
              onChange={e => setData('addresses', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          
          <MultipleValueInput
            label="URL-uri Website"
            id="create-website_urls"
            value={data.website_urls}
            onChange={value => setData('website_urls', value)}
            placeholder="Adaugă URL website..."
          />
          
          <MultipleValueInput
            label="Alte informații de contact"
            id="create-other_contact_info"
            value={data.other_contact_info}
            onChange={value => setData('other_contact_info', value)}
            placeholder="Adaugă alte informații de contact..."
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={processing}>
              Salvează
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Componenta pentru intrare de valori multiple
function MultipleValueInput({ 
  label, 
  id, 
  value, 
  onChange, 
  placeholder,
  onSubmitRef
}: { 
  label: string; 
  id: string; 
  value: string | null | undefined; 
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmitRef?: React.MutableRefObject<(() => boolean) | null>;
}) {
  // Parse the stringified JSON array or initialize an empty array
  const [values, setValues] = useState<string[]>(() => {
    if (!value) {
      return [];
    }
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [String(parsed)];
    } catch (e) {
      return value ? [value] : [];
    }
  });
  
  // Update values when the input value changes from outside
  useEffect(() => {
    if (value === undefined || value === null) {
      setValues([]);
      onChange('[]');
      return;
    }
    
    try {
      const parsed = JSON.parse(value);
      
      if (Array.isArray(parsed)) {
        setValues(parsed);
      } else if (value) {
        const newArray = [String(parsed)];
        setValues(newArray);
        onChange(JSON.stringify(newArray));
      } else {
        setValues([]);
        onChange('[]');
      }
    } catch (e) {
      if (value) {
        const newArray = [value];
        setValues(newArray);
        onChange(JSON.stringify(newArray));
      } else {
        setValues([]);
        onChange('[]');
      }
    }
  }, [value, onChange, label]);
  
  // Current input value for new item
  const [currentValue, setCurrentValue] = useState('');
  
  // Check if there's a pending value and add it
  const addPendingValue = () => {
    if (currentValue.trim()) {
      addValue();
      return true;
    }
    return false;
  };
  
  // Add a new value
  const addValue = () => {
    if (currentValue.trim()) {
      const newValues = [...values, currentValue.trim()];
      setValues(newValues);
      const jsonString = JSON.stringify(newValues);
      onChange(jsonString);
      setCurrentValue('');
    }
  };
  
  // Handle blur event to add any pending value
  const handleBlur = () => {
    if (currentValue.trim()) {
      addValue();
    }
  };
  
  // Remove a value
  const removeValue = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    setValues(newValues);
    const jsonString = newValues.length > 0 ? JSON.stringify(newValues) : '[]';
    onChange(jsonString);
  };
  
  // Handle key press (Enter to add)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addValue();
    }
  };
  
  // Expose a function to add the current input if it's not empty
  useEffect(() => {
    if (onSubmitRef) {
      onSubmitRef.current = () => {
        if (currentValue.trim()) {
          addValue();
          return true; // return true if we added something
        }
        return false; // return false if nothing was added
      };
    }
    
    // Cleanup function
    return () => {
      if (onSubmitRef) {
        onSubmitRef.current = null;
      }
    };
  }, [currentValue, onSubmitRef, addValue]);
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <div className="mt-1">
        {/* Display current values as chips/tags */}
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map((val, index) => (
            <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 text-sm">
              <span>{val}</span>
              <button 
                type="button" 
                onClick={() => removeValue(index)} 
                className="ml-1 text-gray-500 hover:text-red-500"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Input for new value */}
        <div className="flex">
          <input
            type="text"
            id={id}
            value={currentValue}
            onChange={e => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder || `Adaugă ${label.toLowerCase()}...`}
            className="flex-grow block rounded-md border-gray-300 shadow-sm"
          />
          <button 
            type="button" 
            onClick={addValue}
            className="ml-2 text-gray-600 hover:text-green-500"
          >
            <PlusCircleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Clients',
    href: '/clients',
  },
];

export default function ClientsIndex() {
  const { clients = [] } = usePage().props as PageProps;
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Clients" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Clients</h1>
          <CreateClientDialog />
        </div>
        
        <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border">
          <DataTable columns={columns} data={clients || []} />
        </div>
      </div>
    </AppLayout>
  );
}