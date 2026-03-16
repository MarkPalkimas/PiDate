# Deployment Guide for Pidate

## Deploying to Vercel (Recommended)

Vercel is the recommended platform for deploying Pidate as it's built by the creators of Next.js and offers seamless integration.

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/pidate.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Done!**
   - Your site will be live at `https://your-project.vercel.app`
   - Vercel provides automatic HTTPS, CDN, and edge caching

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables

Currently, Pidate doesn't require any environment variables. If you add API integrations or external services in the future, add them in:

- Vercel Dashboard → Project Settings → Environment Variables
- Or create a `.env.local` file locally (not committed to git)

## Custom Domain

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions
5. Vercel handles SSL certificates automatically

## Performance Optimization

The current build is optimized for Vercel's edge network:

- ✅ Static page generation
- ✅ Automatic code splitting
- ✅ Image optimization (if you add images)
- ✅ Edge caching
- ✅ Gzip compression

## Monitoring

Vercel provides built-in analytics:

- Real-time performance metrics
- Web Vitals tracking
- Error logging
- Traffic analytics

Access via: Project Dashboard → Analytics

## Continuous Deployment

Once connected to GitHub:

- Every push to `main` branch triggers a production deployment
- Pull requests get preview deployments
- Automatic rollback on failed builds

## Build Configuration

The project uses these build settings (auto-detected by Vercel):

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Test build locally: `npm run build`

### Runtime Errors

1. Check Function Logs in Vercel dashboard
2. Ensure environment variables are set correctly
3. Check for client/server component issues

### Performance Issues

1. Enable Vercel Analytics
2. Check Web Vitals scores
3. Consider implementing:
   - Lazy loading for heavy components
   - Image optimization
   - Code splitting

## Alternative Deployment Platforms

### Netlify

```bash
npm run build
# Deploy the .next folder
```

### AWS Amplify

1. Connect your GitHub repository
2. Set build settings:
   - Build command: `npm run build`
   - Output directory: `.next`

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Post-Deployment Checklist

- [ ] Test all features on production URL
- [ ] Verify mobile responsiveness
- [ ] Check page load performance
- [ ] Test shareable links
- [ ] Verify SEO metadata
- [ ] Set up custom domain (optional)
- [ ] Enable Vercel Analytics
- [ ] Share your project!

## Updating the Deployment

Simply push changes to your repository:

```bash
git add .
git commit -m "Update feature"
git push
```

Vercel automatically rebuilds and deploys.

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
