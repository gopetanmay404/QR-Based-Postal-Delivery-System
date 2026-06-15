<div align="center">

# Secure Government Document Delivery & Live Tracking System

A full-stack, enterprise-grade platform for the secure delivery of government documents — PAN Card, Passport, Aadhaar, Voter ID, and Certificates — featuring encrypted QR-based verification, live GPS tracking, and real-time notifications.

[![Status](https://img.shields.io/badge/Status-Active-2EA44F?style=for-the-badge)](#)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](#)
[![Security](https://img.shields.io/badge/Security-AES--256--GCM-D7263D?style=for-the-badge&logo=letsencrypt&logoColor=white)](#)
[![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](#)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](#)

</div>

---

## Project Team

This project has been developed as part of the Bachelor of Technology (B.Tech) in Information Technology at **Noida Institute of Engineering and Technology (NIET), Greater Noida**.

### Core Development Team

<table>
<tr>
<td align="center" width="33%" valign="top">

### Prachi Varshney

<img src="https://img.shields.io/badge/Role-System%20Architecture%20%26%20Backend-6366F1" />

<sub>Roll No. 2201330130131</sub>

<br><br>

Designed the scalable system architecture, developed core backend APIs, implemented secure authentication (JWT + encryption), and led overall system integration and performance optimization.

</td>
<td align="center" width="33%" valign="top">

### Vanshika

<img src="https://img.shields.io/badge/Role-Database%20Architecture-10B981" />

<sub>Roll No. 2201330130211</sub>

<br><br>

Designed and managed the database architecture using PostgreSQL/Supabase, optimized data models, and ensured efficient, reliable backend data flow.

</td>
<td align="center" width="33%" valign="top">

### Tanmay Gope

<img src="https://img.shields.io/badge/Role-Full--Stack%20%26%20Realtime%20Systems-F59E0B" />

<sub>Roll No. 2201330130202</sub>

<br><br>

Led full-stack development, implemented the QR-based authentication system, real-time GPS tracking with Socket.IO, frontend-backend integration, and the deployment workflow.

</td>
</tr>
</table>

### Project Supervisor

<div align="center">

<img src="https://img.shields.io/badge/Supervisor-Mr.%20Minhaj%20Nezami-1E3A8A?style=for-the-badge" />

**Assistant Professor, Department of Information Technology**
NIET, Greater Noida

</div>

### Institution

<div align="center">

[![NIET](https://img.shields.io/badge/Institution-NIET%2C%20Greater%20Noida-0F4C81?style=for-the-badge)](#)
[![AKTU](https://img.shields.io/badge/Affiliated%20to-AKTU%2C%20Lucknow-0F766E?style=for-the-badge)](#)
[![Department](https://img.shields.io/badge/School-Computer%20Science%20%26%20IT-7C3AED?style=for-the-badge)](#)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roles & Access](#roles--access)
- [Quick Start](#quick-start)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)
- [Real-Time Events](#real-time-events-socketio)
- [Project Team](#project-team)

---

## Overview

This system streamlines the delivery of sensitive government documents end to end. Users generate encrypted QR codes for their documents, postmen authenticate and deliver via QR scans with live location sharing, and admins oversee the entire pipeline through a centralized analytics dashboard — all backed by token-based authentication, encryption, and role-based access control.

---

## Tech Stack

### Frontend

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-Animations-0055FF?logo=framer&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet.js-Maps-199900?logo=leaflet&logoColor=white)
![Socket.IO Client](https://img.shields.io/badge/Socket.IO-Client-010101?logo=socket.io&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-Analytics-FF6384)
![QR Scanner](https://img.shields.io/badge/html5--qrcode-QR%20Scanning-orange)

- React 19 + Vite 8
- Tailwind CSS v4
- Framer Motion for smooth UI animations
- Leaflet.js + React Leaflet + Leaflet Routing Machine for live maps & navigation
- Socket.IO Client for real-time updates
- html5-qrcode for QR scanning
- Recharts for admin analytics dashboards

### Backend

![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Framework-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-010101?logo=socket.io&logoColor=white)
![Helmet](https://img.shields.io/badge/Helmet-Security%20Headers-grey)
![Rate Limit](https://img.shields.io/badge/express--rate--limit-Protection-red)

- Node.js + Express.js
- Prisma ORM + PostgreSQL
- JWT Authentication (access + refresh tokens)
- Socket.IO for real-time delivery tracking
- AES-256-GCM encryption for QR payloads
- node-cron for scheduled cleanup jobs
- helmet, cors, express-rate-limit for security hardening

---

## Project Structure

```

project-4th/
├── client/                   # React Frontend
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── context/          # Auth, Socket, Notification contexts
│       ├── hooks/             # Custom React hooks
│       ├── layouts/           # Page layouts
│       ├── pages/             # Route pages
│       ├── routes/            # App router
│       └── services/          # API service layer
├── server/                    # Express Backend
│   ├── prisma/                # Database schema & seeds
│   └── src/
│       ├── controllers/        # Route handlers
│       ├── cron/                # Scheduled jobs
│       ├── middleware/          # Auth, RBAC, rate-limit
│       ├── routes/              # API routes
│       ├── services/            # Business logic
│       ├── sockets/             # Socket.IO handlers
│       ├── utils/                # Encryption, JWT, Prisma
│       └── validators/           # Input validation

```

---

## Roles & Access

| Role | Access |
|------|--------|
| **USER** | Dashboard, generate QR, track deliveries, confirm receipt |
| **POSTMAN** | Scan QR, navigate to destination, live tracking |
| **ADMIN** | Analytics, manage users/deliveries, system oversight |

---

## Quick Start

### Prerequisites

![Node](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)

### 1. Clone & Install

```bash
# Backend
cd server
cp .env.example .env    # Edit with your PostgreSQL credentials
npm install

# Frontend
cd ../client
npm install
```

### 2. Database Setup

```bash
cd server
npx prisma db push      # Create tables
node prisma/seed.js     # Seed default data
```

### 3. Start Development

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

### 4. Open the App

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000/api/health` |

---

## Security Features

- JWT access tokens (15 min) + refresh tokens (7 days, HTTP-only cookies)
- AES-256-GCM encrypted QR payloads
- bcrypt password hashing (12 salt rounds)
- Role-based access control (RBAC)
- Rate limiting on sensitive endpoints
- Helmet security headers
- CORS whitelist
- Input validation via express-validator
- QR images stored server-side only — never exposed publicly
- Automatic cleanup of expired data via node-cron

---

## API Endpoints

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| `POST` | `/api/auth/register` | No | — |
| `POST` | `/api/auth/login` | No | — |
| `POST` | `/api/auth/postman-login` | No | — |
| `POST` | `/api/auth/refresh` | Cookie | — |
| `POST` | `/api/auth/logout` | Yes | — |
| `GET` | `/api/auth/me` | Yes | — |
| `POST` | `/api/deliveries/generate` | Yes | USER |
| `GET` | `/api/deliveries/my-deliveries` | Yes | USER |
| `GET` | `/api/deliveries/:id/status` | Yes | USER / ADMIN |
| `POST` | `/api/deliveries/:id/confirm` | Yes | USER |
| `GET` | `/api/postman/assigned` | Yes | POSTMAN |
| `POST` | `/api/postman/scan` | Yes | POSTMAN |
| `POST` | `/api/postman/start-delivery/:id` | Yes | POSTMAN |
| `POST` | `/api/postman/update-location` | Yes | POSTMAN |
| `GET` | `/api/admin/analytics` | Yes | ADMIN |
| `GET` | `/api/admin/users` | Yes | ADMIN |
| `GET` | `/api/admin/deliveries` | Yes | ADMIN |
| `PATCH` | `/api/admin/deliveries/:id` | Yes | ADMIN |
| `DELETE` | `/api/admin/deliveries/:id` | Yes | ADMIN |
| `GET` | `/api/notifications` | Yes | USER |
| `PATCH` | `/api/notifications/:id/read` | Yes | USER |
| `PATCH` | `/api/notifications/read-all` | Yes | USER |

---

## Real-Time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `delivery:join` | Client → Server | Join delivery tracking room |
| `delivery:leave` | Client → Server | Leave delivery room |
| `delivery:started` | Server → Client | Postman started delivery |
| `postman:location` | Server → Client | Live postman position |
| `delivery:near` | Server → Client | Postman within 500m |
| `delivery:completed` | Server → Client | Delivery confirmed |
| `notification:new` | Server → Client | New notification |

---

<div align="center">

Made with dedication by the Core Development Team — B.Tech (IT), NIET Greater Noida

</div>
