import { create } from 'zustand';
import { nowIso, todayYMD, uid } from '../utils/time';
import { dbApi } from './dbApi';
import { ApiService } from '../services/api.service';
import { PaymentService } from '../services/payment.service';

export type Mood = 'calm' | 'stressed' | 'focused' | 'tired' | 'neutral';

export interface Habit {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  archived?: boolean;
  goalPerDay?: number; // default 1
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean; // true if completed, false if not completed
  note?: string; // optional note about feeling/what you did
}

export interface JournalEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  content: string; // NOTE: plaintext in Expo Go; encrypt in Dev Client
  mood?: Mood | null;
  tags?: string[] | null;
}

export type BreathShape = 'circle' | 'rounded' | 'diamond';
export interface BreathProtocol {
  id: string;
  name: string;
  goal: string;
  inhale: number;
  hold: number;
  exhale: number;
  hold2?: number;
  cycles: number;
  gradient: [string, string];
  shape: BreathShape;
  description?: string; // Optional description explaining the protocol's purpose and benefits
}

const phrasePacks: string[] = [
  'Slow is smooth. Smooth is fast.',
  'Breathe in calm, breathe out noise.',
  'Small steps, big direction.',
  'Focus on what you can control.',
  'Quiet mind, clear signals.',
  'Consistency compounds.',
];

// Large collection of mindfulness, balance, and mental wellness quotes
// These change daily based on the date hash
const quotePacks: string[] = [
  'The present moment is the only time over which we have dominion.',
  'Peace comes from within. Do not seek it without.',
  'You are the sky. Everything else is just the weather.',
  'Mindfulness is about being fully awake in our lives.',
  'Balance is not something you find, it\'s something you create.',
  'The best way to take care of the future is to take care of the present moment.',
  'Wherever you are, be there totally.',
  'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.',
  'The mind is everything. What you think you become.',
  'You have power over your mind, not outside events. Realize this, and you will find strength.',
  'Happiness is not something ready made. It comes from your own actions.',
  'The only way out is through.',
  'Progress, not perfection.',
  'You are enough, just as you are.',
  'Self-care is giving the world the best of you, instead of what\'s left of you.',
  'Your calm mind is the ultimate weapon against your challenges.',
  'Be present in all things and thankful for all things.',
  'The quieter you become, the more you can hear.',
  'In the midst of movement and chaos, keep stillness inside of you.',
  'What lies behind us and what lies before us are tiny matters compared to what lies within us.',
  'The journey of a thousand miles begins with one step.',
  'You cannot control the wind, but you can adjust your sails.',
  'Every moment is a fresh beginning.',
  'The only person you are destined to become is the person you decide to be.',
  'What we think, we become.',
  'Be yourself; everyone else is already taken.',
  'The present moment is a gift. That\'s why it\'s called the present.',
  'Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.',
  'You are not your thoughts. You are the observer of your thoughts.',
  'The mind is like water. When calm, it reflects perfectly.',
  'Your task is not to seek for love, but merely to seek and find all the barriers within yourself.',
  'The wound is the place where the Light enters you.',
  'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.',
  'If you want to conquer the anxiety of life, live in the moment, live in the breath.',
  'The best time to plant a tree was 20 years ago. The second best time is now.',
  'You must be the change you wish to see in the world.',
  'It does not matter how slowly you go as long as you do not stop.',
  'Life is what happens to you while you\'re busy making other plans.',
  'The only impossible journey is the one you never begin.',
  'In the end, we will remember not the words of our enemies, but the silence of our friends.',
  'Do what you can, with what you have, where you are.',
  'The future belongs to those who believe in the beauty of their dreams.',
  'It is during our darkest moments that we must focus to see the light.',
  'Success is not final, failure is not fatal: it is the courage to continue that counts.',
  'The way to get started is to quit talking and begin doing.',
  'Don\'t let yesterday take up too much of today.',
  'You learn more from failure than from success.',
  'If you are working on something exciting that you really care about, you don\'t have to be pushed. The vision pulls you.',
  'People who are crazy enough to think they can change the world, are the ones who do.',
  'We may encounter many defeats but we must not be defeated.',
  'Knowing yourself is the beginning of all wisdom.',
  'The unexamined life is not worth living.',
  'The only true wisdom is in knowing you know nothing.',
  'It is the mark of an educated mind to be able to entertain a thought without accepting it.',
  'Quality is not an act, it is a habit.',
  'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
  'Happiness depends upon ourselves.',
  'The secret of happiness, you see, is not found in seeking more, but in developing the capacity to enjoy less.',
  'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
  'The happiness of your life depends upon the quality of your thoughts.',
  'If you are depressed you are living in the past. If you are anxious you are living in the future. If you are at peace you are living in the present.',
  'The mind that is anxious about future events is miserable.',
  'How much time he gains who does not look to see what his neighbor says or does.',
  'You have been assigned this mountain to show others it can be moved.',
  'The cave you fear to enter holds the treasure you seek.',
  'What we achieve inwardly will change outer reality.',
  'The privilege of a lifetime is to become who you truly are.',
  'Until you make the unconscious conscious, it will direct your life and you will call it fate.',
  'I am not what happened to me, I am what I choose to become.',
  'Everything can be taken from a man but one thing: the last of the human freedoms—to choose one\'s attitude in any given set of circumstances.',
  'When we are no longer able to change a situation, we are challenged to change ourselves.',
  'Between stimulus and response there is a space. In that space is our power to choose our response.',
  'Man\'s main concern is not to gain pleasure or to avoid pain but rather to see a meaning in his life.',
  'Those who have a \'why\' to live, can bear almost any \'how\'.',
  'In some ways suffering ceases to be suffering at the moment it finds a meaning.',
  'Everything can be taken from a man but one thing: the last of the human freedoms—to choose one\'s attitude.',
  'The meaning of life is to give life meaning.',
  'Life is never made unbearable by circumstances, but only by lack of meaning and purpose.',
  'When we are no longer able to change a situation, we are challenged to change ourselves.',
  'What is to give light must endure burning.',
  'The wound is the place where the Light enters you.',
  'The quieter you become, the more you are able to hear.',
  'Out beyond ideas of wrongdoing and rightdoing there is a field. I\'ll meet you there.',
  'Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.',
  'The minute I heard my first love story, I started looking for you, not knowing how blind that was.',
  'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.',
  'The wound is the place where the Light enters you.',
  'If you are irritated by every rub, how will your mirror be polished?',
  'The cure for pain is in the pain.',
  'Where there is ruin, there is hope for a treasure.',
  'This too shall pass.',
  'The dark thought, the shame, the malice, meet them at the door laughing, and invite them in.',
  'Be grateful for everything. The good, the bad, the ugly. It\'s all a blessing.',
  'The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.',
  'You have power over your mind—not outside events. Realize this, and you will find strength.',
  'The impediment to action advances action. What stands in the way becomes the way.',
  'If it is not right, do not do it. If it is not true, do not say it.',
  'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
  'The happiness of your life depends upon the quality of your thoughts.',
  'Waste no more time arguing about what a good man should be. Be one.',
  'The best revenge is not to be like your enemy.',
  'Accept the things to which fate binds you, and love the people with whom fate brings you together.',
  'Dwell on the beauty of life. Watch the stars, and see yourself running with them.',
  'Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.',
  'You have power over your mind—not outside events. Realize this, and you will find strength.',
  'The soul becomes dyed with the color of its thoughts.',
  'The best revenge is to be unlike him who performed the injury.',
  'How much trouble he avoids who does not look to see what his neighbor says or does.',
  'The first step in the evolution of ethics is a sense of solidarity with other human beings.',
  'The meaning of life is to give life meaning.',
  'When we are no longer able to change a situation, we are challenged to change ourselves.',
  'Everything can be taken from a man but one thing: the last of the human freedoms—to choose one\'s attitude.',
  'Between stimulus and response there is a space. In that space is our power to choose our response.',
  'Those who have a \'why\' to live, can bear almost any \'how\'.',
  'In some ways suffering ceases to be suffering at the moment it finds a meaning.',
  'The meaning of life is to give life meaning.',
  'Life is never made unbearable by circumstances, but only by lack of meaning and purpose.',
  'When we are no longer able to change a situation, we are challenged to change ourselves.',
  'What is to give light must endure burning.',
  'The wound is the place where the Light enters you.',
  'The quieter you become, the more you are able to hear.',
  'Out beyond ideas of wrongdoing and rightdoing there is a field. I\'ll meet you there.',
  'Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.',
  'The minute I heard my first love story, I started looking for you, not knowing how blind that was.',
  'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.',
  'The wound is the place where the Light enters you.',
  'If you are irritated by every rub, how will your mirror be polished?',
  'The cure for pain is in the pain.',
  'Where there is ruin, there is hope for a treasure.',
  'This too shall pass.',
  'The dark thought, the shame, the malice, meet them at the door laughing, and invite them in.',
  'Be grateful for everything. The good, the bad, the ugly. It\'s all a blessing.',
  'The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.',
  'You have power over your mind—not outside events. Realize this, and you will find strength.',
  'The impediment to action advances action. What stands in the way becomes the way.',
  'If it is not right, do not do it. If it is not true, do not say it.',
  'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
  'The happiness of your life depends upon the quality of your thoughts.',
  'Waste no more time arguing about what a good man should be. Be one.',
  'The best revenge is not to be like your enemy.',
  'Accept the things to which fate binds you, and love the people with whom fate brings you together.',
  'Dwell on the beauty of life. Watch the stars, and see yourself running with them.',
  'Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.',
  'You have power over your mind—not outside events. Realize this, and you will find strength.',
  'The soul becomes dyed with the color of its thoughts.',
  'The best revenge is to be unlike him who performed the injury.',
  'How much trouble he avoids who does not look to see what his neighbor says or does.',
  'The first step in the evolution of ethics is a sense of solidarity with other human beings.',
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return Math.abs(h);
}

const defaultProtocols: BreathProtocol[] = [
  {
    id: '478', name: 'D&S 4-7-8', goal: 'Downshift & sleep',
    inhale: 4, hold: 7, exhale: 8, cycles: 4,
    gradient: ['#B8A9D4', '#D8CCE8'], // lavender
    shape: 'circle',
    description: 'The 4-7-8 breathing technique, popularized by Dr. Andrew Weil, is designed to promote relaxation and reduce anxiety. This pattern activates the parasympathetic nervous system, helping to slow the heart rate and lower blood pressure. Regular practice can improve sleep quality, reduce stress levels, and enhance overall calmness.',
  },
  {
    id: 'box', name: 'Box 4-4-4-4', goal: 'Focus & calm',
    inhale: 4, hold: 4, exhale: 4, hold2: 4, cycles: 4,
    gradient: ['#7BA3D4', '#9BB8D9'], // blue
    shape: 'rounded',
    description: 'Box breathing, also known as four-square breathing, is a technique that involves equal counts for inhaling, holding, exhaling, and holding again. This method helps regulate the breath and activate the parasympathetic nervous system, making it effective for reducing stress, improving concentration, and maintaining composure in high-pressure situations. Commonly used by athletes and professionals.',
  },
  {
    id: 'coh', name: 'Coherent 5-5', goal: 'HRV coherence',
    inhale: 5, hold: 0, exhale: 5, cycles: 6,
    gradient: ['#7FB3A8', '#A8D4C8'], // sage
    shape: 'circle',
    description: 'Coherent breathing involves breathing at a consistent rate with equal inhalation and exhalation durations. This technique aims to synchronize heart rate variability (HRV), which can reduce anxiety, enhance cognitive function, and improve emotional regulation. Regular practice promotes a balanced state between the sympathetic and parasympathetic nervous systems.',
  },
  {
    id: 'bal', name: 'Balanced 4-4', goal: 'Reset & balance',
    inhale: 4, hold: 0, exhale: 4, cycles: 6,
    gradient: ['#E8B89A', '#F5D4C4'], // peach
    shape: 'diamond',
    description: 'Balanced breathing uses equal inhale and exhale durations to create a sense of equilibrium and stability. This simple yet effective technique helps reset the nervous system, reduce stress, and restore balance. It\'s ideal for moments when you need to center yourself and find calm in the present moment.',
  },
];

type State = {
  // phrase
  dailyPhrase: (date: string) => string;
  // quote
  dailyQuote: (date: string) => string;

  // habits
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (name: string) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  setTodayHabitLog: (habitId: string, completed: boolean, note?: string) => void;
  getTodayHabitLog: (habitId: string) => HabitLog | undefined;
  isCompletedToday: (habitId: string) => boolean;

  // journal
  journal: JournalEntry[];
  addJournal: (title: string, content: string, mood?: Mood | null) => void;
  updateJournal: (id: string, patch: Partial<Pick<JournalEntry, 'title' | 'content' | 'mood' | 'tags'>>) => void;
  deleteJournal: (id: string) => void;

  // breathwork
  protocols: BreathProtocol[];
  selectedBreathPresetId: string;
  breathCycles: number;
  customBreath?: {
    name: string; goal: string; inhale: number; hold: number; exhale: number; hold2?: number; shape: BreathShape; gradient: [string,string];
  };
  setSelectedBreathPreset: (id: string) => void;
  setBreathCycles: (n: number) => void;
  setCustomBreath: (cfg: State['customBreath']) => void;
  breathPresets: BreathProtocol[];
  saveCurrentCustomAsPreset: (name: string, goal: string) => void;
  deleteBreathPreset: (id: string) => void;

  // tasks
  tasks: { id: string; title: string; done: boolean; createdAt: string; completedAt?: string | null }[];
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // ui
  lowMotion: boolean;
  setLowMotion: (v: boolean) => void;
  encryptionEnabled: boolean;
  setEncryptionEnabled: (v: boolean) => void;
  cuesHaptics: boolean;
  setCuesHaptics: (v: boolean) => void;
  cuesAudio: boolean;
  setCuesAudio: (v: boolean) => void;
  
  // data retention
  dataRetentionDays: number; // 0 = keep all, 30/90/180/365 = keep last N days
  setDataRetentionDays: (days: number) => void;
  performDataCleanup: (includeJournal?: boolean) => Promise<void>;

  // goals
  weeklyGoal: string;
  threeMonthGoal: string;
  yearlyGoal: string;
  setWeeklyGoal: (text: string) => void;
  setThreeMonthGoal: (text: string) => void;
  setYearlyGoal: (text: string) => void;
  // goal categories - each has weekly, monthly, and yearly
  healthWeeklyGoal: string;
  healthMonthlyGoal: string;
  healthYearlyGoal: string;
  financialWeeklyGoal: string;
  financialMonthlyGoal: string;
  financialYearlyGoal: string;
  personalGrowthWeeklyGoal: string;
  personalGrowthMonthlyGoal: string;
  personalGrowthYearlyGoal: string;
  relationshipWeeklyGoal: string;
  relationshipMonthlyGoal: string;
  relationshipYearlyGoal: string;
  setHealthWeeklyGoal: (text: string) => void;
  setHealthMonthlyGoal: (text: string) => void;
  setHealthYearlyGoal: (text: string) => void;
  setFinancialWeeklyGoal: (text: string) => void;
  setFinancialMonthlyGoal: (text: string) => void;
  setFinancialYearlyGoal: (text: string) => void;
  setPersonalGrowthWeeklyGoal: (text: string) => void;
  setPersonalGrowthMonthlyGoal: (text: string) => void;
  setPersonalGrowthYearlyGoal: (text: string) => void;
  setRelationshipWeeklyGoal: (text: string) => void;
  setRelationshipMonthlyGoal: (text: string) => void;
  setRelationshipYearlyGoal: (text: string) => void;

  // admin
  resetAll: () => void;

  // verification
  verifiedAddress?: string | null;
  verifiedAt?: string | null;
  setVerified: (address: string) => Promise<void>;
  disconnectWallet: () => void;
  username?: string | null;
  usernameSet?: boolean; // Whether username has been set (cannot be changed)
  xHandle?: string | null;
  verified?: boolean; // X account verified badge
  setUsername: (username: string) => Promise<void>;
  syncXAccount: (xHandle: string) => Promise<void>;
  fetchUserProfile: (address: string) => Promise<void>;

  // masterminds
  groups: { id: string; name: string; ownerAddress?: string | null; createdAt: string; isPublic?: boolean; joinPrice?: number; paymentAddress?: string; description?: string; apiGroupId?: string }[];
  messages: { id: string; groupId: string; senderAddress?: string | null; senderUsername?: string | null; content: string; createdAt: string }[];
  createGroup: (name: string) => void;
  createPublicGroup: (name: string, joinPrice: number, paymentAddress: string, category: string, description?: string, createPrice?: number, backgroundImage?: string) => Promise<void>;
  deleteGroup: (id: string) => void;
  deletePublicGroup: (groupId: string, verificationSignature: string) => Promise<void>;
  sendMessage: (groupId: string, content: string) => void;
  joinPublicGroup: (groupId: string, paymentSignature: string) => Promise<void>;
  publicGroups: { id: string; name: string; ownerAddress: string; ownerUsername?: string; createdAt: string; joinPrice: number; paymentAddress: string; description?: string; memberCount?: number; category?: string; backgroundImage?: string }[];
  fetchPublicGroups: (category?: string) => Promise<void>;
  updateGroupJoinPrice: (groupId: string, newJoinPrice: number) => Promise<void>;
};

export const useAppStore = create<State>((set, get) => ({
  dailyPhrase: (date: string) => {
    const idx = hashStr(date) % phrasePacks.length;
    return phrasePacks[idx];
  },
  dailyQuote: (date: string) => {
    // Use a different hash seed to ensure quotes differ from phrases
    const seed = hashStr(date + 'quote');
    const idx = seed % quotePacks.length;
    return quotePacks[idx];
  },
  habits: [],
  logs: [],
  addHabit: (name: string) => set((s) => {
    const h = { id: uid(), name, createdAt: nowIso(), goalPerDay: 1 };
    dbApi.addHabit(h);
    return { habits: [...s.habits, h] };
  }),
  updateHabit: (id, patch) => set((s) => {
    const habits = s.habits.map(h => h.id === id ? { ...h, ...patch } : h);
    const h = habits.find(h => h.id === id)!;
    dbApi.updateHabit(h as any);
    return { habits };
  }),
  deleteHabit: (id) => set((s) => {
    dbApi.deleteHabit(id);
    return { habits: s.habits.filter(h => h.id !== id), logs: s.logs.filter(l => l.habitId !== id) };
  }),
  setTodayHabitLog: async (habitId, completed, note) => {
    const today = todayYMD();
    const state = get();
    // Find existing log for this habit and date to reuse its ID
    const existingLog = state.logs.find((l) => l.habitId === habitId && l.date === today);
    const logId = existingLog?.id || uid(); // Reuse existing ID or create new one
    const log = { id: logId, habitId, date: today, completed, note };
    
    // Update database - this will replace existing entry if ID matches
    await dbApi.upsertHabitLogToday(log);
    
    // Update state - replace existing log or add new one
    // Use the log object after database update (ID may have been updated)
    set((s) => {
      const others = s.logs.filter((l) => !(l.habitId === habitId && l.date === today));
      return { logs: [...others, log] };
    });
  },
  getTodayHabitLog: (habitId) => {
    const today = todayYMD();
    return get().logs.find((l) => l.habitId === habitId && l.date === today);
  },
  isCompletedToday: (habitId) => {
    const log = get().getTodayHabitLog(habitId);
    return !!log?.completed;
  },
  journal: [],
  addJournal: (title: string, content: string, mood?: Mood | null) => set((s) => {
    const e = { id: uid(), createdAt: nowIso(), updatedAt: nowIso(), title, content, mood: mood ?? null, tags: null as string[] | null };
    // Save to database asynchronously with error handling
    dbApi.addJournal(e as any, { encryptionEnabled: get().encryptionEnabled })
      .catch((error) => {
        console.error('[Journal] Failed to save entry:', error, { id: e.id, title: e.title || 'Untitled' });
        // Optionally show user-facing error notification here
      });
    // Optimistically update UI immediately
    return { journal: [e, ...s.journal] };
  }),
  updateJournal: (id, patch) => set((s) => {
    const updated = s.journal.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowIso() } : e));
    const j = updated.find(e => e.id === id)!;
    dbApi.updateJournal(j as any, { encryptionEnabled: get().encryptionEnabled });
    return { journal: updated };
  }),
  deleteJournal: (id) => set((s) => {
    dbApi.deleteJournal(id);
    return { journal: s.journal.filter(j => j.id !== id) };
  }),
  protocols: defaultProtocols,
  selectedBreathPresetId: defaultProtocols[0].id,
  breathCycles: defaultProtocols[0].cycles,
  setSelectedBreathPreset: (id) => set(() => { dbApi.upsertPref('breath.selected', id); return { selectedBreathPresetId: id }; }),
  setBreathCycles: (n) => set(() => { dbApi.upsertPref('breath.cycles', String(n)); return { breathCycles: n }; }),
  setCustomBreath: (cfg) => set(() => { dbApi.upsertPref('breath.custom', JSON.stringify(cfg)); return { customBreath: cfg || undefined }; }),
  breathPresets: [],
  saveCurrentCustomAsPreset: (name, goal) => set((s) => {
    const base = s.customBreath || { name: 'Custom', goal: 'Your rhythm', inhale: 4, hold: 4, exhale: 4, hold2: 0, shape: 'circle' as BreathShape, gradient: ['#7BA3D4','#9BB8D9'] as [string,string] };
    const id = uid();
    const p = { id, name, goal, inhale: base.inhale, hold: base.hold, exhale: base.exhale, hold2: base.hold2 ?? 0, shape: base.shape, gradient: base.gradient, cycles: s.breathCycles } as BreathProtocol;
    dbApi.addBreathPreset(p as any);
    return { breathPresets: [p, ...s.breathPresets], selectedBreathPresetId: id };
  }),
  deleteBreathPreset: (id) => set((s) => { dbApi.deleteBreathPreset(id); return { breathPresets: s.breathPresets.filter(p => p.id !== id), selectedBreathPresetId: s.selectedBreathPresetId === id ? s.protocols[0].id : s.selectedBreathPresetId }; }),

  tasks: [],
  addTask: (title: string) => set((s) => {
    const t = { id: uid(), title, done: false, createdAt: nowIso(), completedAt: null as string | null };
    // Add task to database - catch errors to prevent app crash
    dbApi.addTask(t as any).catch((error) => {
      console.error('[Store] Error adding task to database:', error);
    });
    return { tasks: [t, ...s.tasks] };
  }),
  toggleTask: (id: string) => set((s) => {
    const tasks = s.tasks.map(t => t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? nowIso() : null } : t);
    const t = tasks.find(t => t.id === id)!;
    dbApi.updateTask(t as any);
    return { tasks };
  }),
  deleteTask: (id: string) => set((s) => {
    dbApi.deleteTask(id);
    return { tasks: s.tasks.filter(t => t.id !== id) };
  }),
  lowMotion: false,
  setLowMotion: (v) => set(() => ({ lowMotion: v })),
  encryptionEnabled: false,
  setEncryptionEnabled: (v) => set(() => ({ encryptionEnabled: v })),
  cuesHaptics: true,
  setCuesHaptics: (v) => set(() => { dbApi.upsertPref('cues.haptics', v ? '1' : '0'); return { cuesHaptics: v }; }),
  cuesAudio: false,
  setCuesAudio: (v) => set(() => { dbApi.upsertPref('cues.audio', v ? '1' : '0'); return { cuesAudio: v }; }),
  dataRetentionDays: 0, // Default: keep all data
  setDataRetentionDays: (days) => set(() => { 
    dbApi.upsertPref('data.retentionDays', String(days)); 
    return { dataRetentionDays: days }; 
  }),
  performDataCleanup: async (includeJournal = false) => {
    const { performCleanup } = await import('../db/cleanup');
    const retentionDays = get().dataRetentionDays;
    await performCleanup(retentionDays, includeJournal);
    // Reload logs and tasks after cleanup
    const { all } = await import('../db/client');
    const logs = await all('SELECT * FROM habit_logs ORDER BY date DESC');
    const tasks = await all('SELECT * FROM tasks ORDER BY createdAt DESC');
    set({ logs, tasks });
  },
  weeklyGoal: '',
  threeMonthGoal: '',
  yearlyGoal: '',
  setWeeklyGoal: (text) => set((s) => { dbApi.upsertGoal('weeklyGoal', text); return { weeklyGoal: text }; }),
  setThreeMonthGoal: (text) => set((s) => { dbApi.upsertGoal('threeMonthGoal', text); return { threeMonthGoal: text }; }),
  setYearlyGoal: (text) => set((s) => { dbApi.upsertGoal('yearlyGoal', text); return { yearlyGoal: text }; }),
  healthWeeklyGoal: '',
  healthMonthlyGoal: '',
  healthYearlyGoal: '',
  financialWeeklyGoal: '',
  financialMonthlyGoal: '',
  financialYearlyGoal: '',
  personalGrowthWeeklyGoal: '',
  personalGrowthMonthlyGoal: '',
  personalGrowthYearlyGoal: '',
  relationshipWeeklyGoal: '',
  relationshipMonthlyGoal: '',
  relationshipYearlyGoal: '',
  setHealthWeeklyGoal: (text) => set((s) => { dbApi.upsertGoal('healthWeeklyGoal', text); return { healthWeeklyGoal: text }; }),
  setHealthMonthlyGoal: (text) => set((s) => { dbApi.upsertGoal('healthMonthlyGoal', text); return { healthMonthlyGoal: text }; }),
  setHealthYearlyGoal: (text) => set((s) => { dbApi.upsertGoal('healthYearlyGoal', text); return { healthYearlyGoal: text }; }),
  setFinancialWeeklyGoal: (text) => set((s) => { dbApi.upsertGoal('financialWeeklyGoal', text); return { financialWeeklyGoal: text }; }),
  setFinancialMonthlyGoal: (text) => set((s) => { dbApi.upsertGoal('financialMonthlyGoal', text); return { financialMonthlyGoal: text }; }),
  setFinancialYearlyGoal: (text) => set((s) => { dbApi.upsertGoal('financialYearlyGoal', text); return { financialYearlyGoal: text }; }),
  setPersonalGrowthWeeklyGoal: (text) => set((s) => { dbApi.upsertGoal('personalGrowthWeeklyGoal', text); return { personalGrowthWeeklyGoal: text }; }),
  setPersonalGrowthMonthlyGoal: (text) => set((s) => { dbApi.upsertGoal('personalGrowthMonthlyGoal', text); return { personalGrowthMonthlyGoal: text }; }),
  setPersonalGrowthYearlyGoal: (text) => set((s) => { dbApi.upsertGoal('personalGrowthYearlyGoal', text); return { personalGrowthYearlyGoal: text }; }),
  setRelationshipWeeklyGoal: (text) => set((s) => { dbApi.upsertGoal('relationshipWeeklyGoal', text); return { relationshipWeeklyGoal: text }; }),
  setRelationshipMonthlyGoal: (text) => set((s) => { dbApi.upsertGoal('relationshipMonthlyGoal', text); return { relationshipMonthlyGoal: text }; }),
  setRelationshipYearlyGoal: (text) => set((s) => { dbApi.upsertGoal('relationshipYearlyGoal', text); return { relationshipYearlyGoal: text }; }),
  verifiedAddress: null,
  verifiedAt: null,
  setVerified: async (address) => {
    // Validate and normalize the address to base58 format
    // The address should already be in base58 from WalletService, but double-check
    if (!address || typeof address !== 'string') {
      throw new Error('Invalid wallet address: address is required');
    }
    
    // Basic validation: Solana addresses are base58, 32-44 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(address.trim())) {
      console.error('[Store] Invalid address format:', address.substring(0, 10) + '...', 'length:', address.length);
      throw new Error('Invalid wallet address format. Please reconnect your wallet.');
    }
    
    const normalizedAddress = address.trim();
    console.log('[Store] Setting verified address (base58):', normalizedAddress.substring(0, 10) + '...');
    
    dbApi.upsertPref('verified.address', normalizedAddress);
    dbApi.upsertPref('verified.at', nowIso());
    set(() => ({ verifiedAddress: normalizedAddress, verifiedAt: nowIso() }));
    
    // Fetch user profile from backend when wallet is connected
    const { fetchUserProfile } = get();
    await fetchUserProfile(normalizedAddress);
  },
  disconnectWallet: () => {
    dbApi.upsertPref('verified.address', '');
    dbApi.upsertPref('verified.at', '');
    dbApi.upsertPref('profile.username', '');
    dbApi.upsertPref('profile.usernameSet', '');
    dbApi.upsertPref('profile.xHandle', '');
    dbApi.upsertPref('profile.verified', '');
    set(() => ({
      verifiedAddress: null,
      verifiedAt: null,
      username: null,
      usernameSet: false,
      xHandle: null,
      verified: false,
    }));
  },
  username: null,
  usernameSet: false,
  xHandle: null,
  verified: false,
  setUsername: async (username) => {
    const state = get();
    if (!state.verifiedAddress) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    // Check if username is already set
    if (state.usernameSet && state.username) {
      throw new Error('Username cannot be changed once set.');
    }

    // Validate username format
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty.');
    }
    if (username.length < 3 || username.length > 20) {
      throw new Error('Username must be between 3 and 20 characters.');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores.');
    }

    try {
      const { ApiService } = await import('../services/api.service');
      const apiService = new ApiService();
      
      // Check availability first
      const availability = await apiService.checkUsernameAvailability(username.trim());
      if (!availability.available) {
        throw new Error(availability.message || 'Username is already taken.');
      }

      // Register username with backend
      const result = await apiService.registerUsername(state.verifiedAddress, username.trim());
      
      // Update local state
      dbApi.upsertPref('profile.username', result.username || username.trim());
      dbApi.upsertPref('profile.usernameSet', 'true');
      set(() => ({
        username: result.username || username.trim(),
        usernameSet: true,
      }));
    } catch (error: any) {
      console.error('[Store] Error setting username:', error);
      throw error;
    }
  },
  syncXAccount: async (xHandle?: string) => {
    const state = get();
    if (!state.verifiedAddress) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      // If xHandle is provided, use the old manual method
      // Otherwise, use OAuth flow
      if (xHandle && xHandle.trim().length > 0) {
        // Manual method (legacy support)
        const cleanHandle = xHandle.trim().replace(/^@/, '');
        const { ApiService } = await import('../services/api.service');
        const apiService = new ApiService();
        
        const result = await apiService.syncXAccount(state.verifiedAddress, cleanHandle);
        
        dbApi.upsertPref('profile.xHandle', cleanHandle);
        dbApi.upsertPref('profile.verified', result.verified ? 'true' : 'false');
        set(() => ({
          xHandle: cleanHandle,
          verified: result.verified,
        }));
      } else {
        // OAuth flow - automatically gets username from X
        const { XOAuthService } = await import('../services/x-oauth.service');
        const xOAuth = new XOAuthService();
        
        const result = await xOAuth.authenticate(state.verifiedAddress);
        
        // Update local state with OAuth result
        dbApi.upsertPref('profile.xHandle', result.screenName);
        dbApi.upsertPref('profile.verified', result.verified ? 'true' : 'false');
        set(() => ({
          xHandle: result.screenName,
          verified: result.verified,
        }));
      }
    } catch (error: any) {
      console.error('[Store] Error syncing X account:', error);
      throw error;
    }
  },
  fetchUserProfile: async (address: string) => {
    try {
      const { ApiService } = await import('../services/api.service');
      const apiService = new ApiService();
      
      // Fetch user profile from backend
      const profile = await apiService.getUserProfile(address);
      
      if (profile) {
        // Update local state with profile data
        dbApi.upsertPref('profile.username', profile.username || '');
        dbApi.upsertPref('profile.usernameSet', profile.username ? 'true' : 'false');
        dbApi.upsertPref('profile.xHandle', profile.xHandle || '');
        dbApi.upsertPref('profile.verified', profile.verified ? 'true' : 'false');
        set(() => ({
          username: profile.username || null,
          usernameSet: !!profile.username,
          xHandle: profile.xHandle || null,
          verified: profile.verified || false,
        }));
      } else {
        // No profile found - reset to defaults
        set(() => ({
          username: null,
          usernameSet: false,
          xHandle: null,
          verified: false,
        }));
      }
    } catch (error: any) {
      // Silently handle errors - backend might not be available
      console.log('[Store] Could not fetch user profile (backend may not be available):', error?.message);
      // Don't throw - allow app to work offline
    }
  },
  groups: [],
  messages: [],
  publicGroups: [],
  createGroup: (name) => set((s) => {
    const g = { id: uid(), name, ownerAddress: s.verifiedAddress ?? null, createdAt: nowIso(), isPublic: false };
    dbApi.addGroup(g as any);
    return { groups: [g, ...s.groups] };
  }),
  createPublicGroup: async (name, joinPrice, paymentAddress, category, description, createPrice, backgroundImage) => {
    const apiService = new ApiService();
    const paymentService = new PaymentService();
    const state = get();
    
    if (!state.verifiedAddress) {
      throw new Error('Wallet not verified. Please verify your wallet first.');
    }

    // Import platform config
    const { PLATFORM_CREATE_FEE, PLATFORM_PAYMENT_ADDRESS } = await import('../config/platform');
    
    // Use provided createPrice or default platform fee
    const fee = createPrice ?? PLATFORM_CREATE_FEE;
    
    if (!PLATFORM_PAYMENT_ADDRESS) {
      throw new Error('Platform payment address not configured. Please set EXPO_PUBLIC_PLATFORM_ADDRESS.');
    }

    try {
      // Step 1: Pay creation fee to platform
      // Use the already-connected wallet address (no need to re-authorize)
      console.log('[Store] Starting payment for group creation...');
      const paymentSignature = await paymentService.payToCreateGroup(
        PLATFORM_PAYMENT_ADDRESS, 
        fee,
        state.verifiedAddress // Pass the already-connected wallet address
      );
      console.log('[Store] Payment successful, signature:', paymentSignature?.substring(0, 20) + '...');

      // Delay to ensure transaction is fully confirmed and indexed on RPC nodes
      // The payment service already confirms, but backend verification might need more time
      // RPC nodes can take 2-5 seconds to index transactions, especially on mainnet
      console.log('[Store] Waiting for transaction to be indexed on RPC nodes...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Increased to 3 seconds

      // Step 2: Create the group on the backend API with payment signature
      console.log('[Store] Creating group on backend...');
      const publicGroup = await apiService.createPublicGroup({
        name,
        ownerAddress: state.verifiedAddress,
        ownerUsername: state.username || undefined,
        joinPrice,
        paymentAddress, // Address to receive join payments (can be owner or platform)
        description,
        createPaymentSignature: paymentSignature,
        createPrice: fee,
        backgroundImage, // Cloudinary URL for background image
        category, // Required category
      });
      console.log('[Store] Group created on backend:', publicGroup.id);

      // Step 3: Save to local database
      const localId = uid();
      const g = {
        id: localId,
        name,
        ownerAddress: state.verifiedAddress,
        createdAt: nowIso(),
        isPublic: true,
        joinPrice,
        paymentAddress,
        description,
        apiGroupId: publicGroup.id,
      };
      dbApi.addGroup(g as any);
      
      set((s) => ({ groups: [g, ...s.groups] }));
      
      // Step 4: Optimistically add to publicGroups with image so it shows immediately
      const transformedGroup = {
        id: publicGroup.id,
        name,
        ownerAddress: state.verifiedAddress,
        ownerUsername: state.username || undefined,
        createdAt: publicGroup.created_at || nowIso(),
        joinPrice,
        paymentAddress,
        description,
        memberCount: 0,
        backgroundImage: backgroundImage || undefined,
        category,
      };
      set((s) => {
        // Check if group already exists to prevent duplicates
        const exists = s.publicGroups.some(g => g.id === transformedGroup.id);
        if (exists) {
          // Update existing group instead of adding duplicate
          return {
            publicGroups: s.publicGroups.map(g => 
              g.id === transformedGroup.id ? transformedGroup : g
            )
          };
        }
        // Add new group
        return { 
          publicGroups: [transformedGroup, ...s.publicGroups] 
        };
      });
      
      // Step 5: Refresh from backend to get latest data (in background)
      // Note: We don't pass category here because we want to refresh all groups
      // The frontend will filter by category if needed
      get().fetchPublicGroups().catch(() => {
        // Ignore errors - we already have the optimistic update
      });
    } catch (error) {
      console.error('[Store] Error creating public group:', error);
      throw error;
    }
  },
  joinPublicGroup: async (groupId, paymentSignature) => {
    const apiService = new ApiService();
    const state = get();
    
    if (!state.verifiedAddress) {
      throw new Error('Wallet not verified. Please verify your wallet first.');
    }

    // Import testing config
    const { TESTING_MODE } = await import('../config/testing');

    try {
      // Check if user is already a member (from local DB)
      const existingMember = await dbApi.getMember(groupId, state.verifiedAddress);
      
      // Find the group to get current join price
      const publicGroup = state.publicGroups.find(g => g.id === groupId);
      const localGroup = state.groups.find(g => g.id === groupId || g.apiGroupId === groupId);
      const group = publicGroup || localGroup;
      
      if (!group) {
        throw new Error('Group not found');
      }

      const currentJoinPrice = group.joinPrice || 0;
      
      // If user already joined when it was free, they stay free
      if (existingMember && existingMember.joinPricePaid === 0) {
        console.log('[Store] User already joined when group was free, no payment required');
        // They're already a member, no need to rejoin
        return;
      }

      // If group is now paid and user needs to pay (either new user or rejoining after leaving)
      if (currentJoinPrice > 0 && (!existingMember || existingMember.joinPricePaid !== currentJoinPrice)) {
        // User needs to pay the current price
        // Payment should have been processed before calling this function
      }

      if (TESTING_MODE) {
        // Testing mode: Join group locally without backend verification
        console.log('[Store] TESTING MODE: Joining group locally without backend');
        
        // Save membership to local DB
        const { uid, nowIso } = await import('../utils/time');
        await dbApi.addMember({
          id: uid(),
          groupId,
          userAddress: state.verifiedAddress,
          joinedAt: nowIso(),
          joinPricePaid: currentJoinPrice,
        });
      } else {
        // Join the group via API (which verifies payment)
        // For free groups, paymentSignature can be 'free' or empty string
        await apiService.joinPublicGroup({
          groupId,
          userAddress: state.verifiedAddress,
          username: state.username || undefined,
          paymentSignature: paymentSignature === 'free' ? '' : paymentSignature,
        });

        // Save membership to local DB
        const { uid, nowIso } = await import('../utils/time');
        await dbApi.addMember({
          id: uid(),
          groupId,
          userAddress: state.verifiedAddress,
          joinedAt: nowIso(),
          joinPricePaid: currentJoinPrice,
        });

        // Fetch updated public groups list
        await get().fetchPublicGroups();
      }
    } catch (error) {
      console.error('[Store] Error joining public group:', error);
      throw error;
    }
  },
  fetchPublicGroups: async (category?: string) => {
    const apiService = new ApiService();
    const state = get();
    try {
      const groups = await apiService.getPublicGroups(category);
      
      // Merge with existing groups to preserve optimistic updates
      // If fetching with a category filter, merge intelligently
      if (category) {
        // Keep groups that don't match the category
        const otherGroups = state.publicGroups.filter(g => g.category !== category);
        
        // For groups in this category, merge fetched groups with existing ones
        // This preserves optimistic updates that might not be in the backend yet
        const existingCategoryGroups = state.publicGroups.filter(g => g.category === category);
        const fetchedGroupIds = new Set(groups.map(g => g.id));
        
        // Keep existing groups that weren't in the fetched results (optimistic updates)
        const preservedOptimistic = existingCategoryGroups.filter(g => !fetchedGroupIds.has(g.id));
        
        // Combine: other categories + fetched groups + preserved optimistic updates
        // Deduplicate by ID to prevent duplicate keys
        const merged = [...otherGroups, ...groups, ...preservedOptimistic];
        const uniqueGroups = Array.from(
          new Map(merged.map(g => [g.id, g])).values()
        );
        set({ publicGroups: uniqueGroups });
      } else {
        // Fetching all groups - replace entire list with backend data
        // This ensures deleted groups are removed
        set({ publicGroups: groups });
      }
    } catch (error) {
      console.error('[Store] Error fetching public groups:', error);
      // Don't throw - allow app to continue with existing groups
    }
  },
  updateGroupJoinPrice: async (groupId, newJoinPrice) => {
    const state = get();
    
    if (!state.verifiedAddress) {
      throw new Error('Wallet not verified. Please verify your wallet first.');
    }

    // Find the group
    const localGroup = state.groups.find(g => g.id === groupId || g.apiGroupId === groupId);
    if (!localGroup) {
      throw new Error('Group not found');
    }

    // Check if user is the owner
    if (localGroup.ownerAddress !== state.verifiedAddress) {
      throw new Error('Only the group owner can update the join price');
    }

    // Update in local DB
    await dbApi.updateGroupJoinPrice(groupId, newJoinPrice);

    // Update in state
    set((s) => ({
      groups: s.groups.map(g => 
        (g.id === groupId || g.apiGroupId === groupId) 
          ? { ...g, joinPrice: newJoinPrice }
          : g
      ),
      publicGroups: s.publicGroups.map(g => 
        g.id === groupId 
          ? { ...g, joinPrice: newJoinPrice }
          : g
      ),
    }));

    // TODO: Update on backend API if connected
    // const apiService = new ApiService();
    // await apiService.updateGroupJoinPrice(groupId, newJoinPrice);
  },
  deleteGroup: (id) => set((s) => { dbApi.deleteGroup(id); return { groups: s.groups.filter(g => g.id !== id), messages: s.messages.filter(m => m.groupId !== id) }; }),
  deletePublicGroup: async (groupId, verificationSignature) => {
    const apiService = new ApiService();
    const state = get();
    
    if (!state.verifiedAddress) {
      throw new Error('Wallet not verified. Please verify your wallet first.');
    }

    try {
      await apiService.deletePublicGroup(groupId, state.verifiedAddress, verificationSignature);
      
      // Remove from local state immediately (optimistic update)
      // Match by both id and apiGroupId to catch all variations
      set((s) => ({
        groups: s.groups.filter(g => {
          const groupIdMatch = g.id === groupId || g.apiGroupId === groupId;
          const apiGroupIdMatch = (g as any).apiGroupId === groupId;
          return !groupIdMatch && !apiGroupIdMatch;
        }),
        messages: s.messages.filter(m => m.groupId !== groupId),
        publicGroups: s.publicGroups.filter(g => {
          // Match by id, apiGroupId, or if the group's apiGroupId matches
          const groupIdMatch = g.id === groupId;
          const apiGroupIdMatch = (g as any).apiGroupId === groupId;
          const nestedMatch = g.id === (state.groups.find(lg => lg.id === groupId)?.apiGroupId);
          return !groupIdMatch && !apiGroupIdMatch && !nestedMatch;
        }),
      }));
      
      // Also delete from local database
      const { dbApi } = await import('./dbApi');
      await dbApi.deleteGroup(groupId);
      
      // Force refresh from backend to ensure consistency
      // This ensures any groups deleted on the backend are removed from the frontend
      // We refresh without category filter to get all groups
      get().fetchPublicGroups().catch((err) => {
        console.error('[Store] Error refreshing groups after delete:', err);
        // Don't throw - deletion was successful, refresh is just for consistency
      });
    } catch (error) {
      console.error('[Store] Error deleting public group:', error);
      throw error;
    }
  },
  sendMessage: (groupId, content) => set((s) => {
    const m = { id: uid(), groupId, senderAddress: s.verifiedAddress ?? null, content, createdAt: nowIso() };
    dbApi.addMessage(m as any);
    return { messages: [...s.messages, m] };
  }),
  resetAll: () => set(() => ({ habits: [], logs: [], journal: [] })),
}));
