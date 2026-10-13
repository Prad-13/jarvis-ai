import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  status?: string; // used for streaming status updates (e.g. "Executing Gmail search...")
  tools?: { name: string; status: 'success' | 'error'; label: string }[];
  timestamp: string;
}

export interface GoogleUserProfile {
  name?: string;
  email?: string;
  picture?: string;
}

interface JarvisState {
  // UI Layout States
  activeTab: string;
  sidebarExpanded: boolean;
  chatPanelOpen: boolean;
  commandPaletteOpen: boolean;
  
  // Authentication & Connections
  googleConnected: boolean;
  googleUser: GoogleUserProfile | null;
  
  // Chat Integration States
  messages: ChatMessage[];
  statusMessage: string | null;
  isStreaming: boolean;
  isRecording: boolean;
  
  // Actions
  setActiveTab: (tab: string) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setChatPanelOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setGoogleConnected: (connected: boolean, user: GoogleUserProfile | null) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessageContent: (content: string, append?: boolean) => void;
  updateLastMessageTools: (tools: ChatMessage['tools']) => void;
  setStatusMessage: (msg: string | null) => void;
  setIsStreaming: (is: boolean) => void;
  setIsRecording: (is: boolean) => void;
  clearChat: () => void;
}

export const useJarvisStore = create<JarvisState>((set) => ({
  // Defaults
  activeTab: 'dashboard',
  sidebarExpanded: true,
  chatPanelOpen: true,
  commandPaletteOpen: false,
  googleConnected: false,
  googleUser: null,
  messages: [
    {
      id: 'welcome-msg',
      role: 'model',
      content: 'Awaiting your command, Pradyumna. The Google ecosystem is integrated and ready. What shall we achieve today?',
      timestamp: new Date().toISOString()
    }
  ],
  statusMessage: null,
  isStreaming: false,
  isRecording: false,

  // Action implementations
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setChatPanelOpen: (open) => set({ chatPanelOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setGoogleConnected: (connected, user) => set({ googleConnected: connected, googleUser: user }),
  
  addMessage: (msg) => set((state) => ({
    messages: [
      ...state.messages,
      {
        ...msg,
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
      }
    ]
  })),

  updateLastMessageContent: (content, append = true) => set((state) => {
    if (state.messages.length === 0) return {};
    const updated = [...state.messages];
    const lastIdx = updated.length - 1;
    updated[lastIdx] = {
      ...updated[lastIdx],
      content: append ? (updated[lastIdx].content + content) : content
    };
    return { messages: updated };
  }),

  updateLastMessageTools: (tools) => set((state) => {
    if (state.messages.length === 0) return {};
    const updated = [...state.messages];
    const lastIdx = updated.length - 1;
    updated[lastIdx] = {
      ...updated[lastIdx],
      tools
    };
    return { messages: updated };
  }),

  setStatusMessage: (msg) => set({ statusMessage: msg }),
  setIsStreaming: (is) => set({ isStreaming: is }),
  setIsRecording: (is) => set({ isRecording: is }),
  clearChat: () => set({
    messages: [
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: 'System reset complete. Ready for new input, Pradyumna.',
        timestamp: new Date().toISOString()
      }
    ]
  }),
}));
