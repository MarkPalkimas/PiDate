# Pidate

**Find where your date appears in π**

Because π is infinite, every date appears somewhere inside it. Pidate lets you discover the exact decimal position where any date lives within the digits of pi.

![Pidate Screenshot](https://via.placeholder.com/1200x630/3b82f6/ffffff?text=Pidate)

## ✨ Features

- 🔍 **Date Search**: Find any date in YYYYMMDD format within π
- 📅 **Multiple Input Methods**: Date picker, manual entry, or quick actions
- 🎯 **Precise Location**: Shows exact decimal position with formatted numbers
- 📊 **Interactive Visualization**: Scroll through 100,000+ digits of π
- ✨ **Smooth Animations**: Delightful transitions and highlight effects
- 🔗 **Shareable Results**: Copy and share your findings
- 📱 **Fully Responsive**: Works beautifully on desktop, tablet, and mobile
- 🚀 **Optimized Performance**: Virtualized rendering for smooth scrolling

## 🎯 How It Works

1. **Select a Date**: Use the date picker, enter manually (YYYYMMDD), or try "Today" or "Random"
2. **Search**: The app searches through 100,000 digits of π
3. **Discover**: See exactly where your date appears
4. **Visualize**: The π viewer automatically scrolls to and highlights your date

### Example

```
March 14, 2026 (20260314)
appears at the 77,958,217th decimal place of π
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Date Handling**: date-fns
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pidate.git
cd pidate
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🌐 Deploy to Vercel

The easiest way to deploy Pidate is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect Next.js and configure the build
4. Deploy!

Alternatively, use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## 📁 Project Structure

```
pidate/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── Hero.tsx            # Hero section
│   ├── DateInput.tsx       # Date input controls
│   ├── ResultDisplay.tsx   # Search result display
│   └── PiViewer.tsx        # Pi digits viewer
├── lib/
│   ├── piDigits.ts         # Pi digits dataset
│   ├── piSearch.ts         # Search functionality
│   └── dateUtils.ts        # Date utilities
└── public/                 # Static assets
```

## 🔧 Key Implementation Details

### Pi Digits Dataset

The app currently searches through 100,000 digits of π. The dataset is generated in `lib/piDigits.ts`. For production use with more digits:

1. Download a larger π digits file
2. Replace the `generatePiDigits()` function with file loading
3. Consider chunked loading for very large datasets

### Search Algorithm

Simple substring search using JavaScript's native `indexOf()`. For larger datasets, consider:

- Web Workers for non-blocking search
- Suffix arrays or other advanced algorithms
- Server-side search with API endpoints

### Performance Optimization

- **Virtualization**: Only renders visible rows in the π viewer
- **Memoization**: Components use React optimization techniques
- **Smooth Scrolling**: CSS-based smooth scroll with calculated positions
- **Lazy Loading**: Components load progressively

## 🎨 Design Philosophy

Pidate follows a minimal, premium design aesthetic:

- Clean typography with generous spacing
- Subtle shadows and borders
- Smooth, purposeful animations
- Mathematical elegance without complexity
- Apple-inspired calm and clarity

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- Pi digits sourced from mathematical computation
- Inspired by the infinite nature of π
- Built with modern web technologies

## 📧 Contact

Questions or suggestions? Open an issue or reach out!

---

**Find your date in π at [pidate.vercel.app](https://pidate.vercel.app)**
