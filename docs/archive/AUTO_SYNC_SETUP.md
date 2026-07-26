# Automatic GitHub Sync Setup (Bidirectional)

## Real-Time Team Collaboration

This setup enables **bidirectional sync** with GitHub - you'll automatically:
- ✅ **PULL** changes made by your team members
- ✅ **PUSH** your own changes
- ✅ Stay in sync in real-time (every 5 seconds)

## Quick Start

**Double-click** [`auto-sync-github.bat`](auto-sync-github.bat:1)

That's it! The script will:
1. Check for team members' changes every 10 seconds and pull them
2. Automatically commit and push your changes
3. Keep everyone in sync in real-time

## What You'll See

```
========================================
  Auto-Sync with GitHub (Bidirectional)
========================================

Monitoring: C:\Users\5J0601897\Desktop\BOB Project - 052926\tcoc
Repository: https://github.com/rickwill-ibm/RHTP-Code-Base

This script will:
  - Pull changes from GitHub every 5 seconds
  - Push your changes to GitHub automatically
  - Keep you in sync with your team in real-time

Press Ctrl+C to stop
========================================

[Date Time] Checking for remote changes...
[Date Time] Remote changes detected! Pulling...
[Date Time] Pull completed - you now have the latest changes!

[Date Time] Local changes detected! Committing and pushing...
[Date Time] Push completed - team can now see your changes!
```

## How It Works

### Every 5 Seconds:

1. **Fetch & Pull** - Checks GitHub for team changes
   - If someone pushed changes → automatically pulls them
   - Your local files update instantly

2. **Commit & Push** - Checks for your local changes
   - If you modified files → automatically commits and pushes
   - Team sees your changes instantly

## Use Cases

✅ **Perfect for:**
- Real-time collaborative editing sessions
- Pair programming with remote team members
- Live demos where multiple people are making changes
- Rapid prototyping with immediate feedback

⚠️ **Not recommended for:**
- Solo development (use manual commits with meaningful messages)
- Large refactoring (too many auto-commits)
- When you need to test before pushing

## Stopping Auto-Sync

1. Go to the auto-sync terminal window
2. Press **Ctrl+C**
3. Sync stops immediately

## Adjusting Sync Interval

Edit [`auto-sync-github.bat`](auto-sync-github.bat:1) line 49:
```batch
timeout /t 5 /nobreak >nul    REM Change 5 to desired seconds
```

## Current Pending Changes

These changes will be pushed when you start auto-sync:
- ✅ Maria Redhawk care plan updates
- ✅ Desktop launcher files  
- ✅ Auto-sync setup files

## Conflict Resolution

If you and a team member edit the same file:
- Git will attempt to auto-merge
- If conflicts occur, the script will pause
- Resolve conflicts manually, then restart the script

## Alternative: Manual Sync

If you prefer manual control:

**Pull team changes:**
```bash
git pull origin main
```

**Push your changes:**
```bash
git add -A
git commit -m "Your message"
git push origin main
```

---

**Made with Bob** 🤖