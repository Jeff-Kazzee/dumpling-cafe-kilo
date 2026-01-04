# Changelog

All notable changes to Dumpling Cafe are documented in this file.

## [Unreleased]

## [1.0.0] - 2026-01-03

### Phase 8: UI Polish & Image Editing Fix

#### Added
- Collapsible sidebars on Chat and Research pages (`a8b27d3`)
- Vitest testing framework with integration tests (`31c523b`)
- `supportsEditing` flag for image models to distinguish text-to-image vs image editing capable models (`d25c2c4`)
- `EDIT_CAPABLE_MODELS` export for filtering edit-capable models (`d25c2c4`)

#### Fixed
- **Image editing completely broken** - Model returned text instead of images (`d25c2c4`, `76e0dd0`)
  - Root cause: Missing `modalities: ['image', 'text']` parameter in `editImage()`
  - Secondary issue: FLUX models don't support vision input (text-to-image only)
  - Solution: Added modalities parameter, filtered to edit-capable models, added Gemini config
- Research customization panel now scrollable when custom models expanded (`a8b27d3`)
- Removed API key example from README (`a8b27d3`)

#### Documentation
- Added Phase 8 image editing fix documentation to README (`3c03ca1`)
- Added testing section to README (`3c03ca1`)
- Updated Lessons Learned with model capability insights (`3c03ca1`)

---

## [0.9.0] - 2026-01-03

### Phase 7.5: UI Fixes & System Prompts

#### Fixed
- Mascot PNG white backgrounds on dark theme (`44c1d03`)
- Reasoning traces display in chat messages (`1d5f39b`)

#### Added
- Comprehensive system prompts for all AI modes (`1d5f39b`)
- Code review feedback addressed (`906f06c`)

---

## [0.8.0] - 2026-01-03

### Phase 7.3: Research Performance

#### Added
- Quick/Deep research mode toggle (`85a0639`)
- User-selectable model presets (Fast, Balanced, Quality, Custom) (`a4a6193`)
- Delete button for research tasks (`9608d62`)
- Cost tracking and display per research task

#### Fixed
- Research performance - switched to faster models (`85a0639`)
- New query input field behavior (`9608d62`)

---

## [0.7.0] - 2026-01-02

### Phase 7: Critical Bug Fixes

#### Fixed
- **Chat always generated images** - Added Chat/Image mode toggle (`002804c`)
- **Image generation failing** - Added `modalities: ['image', 'text']` parameter (`002804c`)
- **White image backgrounds** - Changed to transparent/CSS variable backgrounds (`002804c`)
- **Aspect ratio ignored** - Added `extra_body.image_config` for Gemini models (`002804c`)

#### Added
- Comprehensive README with architecture decisions (`4a14530`)
- QA verification results documented (`4a14530`)
- Code review fixes (`6e5d3cf`)

---

## [0.6.0] - 2026-01-02

### Phase 4 & 5: Image Editor + Polish

#### Added
- Canvas-based image editor with drawing tools (`ae34772`)
- Brush size and color selection (`ae34772`)
- Mask generation for inpainting (`ae34772`)
- Image download functionality (`ae34772`)
- Save prompt to library from generated images (`ae34772`)

#### Improved
- UI polish and transitions (`ae34772`)
- Media gallery enhancements (`ae34772`)

---

## [0.5.0] - 2026-01-02

### Phase 3: Research Studio

#### Added
- Multi-agent research system (`5a488c3`)
  - Planner agent for query decomposition
  - Researcher agent with web search
  - Writer agent for synthesis
- Progress tracking with live logs (`5a488c3`)
- Research task history sidebar (`5a488c3`)
- "Discuss in Chat" button to continue research in chat (`5a488c3`)

---

## [0.4.0] - 2026-01-02

### Phase 2: Model Updates

#### Updated
- Chat models list with latest 2025/2026 models (`428c23d`)
  - Free tier: MiMo-V2-Flash, Devstral 2, OLMo, Nemotron
  - Budget tier: DeepSeek V3.2, Grok 4.1 Fast
  - Mid tier: Gemini 3 Flash, Claude Haiku 4.5
  - Premium tier: Claude Sonnet 4.5, GPT-5.2
  - Frontier tier: Claude Opus 4.5
- Image models list (`428c23d`)
  - Gemini 2.5 Flash, Gemini 3 Pro
  - FLUX.2 Max, FLUX.2 Flex
  - Seedream 4.5, Riverflow V2 Max

---

## [0.3.0] - 2026-01-02

### Phase 1: OpenRouter API Integration

#### Fixed
- OpenRouter API client configuration (`9585ca8`)
- API key storage and retrieval (`9585ca8`)
- Request headers (HTTP-Referer, X-Title) (`9585ca8`)

#### Added
- Web search capability with `:online` suffix (`9585ca8`)
- Reasoning mode with effort levels (`9585ca8`)

---

## [0.2.0] - 2026-01-02

### Infrastructure

#### Added
- CI/CD workflow with GitHub Actions (`087fdbb`)
- Vercel deployment configuration (`f87bd20`)

#### Fixed
- Removed auto-deploy (manual deploy via Vercel CLI) (`f87bd20`)

---

## [0.1.0] - 2026-01-02

### Initial Release

#### Added
- Next.js 15 App Router foundation (`f547f78`)
- TypeScript + Tailwind CSS v4 setup (`f547f78`)
- IndexedDB storage layer (`f547f78`)
- Chat interface with message history (`f547f78`)
- Image generation interface (`f547f78`)
- Prompt library with folders and tags (`f547f78`)
- Media gallery with favorites (`f547f78`)
- Settings modal with API key management (`f547f78`)
- Dumpling mascot with state animations (`f547f78`)
- Dark theme with CSS variables (`f547f78`)

---

## Commit Reference

| Version | Key Commits |
|---------|-------------|
| 1.0.0 | `a8b27d3`, `3c03ca1`, `110ac55`, `31c523b`, `d25c2c4` |
| 0.9.0 | `44c1d03`, `1d5f39b`, `906f06c` |
| 0.8.0 | `85a0639`, `a4a6193`, `9608d62` |
| 0.7.0 | `002804c`, `4a14530`, `6e5d3cf` |
| 0.6.0 | `ae34772` |
| 0.5.0 | `5a488c3` |
| 0.4.0 | `428c23d` |
| 0.3.0 | `9585ca8` |
| 0.2.0 | `087fdbb`, `f87bd20` |
| 0.1.0 | `f547f78` |
