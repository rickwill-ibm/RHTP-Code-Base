# 🚀 TCOC Application - Quick Start Desktop Launcher

## Easiest Way to Launch the App

### Option 1: Automatic Desktop Shortcut (RECOMMENDED) ⭐

Simply run this PowerShell script to automatically create a desktop shortcut:

```powershell
powershell -ExecutionPolicy Bypass -File create-desktop-shortcut.ps1
```

**Or:**
1. Right-click on [`create-desktop-shortcut.ps1`](create-desktop-shortcut.ps1:1)
2. Select **"Run with PowerShell"**
3. A shortcut will appear on your desktop
4. Double-click the shortcut to launch the app!

### Option 2: Manual Desktop Shortcut

1. Right-click on [`start-tcoc-app.vbs`](start-tcoc-app.vbs:1)
2. Select **"Send to" → "Desktop (create shortcut)"**
3. Double-click the desktop shortcut to launch!

### Option 3: Direct Launch (No Shortcut)

Double-click [`start-tcoc-app.bat`](start-tcoc-app.bat:1) to start the application immediately.

---

## What Happens When You Launch?

1. ✅ **Server starts** - The Next.js development server starts on port 4028
2. ✅ **Browser opens** - Your default browser opens to http://localhost:4028
3. ✅ **App loads** - The TCOC Care Management application is ready to use
4. ✅ **Background process** - Server runs silently in the background

---

## Files Included

| File | Purpose |
|------|---------|
| [`start-tcoc-app.bat`](start-tcoc-app.bat:1) | Main launcher script (shows console) |
| [`start-tcoc-app.vbs`](start-tcoc-app.vbs:1) | Silent launcher (no console, for shortcuts) |
| [`create-desktop-shortcut.ps1`](create-desktop-shortcut.ps1:1) | Auto-creates desktop shortcut |
| [`DESKTOP_SHORTCUT_INSTRUCTIONS.md`](DESKTOP_SHORTCUT_INSTRUCTIONS.md:1) | Detailed setup instructions |

---

## Stopping the Application

### Method 1: Task Manager
1. Press **Ctrl + Shift + Esc**
2. Find **"Node.js: Server-side JavaScript"**
3. Right-click → **"End Task"**

### Method 2: Command Line
```bash
taskkill /F /IM node.exe
```

### Method 3: Restart Computer
The server will stop automatically when you restart.

---

## Troubleshooting

### "Cannot run scripts" error in PowerShell
Run this command first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Application doesn't start
1. Verify Node.js is installed: `node --version`
2. Install dependencies: `npm install`
3. Try running [`start-tcoc-app.bat`](start-tcoc-app.bat:1) directly to see errors

### Browser doesn't open
Manually navigate to: **http://localhost:4028**

### Port 4028 already in use
Stop any existing Node.js processes in Task Manager and try again.

---

## 🎯 Quick Reference

**Launch App:** Double-click desktop shortcut or [`start-tcoc-app.vbs`](start-tcoc-app.vbs:1)  
**App URL:** http://localhost:4028  
**Stop App:** Task Manager → End Node.js process  

---

**Made with Bob** 🤖