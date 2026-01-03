# Dumpling Cafe App - Agent Guide

## Package Identity

Next.js 15 AI content creation studio with chat, research, prompts, and media features.
Dark mode only, warm paper-craft aesthetic.

---

## Setup & Run

```bash
# Install
bun install

# Development
bun run dev

# Build (must pass before checkpoints)
bun run build

# Production
bun run start

# Deploy
bunx vercel --prod
```

---

## Patterns & Conventions

### Component Structure
```typescript
// ✅ DO: Functional component with explicit types
'use client';

import { useState } from 'react';

interface Props {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: Props) {
  const [state, setState] = useState(false);
  return <div>...</div>;
}
```

```typescript
// ❌ DON'T: Class components, any types, missing 'use client'
class MyComponent extends React.Component { ... }
```

### Styling
```typescript
// ✅ DO: Use CSS variables
<div className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">

// ✅ DO: Use Tailwind utilities
<div className="rounded-xl p-4 shadow-lg">

// ❌ DON'T: Hardcode colors
<div style={{ background: '#252220' }}>
```

### State & Data
```typescript
// ✅ DO: Use storage service
import { storage } from '@/lib/storage';
const data = await storage.getAll<Prompt>('prompts');

// ✅ DO: Handle loading states
const [isLoading, setIsLoading] = useState(true);

// ❌ DON'T: Direct IndexedDB calls
indexedDB.open('MyDB')...
```

### API Calls
```typescript
// ✅ DO: Use api wrapper with error handling
import { generateImage } from '@/lib/api';
try {
  const image = await generateImage(prompt, model, aspectRatio);
} catch (error) {
  setMascotState('error');
  toast.error(error.message);
}
```

---

## Key Files

| Purpose | File |
|---------|------|
| Main entry | `src/app/page.tsx` |
| Design tokens | `src/app/globals.css` |
| Database | `src/lib/storage.ts` |
| API client | `src/lib/api.ts` |
| Header + nav | `src/components/Header.tsx` |
| Chat interface | `src/components/ChatView.tsx` |
| Image generation | `src/components/ChatInput.tsx` |
| Research system | `src/components/ResearchView.tsx` |
| Prompt library | `src/components/PromptsView.tsx` |
| Media gallery | `src/components/MediaView.tsx` |
| Image editor | `src/components/ImageEditor.tsx` |
| Mascot states | `src/components/Mascot.tsx` |

---

## JIT Index

```bash
# Find a component
rg -n "export function" src/components

# Find hooks
rg -n "useState|useEffect" src/components

# Find API usage
rg -n "generateImage|storage\." src/

# Find types
rg -n "interface|type" src/lib/storage.ts

# Find mascot states
rg -n "mascotState|MascotState" src/
```

---

## Common Gotchas

1. **'use client' required** - All interactive components need this directive
2. **CSS variables** - Always use `var(--color-*)`, never hex codes
3. **Storage init** - Call `storage.init()` before any DB operations
4. **API key check** - Always verify key exists before API calls
5. **Image data URLs** - Use `dataUrl` not `url` for IndexedDB stored images

---

## Pre-PR Checks

```bash
bun run build && bun run lint
```

---

## Design System Quick Reference

### Colors
- Background: `--color-background` (#1a1814)
- Surface: `--color-surface` (#252220)
- Text: `--color-text-primary` (#f5f0e8)
- Accents: coral, teal, sage, gold, lavender

### Typography
- Body: Nunito
- Code: JetBrains Mono

### Spacing
- Border radius: 12-16px
- Padding: 16-24px
- Shadows: soft, 0 4px 12px rgba(0,0,0,0.3)

### Mascot States
`sleeping`, `waving`, `default`, `thinking`, `writing`, `reading`, `celebration`, `error`, `searching`, `coffee`
