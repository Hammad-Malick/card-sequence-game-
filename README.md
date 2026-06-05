# Sequence Game 🃏

A full-featured real-time multiplayer **Sequence** board game built with React, Socket.io, and TypeScript.

---

## Features

- 🎮 **Real-time multiplayer** — all moves broadcast instantly via Socket.io
- 🏠 **Room system** — create or join rooms with 6-character codes
- 👥 **Multiple game modes** — 2 players (1v1), 2 teams, 3 teams
- 🃏 **Full Sequence rules** — two-eyed Jacks (wild), one-eyed Jacks (remove opponent chip), dead card replacement
- 🔍 **Sequence detection** — horizontal, vertical, diagonal 5-in-a-row
- 💾 **Session persistence** — localStorage saves your session; refresh the page and resume
- 🔄 **Reconnect handling** — if you disconnect, you can rejoin within 60 seconds
- 💬 **Room chat** — real-time in-game chat
- 🏆 **Winner modal** — animated win/lose screen, host can restart
- 📱 **Responsive** — desktop and mobile layout

---

## Tech Stack

| Layer    | Stack                                       |
|----------|---------------------------------------------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS  |
| State    | Zustand + React Router                      |
| Realtime | Socket.io Client                            |
| Backend  | Node.js + Express + Socket.io               |
| Storage  | In-memory (no database)                     |
| Deploy   | Vercel (frontend) + Render/Railway (backend)|

---

## Game Rules Summary

1. **Board** — 10×10 grid with each non-Jack card appearing twice. Four corners are free spaces.
2. **Cards** — 2 standard decks dealt at game start (7 cards for 2 players, 6 for 3–4, 5 for 6).
3. **Turn** — select a card from your hand, click the matching board position to place your chip.
4. **Two-eyed Jacks** (JD, JC) — wild card: place chip on any empty cell.
5. **One-eyed Jacks** (JH, JS) — remove an opponent's chip (cannot remove protected sequence chips).
6. **Dead cards** — if all board positions for a card are occupied, tap it at the start of your turn to discard it and draw a replacement (your turn does not end).
7. **Sequence** — 5 chips in a row (horizontal/vertical/diagonal) for your team.
8. **Win condition** — 2 sequences wins in 2-player/2-team mode; 1 sequence in 3-team mode.

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+

---

## Frontend

### Environment Variables

Create `frontend/.env` from the example:

```bash
cp frontend/.env.example frontend/.env
```

| Variable         | Description                        | Example                          |
|------------------|------------------------------------|----------------------------------|
| `VITE_SOCKET_URL`| URL of your backend Socket.io server | `http://localhost:4000`        |
| `VITE_APP_NAME`  | App display name                   | `Sequence Game`                 |

### Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Runs on [http://localhost:5173](http://localhost:5173)

### Build Frontend

```bash
cd frontend
npm run build
```

Output in `frontend/dist/`

### Preview Production Build

```bash
cd frontend
npm run preview
```

---

## Backend

### Environment Variables

Create `server/.env` from the example:

```bash
cp server/.env.example server/.env
```

| Variable     | Description                          | Example                                   |
|--------------|--------------------------------------|-------------------------------------------|
| `PORT`       | Port to listen on                    | `4000`                                    |
| `CLIENT_URL` | Your frontend origin for CORS        | `https://your-app.vercel.app`            |
| `NODE_ENV`   | Environment                          | `development` or `production`             |

### Run Backend Locally

```bash
cd server
npm install
npm run dev
```

Server starts on [http://localhost:4000](http://localhost:4000)

Health check: [http://localhost:4000/health](http://localhost:4000/health)

### Build Backend

```bash
cd server
npm run build
```

### Start in Production

```bash
cd server
npm start
```

---

## Deployment

### Deploy Frontend to Vercel

1. Push the `frontend/` folder (or the whole monorepo) to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Add environment variable:
   - `VITE_SOCKET_URL` → your deployed backend URL (e.g. `https://sequence-server.onrender.com`)
5. Deploy. React Router SPA rewrites are handled by `vercel.json`.

### Deploy Backend to Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repo, set **Root Directory** to `server`.
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Add environment variables:
   - `PORT` → `4000` (Render injects its own PORT, so this is a fallback)
   - `CLIENT_URL` → your Vercel frontend URL
   - `NODE_ENV` → `production`
6. Deploy. Render keeps the process always running.

### Deploy Backend to Railway

```bash
# From server/ directory
railway init
railway up
```

Set `CLIENT_URL` to your Vercel URL in Railway's environment panel.

### Deploy Backend to Fly.io

```bash
cd server
fly launch
fly secrets set CLIENT_URL=https://your-app.vercel.app NODE_ENV=production
fly deploy
```

---

## No Database

This application uses **no external database**. All room and game state lives in Node.js process memory.

**Implications:**
- If the server restarts, all active rooms are lost.
- The frontend handles this gracefully: if you try to reconnect and the room no longer exists, you see a clear "room expired" message.
- For production use, this is acceptable for ephemeral multiplayer sessions. For persistence, you would need to add Redis or a database (not in scope for this project).

---

## localStorage Session Behavior

When you create or join a room, the following is saved to `localStorage`:

```
playerId, playerName, roomCode, teamId, isHost, reconnectToken, lastKnownGameState
```

On every page load:
1. The app checks for an existing session.
2. If found, a **"Resume Game"** button appears on the home page.
3. Clicking it attempts to reconnect via Socket.io using `playerId` + `reconnectToken`.
4. If the server still has the room → you're restored to your session.
5. If the server restarted or the room expired → you see: *"Your room expired because the server restarted or the room no longer exists."*

The "Clear Session" button permanently removes the localStorage entry.

> **Important:** localStorage is only for session recovery. Socket.io is the real-time sync system.

---

## In-Memory Server Limitation

The server stores rooms in a `Map<string, Room>`. If the Node.js process is killed or crashes:
- All rooms are gone
- Players refreshing will see the "room expired" error
- Stale rooms are automatically cleaned up after 4 hours of inactivity

This is a known, documented trade-off. The UI communicates this clearly to users.

---

## Troubleshooting Socket.io CORS Issues

If the frontend cannot connect to the backend:

1. **Verify `CLIENT_URL`** in the backend `.env` matches your Vercel deployment URL exactly (no trailing slash).
2. **Check browser console** for CORS errors — the origin must be in the server's allowed list.
3. **Development:** the server allows both `http://localhost:5173` and `http://localhost:3000` automatically.
4. **Production:** only the `CLIENT_URL` value is allowed.
5. If you use a custom domain on Vercel, update `CLIENT_URL` accordingly.
6. Ensure your hosting provider (Render/Railway/etc.) does not strip WebSocket upgrade headers — most modern providers support this natively.

---

## Project Structure

```
sequance/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── Board/         # GameBoard, BoardCell
│   │   │   ├── Cards/         # PlayerHand, PlayingCard
│   │   │   ├── Chat/          # ChatBox
│   │   │   ├── Layout/        # GameLayout
│   │   │   ├── Lobby/         # PlayerList
│   │   │   ├── Modals/        # WinnerModal, ConfirmModal
│   │   │   └── UI/            # Button, Loader
│   │   ├── game/              # Board layout, deck utilities, types
│   │   ├── pages/             # HomePage, CreateRoom, JoinRoom, Lobby, Game
│   │   ├── services/          # socket.service, localStorage.service
│   │   └── store/             # Zustand stores
│   ├── .env.example
│   └── vercel.json
│
└── server/                    # Node.js + Express + Socket.io backend
    ├── src/
    │   ├── game/              # Board, deck, rules, sequence-checker, game manager
    │   ├── rooms/             # Room manager, types
    │   ├── utils/             # generateRoomCode, generateToken
    │   ├── socket.ts          # Socket.io event handlers
    │   └── index.ts           # Express server entry point
    └── .env.example
```
