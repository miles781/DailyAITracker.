# DailyAITracker - Quick Reference & Commands

## 🚀 Quick Start Commands

### Installation (First Time)
```bash
cd c:\Users\USER\dailyAItracker
npm install
```

### Development
```bash
npm run dev
# Open http://localhost:3000 in browser
# Test on mobile via DevTools (Ctrl+Shift+M)
```

### Production Build
```bash
npm run build
npm start
```

### Testing
```bash
# Run all tests (recommended)
npm test -- tests/features.test.ts tests/components.test.tsx

# Run only feature tests
npm test -- tests/features.test.ts

# Run only component tests
npm test -- tests/components.test.tsx

# Run all tests including existing tests
npm test

# Run with verbose output
npm test -- --verbose
```

### Linting
```bash
npm run lint
```

---

## 📱 Manual Testing Scenarios

### Scenario 1: Mobile Text Truncation Fix

**Setup**: Start dev server and open DevTools
```bash
npm run dev
# Press Ctrl+Shift+M to toggle device toolbar
# Set viewport to iPhone 12 (390x844)
```

**Test Cases**:

1. **Short Task** (baseline)
   - Title: "Gym"
   - Expected: Displays normally

2. **Medium Task** (typical)
   - Title: "Plan tomorrow's content"
   - Expected: Full text visible, may wrap on mobile

3. **Long Task** (stress test)
   - Title: "Prepare presentation slides, review feedback, schedule team meeting at 2pm"
   - Expected: Text wraps naturally, no truncation/clipping

4. **Very Long Single Word** (edge case)
   - Title: "Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
   - Expected: Word wraps or breaks gracefully

5. **Special Characters**
   - Title: "TODO: Review PR #42 & fix CSS (mobile) @mention [urgent]"
   - Expected: All characters display correctly

6. **Unicode & Emoji**
   - Title: "🏋️ Gym session - 💪 chest day + 📋 track progress"
   - Expected: Emoji and text display properly

**Verification Points**:
- ✅ No horizontal scroll on mobile
- ✅ All text visible (not cut off)
- ✅ Text wraps naturally on small screens
- ✅ No overlapping elements
- ✅ Touch targets (buttons) remain accessible

---

### Scenario 2: Plan for Tomorrow Feature

**Setup**: Start dev server
```bash
npm run dev
```

**Test Case 1: Create Regular Task**
1. Click "+ Add Task" button
2. Enter title: "Review code"
3. Select category: "Work"
4. Leave "Plan for Tomorrow" unchecked
5. Click "Add Task"
6. **Expected**: Task appears in list without badge

**Test Case 2: Create Next Day Task**
1. Click "+ Add Task" button
2. Enter title: "Prepare content"
3. Select category: "Personal"
4. Check "📅 Plan for Tomorrow"
5. Click "Add Task"
6. **Expected**: Task shows "📅 Next Day" badge in list

**Test Case 3: Mixed Task List**
1. Add 3 tasks with "Plan for Tomorrow" checked
2. Add 3 tasks without "Plan for Tomorrow" checked
3. **Expected**: Only the 3 flagged tasks show badge

**Test Case 4: Edit Existing Task**
1. Add task with "Plan for Tomorrow" checked
2. Click edit button on task
3. Modal opens with checkbox already checked
4. Uncheck the checkbox
5. Click "Update Task"
6. **Expected**: Badge disappears from task

**Test Case 5: Data Persistence**
1. Create task with "Plan for Tomorrow" checked
2. Refresh page (F5)
3. **Expected**: Task still shows badge after refresh

---

### Scenario 3: Responsive Layout (All Viewports)

**Setup**: Dev server with DevTools open

**Mobile (375px)**
```
Device: iPhone SE
Width: 375px
Height: 667px
```
Test:
- Tasks display without horizontal scroll
- Badges and buttons stay aligned
- Text wraps properly
- Inputs are fully visible
- Checkboxes are clickable

**Tablet (768px)**
```
Device: iPad
Width: 768px
Height: 1024px
```
Test:
- Layout adapts correctly
- Spacing increases appropriately
- Category badges show icons
- All elements properly sized

**Desktop (1024px+)**
```
Width: 1920px
Height: 1080px
```
Test:
- Full layout displays
- Typography scales appropriately
- Hover effects work
- All features visible

---

## 🧪 Automated Test Commands

### Test Execution
```bash
# Run feature tests only
npm test -- tests/features.test.ts

# Output:
# PASS tests/features.test.ts
# Plan for Tomorrow Feature (6 tests)
# Task Interface and Data Persistence (3 tests)
# Mobile Text Truncation Fixes (4 tests)
# Combined Feature and Responsive Tests (2 tests)
# ✓ 15 passed
```

### Component Tests
```bash
# Run component tests only
npm test -- tests/components.test.tsx

# Output:
# PASS tests/components.test.tsx
# AddTaskModal Component (5 tests)
# TaskList Component - Next Day Badge (5 tests)
# Responsive Layout Classes (2 tests)
# ✓ 12 passed
```

### Coverage Report (Optional)
```bash
npm test -- --coverage tests/features.test.ts tests/components.test.tsx
```

---

## 🔍 File Locations & Quick Reference

### Core Implementation Files
- `lib/db.ts` - Database schema (Task interface)
- `components/AddTaskModal.tsx` - Modal form with checkbox
- `components/TaskList.tsx` - Task list with badge display
- `store/appState.ts` - State management and persistence

### Test Files
- `tests/features.test.ts` - Feature tests (15 tests)
- `tests/components.test.tsx` - Component tests (12 tests)

### Documentation Files
- `IMPLEMENTATION_COMPLETE.md` - Full implementation guide
- `IMPLEMENTATION_VERIFICATION_CHECKLIST.md` - Verification checklist
- `FILES_CHANGED_SUMMARY.md` - List of all modified files
- `QUICK_REFERENCE.md` - This file

### Configuration Files
- `jest.config.ts` - Jest test configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration

---

## 🎯 Key CSS Classes Used

### Mobile Text Truncation
```css
/* Prevent flex overflow */
.min-w-0 { min-width: 0; }

/* Allow text wrapping */
.break-words { word-break: break-word; }

/* Truncate on larger screens */
.sm:truncate { 
  @media (min-width: 640px) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
```

### Responsive Spacing
```css
.gap-3 { gap: 0.75rem; }  /* Mobile */
.sm:gap-4 { 
  @media (min-width: 640px) {
    gap: 1rem;
  }
}
```

### Badge Styling
```css
.bg-purple-100 { background-color: rgb(243, 232, 255); }
.dark:bg-purple-900/40 { 
  @media (prefers-color-scheme: dark) {
    background-color: rgb(75, 0, 130, 0.4);
  }
}
.text-purple-600 { color: rgb(147, 51, 234); }
.dark:text-purple-300 {
  @media (prefers-color-scheme: dark) {
    color: rgb(216, 180, 254);
  }
}
```

---

## 📋 Verification Checklist (Post-Implementation)

- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test -- tests/features.test.ts tests/components.test.tsx`
- [ ] Dev server runs: `npm run dev`
- [ ] Mobile view tested (DevTools)
- [ ] Tablet view tested
- [ ] Desktop view tested
- [ ] Dark mode tested (all viewports)
- [ ] "Plan for Tomorrow" checkbox works
- [ ] Badge displays correctly
- [ ] Long titles wrap properly
- [ ] No horizontal scroll on mobile
- [ ] Data persists after refresh
- [ ] Form submission works
- [ ] Task editing works

---

## 🐛 Troubleshooting

### Tests Failing
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -r node_modules package-lock.json
npm install

# Run specific test file
npm test -- tests/features.test.ts --verbose
```

### Build Errors
```bash
# Check TypeScript errors
npx tsc --noEmit

# Clear build cache
rm -rf .next

# Rebuild
npm run build
```

### Dev Server Issues
```bash
# Kill existing process (Windows)
taskkill /F /IM node.exe

# Restart dev server
npm run dev
```

### Mobile Testing Issues
```bash
# Clear browser cache
# Ctrl+Shift+Delete in most browsers

# Use incognito/private window
# Open DevTools and test
```

---

## 📞 Support Information

### Code Review Points
1. Check `components/TaskList.tsx` for responsive classes
2. Check `components/AddTaskModal.tsx` for checkbox implementation
3. Review `tests/features.test.ts` for feature coverage
4. Review `tests/components.test.tsx` for component rendering tests

### Key Implementation Details
- `planForNextDay` is optional for backward compatibility
- Data is encrypted before storage
- Responsive design uses Tailwind breakpoints (sm: = 640px)
- Badge styling supports light and dark modes
- All tests use proper mocks and fixtures

---

**Last Updated**: November 11, 2025
**Status**: ✅ Production Ready
**Version**: 1.0.0
