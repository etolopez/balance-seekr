import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { initDb, all, run } from '../db/client';
import { getOrCreateKey } from '../crypto/keystore';
import { decryptString, isWebCryptoAvailable } from '../crypto/crypto';
import { migrateDatabase } from '../db/migrate';

export function useHydrateStore() {
  const setState = useAppStore.setState;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initDb();
      // Run database migration to add new columns
      try {
        await migrateDatabase();
      } catch (error) {
        console.error('[Persist] Migration error (may be expected):', error);
      }
      // Load habits
      const habits = await all('SELECT * FROM habits ORDER BY createdAt DESC');
      // Load logs and convert completed from integer (1/0) to boolean
      const logsRaw = await all<any>('SELECT * FROM habit_logs ORDER BY date DESC');
      const logs = logsRaw.map((log: any) => ({
        ...log,
        completed: log.completed === 1, // Convert integer to boolean
      }));
      // Load journal
      const rawJournal = await all<any>('SELECT * FROM journal_entries ORDER BY createdAt DESC');
      const encryptionEnabled = useAppStore.getState().encryptionEnabled;
      let journal = rawJournal;
      if (encryptionEnabled && isWebCryptoAvailable()) {
        const key = await getOrCreateKey();
        journal = await Promise.all(
          rawJournal.map(async (e) => ({
            ...e,
            content: e.iv ? await decryptString(e.content, e.iv, key) : e.content,
          }))
        );
      }
      // Load tasks
      const tasks = await all('SELECT * FROM tasks ORDER BY createdAt DESC');
      const groupsRaw = await all<any>('SELECT * FROM mastermind_groups ORDER BY createdAt DESC');
      const groups = groupsRaw.map((g: any) => ({
        ...g,
        isPublic: g.isPublic === 1,
        joinPrice: g.joinPrice ? Number(g.joinPrice) : undefined,
      }));
      const messages = await all('SELECT * FROM mastermind_messages ORDER BY createdAt ASC');
      // Load goals
      const goalsRows = await all<any>('SELECT key, value FROM goals');
      const goals = Object.fromEntries(goalsRows.map((g: any) => [g.key, g.value]));
      const weeklyGoal = goals['weeklyGoal'] ?? '';
      const threeMonthGoal = goals['threeMonthGoal'] ?? '';
      const yearlyGoal = goals['yearlyGoal'] ?? '';
      const healthWeeklyGoal = goals['healthWeeklyGoal'] ?? '';
      const healthMonthlyGoal = goals['healthMonthlyGoal'] ?? '';
      const healthYearlyGoal = goals['healthYearlyGoal'] ?? '';
      const financialWeeklyGoal = goals['financialWeeklyGoal'] ?? '';
      const financialMonthlyGoal = goals['financialMonthlyGoal'] ?? '';
      const financialYearlyGoal = goals['financialYearlyGoal'] ?? '';
      const personalGrowthWeeklyGoal = goals['personalGrowthWeeklyGoal'] ?? '';
      const personalGrowthMonthlyGoal = goals['personalGrowthMonthlyGoal'] ?? '';
      const personalGrowthYearlyGoal = goals['personalGrowthYearlyGoal'] ?? '';
      const relationshipWeeklyGoal = goals['relationshipWeeklyGoal'] ?? '';
      const relationshipMonthlyGoal = goals['relationshipMonthlyGoal'] ?? '';
      const relationshipYearlyGoal = goals['relationshipYearlyGoal'] ?? '';
      // Load prefs
      const prefRows = await all<any>('SELECT key, value FROM prefs');
      const prefs = Object.fromEntries(prefRows.map((p: any) => [p.key, p.value]));
      const selectedBreathPresetId = prefs['breath.selected'] ?? undefined;
      const breathCycles = prefs['breath.cycles'] ? Number(prefs['breath.cycles']) : undefined;
      const customBreath = prefs['breath.custom'] ? JSON.parse(prefs['breath.custom']) : undefined;
      const cuesHaptics = prefs['cues.haptics'] ? prefs['cues.haptics'] === '1' : undefined;
      const cuesAudio = prefs['cues.audio'] ? prefs['cues.audio'] === '1' : undefined;
      const verifiedAddress = prefs['verified.address'] ?? null;
      const verifiedAt = prefs['verified.at'] ?? null;
      const username = prefs['profile.username'] ?? null;
      const usernameSet = prefs['profile.usernameSet'] === 'true';
      const xHandle = prefs['profile.xHandle'] ?? null;
      const verified = prefs['profile.verified'] === 'true';
      const dataRetentionDays = prefs['data.retentionDays'] ? Number(prefs['data.retentionDays']) : 0;
      const backgroundHue = prefs['ui.backgroundHue'] ? Number(prefs['ui.backgroundHue']) : 0;
      // Load custom breath presets
      const bpRows = await all<any>('SELECT * FROM breath_presets ORDER BY updatedAt DESC');
      const breathPresets = bpRows.map((r: any) => ({ id: r.id, name: r.name, goal: r.goal, inhale: r.inhale, hold: r.hold, exhale: r.exhale, hold2: r.hold2 ?? 0, shape: r.shape, gradient: [r.grad0, r.grad1] as [string,string], cycles: r.cycles }));
      setState({ habits, logs, journal, tasks, groups, messages, weeklyGoal, threeMonthGoal, yearlyGoal, healthWeeklyGoal, healthMonthlyGoal, healthYearlyGoal, financialWeeklyGoal, financialMonthlyGoal, financialYearlyGoal, personalGrowthWeeklyGoal, personalGrowthMonthlyGoal, personalGrowthYearlyGoal, relationshipWeeklyGoal, relationshipMonthlyGoal, relationshipYearlyGoal, breathPresets,
        ...(selectedBreathPresetId ? { selectedBreathPresetId } : {}),
        ...(breathCycles ? { breathCycles } : {}),
        ...(customBreath ? { customBreath } : {}),
        ...(cuesHaptics !== undefined ? { cuesHaptics } : {}),
        ...(cuesAudio !== undefined ? { cuesAudio } : {}),
        ...(verifiedAddress ? { verifiedAddress } : {}),
        ...(verifiedAt ? { verifiedAt } : {}),
        ...(username ? { username } : {}),
        usernameSet,
        ...(xHandle ? { xHandle } : {}),
        verified,
        dataRetentionDays,
        backgroundHue,
      });
      
      // If wallet is connected, fetch profile from backend
      if (verifiedAddress) {
        const { fetchUserProfile } = useAppStore.getState();
        fetchUserProfile(verifiedAddress).catch(() => {
          // Silently handle errors - backend might not be available
        });
      }
      
      // Perform automatic cleanup if retention policy is set
      if (dataRetentionDays > 0) {
        try {
          const { performCleanup } = await import('../db/cleanup');
          await performCleanup(dataRetentionDays, false); // Don't clean journal by default
          // Reload logs and tasks after cleanup
          const logsAfterCleanupRaw = await all<any>('SELECT * FROM habit_logs ORDER BY date DESC');
          const logsAfterCleanup = logsAfterCleanupRaw.map((log: any) => ({
            ...log,
            completed: log.completed === 1, // Convert integer to boolean
          }));
          const tasksAfterCleanup = await all('SELECT * FROM tasks ORDER BY createdAt DESC');
          setState({ logs: logsAfterCleanup, tasks: tasksAfterCleanup });
        } catch (error) {
          // Cleanup error (non-critical, app continues)
        }
      }
      
      setReady(true);
    })();
  }, []);

  return ready;
}

// Persistence helpers used by store actions
// (dbApi moved to src/state/dbApi.ts to break import cycle)
