# LinkSnap – AI-Powered URL Shortener Dashboard

A production-ready full-stack URL shortening platform inspired by Bitly. LinkSnap enables users to create, manage, and analyze short URLs through a modern dashboard with AI-powered alias suggestions and detailed click analytics.

---

## Features

- Create and manage short URLs
- Custom aliases with duplicate validation
- Automatic Base62 short code generation
- Optional expiry dates
- Enable / Disable links
- Soft delete support
- Search and pagination
- Dashboard statistics
- Redirect tracking
- Click analytics
- Browser analytics
- Operating System analytics
- Device analytics
- Country analytics
- Referrer analytics
- Daily analytics charts
- AI-powered alias suggestions (Google Gemini)
- Input validation
- Docker support
- Unit and API testing

---

## Tech Stack

### Frontend

- React
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

## Project Structure

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
git clone <repository-url>

cd linksnap

pnpm install
```

---

## Environment Variables

```env
DATABASE_URL=

PORT=8080

GEMINI_API_KEY=

NODE_ENV=development
```

---

## Run Locally

```bash
pnpm install

pnpm run dev
```

---

## Run with Docker

```bash
docker compose up --build
```

---

## API Endpoints

| Method | Endpoint |
|----------|---------------------------|
| POST | /api/links |
| GET | /api/links |
| GET | /api/links/:id |
| PUT | /api/links/:id |
| DELETE | /api/links/:id |
| PATCH | /api/links/:id/status |
| GET | /api/analytics/:id |
| GET | /api/dashboard/summary |
| GET | /api/r/:shortCode |

---

## Testing

```bash
pnpm test
```

- 38 Automated Tests
- Unit Tests
- API Tests
- TypeScript Validation

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

## Documentation

Additional documentation is available in the `docs/` directory:

- approach.md
- architecture.md
- tradeoffs.md
- prompts.md

---

## Future Enhancements

- Redis caching
- QR code generation
- Bulk URL shortening
- Custom domains
- Team workspaces
- Analytics export
- Rate limiting
