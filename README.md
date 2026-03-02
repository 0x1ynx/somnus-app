# Somnus

A gentle dream journal PWA to capture the stories your sleeping mind tells.

Record dream fragments, let AI reconstruct coherent narratives, and receive psychoanalytic interpretations — all in a starlit interface you can install on your phone.

## Features

- **Record** — Jot down fragments, keywords, or full sentences right after waking up. Auto-saves drafts so nothing is lost if you close the app.
- **Reconstruct** — DeepSeek AI weaves your fragments into a coherent dream narrative and extracts keywords.
- **Interpret** — Get a psychoanalytic interpretation of your dream, informed by your personal context.
- **Journal** — Browse, search, and revisit past dreams grouped by month.
- **Insights** — Mood trends, dream frequency calendar, keyword clouds, and dream-per-week graphs.
- **Import** — Bulk-import an existing dream journal from Apple Notes (YY.M.D format).
- **Personal Dictionary** — Define codenames and recurring symbols so the AI understands your dream language.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES modules), no framework
- **Build**: Vite + vite-plugin-pwa
- **Backend**: Supabase (PostgreSQL + Auth with email OTP)
- **AI**: DeepSeek API (user-provided key, stored locally)
- **Styling**: Custom CSS with dark theme and animated starfield canvas

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with a `dreams` table
- (Optional) A [DeepSeek](https://platform.deepseek.com) API key for AI features

### Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Configure your Supabase URL and anon key in `src/services/supabase.js`.

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  main.js              # Entry point, auth guard, hash router
  store.js             # Data layer (Supabase CRUD + localStorage)
  views/
    Login.js           # Email OTP authentication
    NewDream.js        # Dream recording (3-step AI flow)
    DreamList.js       # Searchable journal list
    DreamDetail.js     # View/edit a single dream
    Analysis.js        # Insights dashboard
    Settings.js        # API key, personal dictionary, import
  components/
    NavBar.js          # Bottom tab navigation
    MoodPicker.js      # Emoji mood selector
    DreamGraph.js      # SVG dream frequency graph
    StarField.js       # Animated canvas background
  services/
    supabase.js        # Supabase client singleton
    deepseek.js        # DeepSeek API (reconstruct + interpret)
  styles/
    main.css           # Full design system
```

## License

MIT
