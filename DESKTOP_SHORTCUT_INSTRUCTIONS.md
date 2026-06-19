# TCOC Application Desktop Shortcut Setup

## Quick Start - Create Desktop Shortcut

Follow these simple steps to create a desktop icon that launches the TCOC application:

### Method 1: Automatic Setup (Recommended)

1. **Right-click** on `start-tcoc-app.vbs` in this folder
2. Select **"Send to" → "Desktop (create shortcut)"**
3. The shortcut will appear on your desktop
4. **Right-click** the desktop shortcut and select **"Properties"**
5. Click **"Change Icon..."** button
6. Click **"Browse..."** and navigate to:
   ```
   C:\Users\5J0601897\Desktop\BOB Project - 052926\tcoc\public\assets\images\app_logo.png
   ```
7. If Windows says "No icons available", click **OK** and then **Browse** again to:
   ```
   %SystemRoot%\System32\imageres.dll
   ```
   Select any icon you like (or use the default)
8. Click **OK** to save
9. **Rename** the shortcut to "TCOC Application" or your preferred name

### Method 2: Manual Shortcut Creation

1. **Right-click** on your Desktop
2. Select **New → Shortcut**
3. For the location, enter:
   ```
   "C:\Users\5J0601897\Desktop\BOB Project - 052926\tcoc\start-tcoc-app.vbs"
   ```
4. Click **Next**
5. Name it "TCOC Application"
6. Click **Finish**
7. Follow steps 4-8 from Method 1 to add an icon

## What Happens When You Double-Click the Icon?

1. ✅ The application server starts automatically (hidden in background)
2. ✅ Your default web browser opens to `http://localhost:4028`
3. ✅ The TCOC application loads and is ready to use
4. ✅ A server window runs in the background (you won't see it)

## How to Stop the Application

When you're done using the application:

1. **Open Task Manager** (Ctrl + Shift + Esc)
2. Find **"Node.js: Server-side JavaScript"** or **"cmd.exe"** with "TCOC Server" title
3. Right-click and select **"End Task"**

OR simply restart your computer (the server will stop automatically)

## Troubleshooting

### Icon doesn't show the app logo
- Windows doesn't natively support PNG icons in shortcuts
- Use Method 1, step 7 to select a Windows system icon instead
- Or convert the PNG to ICO format using an online converter

### Application doesn't start
1. Make sure Node.js is installed: Open Command Prompt and type `node --version`
2. Check that you're in the correct directory
3. Try running `start-tcoc-app.bat` directly to see any error messages

### Browser doesn't open automatically
- The browser should open after 5 seconds
- If not, manually open your browser and go to: `http://localhost:4028`

### Port 4028 is already in use
1. Open Task Manager
2. End any existing Node.js processes
3. Try launching again

## Files Created

- **start-tcoc-app.bat** - Main launcher script (shows console window)
- **start-tcoc-app.vbs** - Silent launcher (no console window, better for shortcuts)
- **DESKTOP_SHORTCUT_INSTRUCTIONS.md** - This file

## Advanced: Custom Icon

If you want to use the app logo as the icon:

1. Convert `public/assets/images/app_logo.png` to `.ico` format using:
   - Online tool: https://convertio.co/png-ico/
   - Or use GIMP, Photoshop, etc.
2. Save the `.ico` file in the project root
3. In shortcut properties, browse to the `.ico` file

---

**Made with Bob** 🤖