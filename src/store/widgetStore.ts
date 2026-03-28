import { create } from 'zustand';
import { saveUserWidget, deleteUserWidget, fetchUserWidgets } from '../lib/firestoreService';

export interface WidgetConfig {
  id?: string;
  name: string;
  n8nWebhookUrl: string;
  primaryColor: string;
  botBubbleColor: string;
  userBubbleColor: string;
  greetingMessage: string;
  headerSubtitle: string;
  starterQuestions: string[];
  showBranding: boolean;
  brandingText: string;
  brandingLink: string;
  logoUrl: string;
  position: 'left' | 'right';
  autoOpen: boolean;
  ownerUid?: string;
  createdAt?: any;
}

export const defaultWidget: WidgetConfig = {
  name: 'My Custom AI',
  n8nWebhookUrl: '',
  primaryColor: '#6366f1',
  botBubbleColor: '#ffffff',
  userBubbleColor: '#6366f1',
  greetingMessage: 'Hello! How can I help you today?',
  headerSubtitle: 'Online and ready to help',
  starterQuestions: ['What are your services?', 'How do I start?'],
  showBranding: true,
  brandingText: 'Powered by AI Widget',
  brandingLink: 'https://yourwebsite.com',
  logoUrl: 'https://ui-avatars.com/api/?name=AI&background=6366f1&color=fff',
  position: 'right',
  autoOpen: false,
};

/** Wraps a promise with a timeout — prevents Firestore hangs from freezing the UI */
const withTimeout = <T>(promise: Promise<T>, ms = 15000, label = 'Operation'): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out. Check your Firestore/network setup.`)), ms)
  );
  return Promise.race([promise, timeout]);
};

interface WidgetState {
  config: WidgetConfig;
  savedWidgets: WidgetConfig[];
  saving: boolean;
  loading: boolean;
  loadError: string | null;
  saveError: string | null;
  loadWidgets: (uid: string) => Promise<void>;
  saveWidget: (config: WidgetConfig, uid: string) => Promise<void>;
  deleteWidget: (id: string) => Promise<void>;
  updateConfig: (key: keyof WidgetConfig, value: any) => void;
  setConfig: (config: WidgetConfig) => void;
  resetConfig: () => void;
}

export const useWidgetStore = create<WidgetState>((set, get) => ({
  config: { ...defaultWidget, id: crypto.randomUUID() },
  savedWidgets: [],
  saving: false,
  loading: false,
  loadError: null,
  saveError: null,

  loadWidgets: async (uid: string) => {
    set({ loading: true, loadError: null });
    try {
      const widgets = await withTimeout(fetchUserWidgets(uid), 15000, 'Load widgets');
      set({ savedWidgets: widgets, loading: false });
    } catch (e: any) {
      console.error('[Firestore] loadWidgets failed:', e.message);
      set({ loading: false, loadError: e.message || 'Failed to load widgets.' });
    }
  },

  saveWidget: async (config: WidgetConfig, uid: string) => {
    set({ saving: true, saveError: null });
    try {
      await withTimeout(saveUserWidget(uid, { ...config, ownerUid: uid }), 15000, 'Save widget');
      const existing = get().savedWidgets.findIndex(w => w.id === config.id);
      let newWidgets = [...get().savedWidgets];
      if (existing >= 0) {
        newWidgets[existing] = config;
      } else {
        newWidgets = [config, ...newWidgets];
      }
      set({ savedWidgets: newWidgets, saving: false });
    } catch (e: any) {
      console.error('[Firestore] saveWidget failed:', e.message);
      set({ saving: false, saveError: e.message || 'Failed to save widget.' });
      throw e;
    }
  },

  deleteWidget: async (id: string) => {
    try {
      await withTimeout(deleteUserWidget(id), 15000, 'Delete widget');
      set(state => ({ savedWidgets: state.savedWidgets.filter(w => w.id !== id) }));
    } catch (e: any) {
      console.error('[Firestore] deleteWidget failed:', e.message);
      throw e;
    }
  },

  updateConfig: (key, value) =>
    set(state => ({ config: { ...state.config, [key]: value } })),

  setConfig: (config) => set({ config }),

  resetConfig: () => set({ config: { ...defaultWidget, id: crypto.randomUUID() } }),
}));
