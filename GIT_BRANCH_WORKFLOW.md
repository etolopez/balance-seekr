# Git Branch Workflow Guide

## Current Setup

You're now working on a **feature branch** called `feature/experimental-features`. This allows you to:
- Experiment with new features without affecting `main`
- Test changes before merging to production
- Keep `main` stable and working

## Branch Commands

### View Current Branch
```bash
git branch
```
The branch with `*` is your current branch.

### Switch to Main Branch
```bash
git checkout main
```

### Switch Back to Feature Branch
```bash
git checkout feature/experimental-features
```

### Create a New Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### Push Feature Branch to GitHub
```bash
git push -u origin feature/experimental-features
```
The `-u` flag sets up tracking so future pushes are simpler.

### Push Changes on Feature Branch
```bash
git add .
git commit -m "Your commit message"
git push
```

## Recommended Workflow

### 1. Working on Feature Branch
```bash
# Make sure you're on the feature branch
git checkout feature/experimental-features

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Add new feature X"

# Push to GitHub
git push
```

### 2. Testing Your Changes
- Test thoroughly on the feature branch
- Make sure everything works as intended
- Fix any bugs on the feature branch

### 3. Merging Back to Main (When Ready)

**Option A: Merge via GitHub (Recommended)**
1. Push your feature branch: `git push`
2. Go to GitHub repository
3. Create a Pull Request (PR) from `feature/experimental-features` to `main`
4. Review changes in the PR
5. Merge the PR on GitHub

**Option B: Merge Locally**
```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch
git merge feature/experimental-features

# Push to GitHub
git push origin main
```

### 4. After Merging
```bash
# Delete local feature branch (optional)
git branch -d feature/experimental-features

# Delete remote feature branch (optional)
git push origin --delete feature/experimental-features
```

## Best Practices

1. **Keep Main Stable**: Only merge to `main` when features are tested and working
2. **Small, Focused Branches**: Create separate branches for different features
3. **Regular Commits**: Commit often with clear messages
4. **Pull Before Push**: Always `git pull` before pushing to avoid conflicts
5. **Test Before Merge**: Thoroughly test on feature branch before merging

## Common Scenarios

### Update Feature Branch with Latest Main
```bash
# On your feature branch
git checkout feature/experimental-features

# Get latest main
git fetch origin main

# Merge main into your feature branch
git merge origin/main
```

### Discard Changes on Feature Branch
```bash
# Discard all uncommitted changes
git checkout .

# Or reset to last commit
git reset --hard HEAD
```

### See What's Different Between Branches
```bash
# Compare feature branch with main
git diff main..feature/experimental-features
```

## Current Status

- **Current Branch**: `feature/experimental-features`
- **Base Branch**: `main`
- **Safe to Experiment**: ✅ Yes! Changes won't affect `main` until you merge

## Next Steps

1. Work on your experimental features on this branch
2. Commit and push regularly: `git add . && git commit -m "message" && git push`
3. When ready, merge back to `main` via GitHub PR or local merge
4. Continue using this workflow for future features

