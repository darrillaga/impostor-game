# 🚀 Quick Deploy Instructions

Your Impostor Game is ready to deploy! Follow these simple steps:

## Deploy to Railway (Recommended - 2 Minutes)

### Option 1: Web Interface (Easiest)

1. Go to **[railway.app](https://railway.app)**

2. Click **"New Project"**

3. Select **"Deploy from GitHub repo"**

4. Choose **`darrillaga/impostor-game`**

5. Railway will automatically deploy (takes ~2-3 minutes)

6. Once done, go to **Settings → Networking → Generate Domain**

7. **Your game is live!** Share the URL with friends!

### Option 2: CLI (Alternative)

```bash
# Login (opens browser)
railway login

# Link to project
railway link

# Deploy
railway up

# Get URL
railway domain
```

---

## What Railway Will Do

✅ Install dependencies (`npm install`)
✅ Build the app (`npm run build`)
✅ Start the server (`npm start`)
✅ Enable WebSocket support (Socket.io)
✅ Provide a public URL

---

## After Deployment

Test these features:
- [ ] Create a room
- [ ] Share the link
- [ ] Join with multiple devices/browsers
- [ ] Play a full game
- [ ] Check leaderboard persistence

---

## Repository

GitHub: https://github.com/darrillaga/impostor-game

## Need Help?

Check `DEPLOYMENT.md` for detailed troubleshooting and alternatives.
