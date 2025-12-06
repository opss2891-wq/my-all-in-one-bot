import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBAUELXkxLzDAEqNwPKQOv2T9M7vtiVBTA",
  authDomain: "app-hosting-link.firebaseapp.com",
  projectId: "app-hosting-link",
  storageBucket: "app-hosting-link.firebasestorage.app",
  messagingSenderId: "385305453674",
  appId: "1:385305453674:web:8a8763116a4d31a457d613",
  measurementId: "G-RGZGNETWVZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Conversation types
export interface Conversation {
  id?: string;
  title: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Message types
export type MessageType = 'note' | 'tasks' | 'credentials' | 'links' | 'code';

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
  credType: 'ftp' | 'ssh' | 'hosting' | 'admin' | 'cpanel' | 'database' | 'other';
}

export interface LinkItem {
  title: string;
  url: string;
}

export interface Message {
  id?: string;
  conversationId?: string;
  type: MessageType;
  content?: string;
  tasks?: TaskItem[];
  credential?: CredentialData;
  links?: LinkItem[];
  codeData?: CodeData;
  images?: string[]; // Base64 images for notes
  createdAt: string;
}

// Conversation operations
export const createConversation = async (title: string = 'New Conversation') => {
  const now = new Date().toISOString();
  return await addDoc(collection(db, 'conversations'), {
    title,
    archived: false,
    createdAt: now,
    updatedAt: now,
  });
};

export const getConversations = async () => {
  const q = query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];
  return convs.filter(c => !c.archived);
};

export const getArchivedConversations = async () => {
  const q = query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'));
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
export const addMessage = async (message: Omit<Message, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'messages'), {
    ...message,
    createdAt: new Date().toISOString(),
  });
  
  if (message.conversationId) {
    await updateDoc(doc(db, 'conversations', message.conversationId), {
      updatedAt: new Date().toISOString(),
    });
  }
  
  return docRef;
};

export const getMessages = async (conversationId?: string) => {
  let q;
  if (conversationId) {
    // Simple query without composite index requirement
    q = query(
      collection(db, 'messages'), 
      where('conversationId', '==', conversationId)
    );
  } else {
    q = query(collection(db, 'messages'));
  }
  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Message, 'id'>) })) as Message[];
  // Sort client-side to avoid composite index requirement
  return messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const updateMessage = async (id: string, data: Partial<Message>) => {
  await updateDoc(doc(db, 'messages', id), data as Record<string, unknown>);
};

export const deleteMessage = async (id: string) => {
  await deleteDoc(doc(db, 'messages', id));
};

// Legacy exports for backward compatibility
export const addNote = async (content: string) => {
  return await addMessage({ type: 'note', content });
};

export const getNotes = async () => {
  const messages = await getMessages();
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
  title: string;
  completed: boolean;
  createdAt: string;
}

export const addTask = async (title: string) => {
  return await addDoc(collection(db, 'tasks'), {
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  });
};

export const getTasks = async () => {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
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
  username: string;
  password: string;
  host: string;
  url: string;
  type: CredentialType;
  createdAt: string;
}

export const addCredential = async (credential: Omit<Credential, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'credentials'), {
    ...credential,
    createdAt: new Date().toISOString(),
  });
};

export const getCredentials = async () => {
  const q = query(collection(db, 'credentials'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Credential[];
};

export const deleteCredential = async (id: string) => {
  await deleteDoc(doc(db, 'credentials', id));
};
