import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { TrashIcon, CloudArrowUpIcon, ArrowDownTrayIcon, DocumentIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Define file type
type File = {
  id: number;
  name: string;
  size: string;
  mime_type: string;
  description: string | null;
  uploaded_at: string;
  uploaded_by: string;
  download_url: string;
  is_image: boolean;
  is_pdf: boolean;
};

interface FileUploaderProps {
  fileableType: 'client' | 'project' | 'vulnerability';
  fileableId: number;
  title?: string;
  allowedFileTypes?: string;
  maxFileSizeMB?: number;
}

export default function FileUploader({ 
  fileableType, 
  fileableId, 
  title = 'Files', 
  allowedFileTypes = '*', 
  maxFileSizeMB = 25
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<FileList | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Fetch files when component mounts or fileableId/fileableType changes
  useEffect(() => {
    fetchFiles();
  }, [fileableType, fileableId]);

  // Function to fetch files
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/files', {
        params: {
          fileable_type: fileableType,
          fileable_id: fileableId,
        }
      });
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setSelectedFile(null);
      setFileError(null);
      return;
    }
    
    const file = files[0];
    
    // Check file size
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setFileError(`File size exceeds the maximum limit of ${maxFileSizeMB}MB`);
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(files);
    setFileError(null);
  };

  // Function to upload a file
  const handleUpload = async () => {
    if (!selectedFile || !selectedFile[0]) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (fileError) {
      toast.error(fileError);
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile[0]);
    formData.append('fileable_type', fileableType);
    formData.append('fileable_id', fileableId.toString());
    
    if (fileDescription) {
      formData.append('description', fileDescription);
    }
    
    try {
      setUploading(true);
      await axios.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Reset form and fetch updated file list
      setSelectedFile(null);
      setFileDescription('');
      setShowUploadDialog(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      fetchFiles();
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Function to delete a file
  const handleDelete = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await axios.delete(`/files/${fileId}`);
      // Remove the file from state
      setFiles(files.filter(file => file.id !== fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  // Function to get file icon based on mime type
  const getFileIcon = (file: File) => {
    if (file.is_image) {
      return <PhotoIcon className="h-6 w-6 text-blue-500" />;
    } else if (file.is_pdf) {
      return <DocumentTextIcon className="h-6 w-6 text-red-500" />;
    } else {
      return <DocumentIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </CardDescription>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <CloudArrowUpIcon className="h-4 w-4 mr-1" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Upload a file to attach to this {fileableType}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept={allowedFileTypes}
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                {fileError && (
                  <div className="text-sm text-red-500">{fileError}</div>
                )}
                <div className="text-xs text-gray-500">
                  Maximum file size: {maxFileSizeMB}MB
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Add a description for this file..."
                  rows={3}
                  disabled={uploading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || !!fileError}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="py-4 text-center text-sm text-gray-500">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">No files uploaded yet.</div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-start justify-between rounded-md border p-3">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">{getFileIcon(file)}</div>
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-gray-500">
                      {file.size} • Uploaded by {file.uploaded_by} on {formatDate(file.uploaded_at)}
                    </div>
                    {file.description && (
                      <div className="mt-1 text-sm">{file.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.download_url, '_blank')}
                    className="h-8 px-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                    className="h-8 px-2"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 