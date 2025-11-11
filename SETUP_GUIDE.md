# 🧠 DailyAITracker - Installation & Usage Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install Dependencies**
```bash
npm install
```

This will install the new dependencies:
- `next-themes@0.2.1` - Dark mode support
- `lucide-react@0.408.0` - Modern icons

2. **Run Development Server**
```bash
npm run dev
```

The app will be available at:
- `http://localhost:3000` (if port is available)
- `http://localhost:3001` (if port 3000 is in use)

3. **Build for Production**
```bash
npm run build
npm start
```

---

## 🎨 Theme System

### Automatic Dark Mode Detection
The app automatically detects your system preference (light/dark mode) and applies the corresponding theme on first load.

### Manual Theme Toggle
Click the **Sun/Moon icon** (☀️/🌙) in the header to switch between light and dark modes. Your preference is saved to localStorage.

### Available Themes
- **Light Mode** - Clean white background with dark text
- **Dark Mode** - Deep slate background with light text

Both modes are automatically handled by the `next-themes` package and adapt all colors through CSS variables.

---

## 🎯 Key Features

### 1. **Authentication**
- Google OAuth login with secure encryption
- Persistent user sessions
- One-click sign out

### 2. **Task Management**
- Create, edit, and delete tasks
- Organize by category (Work, Personal, Health, Learning, Other)
- Schedule tasks with time slots
- Mark tasks complete with smooth animations
- Empty state guidance

### 3. **AI Planning**
- Daily AI-generated plans with focus areas
- Motivational quotes
- Recommended tasks based on your profile
- Actionable insights

### 4. **Reflection**
- Daily mood tracking (5-level scale with emoji)
- Journaling interface
- View past reflections
- Edit/update reflections

### 5. **Streak Tracking**
- Current and personal best streaks
- Daily progress visualization
- Weekly activity heatmap
- Motivational quotes

### 6. **Reward System**
- Growth tree visualization
- Leaf-based progress system
- Milestone badges (Weekly, Monthly)
- Achievement celebration

---

## 🎨 Design Elements

### Color System
All colors automatically adapt to the current theme:

**Primary Actions:** Violet (#8B5CF6) / Secondary: Cyan (#06B6D4)

Light Mode:
- Background: White
- Text: Dark Slate
- Cards: Light Gray

Dark Mode:
- Background: Deep Slate
- Text: Near White
- Cards: Dark Gray

### Components

#### Buttons
- **Primary Button** - Gradient AI (violet → cyan)
- **Secondary Button** - Cyan background
- **Outline Button** - Border-only style
- **Ghost Button** - Transparent with hover effect

#### Cards
- Glass morphism effect with backdrop blur
- Subtle shadow depth
- Rounded corners (2rem default)
- Hover elevation animation

#### Inputs
- Rounded corners (1.25rem)
- Focus ring with primary color
- Placeholder text with reduced opacity
- Support for all input types

#### Badges
- Soft background with text color
- Icon support
- Pill-shaped design

#### Modals
- Animated backdrop blur
- Spring entrance animation
- Content card with depth shadow
- Close button (X) on top-right

---

## ⌨️ Keyboard Shortcuts

- **Tab** - Navigate between elements
- **Enter** - Submit forms, activate buttons
- **Escape** - Close modals, cancel actions
- **Space** - Toggle checkboxes/buttons

---

## 📱 Responsive Breakpoints

The design is fully responsive:

- **Mobile** (< 640px) - Single column, stacked layout
- **Tablet** (640px - 1024px) - Optimized two-column
- **Desktop** (> 1024px) - Full feature layout

All components scale and reflow based on screen size.

---

## 🔧 Customization Guide

### Changing Primary Color

1. Edit `app/globals.css`:
```css
:root {
  --primary: 262 83% 67%;  /* Change HSL values */
}
```

2. The color will automatically apply to all primary buttons, links, and accents.

### Changing Font Family

1. Edit `app/layout.tsx`:
```tsx
const yourFont = YourFont({
  subsets: ["latin"],
  variable: "--font-your-font",
});
```

2. Update `tailwind.config.js`:
```js
fontFamily: {
  sans: ['YourFont', 'sans-serif'],
}
```

### Adding New Component Styles

1. Add to `app/globals.css` in the `@layer components` section:
```css
@layer components {
  .my-custom-component {
    @apply p-6 rounded-xl bg-card border border-border;
  }
}
```

2. Use in components:
```tsx
<div className="my-custom-component">Content</div>
```

---

## 🐛 Troubleshooting

### Theme Not Changing?
- Clear browser cache and localStorage
- Ensure ThemeProvider is wrapping the app
- Check console for errors

### Text Not Visible?
- Verify you're using semantic color classes (`text-foreground`, `bg-background`)
- Don't hardcode colors like `text-black` or `bg-white`
- Use theme variables instead

### Animations Stuttering?
- Check browser developer tools for performance issues
- Reduce animation complexity on lower-end devices
- Disable animations for accessibility if needed

### Dark Mode Colors Wrong?
- Verify CSS variables are defined in `.dark` selector
- Check that `darkMode: 'class'` is set in Tailwind config
- Ensure all color utilities use `hsl(var(--variableName))`

---

## 📚 File Reference

### Core Files Modified

```
app/
├── layout.tsx              ← ThemeProvider added
├── page.tsx                ← Complete redesign with animations
├── globals.css             ← Theme variables & component classes

components/
├── ThemeProvider.tsx       ← NEW: Theme wrapper
├── ThemeToggle.tsx         ← NEW: Dark mode toggle
├── AuthButton.tsx          ← Updated styling
├── TaskList.tsx            ← Complete redesign
├── AddTaskModal.tsx        ← Complete redesign
├── ReflectionCard.tsx      ← Complete redesign
├── RewardTree.tsx          ← Complete redesign
├── StreakCard.tsx          ← Complete redesign

tailwind.config.js          ← Extended with new utilities
package.json                ← Added dependencies
```

---

## 🚀 Performance Optimization

The design system includes several performance optimizations:

1. **CSS-in-JS Minimized** - Uses Tailwind's compiled CSS
2. **Component Splitting** - Lazy-loaded components
3. **Image Optimization** - Next.js Image component ready
4. **Animation Optimizations** - GPU-accelerated transforms
5. **Smooth Scrolling** - CSS scroll behavior

---

## ♿ Accessibility Features

- ✅ WCAG AA contrast ratios
- ✅ Semantic HTML structure
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation throughout
- ✅ Focus indicators on all buttons
- ✅ Screen reader compatible
- ✅ Color-blind friendly design

Test with:
- Chrome DevTools (Accessibility panel)
- WAVE browser extension
- Screen readers (NVDA, JAWS)

---

## 📊 Analytics Integration

The design is ready for analytics:

```tsx
// Add Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout() {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🔐 Security Notes

- All form inputs are sanitized by React
- Theme preference is stored in localStorage (no sensitive data)
- Animations use GPU acceleration safely
- No external font requests (fonts loaded from Google)

---

## 📞 Support & Resources

### Tailwind CSS Documentation
- https://tailwindcss.com/docs
- Dark mode guide: https://tailwindcss.com/docs/dark-mode

### Framer Motion
- https://www.framer.com/motion/
- Animation tutorials: https://www.framer.com/motion/examples/

### Next Themes
- https://github.com/pacocoursey/next-themes
- Configuration guide included in repo

### Lucide React Icons
- https://lucide.dev
- 400+ icons available

---

## 🎉 That's It!

Your DailyAITracker is now fully modernized and ready to use. Enjoy the sleek, futuristic design! 🚀

For any issues or questions, refer to the troubleshooting section above or check the component source code.

---

**Last Updated:** November 11, 2025
**Version:** 2.0
**Status:** Production Ready ✅
