# 🚀 SOFLOTTO Deployment Guide

## Quick Deploy to GitHub + Netlify

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon → "New repository"
3. Name it: `SOFLOTTO`
4. Make it **Public** (required for free Netlify)
5. **Don't** initialize with README (we already have files)
6. Click "Create repository"

### Step 2: Push to GitHub

```bash
# Add your GitHub repo as remote
git remote add origin https://github.com/YOUR_USERNAME/SOFLOTTO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Netlify

1. Go to [Netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub account
4. Select the `SOFLOTTO` repository
5. Build settings (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

### Step 4: Configure Environment Variables (if needed)

In Netlify dashboard → Site settings → Environment variables:
- Add any `.env` variables your app needs

## 🎯 Why This Fixes Wallet Issues

**Local Development Problems:**
- Hot reloading interferes with wallet connections
- Browser security restrictions in dev mode
- Network conflicts with wallet extensions

**Production Benefits:**
- Stable HTTPS environment
- No hot reloading interference
- Proper browser security context
- Better wallet extension compatibility

## 🔧 Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📱 Custom Domain (Optional)

1. In Netlify: Site settings → Domain management
2. Add custom domain
3. Configure DNS records
4. Enable HTTPS

## 🚨 Troubleshooting

**Build fails?**
- Check Node.js version (use 18+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

**Wallet still not working?**
- Check browser console for errors
- Ensure HTTPS (required for wallets)
- Try different browser/incognito mode

## 🎉 Success!

Once deployed, your wallet connections will be much more stable and reliable!
