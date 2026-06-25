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
Converts gameplay performance into university-style grading metrics calculated directly from the real-time score system:

| Grade | Score (Normalized Range) | Performance Level |
| ----- | ------------------------ | ----------------- |
| **A** | $86 - 100$               | Excellent         |
| **B** | $75 - 85$                | Good              |
| **C** | $65 - 74$                | Satisfactory      |
| **D** | $< 65$                   | Needs Improvement |

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

### Data Layer
* PostgreSQL (Primary & Replica)
* Redis (Caching & Pub/Sub)

### Infrastructure
* Nginx API Gateway (Reverse Proxy Port 80)
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
│ Routing (Port 80)   │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────┐
│       Microservices Cluster          │
│ ┌─────────────────┐ ┌──────────────┐ │
│ │  Login Service  │ │ Chat Service │ │
│ └─────────────────┘ └──────────────┘ │
│ ┌─────────────────┐ ┌──────────────┐ │
│ │ Matchmaking Serv│ │ Game Service │ │
│ └─────────────────┘ └──────────────┘ │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│             Data Layer               │
│ ┌─────────────────┐ ┌──────────────┐ │
│ │ Redis (Pub/Sub) │ │ PostgreSQL   │ │
│ └─────────────────┘ └──────────────┘ │
└──────────────────────────────────────┘