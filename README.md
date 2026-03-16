# Pidate

**Every date lives in π**

Experience π as a living, continuous page. Because π is infinite, every date appears somewhere inside it. Pidate shows you exactly where.

## ✨ The Experience

When you visit Pidate, you're immediately immersed in the digits of π starting from 3.14159... The page automatically scrolls to today's date, highlighting exactly where it appears within the infinite sequence.

- **Continuous π**: Scroll through thousands of digits, starting from the very beginning
- **Auto-discovery**: Today's date is automatically found and highlighted on load
- **Precise positioning**: See the exact digit range (e.g., "Digits 77,958,217–77,958,224")
- **Elegant design**: Minimal, mathematical, premium aesthetic
- **Any date**: Use the discreet date picker to find any date in history

## 🎯 How It Works

1. **Page loads**: You see π starting from 3.14159...
2. **Auto-scroll**: The page smoothly scrolls to today's date
3. **Highlight**: The matching digits glow with a subtle animation
4. **Explore**: Scroll up to the beginning or down through more digits
5. **Try another**: Click "Pick a date" to find any other date

### Example

```
March 14, 2026 (20260314)
Digits 77,958,217–77,958,224 match today
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
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Main page orchestration
│   └── globals.css             # Global styles
├── components/
│   ├── ContinuousPiViewer.tsx  # Main continuous π display
│   └── DatePickerPopup.tsx     # Floating date picker
├── lib/
│   ├── piDigits.ts             # Pi digits dataset (10,000+)
│   ├── piSearch.ts             # Search functionality
│   └── dateUtils.ts            # Date utilities
└── public/                     # Static assets
```

## 🔧 Key Implementation Details

### Continuous Page Experience

The page presents π as one seamless, scrollable document:
- Starts visually at 3.14159...
- Uses window scroll (not container scroll) for natural feel
- Virtualized rendering for performance (only renders visible rows)
- Smooth auto-scroll to highlighted date on load

### Pi Digits Dataset

Currently searches through 10,000+ actual digits of π stored in `lib/piDigits.ts`. The dataset uses real Pi digits and can be expanded by loading larger files.

### Search & Highlighting

- Substring search using JavaScript's `indexOf()`
- Calculates exact digit positions (inclusive range)
- Smooth scroll animation to match location
- Subtle pulse animation on highlighted digits

### Performance Optimization

- **Virtualization**: Only renders visible rows plus buffer
- **Scroll throttling**: Updates visible range efficiently
- **Memoization**: Prevents unnecessary re-renders
- **GPU acceleration**: CSS transforms for smooth animations

## 🎨 Design Philosophy

Pidate embodies a minimal, premium aesthetic:

- **Mathematical elegance**: Clean typography, generous spacing
- **Continuous experience**: Feels like one infinite page of π
- **Subtle interactions**: Smooth animations, refined highlights
- **Calm clarity**: Soft colors, no visual clutter
- **Premium polish**: Every detail considered

The design prioritizes the π digits themselves, with UI elements staying discreet and out of the way.

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
