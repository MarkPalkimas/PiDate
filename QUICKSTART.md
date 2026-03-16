# Pidate - Quick Start Guide

Get Pidate running in 2 minutes.

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation

```bash
# Clone or download the project
cd pidate

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select a date** using the date picker or enter manually (YYYYMMDD format)
2. **Click Search** to find where it appears in π
3. **Watch the magic** as the viewer scrolls to and highlights your date

## Quick Actions

- **Today**: Instantly search for today's date
- **Random Date**: Try a random date
- **Share Result**: Copy shareable text to clipboard

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or push to GitHub and import in [Vercel Dashboard](https://vercel.com/new).

## Project Structure

```
pidate/
├── app/              # Next.js pages
├── components/       # React components
├── lib/             # Utilities and logic
└── public/          # Static assets
```

## Key Files

- `app/page.tsx` - Main page
- `components/PiViewer.tsx` - Digit visualization
- `lib/piSearch.ts` - Search logic
- `lib/piDigits.ts` - Pi dataset

## Customization

### Expand Pi Dataset

Edit `lib/piDigits.ts` and replace `PI_DIGITS` with more digits.

### Change Colors

Edit `tailwind.config.ts` or component className props.

### Modify Animations

Edit Framer Motion props in components.

## Common Issues

**Build fails**: Run `npm install` again
**Port in use**: Use `npm run dev -- -p 3001`
**Slow search**: Dataset is too large, consider optimization

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for technical details
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment options

## Support

Open an issue on GitHub or check the documentation.

Happy date hunting! 🎯
