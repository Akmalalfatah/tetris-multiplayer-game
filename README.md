# 🎮 Tetris Multiplayer Arena 1v1

A modern, real-time multiplayer 1v1 Tetris game featuring synchronous gameplay mirror screens, integrated global chat, and an automated matchmaking queue system. Built with a robust microservices architecture containerized using Docker.

---

## 🚀 Features

### 🎯 Automated Matchmaking Queue

Automatically pairs online users into dedicated sync rooms, allowing players to quickly enter competitive matches without manual room creation.

### 🪞 Real-Time 1v1 Mirror Screen

Displays your opponent's board in real time through synchronized game state updates, creating an authentic competitive Tetris experience.

### 🧩 Modern Tetris Mechanics

Includes advanced gameplay mechanics commonly found in modern Tetris implementations:

* Ghost Piece (Shadow)
* Hard Drop (Spacebar)
* Hold Piece System
* Continuous Movement (DAS-like behavior)
* Dynamic Speed Level Scaling
* Real-Time Score Tracking

### 💬 Global Chat System

Integrated real-time communication channel powered by Redis Pub/Sub, enabling players across multiple service instances to communicate seamlessly.

### 🏆 Graceful Match Termination

Handles unexpected player disconnections or match abandonment by:

* Freezing synchronization states
* Preventing board corruption
* Automatically awarding Win by WO (Walk Out) points

### 🎓 Academic Grading Framework

Converts gameplay performance into university-style grading metrics:

| Grade | Score Range              |
| ----- | ------------------------ |
| A     | Excellent Performance    |
| B     | Good Performance         |
| C     | Satisfactory Performance |
| D     | Needs Improvement        |

---

## 🛠️ Tech Stack

### Frontend

* HTML5 Canvas
* CSS3
* JavaScript
* Socket.IO Client

### Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM

### Data Layer

* Redis (Caching & Pub/Sub)

### Infrastructure

* Nginx API Gateway
* Docker
* Docker Compose

---

## 📦 Architecture Overview

The application follows a microservices-based architecture that separates concerns while maintaining real-time responsiveness.

```text
┌─────────────────────┐
│      Frontend       │
│    game.html        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Nginx Gateway    │
│ Routing & WebSocket │
└──────────┬──────────┘
           │
           ▼
┌────────────────────────────┐
│ Login & Socket Service     │
│ Authentication             │
│ Matchmaking                │
│ Real-Time Gameplay Sync    │
└──────────┬─────────────────┘
           │
           ▼
┌─────────────────────┐
│    Redis Pub/Sub    │
│ Global Chat Events  │
│ Synchronization     │
└─────────────────────┘
```

### Request Flow

1. Client (`game.html`) connects through the Nginx Gateway.
2. Nginx handles API routing and WebSocket upgrades.
3. Login & Socket Service authenticates users and manages matchmaking.
4. Redis Pub/Sub distributes chat messages and synchronization events.
5. Opponent game boards are mirrored in real time.

---

## ⚡ Quick Start

### Prerequisites

Make sure the following software is installed:

* Docker Desktop
* Docker Compose
* Node.js (Recommended LTS Version)
* Git

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Akmalalfatah/tetris-multiplayer-game.git
cd tetris-multiplayer-game
```

### 2. Configure Environment Variables

Create and configure `.env` files inside each service directory.

Example:

```env
PORT=3001
DATABASE_URL=your_database_url
REDIS_URL=redis://redis:6379
JWT_SECRET=your_secret_key
```

### 3. Build and Start the Services

```bash
docker compose up -d --build
```

Verify running containers:

```bash
docker ps
```

### 4. Launch the Frontend

Open `game.html` using VS Code Live Server:

```text
http://127.0.0.1:5500/game.html
```

### 5. Test Multiplayer Mode

* Open the game in one browser window.
* Open an Incognito Window.
* Register a second account.
* Join matchmaking from both accounts.
* Verify automatic room pairing and board synchronization.

---

## 📡 API Gateway Routes

| Route         | Description                    |
| ------------- | ------------------------------ |
| `/api/auth/*` | Authentication endpoints       |
| `/api/chat/*` | Chat & Socket.IO communication |
| `/health`     | Service health checks          |

---

## 🐳 Docker Commands

Start services:

```bash
docker compose up -d
```

Rebuild services:

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f
```

Stop services:

```bash
docker compose down
```

---

## 🔧 Development

Run backend service locally:

```bash
npm install
npm run dev
```

Build production version:

```bash
npm run build
```

---

## 📈 Future Improvements

* Ranked Matchmaking System
* Spectator Mode
* Tournament Brackets
* Friend Invitations
* Persistent Match History
* Leaderboards
* Replay System

---

## 📄 License

This project is intended for educational and academic purposes.

---

## 👨‍💻 Author

**Muhamad Akmal Al Fatah**

* GitHub: https://github.com/Akmalalfatah
* Portfolio: https://portfolio-akmal-alfatah.vercel.app
* LinkedIn: https://linkedin.com/in/muhamad-akmal-al-fatah
