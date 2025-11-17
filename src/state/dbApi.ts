import { run, all } from '../db/client';
import { getOrCreateKey } from '../crypto/keystore';
import { encryptString, isWebCryptoAvailable } from '../crypto/crypto';

type EncryptOpts = { encryptionEnabled?: boolean };

// DB helpers used by store actions (no store imports to avoid cycles)
export const dbApi = {
  addHabit: (h: any) =>
    run(
      'INSERT INTO habits (id,name,color,createdAt,goalPerDay,archived) VALUES (?,?,?,?,?,?)',
      [h.id, h.name, h.color ?? null, h.createdAt, h.goalPerDay ?? 1, h.archived ? 1 : 0]
    ),

  updateHabit: (h: any) =>
    run(
      'UPDATE habits SET name=?, color=?, goalPerDay=?, archived=? WHERE id=?',
      [h.name ?? null, h.color ?? null, h.goalPerDay ?? 1, h.archived ? 1 : 0, h.id]
    ),

  deleteHabit: async (id: string) => {
    await run('DELETE FROM habit_logs WHERE habitId=?', [id]);
    await run('DELETE FROM habits WHERE id=?', [id]);
  },

  upsertHabitLogToday: async (log: any) => {
    // First, check if a log exists for this habitId and date
    const existing = await all<any>(
      'SELECT * FROM habit_logs WHERE habitId = ? AND date = ?',
      [log.habitId, log.date]
    );
    
    if (existing.length > 0) {
      // Update existing log (use existing ID to ensure proper replacement)
      const existingId = existing[0].id;
      await run(
        'UPDATE habit_logs SET completed = ?, note = ? WHERE id = ?',
        [log.completed ? 1 : 0, log.note ?? null, existingId]
      );
      // Update the log object to use the existing ID
      log.id = existingId;
    } else {
      // Insert new log
      await run(
        'INSERT INTO habit_logs (id,habitId,date,completed,note) VALUES (?,?,?,?,?)',
      [log.id, log.habitId, log.date, log.completed ? 1 : 0, log.note ?? null]
      );
    }
  },

  addJournal: async (e: any, opts: EncryptOpts = {}) => {
    try {
      const enabled = !!opts.encryptionEnabled && isWebCryptoAvailable();
      let content = e.content;
      let iv: string | null = null;
      if (enabled) {
        const key = await getOrCreateKey();
        const c = await encryptString(e.content, key);
        content = c.cipher;
        iv = c.iv;
      }
      await run(
        'INSERT INTO journal_entries (id,createdAt,updatedAt,title,content,iv,mood,tags) VALUES (?,?,?,?,?,?,?,?)',
        [e.id, e.createdAt, e.updatedAt, e.title ?? null, content, iv, e.mood ?? null, e.tags ? JSON.stringify(e.tags) : null]
      );
    } catch (error) {
      console.error('[DB] Error inserting journal entry:', error, { id: e.id, title: e.title });
      throw error; // Re-throw to allow caller to handle
    }
  },

  updateJournal: async (e: any, opts: EncryptOpts = {}) => {
    const enabled = !!opts.encryptionEnabled && isWebCryptoAvailable();
    let content = e.content;
    let iv: string | null = e.iv ?? null;
    if (enabled && typeof e.content === 'string') {
      const key = await getOrCreateKey();
      const c = await encryptString(e.content, key);
      content = c.cipher;
      iv = c.iv;
    }
    await run(
      'UPDATE journal_entries SET title=?, content=?, iv=?, mood=?, tags=?, updatedAt=? WHERE id=?',
      [e.title ?? null, content, iv, e.mood ?? null, e.tags ? JSON.stringify(e.tags) : null, e.updatedAt, e.id]
    );
  },

  deleteJournal: (id: string) => run('DELETE FROM journal_entries WHERE id=?', [id]),

  addTask: async (t: any) => {
    try {
      await run(
        'INSERT INTO tasks (id,title,done,createdAt,completedAt) VALUES (?,?,?,?,?)',
        [t.id, t.title, t.done ? 1 : 0, t.createdAt, t.completedAt ?? null]
      );
    } catch (error) {
      console.error('[DB] Error adding task:', error, { id: t.id, title: t.title, done: t.done });
      throw error; // Re-throw to allow caller to handle
    }
  },

  updateTask: (t: any) =>
    run('UPDATE tasks SET done=?, completedAt=? WHERE id=?', [t.done ? 1 : 0, t.completedAt ?? null, t.id]),

  deleteTask: (id: string) => run('DELETE FROM tasks WHERE id=?', [id]),

  upsertGoal: (key: string, value: string) =>
    run('INSERT OR REPLACE INTO goals (key,value,updatedAt) VALUES (?,?,?)', [key, value, new Date().toISOString()]),

  upsertPref: (key: string, value: string) =>
    run('INSERT OR REPLACE INTO prefs (key,value,updatedAt) VALUES (?,?,?)', [key, value, new Date().toISOString()]),

  addBreathPreset: (p: any) =>
    run(
      'INSERT INTO breath_presets (id,name,goal,inhale,hold,exhale,hold2,shape,grad0,grad1,cycles,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        p.id,
        p.name,
        p.goal,
        p.inhale,
        p.hold,
        p.exhale,
        p.hold2 ?? 0,
        p.shape,
        p.gradient[0],
        p.gradient[1],
        p.cycles,
        new Date().toISOString(),
      ]
    ),

  deleteBreathPreset: (id: string) => run('DELETE FROM breath_presets WHERE id=?', [id]),

  addGroup: (g: any) =>
    run('INSERT INTO mastermind_groups (id,name,ownerAddress,createdAt,isPublic,joinPrice,paymentAddress,description,apiGroupId) VALUES (?,?,?,?,?,?,?,?,?)', [
      g.id, 
      g.name, 
      g.ownerAddress ?? null, 
      g.createdAt,
      g.isPublic ? 1 : 0,
      g.joinPrice ?? null,
      g.paymentAddress ?? null,
      g.description ?? null,
      g.apiGroupId ?? null
    ]),

  deleteGroup: async (id: string) => {
    await run('DELETE FROM mastermind_messages WHERE groupId=?', [id]);
    await run('DELETE FROM mastermind_members WHERE groupId=?', [id]);
    await run('DELETE FROM mastermind_groups WHERE id=?', [id]);
  },

  addMessage: (m: any) =>
    run('INSERT INTO mastermind_messages (id,groupId,senderAddress,content,createdAt) VALUES (?,?,?,?,?)', [m.id, m.groupId, m.senderAddress ?? null, m.content, m.createdAt]),

  addMember: (member: { id: string; groupId: string; userAddress: string; joinedAt: string; joinPricePaid: number }) =>
    run('INSERT OR REPLACE INTO mastermind_members (id,groupId,userAddress,joinedAt,joinPricePaid) VALUES (?,?,?,?,?)', [
      member.id,
      member.groupId,
      member.userAddress,
      member.joinedAt,
      member.joinPricePaid,
    ]),

  getMember: async (groupId: string, userAddress: string) => {
    const { all } = await import('../db/client');
    const members = await all<any>('SELECT * FROM mastermind_members WHERE groupId=? AND userAddress=?', [groupId, userAddress]);
    return members[0] || null;
  },

  updateGroupJoinPrice: (groupId: string, joinPrice: number) =>
    run('UPDATE mastermind_groups SET joinPrice=? WHERE id=?', [joinPrice, groupId]),

  // Badge persistence
  getEarnedBadges: async () => {
    const badges = await all<any>('SELECT * FROM badges ORDER BY earnedAt DESC');
    return badges.map((b: any) => ({
      id: b.badgeType,
      badgeType: b.badgeType,
      earnedAt: b.earnedAt,
      category: b.category,
      name: b.name,
      description: b.description,
      icon: b.icon,
      isStreak: b.isStreak === 1,
      daysRequired: b.daysRequired,
    }));
  },

  saveBadge: async (badge: any) => {
    await run(
      'INSERT OR REPLACE INTO badges (id, badgeType, earnedAt, category, name, description, icon, isStreak, daysRequired) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        badge.id || badge.badgeType,
        badge.badgeType || badge.id,
        badge.earnedAt,
        badge.category,
        badge.name,
        badge.description,
        badge.icon,
        badge.isStreak ? 1 : 0,
        badge.daysRequired || 0,
      ]
    );
  },
};

