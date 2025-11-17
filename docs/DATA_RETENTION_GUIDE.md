# Data Retention Best Practices Guide

## Overview

This guide explains the data retention system implemented in Solana Seeker and best practices for managing database size.

## Understanding Your Data

### What Gets Stored

1. **Habit Logs** (`habit_logs` table)
   - One entry per day per habit
   - Stores: completion status, date, optional notes
   - Size: ~100-200 bytes per entry
   - Growth: 10 habits × 365 days = ~3,650 rows/year (~365-730 KB)

2. **Tasks** (`tasks` table)
   - One entry per task
   - Stores: title, completion status, dates
   - Size: ~200-500 bytes per entry
   - Growth: Depends on usage

3. **Journal Entries** (`journal_entries` table)
   - One entry per journal entry
   - Stores: title, content, mood, tags
   - Size: Variable (can be large with long content)
   - Growth: Depends on usage

4. **Habits** (`habits` table)
   - One entry per habit definition
   - Size: ~100 bytes per entry
   - Growth: Very small (typically < 50 habits)

## Best Practices

### Recommendation: Keep All Data (Default)

**For most users, keeping all data is recommended because:**

1. **SQLite is Efficient**: SQLite can handle millions of rows efficiently
2. **Storage is Cheap**: Modern devices have plenty of storage
3. **Historical Value**: Long-term habit tracking data is valuable for:
   - Seeing progress over time
   - Identifying patterns
   - Motivation through streaks
   - Data analysis and insights

**Example**: Even with 10 habits tracked for 5 years:
- ~18,250 habit log entries
- ~1.8-3.6 MB of data
- Negligible impact on device storage

### When to Use Retention Policies

Consider setting a retention policy if:

1. **You have many habits** (20+ habits tracked daily)
2. **You track for many years** (5+ years of data)
3. **You're concerned about database size** (though this is rarely an issue)
4. **You only need recent data** for your use case

### Recommended Retention Periods

- **30 Days**: Only if you're very concerned about storage and don't need historical data
- **90 Days**: Good balance for recent tracking while managing size
- **180 Days**: Keeps 6 months of history (good for quarterly reviews)
- **365 Days**: Keeps full year of history (recommended minimum for meaningful insights)
- **Keep All (0)**: Best for long-term habit tracking and analysis (default)

## How It Works

### Automatic Cleanup

When you set a retention policy (30/90/180/365 days):

1. **On App Start**: The app automatically cleans up old data based on your policy
2. **What Gets Cleaned**:
   - Habit logs older than retention period
   - Completed tasks older than retention period
   - Journal entries (optional, disabled by default)

3. **What's Preserved**:
   - All habit definitions
   - Incomplete tasks (regardless of age)
   - Journal entries (by default, unless you enable journal cleanup)

### Manual Cleanup

You can manually trigger cleanup at any time from Settings:
- Go to Settings → Data Retention
- Click "Clean Up Now"
- Confirm the action

## Configuration

### Setting Retention Policy

1. Open Settings
2. Scroll to "Data Retention" section
3. Select your preferred retention period:
   - Keep All Data (0 days) - **Recommended**
   - Last 30 Days
   - Last 90 Days
   - Last 180 Days
   - Last 365 Days

### What Happens When You Change Policy

- The new policy is saved immediately
- Automatic cleanup runs on next app start
- You can trigger manual cleanup anytime

## Technical Details

### Database Size Estimates

For a typical user with 10 habits:

| Time Period | Habit Logs | Estimated Size |
|------------|------------|----------------|
| 30 days    | ~300 rows  | ~30-60 KB      |
| 90 days    | ~900 rows  | ~90-180 KB     |
| 180 days   | ~1,800 rows| ~180-360 KB    |
| 365 days   | ~3,650 rows| ~365-730 KB    |
| 5 years    | ~18,250 rows| ~1.8-3.6 MB    |

**Conclusion**: Even 5 years of data is tiny compared to modern device storage.

### Performance Impact

- **Query Performance**: SQLite handles thousands of rows efficiently
- **App Performance**: No noticeable impact until millions of rows
- **Storage**: Negligible impact on device storage

## Recommendations by Use Case

### Casual User (1-5 habits)
- **Recommendation**: Keep All Data
- **Reason**: Storage impact is minimal, historical data is valuable

### Active User (5-15 habits)
- **Recommendation**: Keep All Data or 365 Days
- **Reason**: Still minimal storage, but 1 year gives good insights

### Power User (15+ habits, years of tracking)
- **Recommendation**: 365 Days or 180 Days
- **Reason**: Manages growth while keeping substantial history

### Storage-Conscious User
- **Recommendation**: 90 Days or 180 Days
- **Reason**: Balances recent tracking with storage management

## FAQ

**Q: Will I lose my habit streaks if I enable retention?**
A: No, streaks are calculated from existing data. As long as you keep recent data (30+ days), your current streaks are preserved.

**Q: Can I recover deleted data?**
A: No, cleanup permanently deletes old data. Make sure you're comfortable with your retention policy.

**Q: Does cleanup affect journal entries?**
A: By default, journal entries are preserved. You can optionally include them in cleanup, but this is disabled by default.

**Q: How often does automatic cleanup run?**
A: Once per app start, if a retention policy is set.

**Q: Can I export my data before cleanup?**
A: Currently, manual export isn't built-in, but you can access the SQLite database file directly if needed.

## Summary

**Default Recommendation**: Keep All Data (0 days)

- SQLite handles large datasets efficiently
- Storage impact is minimal even after years
- Historical data is valuable for insights
- You can always enable retention later if needed

The retention system is there if you need it, but for most users, keeping all data is the best choice.

