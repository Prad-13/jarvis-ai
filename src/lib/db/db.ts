import fs from 'fs';
import path from 'path';

export interface GoogleSession {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  email: string;
  name?: string;
  picture?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  dueDate?: string;
  createdAt: string;
}

export interface MemoryItem {
  id: string;
  content: string;
  category: 'preference' | 'bio' | 'rule' | 'general';
  createdAt: string;
}

interface DatabaseSchema {
  session: GoogleSession | null;
  tasks: Task[];
  memory: MemoryItem[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'jarvis-db.json');

const DEFAULT_DB: DatabaseSchema = {
  session: null,
  tasks: [
    {
      id: 'task-1',
      title: 'Review executive briefing report',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Prepare presentation deck for the Q3 planning session',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Sync calendar and confirm availability for board sync',
      status: 'completed',
      createdAt: new Date().toISOString(),
    }
  ],
  memory: [
    {
      id: 'mem-1',
      content: 'User prefers to be addressed as Pradyumna.',
      category: 'preference',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mem-2',
      content: 'Daily meetings focus mainly on engineering deliverables and architectural designs.',
      category: 'bio',
      createdAt: new Date().toISOString()
    }
  ]
};

class JarvisDatabase {
  private read(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_FILE_PATH)) {
        this.write(DEFAULT_DB);
        return DEFAULT_DB;
      }
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(data) as DatabaseSchema;
    } catch (error) {
      console.error('Failed to read database file:', error);
      return DEFAULT_DB;
    }
  }

  private write(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to write database file:', error);
    }
  }

  // Session Management
  getSession(): GoogleSession | null {
    return this.read().session;
  }

  setSession(session: GoogleSession): void {
    const db = this.read();
    // Maintain refresh token if new session doesn't supply it
    const existingSession = db.session;
    db.session = {
      ...session,
      refresh_token: session.refresh_token || existingSession?.refresh_token
    };
    this.write(db);
  }

  clearSession(): void {
    const db = this.read();
    db.session = null;
    this.write(db);
  }

  // Tasks Management
  getTasks(): Task[] {
    return this.read().tasks;
  }

  addTask(title: string, dueDate?: string): Task {
    const db = this.read();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      status: 'pending',
      dueDate,
      createdAt: new Date().toISOString()
    };
    db.tasks.unshift(newTask);
    this.write(db);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | null {
    const db = this.read();
    const taskIndex = db.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return null;
    
    db.tasks[taskIndex] = {
      ...db.tasks[taskIndex],
      ...updates
    };
    this.write(db);
    return db.tasks[taskIndex];
  }

  deleteTask(id: string): boolean {
    const db = this.read();
    const initialLength = db.tasks.length;
    db.tasks = db.tasks.filter(t => t.id !== id);
    if (db.tasks.length === initialLength) return false;
    this.write(db);
    return true;
  }

  // Memory Management
  getMemory(): MemoryItem[] {
    return this.read().memory;
  }

  addMemory(content: string, category: MemoryItem['category'] = 'general'): MemoryItem {
    const db = this.read();
    const newItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      content,
      category,
      createdAt: new Date().toISOString()
    };
    db.memory.push(newItem);
    this.write(db);
    return newItem;
  }

  deleteMemory(id: string): boolean {
    const db = this.read();
    const initialLength = db.memory.length;
    db.memory = db.memory.filter(m => m.id !== id);
    if (db.memory.length === initialLength) return false;
    this.write(db);
    return true;
  }
}

export const db = new JarvisDatabase();
