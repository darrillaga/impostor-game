# Deployment Guide

Your Impostor Game is ready to deploy! Here are your options:

## Option 1: Deploy to Railway (Recommended - Easiest)

### Via Railway Web Interface (No CLI needed)

1. **Go to [Railway.app](https://railway.app)** and sign up/login with GitHub

2. **Click "New Project"**

3. **Select "Deploy from GitHub repo"**
   - Authorize Railway to access your GitHub
   - Select the repository: `darrillaga/impostor-game`

4. **Railway will automatically detect the configuration** and deploy
   - It will use the `railway.json` and `nixpacks.toml` configs
   - Build command: `npm run build`
   - Start command: `npm start`

5. **Once deployed:**
   - Railway will give you a public URL (e.g., `your-app.up.railway.app`)
   - Your game will be live and accessible!

6. **Important:** Make sure to set the domain in Settings > Networking > Public Networking if it's not enabled

### Via Railway CLI (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up

# Generate domain
railway domain
```

## Option 2: Deploy to Render

1. **Go to [Render.com](https://render.com)** and sign up/login

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure:**
   - Name: impostor-game
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Free

5. **Click "Create Web Service"**

6. **Wait for deployment** (takes 2-5 minutes)

## Option 3: Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (from project directory)
fly launch

# Follow prompts:
# - Choose app name
# - Choose region
# - Don't add databases
# - Deploy now: Yes

# Your app will be live at https://your-app.fly.dev
```

## Post-Deployment Checklist

After deployment, test these features:

- [ ] Create a new room
- [ ] Share room link works
- [ ] Multiple players can join
- [ ] Game starts properly
- [ ] Word reveal swipe gesture works
- [ ] Voting system works
- [ ] Leaderboard persists across rounds
- [ ] Reconnection works after refresh

## Troubleshooting

### WebSocket Connection Issues

If you see WebSocket errors, make sure:
- The platform supports WebSockets (Railway, Render, Fly.io do)
- Your firewall/network allows WebSocket connections
- The Socket.io client is connecting to the correct URL

### Build Failures

If build fails:
```bash
# Locally test the build
npm run build
npm start
```

### Environment Variables

No environment variables are required! The app works out of the box.

### Custom Domain

To use your own domain:

**Railway:**
1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

**Render:**
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS CNAME record

## Cost

All three platforms offer generous free tiers:

- **Railway**: 500 hours/month free ($5 credit)
- **Render**: 750 hours/month free
- **Fly.io**: 3 VMs with 256MB RAM free

Your app should stay within free tier limits for moderate use.

## Monitoring

### Railway
- View logs in Dashboard → Deployments → Logs
- Monitor metrics in Dashboard → Metrics

### Render
- View logs in Dashboard → Logs
- Monitor metrics in Dashboard → Metrics

## Updating Your App

After making changes:

```bash
# Commit changes
git add .
git commit -m "Your update message"
git push

# Railway/Render will auto-deploy on push
# Or manually trigger deployment from dashboard
```

## Need Help?

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Fly.io Docs: https://fly.io/docs
- Socket.io Docs: https://socket.io/docs
