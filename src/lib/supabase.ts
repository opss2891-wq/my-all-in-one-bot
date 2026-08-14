import { createClient } from '@supabase/supabase-js';
import { 
  Conversation, 
  ConversationColor, 
  Message, 
  MessageType,
  Task,
  Credential,
  CredentialType,
  TaskItem,
  LinkItem,
  CredentialData,
  CodeData,
  FileData
} from './firebase'; 

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Re-export types from firebase to ensure they are available
export type { 
  Conversation, 
  ConversationColor, 
  Message, 
  MessageType,
  Task,
  Credential,
  CredentialType,
  TaskItem,
  LinkItem,
  CredentialData,
  CodeData,
  FileData 
};

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

export const updateConversation = async (id: string, data: Partial<Conversation>) => {
  const mappedData: any = {};
  if (data.title !== undefined) mappedData.title = data.title;
  if (data.archived !== undefined) mappedData.archived = data.archived;
  if (data.pinned !== undefined) mappedData.pinned = data.pinned;
  if (data.color !== undefined) mappedData.color = data.color;
  if (data.label !== undefined) mappedData.label = data.label;
  
  mappedData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('conversations')
    .update(mappedData)
    .eq('id', id);
  
  if (error) throw error;
};

export const archiveConversation = async (id: string) => {
  await updateConversation(id, { archived: true });
};

export const unarchiveConversation = async (id: string) => {
  await updateConversation(id, { archived: false });
};

export const pinConversation = async (id: string) => {
  await updateConversation(id, { pinned: true });
};

export const unpinConversation = async (id: string) => {
  await updateConversation(id, { pinned: false });
};

export const setConversationColor = async (id: string, color: ConversationColor) => {
  await updateConversation(id, { color });
};

export const setConversationLabel = async (id: string, label: string) => {
  await updateConversation(id, { label });
};

export const deleteConversation = async (id: string) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
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
      tasks: message.tasks,
      credential: message.credential,
      links: message.links,
      code_data: message.codeData,
      file_data: message.fileData,
      images: message.images
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
  let query = supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId);
  
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
    tasks: m.tasks,
    credential: m.credential,
    links: m.links,
    codeData: m.code_data,
    fileData: m.file_data,
    images: m.images,
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
