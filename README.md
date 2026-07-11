# LinkSnap – AI-Powered URL Shortener Dashboard

A production-ready full-stack URL shortening platform inspired by Bitly, featuring AI-powered alias suggestions, analytics dashboard, click tracking, Docker support, and comprehensive REST APIs.

---

## Project Overview

LinkSnap is an AI-powered URL shortening platform that enables users to create, manage, and analyze shortened URLs through a modern dashboard.

Users can:

- Create short URLs
- Generate unique short codes
- Use custom aliases
- Set expiry dates
- Enable or disable links
- Soft delete links
- Search and paginate links
- Track click analytics
- View dashboard statistics
- Receive AI-generated alias suggestions using Google Gemini

---

## Features

- ✅ Create Short URL
- ✅ Update Short URL
- ✅ Delete (Soft Delete)
- ✅ Custom Alias
- ✅ Automatic Base62 Short Code Generation
- ✅ Expiry Date Support
- ✅ Enable / Disable Links
- ✅ Search Links
- ✅ Pagination
- ✅ Dashboard Statistics
- ✅ Redirect Engine
- ✅ Click Tracking
- ✅ Browser Analytics
- ✅ Operating System Analytics
- ✅ Device Analytics
- ✅ Country Analytics
- ✅ Referrer Analytics
- ✅ Daily Click Charts
- ✅ AI Alias Suggestions (Google Gemini)
- ✅ Input Validation
- ✅ RESTful APIs
- ✅ Docker Support
- ✅ Unit & API Tests

---

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Recharts

### Backend

- Node.js
- Express
- TypeScript

### Database

- PostgreSQL
- Drizzle ORM

### AI

- Google Gemini API

### Testing

- Vitest
- Supertest

### Deployment

- Docker
- Docker Compose
- Nginx

---

## Architecture

Frontend (React + Vite)

↓

REST APIs

↓

Backend (Express)

↓

Drizzle ORM

↓

PostgreSQL

↓

Google Gemini API (Alias Suggestions)

---

## Folder Structure

```
artifacts/
 ├── api-server/
 ├── linksnap/

docs/
 ├── approach.md
 ├── architecture.md
 ├── tradeoffs.md
 ├── prompts.md

lib/
docker-compose.yml
README.md
.env.example
```

---

## Installation

```bash
git clone https://github.com/GRagaPreethi/URL-Shorter_2913.git

cd URL-Shorter_2913

pnpm install
```

---

## Environment Variables

Create a `.env` file.

```env
DATABASE_URL=

PORT=8080

GEMINI_API_KEY=

LOG_LEVEL=info

NODE_ENV=development
```

---

## Running Locally

```bash
pnpm install

pnpm run dev
```

---

## Running with Docker

```bash
docker compose up --build
```

---

## API Endpoints

### Links

| Method | Endpoint |
|----------|-----------------------------|
| POST | /api/links |
| GET | /api/links |
| GET | /api/links/:id |
| PUT | /api/links/:id |
| DELETE | /api/links/:id |
| PATCH | /api/links/:id/status |

### Analytics

| Method | Endpoint |
|----------|-----------------------|
| GET | /api/analytics/:id |

### Dashboard

| Method | Endpoint |
|----------|-------------------------|
| GET | /api/dashboard/summary |

### Redirect

| Method | Endpoint |
|----------|--------------------|
| GET | /api/r/:shortCode |

---

## Testing

Run all tests

```bash
pnpm test
```

Current Status

- ✅ 38 Tests Passing
- ✅ Unit Tests
- ✅ API Tests
- ✅ Zero TypeScript Errors

---

## Assignment Requirements Coverage

| Requirement | Status |
|-------------|--------|
| Create Short URL | ✅ |
| Update Short URL | ✅ |
| Delete (Soft Delete) | ✅ |
| Custom Alias | ✅ |
| Expiry Date | ✅ |
| Search | ✅ |
| Pagination | ✅ |
| Enable / Disable | ✅ |
| Redirect | ✅ |
| Click Analytics | ✅ |
| Browser | ✅ |
| Operating System | ✅ |
| Device | ✅ |
| Country | ✅ |
| Referrer | ✅ |
| Dashboard Statistics | ✅ |
| Analytics Charts | ✅ |
| AI Alias Suggestions | ✅ |
| Input Validation | ✅ |

---

## Future Improvements

- Redis caching
- QR Code generation
- Bulk URL shortening
- User Authentication
- Team Workspaces
- Custom Domains
- CSV Analytics Export
- Rate Limiting
- URL Preview Support

---

## Documentation

Additional documentation is available inside the `docs/` directory.

- approach.md
- architecture.md
- tradeoffs.md
- prompts.md

---

## Author

**Raga Preethi**

AI-Powered URL Shortener Dashboard

Company Hiring Assessment

GitHub Repository:

https://github.com/GRagaPreethi/URL-Shorter_2913
