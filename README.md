# Jarvis AI

An AI-powered executive assistant that unifies your Google Workspace — Gmail, Calendar, Drive, Tasks, and Sheets — into a single conversational interface.

Built with **Next.js 15**, **Gemini 2.5 Flash**, and **Google OAuth 2.0**.

## Features

- **AI Daily Brief** — personalised summary of your emails and calendar generated at load
- **Gmail** — view priority inbox, archive messages, and draft replies via chat
- **Google Calendar** — see upcoming events, get countdowns, schedule meetings via chat
- **Google Tasks** — create, complete, and delete tasks; AI prioritisation
- **Google Drive** — recent files with AI-generated summaries
- **Google Sheets** — read and analyse spreadsheet data via chat
- **Memory** — persistent key-value store so Jarvis remembers your preferences
- **Command palette** — `Ctrl+K` spotlight for quick navigation and AI commands
- **Streaming chat** — real-time responses with tool-call visibility

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/jarvis-ai
cd jarvis-ai
npm install
```

### 2. Create a Google OAuth app

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` as an authorised redirect URI
4. Enable the following APIs: Gmail, Calendar, Drive, Tasks, Sheets

### 3. Get a Gemini API key

Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create a key.

### 4. Configure environment

```bash
cp .env.example .env
# Fill in your credentials
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| AI | Gemini 2.5 Flash (function calling + streaming) |
| Auth | Google OAuth 2.0 |
| State | Zustand |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Database | Local JSON (jarvis-db.json) |

## Project structure

```
src/
  app/
    api/          # Route handlers (chat, auth, Google APIs, memory, tasks)
    dashboard/    # Main dashboard page
    settings/     # Settings page
  components/
    chat/         # Chat panel, messages, voice input, file upload
    dashboard/    # Greeting, inbox, agenda, tasks, sheets, files widgets
    layout/       # Sidebar, command palette, canvas glow, providers
  lib/
    gemini/       # Gemini client and system prompt
    google/       # Google API client
    store/        # Zustand store
    db/           # Local database
```
