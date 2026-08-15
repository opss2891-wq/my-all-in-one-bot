export { supabase } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';



export type MessageType = 'note' | 'tasks' | 'credentials' | 'links' | 'code' | 'file';
export type ConversationColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface TaskItem {
  text: string;
  completed: boolean;
}

export interface LinkItem {
  title: string;
  url: string;
}

export interface CredentialData {
  username?: string;
  password?: string;
  host?: string;
  url?: string;
  port?: string;
  credType: 'ftp' | 'ssh' | 'cpanel' | 'hosting' | 'admin' | 'database' | 'other';
}

export interface CodeData {
  code: string;
  language: string;
  explanation?: string;
  tags?: string[];
}

export interface FileData {
  name: string;
  type: string;
  size: number;
  content: string;
}

export interface Message {
  id?: string;
  userId: string;
  conversationId?: string;
  type: MessageType;
  content?: string;
  pinned?: boolean;
  tasks?: TaskItem[];
  credential?: CredentialData;
  links?: LinkItem[];
  codeData?: CodeData;
  fileData?: FileData;
  images?: string[];
  description?: string;
  createdAt: string;
}

export interface Conversation {
  id?: string;
  userId: string;
  title: string;
  archived: boolean;
  pinned: boolean;
  color: ConversationColor;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id?: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export type CredentialType = 'ftp' | 'ssh' | 'cpanel' | 'hosting' | 'admin' | 'database' | 'other';

export interface Credential {
  id?: string;
  userId: string;
  username?: string;
  password?: string;
  host?: string;
  url?: string;
  type: CredentialType;
  createdAt: string;
}

// Conversation operations
export const createConversation = async (userId: string, title: string = 'New Conversation') => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ user_id: userId, title, archived: false, pinned: false, color: 'none' }])
    .select()
    .single();
  
  if (error) throw error;
  return { id: data.id };
};

export const getConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(c => ({
    id: c.id,
    userId: c.user_id,
    title: c.title,
    archived: c.archived,
    pinned: c.pinned,
    color: c.color,
    label: c.label,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  })) as Conversation[];
};

export const getArchivedConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', true)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(c => ({
    id: c.id,
    userId: c.user_id,
    title: c.title,
    archived: c.archived,
    pinned: c.pinned,
    color: c.color,
    label: c.label,
    createdAt: c.created_at,
    updatedAt: c.updated_at
  })) as Conversation[];
};

export const updateConversation = async (id: string, updates: Partial<Conversation>) => {
  const { error } = await supabase
    .from('conversations')
    .update({
      title: updates.title,
      archived: updates.archived,
      pinned: updates.pinned,
      color: updates.color,
      label: updates.label,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  if (error) throw error;
};

export const archiveConversation = async (id: string) => {
  const { error } = await supabase
    .from('conversations')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const unarchiveConversation = async (id: string) => {
  const { error } = await supabase
    .from('conversations')
    .update({ archived: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const deleteConversation = async (id: string) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const pinConversation = async (id: string) => {
  const { error } = await supabase
    .from('conversations')
    .update({ pinned: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const unpinConversation = async (id: string) => {
  const { error } = await supabase
    .from('conversations')
    .update({ pinned: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const setConversationColor = async (id: string, color: ConversationColor) => {
  const { error } = await supabase
    .from('conversations')
    .update({ color, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const setConversationLabel = async (id: string, label: string) => {
  const { error } = await supabase
    .from('conversations')
    .update({ label, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

// Message operations
export const addMessage = async (userId: string, message: Omit<Message, 'id' | 'createdAt' | 'userId'>) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      user_id: userId,
      conversation_id: message.conversationId,
      type: message.type,
      content: message.content,
      tasks: message.tasks as any,
      credential: message.credential as any,
      links: message.links as any,
      code_data: message.codeData as any,
      file_data: message.fileData as any,

      images: message.images,
      description: message.description
    }])
    .select()
    .single();
  
  if (error) throw error;

  if (message.conversationId) {
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.conversationId);
  }

  return { id: data.id };
};

export const getMessages = async (userId: string, conversationId?: string) => {
  let query = supabase.from('messages').select('*').eq('user_id', userId);
  
  if (conversationId) {
    query = query.eq('conversation_id', conversationId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(m => ({
    id: m.id,
    userId: m.user_id,
    conversationId: m.conversation_id,
    type: m.type as MessageType,
    content: m.content,
    tasks: m.tasks as any,
    credential: m.credential as any,
    links: m.links as any,
    codeData: m.code_data as any,
    fileData: m.file_data as any,

    images: m.images,
    description: m.description,
    createdAt: m.created_at
  })) as Message[];
};

export const deleteMessage = async (id: string) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const deleteDemoData = async (userId: string) => {
  // Find the demo conversation
  const { data: convs, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('title', 'Demo Conversation (DataBot)');
    
  if (convError) throw convError;
  
  if (convs && convs.length > 0) {
    for (const conv of convs) {
      await deleteConversation(conv.id);
    }
  }
};

export const updateMessage = async (id: string, updates: Partial<Message>) => {
  const mappedUpdates: any = {};
  if (updates.content !== undefined) mappedUpdates.content = updates.content;
  if (updates.tasks !== undefined) mappedUpdates.tasks = updates.tasks;
  if (updates.credential !== undefined) mappedUpdates.credential = updates.credential;
  if (updates.links !== undefined) mappedUpdates.links = updates.links;
  if (updates.codeData !== undefined) mappedUpdates.code_data = updates.codeData;
  if (updates.fileData !== undefined) mappedUpdates.file_data = updates.fileData;
  if (updates.images !== undefined) mappedUpdates.images = updates.images;

  const { error } = await supabase
    .from('messages')
    .update(mappedUpdates)
    .eq('id', id);
  if (error) throw error;
};

// Legacy Table Operations
export const addTask = async (userId: string, title: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ user_id: userId, title, completed: false }])
    .select()
    .single();
  if (error) throw error;
  return { id: data.id };
};

export const getTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(t => ({
    id: t.id,
    userId: t.user_id,
    title: t.title,
    completed: t.completed,
    createdAt: t.created_at
  })) as Task[];
};

export const updateTask = async (id: string, completed: boolean) => {
  const { error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', id);
  if (error) throw error;
};

export const deleteTask = async (id: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const addCredential = async (userId: string, credential: Omit<Credential, 'id' | 'createdAt' | 'userId'>) => {
  const { data, error } = await supabase
    .from('credentials')
    .insert([{
      user_id: userId,
      username: credential.username,
      password: credential.password,
      host: credential.host,
      url: credential.url,
      cred_type: credential.type
    }])
    .select()
    .single();
  if (error) throw error;
  return { id: data.id };
};

export const getCredentials = async (userId: string) => {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(c => ({
    id: c.id,
    userId: c.user_id,
    username: c.username,
    password: c.password,
    host: c.host,
    url: c.url,
    type: c.cred_type as CredentialType,
    createdAt: c.created_at
  })) as Credential[];
};

export const deleteCredential = async (id: string) => {
  const { error } = await supabase
    .from('credentials')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const updateCredential = async (id: string, data: Partial<Omit<Credential, 'id' | 'createdAt' | 'userId'>>) => {
  const mappedData: any = {};
  if (data.username !== undefined) mappedData.username = data.username;
  if (data.password !== undefined) mappedData.password = data.password;
  if (data.host !== undefined) mappedData.host = data.host;
  if (data.url !== undefined) mappedData.url = data.url;
  if (data.type !== undefined) mappedData.cred_type = data.type;

  const { error } = await supabase
    .from('credentials')
    .update(mappedData)
    .eq('id', id);
  if (error) throw error;
};

// Legacy exports for backward compatibility
export const addNote = async (userId: string, content: string) => {
  return await addMessage(userId, { type: 'note', content });
};

export const getNotes = async (userId: string) => {
  const messages = await getMessages(userId);
  return messages.filter(m => m.type === 'note').map(m => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt
  }));
};

export const deleteNote = async (id: string) => {
  await deleteMessage(id);
};

// Global search across all conversations
export const searchAllMessages = async (userId: string, queryText: string) => {
  if (!queryText.trim()) return [];
  
  const messages = await getMessages(userId);
  
  const queryLower = queryText.toLowerCase();
  
  return messages.filter(m => {
    if (m.type === 'note' && m.content?.toLowerCase().includes(queryLower)) return true;
    if (m.type === 'tasks' && m.tasks?.some((t: any) => t.text.toLowerCase().includes(queryLower))) return true;
    if (m.type === 'credentials') {
      const cred = m.credential as any;
      if (cred?.username?.toLowerCase().includes(queryLower)) return true;
      if (cred?.host?.toLowerCase().includes(queryLower)) return true;
      if (cred?.url?.toLowerCase().includes(queryLower)) return true;
    }
    if (m.type === 'links' && m.links?.some((l: any) => 
      l.title.toLowerCase().includes(queryLower) || l.url.toLowerCase().includes(queryLower)
    )) return true;
    if (m.type === 'code') {
      const codeData = m.codeData as any;
      if (codeData?.code?.toLowerCase().includes(queryLower)) return true;
      if (codeData?.explanation?.toLowerCase().includes(queryLower)) return true;
      if (codeData?.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) return true;
    }
    if (m.type === 'file') {
      const fileData = m.fileData as any;
      if (fileData?.name?.toLowerCase().includes(queryLower)) return true;
    }
    return false;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
