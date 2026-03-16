# 🥧 Pidate - Find Your Date in π

**Discover where any date appears in the infinite digits of pi.**

Experience π as a continuous mathematical landscape where every date lives somewhere in infinity.

## ✨ Features

- 🔍 **Search any date** - Find where YYYYMMDD appears in π
- 📜 **Continuous scrolling** - Explore π as an infinite mathematical landscape  
- 🎯 **Auto-scroll to today** - Page loads showing today's date in π
- 📱 **Mobile responsive** - Beautiful experience on all devices
- ⚡ **Blazing fast** - Efficient chunked loading of 100 million digits
- 🎨 **Beautiful animations** - Smooth transitions and highlighting

## 🚀 Live Demo

**[Visit Pidate →](https://pidate.vercel.app)**

## 🛠️ Technology

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Chunked streaming** for performance
- **100 million π digits** dataset

## 🎯 How It Works

Because π is infinite and non-repeating, any finite sequence of digits appears somewhere within it. This means every date formatted as YYYYMMDD exists somewhere in π's decimal expansion.

Pidate uses efficient chunked loading to search through 100 million digits of π, providing coverage for virtually any date while maintaining smooth performance.

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
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── PiViewer.tsx    # Main π display with virtualization
│   ├── DateControl.tsx # Date picker interface
│   └── DateIndicator.tsx # Search result display
├── lib/                # Utilities
│   ├── piEngine.ts     # Core π search engine
│   └── dateUtils.ts    # Date formatting utilities
└── public/
    └── pi-100m.txt     # 100 million digits of π
```

## 🎨 Design Philosophy

Pidate feels like a clever internet project that could go viral while maintaining a clean, premium, and technically impressive experience. The interface is designed to be:

- **Mathematical** - Clean typography and spacing
- **Infinite** - Continuous scrolling landscape
- **Magical** - Smooth animations and discoveries
- **Accessible** - Works beautifully on all devices

## 🔧 Deployment

Ready for deployment on Vercel, Netlify, or any static hosting platform.

For production with larger datasets, consider hosting the π file on a CDN for optimal performance.

## 📄 License

MIT License - feel free to use this project for your own mathematical explorations!

---

*"In the infinite digits of π, every story is written, every date remembered, every moment preserved in mathematical eternity."*