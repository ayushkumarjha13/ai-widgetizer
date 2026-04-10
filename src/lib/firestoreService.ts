import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { WidgetConfig } from '../store/widgetStore';

// ─── Users ────────────────────────────────────────────────────────────────────

/** Initialize or update a user profile in Firestore and ensure they have a default widget */
export const syncUserDoc = async (uid: string, email: string) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    uid,
    email,
    plan: 'starter',
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // For production: Ensure new users always have a sample widget
  const widgetsQuery = query(collection(db, 'widgets'), where('ownerUid', '==', uid));
  const snap = await getDocs(widgetsQuery);
  
  if (snap.empty) {
    const welcomeId = crypto.randomUUID();
    const welcomeWidget = {
      id: welcomeId,
      name: 'My First AI Agent',
      n8nWebhookUrl: 'https://primary-n8n-url.com/webhook/example', // Placeholder
      primaryColor: '#6366f1',
      botBubbleColor: '#ffffff',
      userBubbleColor: '#6366f1',
      greetingMessage: 'Hi! I am your new AI assistant. How can I help you today?',
      headerSubtitle: 'Ready to help',
      starterQuestions: ['Tell me about your services', 'How do I get started?'],
      showBranding: true,
      brandingText: 'Powered by ChatWatch',
      brandingLink: 'https://yourwebsite.com',
      logoUrl: 'https://ui-avatars.com/api/?name=CW&background=6366f1&color=fff',
      position: 'right',
      autoOpenDelay: 0,
      ownerUid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'widgets', welcomeId), welcomeWidget);
  }
};

// ─── Widgets ──────────────────────────────────────────────────────────────────

/** Fetch all widgets owned by the current user.
 *  NOTE: We intentionally avoid orderBy() here because combining where() + orderBy()
 *  requires a composite Firestore index. We sort client-side instead.
 */
export const fetchUserWidgets = async (uid: string): Promise<WidgetConfig[]> => {
  const q = query(collection(db, 'widgets'), where('ownerUid', '==', uid));
  const snap = await getDocs(q);
  const widgets = snap.docs.map(d => ({ ...d.data(), id: d.id } as WidgetConfig));
  // Sort newest first client-side
  return widgets.sort((a, b) => {
    const aTime = (a as any).updatedAt?.seconds ?? 0;
    const bTime = (b as any).updatedAt?.seconds ?? 0;
    return bTime - aTime;
  });
};

/** Save (create or update) a widget for the current user */
export const saveUserWidget = async (uid: string, config: WidgetConfig): Promise<void> => {
  const widgetRef = doc(db, 'widgets', config.id!);
  await setDoc(widgetRef, {
    ...config,
    ownerUid: uid,
    updatedAt: serverTimestamp(),
    createdAt: config.createdAt ?? serverTimestamp(),
  }, { merge: true });
};

/** Delete a widget document */
export const deleteUserWidget = async (widgetId: string): Promise<void> => {
  await deleteDoc(doc(db, 'widgets', widgetId));
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalOpens: number;
  totalMessages: number;
  uniqueSessions: number;
  byHour: Record<number, number>;       // hour (0-23) → count
  byCountry: Record<string, number>;    // country → count
  byDay: Record<string, number>;        // 'YYYY-MM-DD' → opens
  bySentiment: { happy: number; neutral: number; angry: number };
}

export interface WidgetEvent {
  widgetId: string;
  eventType: 'open' | 'message' | 'close';
  country?: string;
  region?: string;
  sentiment?: 'happy' | 'neutral' | 'angry';
  sessionId: string;
  text?: string;
  sender?: 'user' | 'bot';
  ts: Timestamp | null;
}

/** Record a widget analytics event (called from the embed script via a lightweight endpoint or client-side) */
export const trackWidgetEvent = async (event: Omit<WidgetEvent, 'ts'>): Promise<void> => {
  await addDoc(collection(db, 'analytics'), {
    ...event,
    ts: serverTimestamp(),
  });
};

/** Fetch aggregated analytics for all widgets owned by a user with optional date range */
export const fetchAnalyticsForUser = async (
  uid: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<Record<string, AnalyticsSummary>> => {
  // Get all widgets for this user first
  const widgets = await fetchUserWidgets(uid);
  const widgetIds = widgets.map(w => w.id!);

  if (widgetIds.length === 0) return {};

  // Firestore 'in' queries support max 30 items; for simplicity batch if needed
  const BATCH = 30;
  const allDocs: WidgetEvent[] = [];

  for (let i = 0; i < widgetIds.length; i += BATCH) {
    const batch = widgetIds.slice(i, i + BATCH);
    let q = query(collection(db, 'analytics'), where('widgetId', 'in', batch));
    
    if (startDate) {
      q = query(q, where('ts', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      q = query(q, where('ts', '<=', Timestamp.fromDate(endDate)));
    }

    const snap = await getDocs(q);
    snap.docs.forEach(d => allDocs.push(d.data() as WidgetEvent));
  }

  // Aggregate per widget
  const result: Record<string, AnalyticsSummary> = {};
  widgetIds.forEach(id => {
    result[id] = { 
      totalOpens: 0, 
      totalMessages: 0, 
      uniqueSessions: 0 as any, 
      byHour: {}, 
      byCountry: {}, 
      byDay: {},
      bySentiment: { happy: 0, neutral: 0, angry: 0 }
    };
  });

  const sessionSets: Record<string, Set<string>> = {};
  widgetIds.forEach(id => { sessionSets[id] = new Set(); });

  allDocs.forEach(ev => {
    const s = result[ev.widgetId];
    if (!s) return;
    sessionSets[ev.widgetId].add(ev.sessionId);
    if (ev.eventType === 'open') s.totalOpens++;
    if (ev.eventType === 'message') {
      s.totalMessages++;
      if (ev.sentiment) s.bySentiment[ev.sentiment]++;
    }

    if (ev.ts) {
      const date = (ev.ts as Timestamp).toDate();
      const hour = date.getHours();
      s.byHour[hour] = (s.byHour[hour] || 0) + 1;
      const day = date.toISOString().slice(0, 10);
      s.byDay[day] = (s.byDay[day] || 0) + 1;
    }
    if (ev.country) {
      s.byCountry[ev.country] = (s.byCountry[ev.country] || 0) + 1;
    }
  });

  // Finalise unique sessions
  widgetIds.forEach(id => {
    result[id].uniqueSessions = sessionSets[id].size as any;
  });

  return result;
};

/** Fetch unique sessions for a widget within a date range */
export const fetchConversationsForWidget = async (
  widgetId: string,
  startDate?: Date,
  endDate?: Date
) => {
  let q = query(
    collection(db, 'analytics'),
    where('widgetId', '==', widgetId),
    orderBy('ts', 'desc')
  );

  if (startDate) q = query(q, where('ts', '>=', Timestamp.fromDate(startDate)));
  if (endDate) q = query(q, where('ts', '<=', Timestamp.fromDate(endDate)));

  const snap = await getDocs(q);
  const events = snap.docs.map(d => d.data() as WidgetEvent);

  // Group by sessionId and find the latest activity for each
  const sessions: Record<string, {
    sessionId: string;
    lastTs: Date;
    country: string;
    messageCount: number;
    lastMessage?: string;
  }> = {};

  events.forEach(ev => {
    if (!sessions[ev.sessionId]) {
      sessions[ev.sessionId] = {
        sessionId: ev.sessionId,
        lastTs: ev.ts?.toDate() || new Date(),
        country: ev.country || 'Unknown',
        messageCount: 0,
      };
    }
    if (ev.eventType === 'message') {
      sessions[ev.sessionId].messageCount++;
      if (!sessions[ev.sessionId].lastMessage && ev.text) {
        sessions[ev.sessionId].lastMessage = ev.text;
      }
    }
  });

  return Object.values(sessions).sort((a, b) => b.lastTs.getTime() - a.lastTs.getTime());
};

/** Fetch all messages for a specific session */
export const fetchSessionMessages = async (sessionId: string) => {
  const q = query(
    collection(db, 'analytics'),
    where('sessionId', '==', sessionId),
    where('eventType', '==', 'message'),
    orderBy('ts', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as WidgetEvent);
};

/** 
 * Calculate current month usage for a user.
 * This is used for subscription limit enforcement.
 */
export const getUserUsageSummary = async (uid: string) => {
  const analytics = await fetchAnalyticsForUser(uid);
  const totalMessages = Object.values(analytics).reduce((acc, s) => acc + s.totalMessages, 0);
  const widgetCount = Object.keys(analytics).length;
  
  // Real apps would filter 'analytics' by the current month's timestamp in the query above.
  return { totalMessages, widgetCount };
};

/** 
 * ─── Admin SaaS Stats ─────────────────────────────────────────────────────────
 * Fetches global metrics across the entire platform. 
 * This is meant for the product owner.
 */
export const fetchSaaSStats = async () => {
  const [usersSnap, widgetsSnap, analyticsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'widgets')),
    getDocs(collection(db, 'analytics'))
  ]);

  const users = usersSnap.docs.map(d => ({ ...d.data(), id: d.id }));
  const widgets = widgetsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
  const events = analyticsSnap.docs.map(d => d.data() as WidgetEvent);

  const totalUsers = users.length;
  const totalWidgets = widgets.length;
  const totalMessages = events.filter(e => e.eventType === 'message').length;
  const totalOpens = events.filter(e => e.eventType === 'open').length;

  // Active Users (those who created at least one widget)
  const uniqueOwners = new Set(widgets.map((w: any) => w.ownerUid));
  const activeMakers = uniqueOwners.size;

  // Global usage by day
  const usageByDay: Record<string, number> = {};
  const widgetMetrics: Record<string, number> = {};
  
  events.forEach(ev => {
    if (ev.ts) {
      const day = (ev.ts as Timestamp).toDate().toISOString().slice(0, 10);
      usageByDay[day] = (usageByDay[day] || 0) + 1;
    }
    
    // Aggregating global widget leaderboard (all time)
    if (ev.eventType === 'message') {
       widgetMetrics[ev.widgetId] = (widgetMetrics[ev.widgetId] || 0) + 1;
    }
  });

  // Top 5 Widgets
  const leaderboard = Object.entries(widgetMetrics)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const w = widgets.find((x: any) => x.id === id) as any;
      return { id, name: w?.name || 'Deleted Widget', count };
    });

  // Plan distribution
  const plans = { starter: 0, business: 0 };
  users.forEach((u: any) => {
    if (u.plan === 'business') plans.business++;
    else plans.starter++;
  });

  return {
    totalUsers,
    totalWidgets,
    totalMessages,
    totalOpens,
    activeMakers,
    usageByDay,
    plans,
    leaderboard,
    users: users.sort((a: any, b: any) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)),
    widgets: widgets.sort((a: any, b: any) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
  };
};
