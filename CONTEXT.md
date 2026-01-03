# Dumpling Cafe - AI Content Creation Studio

## Project Purpose
Dumpling Cafe is a comprehensive AI content creation studio designed to integrate multiple AI workflows into a single, cohesive application. It features a conversational chat interface, a multi-agent research studio, a prompt library, a media gallery, and an image editor.

## Key Features
- **Chat Interface**: Conversational AI for quick tasks and image generation.
- **Research Studio**: Multi-agent deep research with live progress tracking.
- **Prompt Library**: Save, organize, and reuse prompts.
- **Media Hub**: Gallery of all generated images with metadata.
- **Image Editor**: Integrated image editing with drawing tools.
- **Persistence**: All data (prompts, images, settings) persists using IndexedDB.

## Architecture
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: React Context + IndexedDB
- **Single Page Experience**: The application primarily lives in `src/app/page.tsx` using client-side tab navigation to maintain state and provide a seamless experience.

## Design System
- **Theme**: Dark Mode Only
- **Colors**:
  - Background: #1a1814
  - Surface: #252220
  - Text Primary: #f5f0e8
  - Accents: Coral (#e8927c), Teal (#7cbecc), Sage (#7db07d), Gold (#d4a84b)
- **Mascot**: "Dumpling" - various states (sleeping, waving, thinking, etc.)

## Conventions
- Components located in `src/components/`
- "Use Client" directives used strategically for interactive components.
- No separate pages for core features; use conditional rendering based on active tab.
