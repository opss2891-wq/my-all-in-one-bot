import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
import { enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

// Persistence handled in the main component to avoid SSR/Initial load issues
export const enableOfflinePersistence = async () => {
  if (typeof window !== 'undefined') {
    try {
      await enableMultiTabIndexedDbPersistence(db);
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence is not supported by this browser');
      }
    }
  }
};

// Conversation types
export type ConversationColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface Conversation {
  id?: string;
  userId: string;
  title: string;
  archived: boolean;
  pinned?: boolean;
  color?: ConversationColor;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

// Message types
export type MessageType = 'note' | 'tasks' | 'credentials' | 'links' | 'code' | 'file';

export interface CodeData {
  code: string;
  language?: string;
  explanation?: string;
  tags?: string[];
}

export interface TaskItem {
  text: string;
  completed: boolean;
}

export interface CredentialData {
  username: string;
  password: string;
  host?: string;
  url?: string;
  port?: string;
  credType: 'ftp' | 'ssh' | 'hosting' | 'admin' | 'cpanel' | 'database' | 'other';
}

export interface LinkItem {
  title: string;
  url: string;
}

export interface FileData {
  name: string;
  type: string; // mime type
  size: number;
  content: string; // base64 for small files, or text content
}

export interface Message {
  id?: string;
  userId: string;
  conversationId?: string;
  type: MessageType;
  content?: string;
  tasks?: TaskItem[];
  credential?: CredentialData;
  links?: LinkItem[];
  codeData?: CodeData;
  fileData?: FileData;
  images?: string[]; // Base64 images for notes
  createdAt: string;
}

// Conversation operations
export const createConversation = async (userId: string, title: string = 'New Conversation') => {
  const now = new Date().toISOString();
  return await addDoc(collection(db, 'conversations'), {
    userId,
    title,
    archived: false,
    createdAt: now,
    updatedAt: now,
  });
};

export const getConversations = async (userId: string) => {
  const q = query(
    collection(db, 'conversations'), 
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];
  return convs.filter(c => !c.archived);
};

export const getArchivedConversations = async (userId: string) => {
  const q = query(
    collection(db, 'conversations'), 
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];
  return convs.filter(c => c.archived);
};

export const updateConversation = async (id: string, data: Partial<Conversation>) => {
  await updateDoc(doc(db, 'conversations', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
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

// Global search across all conversations
export const searchAllMessages = async (userId: string, queryText: string) => {
  if (!queryText.trim()) return [];
  
  const q = query(collection(db, 'messages'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) })) as Message[];
  
  const queryLower = queryText.toLowerCase();
  
  return messages.filter(m => {
    if (m.type === 'note' && m.content?.toLowerCase().includes(queryLower)) return true;
    if (m.type === 'tasks' && m.tasks?.some(t => t.text.toLowerCase().includes(queryLower))) return true;
    if (m.type === 'credentials') {
      const cred = m.credential;
      if (cred?.username?.toLowerCase().includes(queryLower)) return true;
      if (cred?.host?.toLowerCase().includes(queryLower)) return true;
      if (cred?.url?.toLowerCase().includes(queryLower)) return true;
    }
    if (m.type === 'links' && m.links?.some(l => 
      l.title.toLowerCase().includes(queryLower) || l.url.toLowerCase().includes(queryLower)
    )) return true;
    if (m.type === 'code') {
      const codeData = m.codeData;
      if (codeData?.code?.toLowerCase().includes(queryLower)) return true;
      if (codeData?.explanation?.toLowerCase().includes(queryLower)) return true;
      if (codeData?.tags?.some(tag => tag.toLowerCase().includes(queryLower))) return true;
    }
    if (m.type === 'file') {
      const fileData = m.fileData;
      if (fileData?.name?.toLowerCase().includes(queryLower)) return true;
    }
    return false;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const deleteConversation = async (id: string) => {
  const messagesQuery = query(collection(db, 'messages'), where('conversationId', '==', id));
  const messagesSnapshot = await getDocs(messagesQuery);
  
  const batch = writeBatch(db);
  messagesSnapshot.docs.forEach(msgDoc => {
    batch.delete(msgDoc.ref);
  });
  batch.delete(doc(db, 'conversations', id));
  await batch.commit();
};

// Message operations
export const addMessage = async (userId: string, message: Omit<Message, 'id' | 'createdAt' | 'userId'>) => {
  const docRef = await addDoc(collection(db, 'messages'), {
    ...message,
    userId,
    createdAt: new Date().toISOString(),
  });
  
  if (message.conversationId) {
    await updateDoc(doc(db, 'conversations', message.conversationId), {
      updatedAt: new Date().toISOString(),
    });
  }
  
  return docRef;
};

export const getMessages = async (userId: string, conversationId?: string) => {
  let q;
  if (conversationId) {
    q = query(
      collection(db, 'messages'), 
      where('userId', '==', userId),
      where('conversationId', '==', conversationId)
    );
  } else {
    q = query(collection(db, 'messages'), where('userId', '==', userId));
  }
  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) })) as Message[];
  return messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const updateMessage = async (id: string, data: Partial<Message>) => {
  await updateDoc(doc(db, 'messages', id), data as Record<string, unknown>);
};

export const deleteMessage = async (id: string) => {
  await deleteDoc(doc(db, 'messages', id));
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

export interface Task {
  id?: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export const addTask = async (userId: string, title: string) => {
  return await addDoc(collection(db, 'tasks'), {
    userId,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  });
};

export const getTasks = async (userId: string) => {
  const q = query(
    collection(db, 'tasks'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
};

export const updateTask = async (id: string, completed: boolean) => {
  await updateDoc(doc(db, 'tasks', id), { completed });
};

export const deleteTask = async (id: string) => {
  await deleteDoc(doc(db, 'tasks', id));
};

export type CredentialType = 'ftp' | 'ssh' | 'hosting' | 'admin' | 'cpanel' | 'database' | 'other';

export interface Credential {
  id?: string;
  userId: string;
  username: string;
  password: string;
  host: string;
  url: string;
  type: CredentialType;
  createdAt: string;
}

export const addCredential = async (userId: string, credential: Omit<Credential, 'id' | 'createdAt' | 'userId'>) => {
  return await addDoc(collection(db, 'credentials'), {
    ...credential,
    userId,
    createdAt: new Date().toISOString(),
  });
};

export const getCredentials = async (userId: string) => {
  const q = query(
    collection(db, 'credentials'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Credential[];
};

export const deleteCredential = async (id: string) => {
  await deleteDoc(doc(db, 'credentials', id));
};

export const updateCredential = async (id: string, data: Partial<Omit<Credential, 'id' | 'createdAt' | 'userId'>>) => {
  await updateDoc(doc(db, 'credentials', id), data as Record<string, unknown>);
};