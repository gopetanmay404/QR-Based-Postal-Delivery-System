# 🏛️ Secure Government Document Delivery & Live Tracking System

A full-stack enterprise-grade web application for secure delivery of government documents (PAN Card, Passport, Aadhaar, Voter ID, Certificates) with encrypted QR codes, live GPS tracking, and real-time notifications.

## 🚀 Tech Stack

### Frontend
- React 19 + Vite 8
- Tailwind CSS v4
- Framer Motion (animations)
- Leaflet.js + React Leaflet (maps)
- Leaflet Routing Machine (navigation)
- Socket.IO Client (real-time)
- html5-qrcode (QR scanning)
- Recharts (admin analytics)

### Backend
- Node.js + Express.js
- Prisma ORM + PostgreSQL
- JWT Authentication (access + refresh tokens)
- Socket.IO (real-time tracking)
- AES-256-GCM encryption (QR payloads)
- node-cron (scheduled cleanup)
- helmet, cors, express-rate-limit (security)

## 📁 Project Structure

```
project-4th/
├── client/                   # React Frontend
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── context/          # Auth, Socket, Notification contexts
│       ├── hooks/            # Custom React hooks
│       ├── layouts/          # Page layouts
│       ├── pages/            # Route pages
│       ├── routes/           # App router
│       └── services/         # API service layer
├── server/                   # Express Backend
│   ├── prisma/               # Database schema & seeds
│   └── src/
│       ├── controllers/      # Route handlers
│       ├── cron/             # Scheduled jobs
│       ├── middleware/       # Auth, RBAC, rate-limit
│       ├── routes/           # API routes
│       ├── services/         # Business logic
│       ├── sockets/          # Socket.IO handlers
│       ├── utils/            # Encryption, JWT, Prisma
│       └── validators/       # Input validation
```

## 🔐 Roles

| Role | Access |
|------|--------|
| USER | Dashboard, generate QR, track deliveries, confirm receipt |
| POSTMAN | Scan QR, navigate to destination, live tracking |
| ADMIN | Analytics, manage users/deliveries, system oversight |

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

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
node prisma/seed.js      # Seed default data
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

### 4. Open App
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

## 🔑 Default Credentials

| Role | Email/ID | Password |
|------|----------|----------|
| Admin | admin@govdelivery.in | Admin@123456 |
| User | user@example.com | User@123456 |
| Postman | POST001 | Postman@123 |
| Postman | POST002 | Postman@123 |

## 🛡️ Security Features

- JWT access tokens (15min) + refresh tokens (7 days, HTTP-only cookies)
- AES-256-GCM encrypted QR payloads
- bcrypt password hashing (12 salt rounds)
- Role-based access control (RBAC)
- Rate limiting on sensitive endpoints
- Helmet security headers
- CORS whitelist
- Input validation (express-validator)
- QR images stored server-side only (never public)
- Auto-cleanup of expired data (node-cron)

## 📡 API Endpoints

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | /api/auth/register | No | — |
| POST | /api/auth/login | No | — |
| POST | /api/auth/postman-login | No | — |
| POST | /api/auth/refresh | Cookie | — |
| POST | /api/auth/logout | Yes | — |
| GET | /api/auth/me | Yes | — |
| POST | /api/deliveries/generate | Yes | USER |
| GET | /api/deliveries/my-deliveries | Yes | USER |
| GET | /api/deliveries/:id/status | Yes | USER/ADMIN |
| POST | /api/deliveries/:id/confirm | Yes | USER |
| GET | /api/postman/assigned | Yes | POSTMAN |
| POST | /api/postman/scan | Yes | POSTMAN |
| POST | /api/postman/start-delivery/:id | Yes | POSTMAN |
| POST | /api/postman/update-location | Yes | POSTMAN |
| GET | /api/admin/analytics | Yes | ADMIN |
| GET | /api/admin/users | Yes | ADMIN |
| GET | /api/admin/deliveries | Yes | ADMIN |
| PATCH | /api/admin/deliveries/:id | Yes | ADMIN |
| DELETE | /api/admin/deliveries/:id | Yes | ADMIN |
| GET | /api/notifications | Yes | USER |
| PATCH | /api/notifications/:id/read | Yes | USER |
| PATCH | /api/notifications/read-all | Yes | USER |

## 🔄 Real-Time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| delivery:join | Client→Server | Join delivery tracking room |
| delivery:leave | Client→Server | Leave delivery room |
| delivery:started | Server→Client | Postman started delivery |
| postman:location | Server→Client | Live postman position |
| delivery:near | Server→Client | Postman within 500m |
| delivery:completed | Server→Client | Delivery confirmed |
| notification:new | Server→Client | New notification |
