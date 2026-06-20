# RHTP GitHub Backup Automation Guide

## Quick Start

### Option 1: Simple Backup (Recommended)
```bash
cd "RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2"
./auto_backup_to_github.sh
```

### Option 2: Backup with Custom Message
```bash
./auto_backup_to_github.sh "Added new care plan features"
```

---

## Setup Instructions

### First-Time Setup

#### Step 1: Install GitHub CLI (Easiest Method)
```bash
# Install GitHub CLI
brew install gh

# Login to GitHub
gh auth login
```
Follow the prompts to authenticate with your GitHub account.

#### Step 2: Test the Backup Script
```bash
cd "RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2"
./auto_backup_to_github.sh
```

---

## Alternative Authentication Methods

### Method 1: GitHub CLI (Recommended - Easiest)
```bash
# Install
brew install gh

# Login
gh auth login

# Configure git to use GitHub CLI
gh auth setup-git
```

### Method 2: Personal Access Token
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Copy the token
5. Update remote URL:
```bash
cd "RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2"
git remote set-url origin https://YOUR_TOKEN@github.com/rickwill-ibm/RHTP-Code-Base.git
```

### Method 3: SSH Keys
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Then update remote:
cd "RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2"
git remote set-url origin git@github.com:rickwill-ibm/RHTP-Code-Base.git
```

---

## Automated Scheduled Backups

### Option 1: Cron Job (Runs Automatically)

Create a cron job to backup every hour:
```bash
# Edit crontab
crontab -e

# Add this line (backup every hour):
0 * * * * cd /Users/richardwilliams/Desktop/RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk\ 2 && ./auto_backup_to_github.sh >> /tmp/rhtp_backup.log 2>&1

# Or backup every 30 minutes:
*/30 * * * * cd /Users/richardwilliams/Desktop/RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk\ 2 && ./auto_backup_to_github.sh >> /tmp/rhtp_backup.log 2>&1

# Or backup daily at 6 PM:
0 18 * * * cd /Users/richardwilliams/Desktop/RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk\ 2 && ./auto_backup_to_github.sh >> /tmp/rhtp_backup.log 2>&1
```

View backup logs:
```bash
tail -f /tmp/rhtp_backup.log
```

### Option 2: LaunchAgent (macOS - More Reliable)

Create a LaunchAgent plist file:
```bash
cat > ~/Library/LaunchAgents/com.rhtp.backup.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rhtp.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/richardwilliams/Desktop/RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2/auto_backup_to_github.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>StandardOutPath</key>
    <string>/tmp/rhtp_backup.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/rhtp_backup_error.log</string>
</dict>
</plist>
EOF

# Load the agent
launchctl load ~/Library/LaunchAgents/com.rhtp.backup.plist

# Start it
launchctl start com.rhtp.backup
```

Manage the LaunchAgent:
```bash
# Stop
launchctl stop com.rhtp.backup

# Unload
launchctl unload ~/Library/LaunchAgents/com.rhtp.backup.plist

# Check status
launchctl list | grep rhtp
```

---

## Manual Backup Commands

### Quick Manual Backup
```bash
cd "RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2"
git add -A
git commit -m "Manual backup $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main
```

### Check What Will Be Backed Up
```bash
cd "RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2"
git status
```

### View Backup History
```bash
cd "RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2"
git log --oneline -10
```

---

## Troubleshooting

### Problem: "Authentication failed"
**Solution:** Use GitHub CLI authentication:
```bash
gh auth login
gh auth setup-git
```

### Problem: "Permission denied"
**Solution:** Check your Personal Access Token has `repo` scope, or use SSH keys.

### Problem: "Script not executable"
**Solution:**
```bash
chmod +x auto_backup_to_github.sh
```

### Problem: "No changes to commit"
**Solution:** This is normal - the script only backs up when there are changes.

### Problem: Cron job not running
**Solution:** Check cron logs:
```bash
# View system log
log show --predicate 'process == "cron"' --last 1h

# Or check if cron is running
ps aux | grep cron
```

---

## Best Practices

### 1. Test First
Always test the backup script manually before setting up automation:
```bash
./auto_backup_to_github.sh "Test backup"
```

### 2. Monitor Logs
Check backup logs regularly:
```bash
tail -f /tmp/rhtp_backup.log
```

### 3. Verify on GitHub
Periodically check GitHub to ensure backups are working:
https://github.com/rickwill-ibm/RHTP-Code-Base

### 4. Backup Frequency
- **Development:** Every 30 minutes or hourly
- **Production:** Every 4-6 hours or daily
- **Critical changes:** Manual backup immediately

### 5. Exclude Large Files
Add to `.gitignore`:
```
node_modules/
.next/
*.log
.DS_Store
```

---

## Script Features

The `auto_backup_to_github.sh` script automatically:
- ✅ Checks for changes
- ✅ Adds all modified files
- ✅ Creates timestamped commit
- ✅ Pushes to GitHub
- ✅ Provides colored output
- ✅ Shows helpful error messages
- ✅ Handles authentication issues

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `./auto_backup_to_github.sh` | Backup with auto timestamp |
| `./auto_backup_to_github.sh "message"` | Backup with custom message |
| `git status` | Check what will be backed up |
| `git log --oneline -5` | View recent backups |
| `gh auth login` | Setup GitHub authentication |
| `tail -f /tmp/rhtp_backup.log` | Monitor backup logs |

---

## Support

If you encounter issues:
1. Check the error message in the script output
2. Verify GitHub authentication: `gh auth status`
3. Check repository status: `git status`
4. View logs: `tail -f /tmp/rhtp_backup.log`
5. Test manual push: `git push origin main`

---

**Last Updated:** June 19, 2026