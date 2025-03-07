import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

// Define note type
type Note = {
  id: number;
  content: string;
  created_at: string;
  created_by: string;
};

interface NotesComponentProps {
  notableType: 'client' | 'project' | 'vulnerability';
  notableId: number;
  title?: string;
}

export default function NotesComponent({ notableType, notableId, title = 'Notes' }: NotesComponentProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  // Fetch notes when component mounts or notableId/notableType changes
  useEffect(() => {
    fetchNotes();
  }, [notableType, notableId]);

  // Function to fetch notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/notes', {
        params: {
          notable_type: notableType,
          notable_id: notableId,
        }
      });
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new note
  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/notes', {
        content: newNote,
        notable_type: notableType,
        notable_id: notableId,
      });
      
      setNewNote('');
      setShowAddNote(false);
      fetchNotes();
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  // Function to delete a note
  const deleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await axios.delete(`/notes/${noteId}`);
      // Remove the note from state
      setNotes(notes.filter(note => note.id !== noteId));
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
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
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddNote(!showAddNote)}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </CardHeader>
      
      <CardContent>
        {showAddNote && (
          <form onSubmit={addNote} className="mb-4 space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note here..."
              rows={3}
              required
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => setShowAddNote(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </form>
        )}
        
        {loading ? (
          <div className="py-4 text-center text-sm text-gray-500">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">No notes yet. Add your first note.</div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="rounded-md border p-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm text-gray-500">
                    By {note.created_by} on {formatDate(note.created_at)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                    className="h-7 w-7 p-0"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="mt-2 whitespace-pre-wrap">{note.content}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 