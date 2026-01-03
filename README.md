# Dumpling Cafe

An AI-powered creative studio for chat, image generation, research, and prompt management. Built for the Kilo Hackathon.

## Live Demo

[Deployed on Vercel](https://dumpling-cafe.vercel.app) *(update with actual URL)*

---

## Features

### Chat Mode
- Text conversations with 20+ LLM models (free to frontier tier)
- Web Search toggle (`:online` suffix) for real-time information
- Reasoning toggle for extended thinking (effort levels: high/medium/low)
- Streaming responses with mascot animations

### Image Mode
- AI image generation with multiple models (Gemini, FLUX, Seedream)
- Aspect ratio presets: 1:1, 16:9, 9:16, 4:3
- Image size options: 1K, 2K, 4K (Gemini)
- In-app image editor with drawing tools

### Research Studio
- Multi-agent research system (Planner → Researcher → Writer → Critic)
- Parallel web searches with source aggregation
- Progress tracking and cost estimation

### Prompt Library
- Save, organize, and reuse prompts
- Folder organization with tags
- Usage tracking and favorites

### Media Gallery
- Browse all generated images
- Favorites, search, and filtering
- Download and edit capabilities

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Storage | IndexedDB (local, no server) |
| API | OpenRouter (unified LLM gateway) |
| Deployment | Vercel |

---

## Architecture Decisions

### Why OpenRouter?

We chose OpenRouter as our unified API gateway for several reasons:

1. **Multi-model access**: Single API key for 200+ models (OpenAI, Anthropic, Google, open-source)
2. **Automatic fallbacks**: If one provider fails, routes to another
3. **Cost optimization**: Price-based routing, free tier models available
4. **Unified interface**: Same request format for all models

### Why IndexedDB (No Backend)?

1. **Privacy first**: API keys and data never leave the user's browser
2. **Zero server costs**: No database or auth infrastructure needed
3. **Offline capable**: Chat history persists locally
4. **Hackathon speed**: No backend deployment complexity

### Why Separate Chat/Image Modes?

**The Problem**: Early versions sent every message to image generation, even simple chat queries.

**The Solution**: Explicit mode toggle with different:
- Model selectors (CHAT_MODELS vs IMAGE_MODELS)
- API parameters (text-only vs `modalities: ['image', 'text']`)
- UI elements (aspect ratio only in Image mode)

**Key Insight**: OpenRouter image generation REQUIRES the `modalities` parameter. Without it, models return text descriptions instead of images.

```typescript
// Image generation MUST include:
modalities: ['image', 'text'],
extra_body: {
  image_config: {
    aspect_ratio: '16:9',
    image_size: '1K'
  }
}
```

### Why Web Search as Toggle (Not Default)?

1. **Cost**: Web search adds ~$0.02 per request
2. **Latency**: Search adds 1-3 seconds
3. **Relevance**: Most queries don't need real-time data
4. **User control**: Let users decide when they need current info

Implementation: Append `:online` suffix to model ID.

### Why Reasoning as Toggle?

1. **Token cost**: Reasoning tokens are billed as output tokens
2. **Speed**: Extended thinking adds significant latency
3. **Overkill**: Simple queries don't need chain-of-thought

Implementation: `extra_body.reasoning.effort` parameter.

---

## Bug Fixes & QA Results

### Phase 7: Critical Bug Fixes

| Bug | Root Cause | Fix |
|-----|------------|-----|
| Chat always generates images | No mode toggle, only called `generateImage()` | Added Chat/Image toggle, route to correct API function |
| Image generation failing | Missing `modalities` parameter | Added `modalities: ['image', 'text']` to request |
| White image backgrounds | CSS background color bleeding | Changed to `bg-transparent` / CSS variable backgrounds |
| Aspect ratio ignored | Missing `image_config` for Gemini | Added `extra_body.image_config` with aspect_ratio and image_size |

### QA Verification (Claude in Chrome)

| Test | Result | Evidence |
|------|--------|----------|
| Chat mode sends text-only request | PASS | No `modalities` in payload |
| Image mode sends correct params | PASS | `modalities: ['image', 'text']` + `image_config` present |
| Web Search toggle exists | PASS | Globe icon toggle in Chat mode |
| Reasoning toggle exists | PASS | Brain icon toggle in Chat mode |
| API key deletion handling | PASS | Returns to onboarding, preserves history |

---

## API Reference

See [OPENROUTER-SKILL.md](./OPENROUTER-SKILL.md) for comprehensive OpenRouter API documentation including:

- Text chat generation
- Image generation (with `modalities`)
- Vision/image input
- Web search (`:online` suffix)
- Reasoning tokens
- Tool calling
- Structured outputs
- Provider selection
- Model fallbacks
- Prompt caching

---

## Development

### Prerequisites

- Node.js 18+ or Bun
- OpenRouter API key ([get one free](https://openrouter.ai))

### Setup

```bash
# Clone
git clone https://github.com/Jeff-Kazzee/dumpling-cafe-kilo.git
cd dumpling-cafe-kilo

# Install
bun install

# Run locally
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/
│   ├── ChatView.tsx     # Main chat interface
│   ├── ChatInput.tsx    # Input with mode toggle
│   ├── ChatMessageItem.tsx
│   ├── ImageEditor.tsx  # Canvas-based editor
│   ├── MediaView.tsx    # Gallery view
│   └── ...
├── lib/
│   ├── api.ts          # OpenRouter API functions
│   ├── models.ts       # Model definitions (chat + image)
│   └── storage.ts      # IndexedDB wrapper
```

---

## Models

### Chat Models (Tiered)

| Tier | Example | Pricing |
|------|---------|---------|
| Free | MiMo-V2-Flash, Devstral 2 | $0 |
| Budget | DeepSeek V3.2, Grok 4.1 Fast | $0.20-0.50/M |
| Mid | Gemini 3 Flash, Claude Haiku 4.5 | $0.50-3/M |
| Premium | Claude Sonnet 4.5, GPT-5.2 | $3-15/M |
| Frontier | Claude Opus 4.5 | $5-25/M |

### Image Models

| Model | Provider | Strength |
|-------|----------|----------|
| Gemini 2.5 Flash Image | Google | Fast, cheap, good for iteration |
| Gemini 3 Pro Image | Google | 4K output, identity preservation |
| FLUX.2 Max | Black Forest Labs | Highest quality |
| FLUX.2 Flex | Black Forest Labs | Best text rendering |
| Seedream 4.5 | ByteDance | Excellent portraits |

---

## Deployment

### Vercel (Recommended)

```bash
npx vercel@latest
```

No environment variables needed - API key is stored client-side.

### Manual Build

```bash
bun run build
bun run start
```

---

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open PR to `dev` branch

### Branch Strategy

- `main` - Production, deployed to Vercel
- `dev` - Integration branch, PR target
- `feature/*` - Feature branches

---

## Lessons Learned

1. **Read the API docs**: OpenRouter's `modalities` parameter isn't obvious but is required for image generation
2. **Separate concerns**: Chat and Image modes have fundamentally different API requirements
3. **Test with real requests**: Mock tests wouldn't have caught the missing `modalities` bug
4. **Local-first works**: IndexedDB + client-side API calls = zero backend complexity
5. **QA automation**: Claude in Chrome saved hours of manual testing

---

## License

MIT

---

## Credits

Built by Jeff Kazzee for the Kilo Hackathon.

Powered by:
- [OpenRouter](https://openrouter.ai) - Unified LLM API
- [Next.js](https://nextjs.org) - React framework
- [Claude Code](https://claude.com/claude-code) - AI pair programming
