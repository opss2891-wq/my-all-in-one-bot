import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Loader2, Copy } from 'lucide-react';
import { addNote, getNotes, deleteNote } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

const NotesSection: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadNotes();
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;
    try {
      const data = await getNotes(user.uid);
      setNotes(data as Note[]);
    } catch (error) {
      toast({ title: 'Error loading notes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;
    setAdding(true);
    try {
      await addNote(user.uid, newNote);
      setNewNote('');
      await loadNotes();
      toast({ title: 'Note added successfully' });
    } catch (error) {
      toast({ title: 'Error adding note', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNote(id);
      await loadNotes();
      toast({ title: 'Note deleted' });
    } catch (error) {
      toast({ title: 'Error deleting note', variant: 'destructive' });
    }
  };

  const handleCopyNote = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <section id="notes" className="snap-section p-6 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-success/20 glow-primary">
            <FileText className="w-6 h-6 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Notes</h2>
        </div>

        <div className="flex gap-3 mb-6">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write your note here..."
            className="flex-1 bg-card border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <button
            onClick={handleAddNote}
            disabled={adding || !newNote.trim()}
            className="px-4 bg-success hover:bg-success/90 disabled:opacity-50 rounded-lg transition-all flex items-center justify-center"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin text-success-foreground" /> : <Plus className="w-5 h-5 text-success-foreground" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No notes yet
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleCopyNote(note.content)}
                className="bg-card border border-border rounded-lg p-4 animate-slide-up group hover:border-success/50 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-foreground whitespace-pre-wrap flex-1">
                    {note.content}
                  </p>
                  <div className="flex items-center gap-1">
                    <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(note.createdAt).toLocaleString('en-US')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default NotesSection;
