# Cleanup All Groups

This guide explains how to delete all groups from the database.

## ⚠️ WARNING

**This action cannot be undone!** All groups, members, and messages will be permanently deleted.

## Option 1: Run the Cleanup Script (Recommended)

### On Railway (Production)

1. Go to your Railway dashboard
2. Select your backend service
3. Click on "Deployments" or "Settings"
4. Open the "Shell" or "Terminal" tab
5. Run:
   ```bash
   npm run cleanup-groups
   ```

### Locally (Development)

1. Make sure you have the `DATABASE_URL` environment variable set
2. Run:
   ```bash
   cd backend
   npm run cleanup-groups
   ```

## Option 2: Direct SQL Query

If you have direct database access (via Railway PostgreSQL service):

1. Go to Railway → PostgreSQL service → "Data" tab
2. Or use a PostgreSQL client (psql, pgAdmin, etc.)
3. Connect using the `DATABASE_URL` from your environment variables
4. Run:
   ```sql
   DELETE FROM groups;
   ```

This will delete all groups. Due to CASCADE constraints, related records in `group_members` and `messages` tables will also be automatically deleted.

## Option 3: Via Railway Database Console

1. Go to Railway → PostgreSQL service
2. Click on "Data" or "Query" tab
3. Run:
   ```sql
   DELETE FROM groups;
   ```

## Verification

After running the cleanup, verify that all groups are deleted:

```sql
SELECT COUNT(*) FROM groups;
```

This should return `0`.

## What Gets Deleted

- All groups from the `groups` table
- All group members (automatically via CASCADE)
- All messages (automatically via CASCADE)

## What Stays

- User accounts (`users` table)
- User usernames and X account syncs
- All other app data (habits, tasks, etc. - these are in the frontend database)

