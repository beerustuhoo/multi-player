# Stickfighters Presentation Guide

Use this guide to structure your presentation to reviewers.

## 1. Introduction (1 minute)
- **Concept**: A real-time multiplayer 2D fighting game.
- **Hook**: "We wanted to build a fast-paced, physics-based combat game using only web technologies—no heavy game engines."
- **Key Features**:
  - Real-time synchronization (Socket.IO).
  - Custom physics engine (AABB collision, gravity).
  - Procedural audio (Web Audio API).

## 2. Technology Stack (1 minute)
Briefly touch upon the tools used:
- **Frontend**: Vanilla JavaScript + Vite.
  - *Why?* To have full control over the game loop and DOM rendering without framework overhead.
- **Backend**: Node.js + Express.
- **Networking**: Socket.IO.
  - *Why?* For reliable, event-based real-time communication.

## 3. Live Demo (3-5 minutes)

**Preparation**:
1. Run `npm run dev` in your terminal.
2. Open two browser windows side-by-side:
   - Window 1: `http://localhost:5173/` (Host)
   - Window 2: Incognito window or `http://localhost:5173/` (Player 2)

**Walkthrough**:
1.  **Lobby & Connection**:
    - Enter a username in Window 1 (e.g., "HostPlayer") and click **Join**.
    - Show the Lobby UI.
    - Enter a username in Window 2 (e.g., "Challenger") and click **Join**.
    - *Highlight*: "Notice how the player list updates instantly on both screens."

2.  **Game Settings**:
    - As the host (Window 1), change the **Duration** to "3 Minutes".
    - Click **Start Game**.

3.  **Gameplay**:
    - Move characters around using WASD/Arrow keys.
    - Demonstrate **Physics**: Jump and land on the ground.
    - Demonstrate **Combat**: Use `J` (Punch) and `K` (Kick).
    - *Highlight*: "The movement and attacks are synchronized. If I punch here, they take damage there."

4.  **Synchronization**:
    - Press `ESC` on one client.
    - *Show*: Both screens show "Game Paused".
    - Resume the game.

## 4. Code Highlights (2 minutes)
If reviewers ask to see code, show these interesting parts:

- **Game Loop (`client/src/game.js`)**:
  - Show the `gameLoop` method.
  - Explain the **Fixed Timestep**: "We use a fixed execution order to ensure consistent physics across different frame rates."

- **Input Handling (`client/src/input.js`)**:
  - *Highlight*: "We capture raw key events and send them to the server."
  - Mention the recent fix: "We also ensure game controls are disabled when typing in the UI."

- **Server Logic (`server/GameRoom.js`)**:
  - Show how the server manages the game state and broadcasts updates to all clients.

## 5. Future Improvements & Q&A
- **Planned Features**:
  - More weapon types.
  - Power-ups spawned in the arena.
  - Mobile touch controls.
