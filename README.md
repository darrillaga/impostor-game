# Impostor Game

A multiplayer social deduction game where players must find the impostor among them!

## Features

- **Mobile-First Design**: Optimized for touch devices with swipe gestures
- **Real-Time Multiplayer**: Socket.io powered real-time game synchronization
- **Room System**: Create private rooms with password protection
- **Swipe-to-Reveal**: Interactive card swipe gesture to reveal your word/role
- **Multiple Game Modes**: Support for 1-3 impostors
- **Persistent Leaderboard**: Scores tracked across multiple rounds in the same room
- **Reconnection Support**: Automatically rejoin if you refresh or disconnect
- **10 Categories**: Animals, Countries, Food, Sports, Professions, Colors, Movie Genres, Technology, Music Genres, and Vehicles

## Game Flow

1. **Lobby**:
   - First player becomes the host
   - Host selects number of impostors (1-3)
   - Share room link with friends
   - Host starts game when ready (minimum 3 players)

2. **Word Reveal**:
   - Swipe up to reveal your role
   - Normal players see the secret word
   - Impostors see only the category + a subtle clue

3. **Discussion**:
   - Talk with other players to figure out who's the impostor
   - Host controls when to move to voting

4. **Voting**:
   - Everyone votes to eliminate one player
   - Eliminated player's role is revealed
   - Tie votes result in no elimination

5. **Results**:
   - Game ends when all impostors are found (normals +1 point each)
   - Or when impostors equal/outnumber normals (impostors +2 points each)
   - Play multiple rounds to build the leaderboard!

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Socket.io** - Real-time WebSocket communication
- **Tailwind CSS** - Styling
- **Framer Motion** - Swipe gesture animations

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm start
```

## Project Structure

```
impostor-game/
├── app/
│   ├── page.tsx              # Home page (create room)
│   ├── room/[id]/page.tsx    # Game room
│   └── layout.tsx            # Root layout
├── components/
│   ├── Lobby.tsx             # Pre-game lobby
│   ├── WordReveal.tsx        # Swipe-up word reveal
│   ├── VotingPhase.tsx       # Voting interface
│   ├── Results.tsx           # Round/game results
│   └── Leaderboard.tsx       # Score display
├── lib/
│   ├── socket.ts             # Socket.io client
│   ├── gameData.ts           # Categories & words
│   └── gameLogic.ts          # Game state management
├── server/
│   └── socketServer.ts       # Socket.io server logic
└── server.ts                 # Custom Next.js + Socket.io server
```

## How to Play

1. **Create a Room**:
   - Go to the home page
   - Enter a room password
   - Click "Create New Room"

2. **Invite Players**:
   - Share the room link (it includes the password)
   - Wait for at least 3 players to join

3. **Start Game**:
   - Host selects number of impostors
   - Host clicks "Start Game"

4. **Reveal Your Role**:
   - Swipe up on the card to see if you're normal or impostor
   - Memorize your word (or clue if impostor)

5. **Discussion & Voting**:
   - Discuss with other players
   - Vote to eliminate suspected impostors
   - Continue until game ends

6. **Play Again**:
   - Scores persist across games in the same room
   - Host can start a new game anytime

## Tips for Players

**If you're Normal**:
- Remember your exact word
- Listen for impostors who might use vague language
- Work together to identify suspicious players

**If you're Impostor**:
- Use the clue carefully (it's generic but can help)
- Listen to normal players and blend in
- Avoid being too specific or too vague

## License

MIT
