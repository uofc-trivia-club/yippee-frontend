# Yippee Front-End
Yippee is a real-time multiplayer quiz game built with React, TypeScript, and Material-UI. Users can create quizzes, host live game sessions, and compete with others using WebSockets.

---

## Features

- Create custom multiple-choice quizzes
- Host real-time quiz games with unique room codes
- Join live games and compete against others
- Real-time leaderboards and scoring
- Lobby chat for players and hosts
- Multiple themes: Pink, Blue, Purple, Dark Mode

---

## Tech Stack

### Frontend
- **React 18 + TypeScript** ([React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/))
- **Material-UI (MUI)** – https://mui.com/
- **Redux Toolkit** – https://redux-toolkit.js.org/
- **React Router** – https://reactrouter.com/
- **WebSockets** – https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- **tsparticles** – https://particles.js.org/

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/download)
- npm 
- [Backend server](https://github.com/uofc-trivia-club/yippee-backend/issues) running

### Installation
```bash
git clone https://github.com/uofc-trivia-club/yippee-frontend.git
cd yippee
npm install
```

### Environment Setup (Local vs Production Backend)

Use a backend target switch in your env files.

Example `.env`:

```dotenv
PORT=3001
REACT_APP_BACKEND_TARGET=local

REACT_APP_BACKEND_URL_LOCAL=http://localhost:8080
REACT_APP_WS_URL_LOCAL=ws://localhost:8080/ws

REACT_APP_BACKEND_URL_PRODUCTION=https://yippee-backend-production.up.railway.app
REACT_APP_WS_URL_PRODUCTION=wss://yippee-backend-production.up.railway.app/ws
```

Set `REACT_APP_BACKEND_TARGET` to:
- `local` for local backend development
- `production` for deployed backend

Suggested file usage:
- `.env` shared defaults
- `.env.local` local machine overrides
- `.env.production` production build values
- `.env.copy` committed template you can duplicate

You can also choose the backend at runtime without editing files:

```bash
npm start -- --backend=local
npm start -- --backend=production
```

Quick start (copy/paste):

```bash
# 1) copy template once
cp .env.copy .env

# 2) fill in the proper values for the env variables

# 3) local backend dev
npm run start:local

# 4) test against deployed backend
npm run start:production

# 5) build with a specific target
npm run build:local
npm run build:production
```

Convenience scripts:

```bash
npm run start:local
npm run start:production
npm run build:local
npm run build:production
```

### Development
1. Ensure backend is running.
2. Set `REACT_APP_BACKEND_TARGET=local`.
3. Start frontend:

```bash
npm start
```

Runs the app at http://localhost:3000

### Production Build
1. Set `REACT_APP_BACKEND_TARGET=production`.
2. Build:

```bash
npm run build
```

### Deploying on Vercel

Set these Vercel Environment Variables:

```dotenv
REACT_APP_BACKEND_TARGET=production
REACT_APP_BACKEND_URL_PRODUCTION=https://yippee-backend-production.up.railway.app
REACT_APP_WS_URL_PRODUCTION=wss://yippee-backend-production.up.railway.app/ws
```

Then redeploy.

Note: a deployed frontend cannot use `localhost` backend.

### Security

`.env` files are gitignored. If any were tracked previously, untrack them once:

```bash
git rm --cached .env .env.local .env.production
git commit -m "Stop tracking env files"
```

---

## Application Flow

### Home
- Host Game
- Join Game
- Create Quiz
- Resources

### Create Quiz
- Add questions and multiple-choice answers
- Set difficulty (1–10), points, and optional hints
- Submit via /api/create-quiz

### Host Game
- Select a quiz
- Create lobby (room code generated)
- Configure settings and start game

### Join Game
- Enter player name and room code
- Wait in lobby until game starts

### Lobby
- Player list and chat
- Host controls game settings and start

### Game Session
- Host controls question flow
- Players submit answers
- Live leaderboard updates

---

## WebSocket Integration

### Key Commands
- createLobby
- joinLobby
- sendLobbyMessage
- startGame
- submitAnswer
- nextQuestion

### State Management
WebSocket and game state are managed with Redux:
- Room code
- Players
- Questions
- Scores
- Connection status

---

## Key Files

App.tsx – Routing and theme setup  
Game.tsx – Lobby, active game, and results  
types.ts – Shared TypeScript types  
SelectQuiz.tsx – Quiz selection UI  
PlayerCard.tsx – Player display component  

---

## Development Notes

You can find the Figma design here: https://www.figma.com/proto/f1RXPSz3CNBC5YP8O5pd7o/Yippee-?node-id=0-1&t=nFPsW2rWygzW3IUr-1

When prototyping the frontend, use that link to do so. As of April 08, 2026 it looks bad.
