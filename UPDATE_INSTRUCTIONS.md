# How to Deploy Updates

## When you make changes to the quiz app:

### Step 1: Update Cache Version
Open `service-worker.js` and increment the `CACHE_VERSION` number:

```javascript
const CACHE_VERSION = 3; // <-- Change this to 4, 5, 6, etc.
```

### Step 2: Deploy to Server
```bash
git add .
git commit -m "Your update message"
git push
```

Then sync to your server at `quiz.serveris.live`

### Step 3: Users Will Auto-Update
- When users visit the site, the app will automatically detect the new service worker
- It will reload the page once to apply updates
- No Ctrl+F5 needed!

---

## What was fixed:

1. **Cache Version System**: Each time you increment `CACHE_VERSION`, old cached files are cleared
2. **Auto-Update Detection**: App checks for service worker updates on every page load
3. **Auto-Reload**: When a new version is detected, page automatically reloads once

## Current Version: 2

Remember to bump this version number in `service-worker.js` every time you:
- Update JavaScript files
- Update CSS
- Add new quiz content
- Fix bugs
- Make any changes that users should see immediately
