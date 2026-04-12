import { create } from 'zustand';
import { apiService } from '../lib/apiService';

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
      const widgets = await apiService.getWidgets(uid);
      set({ savedWidgets: widgets, loading: false });
    } catch (e: any) {
      console.error('[API] loadWidgets failed:', e.message);
      set({ loading: false, loadError: e.message || 'Failed to load widgets.' });
    }
  },

  saveWidget: async (config: WidgetConfig, uid: string) => {
    set({ saving: true, saveError: null });
    try {
      if (config.id && get().savedWidgets.some(w => w.id === config.id)) {
        await apiService.updateWidget(config.id, config);
      } else {
        await apiService.createWidget(config);
      }
      
      const widgets = await apiService.getWidgets(uid);
      set({ savedWidgets: widgets, saving: false });
    } catch (e: any) {
      console.error('[API] saveWidget failed:', e.message);
      set({ saving: false, saveError: e.message || 'Failed to save widget.' });
      throw e;
    }
  },

  deleteWidget: async (id: string) => {
    try {
      await apiService.deleteWidget(id);
      set(state => ({ savedWidgets: state.savedWidgets.filter(w => w.id !== id) }));
    } catch (e: any) {
      console.error('[API] deleteWidget failed:', e.message);
      throw e;
    }
  },

  updateConfig: (key, value) =>
    set(state => ({ config: { ...state.config, [key]: value } })),

  setConfig: (config) => set({ config }),

  resetConfig: () => set({ config: { ...defaultWidget, id: crypto.randomUUID() } }),
}));
