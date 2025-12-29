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
git clone https://github.com/uofc-trivia-club/yippee-frontend.git
cd yippee
npm install

### Development
npm start

Runs the app at http://localhost:3000

### Production Build
npm run build

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
