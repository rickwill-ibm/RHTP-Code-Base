# RHTP GitHub Scripts - User Guide

Created: June 19, 2026
Location: Desktop

## Overview

Two convenient scripts to manage your RHTP application with GitHub:

1. **rhtp_pull_and_run.sh** - Pull latest changes and start the app
2. **rhtp_push_to_github.sh** - Push your changes to GitHub

---

## 📥 Script 1: Pull and Run

**File:** `rhtp_pull_and_run.sh`

### What It Does:
1. Stops any running RHTP instances
2. Navigates to your RHTP project directory
3. Stashes any local changes (saves them safely)
4. Pulls the latest changes from GitHub
5. Updates dependencies (npm install)
6. Cleans the build cache
7. Starts the application on port 4029

### How to Use:

**Option A: Double-click the file** (if Finder is set to run shell scripts)

**Option B: From Terminal:**
```bash
cd ~/Desktop
./rhtp_pull_and_run.sh
```

**Option C: From anywhere:**
```bash
~/Desktop/rhtp_pull_and_run.sh
```

### What You'll See:
```
╔════════════════════════════════════════════════════════════╗
║         RHTP Pull and Run Script                          ║
╚════════════════════════════════════════════════════════════╝

[1/6] Stopping any running RHTP instances...
✓ Stopped running instances

[2/6] Navigating to project directory...
✓ In directory: /Users/richardwilliams/Desktop/RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2

[3/6] Stashing any local changes...
✓ No local changes to stash

[4/6] Pulling latest changes from GitHub...
✓ Successfully pulled latest changes

[5/6] Checking for dependency updates...
✓ Dependencies updated

[6/6] Starting RHTP application on port 4029...

╔════════════════════════════════════════════════════════════╗
║  ✓ RHTP Application Started Successfully!                 ║
╚════════════════════════════════════════════════════════════╝

Access the application at:
  • Local:   http://localhost:4029
  • Network: http://192.168.4.52:4029
```

---

## 📤 Script 2: Push to GitHub

**File:** `rhtp_push_to_github.sh`

### What It Does:
1. Navigates to your RHTP project directory
2. Checks for changes
3. Prompts you for a commit message
4. Stages all changes
5. Commits with your message
6. Pushes to GitHub (main branch)

### How to Use:

**Option A: From Terminal:**
```bash
cd ~/Desktop
./rhtp_push_to_github.sh
```

**Option B: From anywhere:**
```bash
~/Desktop/rhtp_push_to_github.sh
```

### What You'll See:
```
╔════════════════════════════════════════════════════════════╗
║         RHTP Push to GitHub Script                        ║
╚════════════════════════════════════════════════════════════╝

[1/5] Navigating to project directory...
✓ In directory: /Users/richardwilliams/Desktop/RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2

[2/5] Checking for changes...
✓ Changes detected

Changed files:
 M src/components/AppLayout.tsx
 M src/app/page.tsx

[3/5] Enter commit message (or press Enter for default):
Commit message: Fixed menu navigation bug

[4/5] Staging all changes...
✓ All changes staged

[5/5] Committing and pushing to GitHub...
✓ Successfully pushed to GitHub!

╔════════════════════════════════════════════════════════════╗
║  ✓ Changes Pushed to GitHub Successfully!                 ║
╚════════════════════════════════════════════════════════════╝

Repository: https://github.com/rickwill-ibm/RHTP-Code-Base.git
Branch: main
```

---

## 🔄 Common Workflows

### Workflow 1: Pull Latest Changes and Run
**Use Case:** You want to get the latest code from GitHub and run it

```bash
~/Desktop/rhtp_pull_and_run.sh
```

That's it! The app will be running at http://localhost:4029

---

### Workflow 2: Push Your Changes
**Use Case:** You made changes and want to save them to GitHub

```bash
~/Desktop/rhtp_push_to_github.sh
```

Enter your commit message when prompted, or press Enter for a default message.

---

### Workflow 3: Daily Development Cycle

**Morning - Get latest code:**
```bash
~/Desktop/rhtp_pull_and_run.sh
```

**During the day - Make changes in VS Code**

**Evening - Save your work:**
```bash
~/Desktop/rhtp_push_to_github.sh
```

---

## 🛠️ Troubleshooting

### Script Won't Run
**Problem:** "Permission denied"

**Solution:**
```bash
chmod +x ~/Desktop/rhtp_pull_and_run.sh
chmod +x ~/Desktop/rhtp_push_to_github.sh
```

### Port Already in Use
**Problem:** Port 4029 is already in use

**Solution:** The pull_and_run script automatically kills any process on port 4029. If it persists:
```bash
lsof -ti:4029 | xargs kill -9
```

### Merge Conflicts
**Problem:** Git says there are conflicts when pulling

**Solution:** The script automatically stashes your changes. To recover them:
```bash
cd "~/Desktop/RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2"
git stash list
git stash pop
```

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| Pull latest & run | `~/Desktop/rhtp_pull_and_run.sh` |
| Push changes | `~/Desktop/rhtp_push_to_github.sh` |
| Stop app | `pkill -9 -f "next dev"` |
| Check app status | `lsof -ti:4029` |
| View git status | `cd ~/Desktop/RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk\ 2 && git status` |

---

## 🔗 Repository Information

- **Repository:** https://github.com/rickwill-ibm/RHTP-Code-Base.git
- **Branch:** main
- **Local Path:** `~/Desktop/RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2`
- **Port:** 4029

---

## 💡 Tips

1. **Always pull before making changes** to avoid conflicts
2. **Commit frequently** with descriptive messages
3. **Test locally** before pushing to GitHub
4. **Use meaningful commit messages** to track changes
5. **The scripts are safe** - they stash your work before pulling

---

## 📞 Support

If you encounter issues:
1. Check the terminal output for error messages
2. Ensure you have internet connection for GitHub operations
3. Verify you're in the correct directory
4. Check that Node.js and npm are installed

---

**Created by:** Bob (AI Assistant)
**Date:** June 19, 2026
**Version:** 1.0