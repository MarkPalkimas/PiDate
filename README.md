# 🥧 Pidate - Find Your Date in π

**Discover where any date appears in the infinite digits of pi.**

Experience π as a continuous mathematical landscape where every date lives somewhere in infinity.

## ✨ Features

- ⚡ **Instant results** - Today's date position is pre-computed and loads instantly
- 🔍 **Search any date** - Find where MMDDYYYY appears in π using external APIs
- 📜 **Continuous scrolling** - Explore π as an infinite mathematical landscape  
- 🗓️ **Daily updates** - Site automatically updates with today's date position
- 📱 **Mobile responsive** - Beautiful experience on all devices
- 🚀 **Lightning fast** - No large file downloads, uses efficient external APIs
- 🎨 **Beautiful animations** - Smooth transitions and highlighting

## 🚀 Live Demo

**[Visit Pidate →](https://pidate.vercel.app)**

## 🛠️ Technology

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **External Pi APIs** for fast, accurate searches
- **GitHub Actions** for daily automated updates
- **Pre-computed positions** for instant loading

## 🎯 How It Works

### Instant Today's Date
When you visit Pidate, today's date position is already pre-computed and displays instantly. No waiting, no large file downloads.

### Smart Search System
- **Pre-computed dates**: Common dates load instantly from cache
- **External APIs**: Rare dates are searched using powerful external pi databases
- **Daily updates**: GitHub Actions automatically updates today's date position every day

### Infinite Pi Experience
Because π is infinite and non-repeating, any finite sequence of digits appears somewhere within it. This means every date formatted as MMDDYYYY exists somewhere in π's decimal expansion.

## 🏃‍♂️ Quick Start

```bash
# Clone the repository
git clone https://github.com/MarkPalkimas/PiDate.git
cd PiDate

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
├── app/
│   ├── api/precomputed-dates/  # Daily updated date positions
│   └── page.tsx               # Main application
├── components/
│   ├── PiViewer.tsx          # Pi display with external API
│   ├── DateControl.tsx       # Date picker interface
│   └── DateIndicator.tsx     # Search result display
├── lib/
│   ├── piAPI.ts             # External pi API integration
│   └── dateUtils.ts         # Date formatting utilities
└── .github/workflows/
    └── daily-update.yml     # Automated daily updates
```

## 🔄 Daily Updates

Pidate automatically updates every day using GitHub Actions:

1. **Calculate today's position** in π using external APIs
2. **Update pre-computed cache** for instant loading
3. **Deploy to Vercel** with fresh data
4. **Zero downtime** - users always see current data

## 🎨 Design Philosophy

Pidate feels like a clever internet project that could go viral while maintaining a clean, premium, and technically impressive experience:

- **Instant gratification** - Today's date loads immediately
- **Mathematical beauty** - Clean typography and infinite scrolling
- **Performance first** - No large downloads, smart caching
- **Always current** - Automatically updates daily

## 🚀 Performance Benefits

- **No large files** - Uses external APIs instead of hosting gigabytes
- **Instant loading** - Pre-computed positions for immediate results
- **Smart caching** - Frequently searched dates are cached
- **Scalable** - Can handle unlimited pi digits via external services

## 📄 License

MIT License - feel free to use this project for your own mathematical explorations!

---

*"In the infinite digits of π, every story is written, every date remembered, every moment preserved in mathematical eternity."*