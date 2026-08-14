import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Eye, EyeOff, Copy, Loader2, Edit2, Check, X } from 'lucide-react';
import { addCredential, getCredentials, deleteCredential, updateCredential, Credential, CredentialType } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const credentialTypes: { value: CredentialType; label: string }[] = [
  { value: 'hosting', label: 'Hosting' },
  { value: 'admin', label: 'Admin Panel' },
  { value: 'ftp', label: 'FTP' },
  { value: 'ssh', label: 'SSH' },
  { value: 'cpanel', label: 'cPanel' },
  { value: 'database', label: 'Database' },
  { value: 'other', label: 'Other' },
];

const getTypeColor = (type: CredentialType) => {
  const colors: Record<CredentialType, string> = {
    hosting: 'bg-primary/20 text-primary',
    admin: 'bg-destructive/20 text-destructive',
    ftp: 'bg-success/20 text-success',
    ssh: 'bg-warning/20 text-warning',
    cpanel: 'bg-accent/20 text-accent',
    database: 'bg-blue-500/20 text-blue-400',
    other: 'bg-muted text-muted-foreground',
  };
  return colors[type] || colors.other;
};

const CredentialsSection: React.FC = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    host: '',
    url: '',
    port: '',
    type: 'hosting' as CredentialType,
  });
  const [form, setForm] = useState({
    username: '',
    password: '',
    host: '',
    url: '',
    port: '',
    type: 'hosting' as CredentialType,
  });

  useEffect(() => {
    if (user) loadCredentials();
  }, [user]);

  const loadCredentials = async () => {
    if (!user) return;
    try {
      const data = await getCredentials(user.uid);
      setCredentials(data);
    } catch (error) {
      toast({ title: 'Error loading credentials', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredential = async () => {
    if (!form.username || !form.password || !user) return;
    setAdding(true);
    try {
      await addCredential(user.uid, form);
      setForm({ username: '', password: '', host: '', url: '', port: '', type: 'hosting' });
      setShowForm(false);
      await loadCredentials();
      toast({ title: 'Credential added successfully' });
    } catch (error) {
      toast({ title: 'Error adding credential', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    try {
      await deleteCredential(id);
      await loadCredentials();
      toast({ title: 'Credential deleted' });
    } catch (error) {
      toast({ title: 'Error deleting credential', variant: 'destructive' });
    }
  };

  const startEditing = (cred: Credential) => {
    setEditingId(cred.id!);
    setEditForm({
      username: cred.username,
      password: cred.password,
      host: cred.host || '',
      url: cred.url || '',
      port: (cred as any).port || '',
      type: cred.type,
    });
  };

  const handleUpdateCredential = async () => {
    if (!editingId || !editForm.username || !editForm.password) return;
    try {
      await updateCredential(editingId, editForm);
      setEditingId(null);
      await loadCredentials();
      toast({ title: 'Credential updated successfully' });
    } catch (error) {
      toast({ title: 'Error updating credential', variant: 'destructive' });
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ username: '', password: '', host: '', url: '', port: '', type: 'hosting' });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="credentials" className="snap-section p-6 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/20 glow-accent">
              <Key className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Credentials</h2>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-3 gradient-accent rounded-xl hover:opacity-90 transition-all"
          >
            <Plus className="w-5 h-5 text-accent-foreground" />
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6 animate-slide-up">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as CredentialType })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {credentialTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Host</label>
                <input
                  type="text"
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  placeholder="ftp.example.com"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Port</label>
                <input
                  type="text"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: e.target.value })}
                  placeholder="21"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-1 block">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleAddCredential}
              disabled={adding || !form.username || !form.password}
              className="w-full py-2 gradient-accent rounded-lg text-accent-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Credential
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No credentials saved
            </div>
          ) : (
            credentials.map((cred) => (
              <div
                key={cred.id}
                className="bg-card border border-border rounded-xl p-4 animate-slide-up group hover:border-accent/50 transition-all"
              >
                {editingId === cred.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value as CredentialType })}
                          className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {credentialTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                        <input
                          type="text"
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Host</label>
                        <input
                          type="text"
                          value={editForm.host}
                          onChange={(e) => setEditForm({ ...editForm, host: e.target.value })}
                          className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Port</label>
                        <input
                          type="text"
                          value={editForm.port}
                          onChange={(e) => setEditForm({ ...editForm, port: e.target.value })}
                          className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">URL</label>
                      <input
                        type="url"
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelEditing}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={handleUpdateCredential}
                        className="p-2 hover:bg-success/20 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4 text-success" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-mono ${getTypeColor(cred.type)}`}>
                        {cred.type.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(cred)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCredential(cred.id!)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">User:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{cred.username}</span>
                          <button onClick={() => copyToClipboard(cred.username, 'Username')} className="p-1 hover:bg-muted rounded">
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pass:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">
                            {showPasswords[cred.id!] ? cred.password : '••••••••'}
                          </span>
                          <button onClick={() => togglePassword(cred.id!)} className="p-1 hover:bg-muted rounded">
                            {showPasswords[cred.id!] ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                          </button>
                          <button onClick={() => copyToClipboard(cred.password, 'Password')} className="p-1 hover:bg-muted rounded">
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      {cred.host && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Host:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{cred.host}</span>
                            <button onClick={() => copyToClipboard(cred.host, 'Host')} className="p-1 hover:bg-muted rounded">
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      )}
                      {(cred as any).port && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Port:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{(cred as any).port}</span>
                            <button onClick={() => copyToClipboard((cred as any).port, 'Port')} className="p-1 hover:bg-muted rounded">
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      )}
                      {cred.url && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">URL:</span>
                          <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                            {cred.url}
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default CredentialsSection;