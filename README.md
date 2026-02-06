# MealMajor (Hungry Hackers — SOEN 341 Project)

MealMajor is a full-stack web application that helps students manage day-to-day nutrition planning. The current implementation focuses on user account management: registration, login, secure session handling, and editable user profile data (including allergies and dietary preferences).

## Preserved original project information

> The following section keeps the original repository information intact and is included as-is for continuity.

### Original Project Description
MealMajor is a web application designed for students to plan meals, track groceries, and propose easy recipes.

**Sprint 1 Focus:** Implement User Account Management features, including:
1. **User registration and login** – Users can create an account with basic credentials and log in.
2. **Profile management** – Users can add personal details such as diet preferences, allergies, and other profile information.

### Original Team Members and Roles

| Team Member | Role | Sprint 1 Tasks |
|------------|------|----------------|
| Taras | Backend Developer | Initialize repository, backend logic for sign-up and login |
| Ishika | Backend + Documentation | Backend account creation (personal info), documentation of stories/backlog |
| Nigel | Backend Developer | Backend logic for editing/updating account info |
| Dylan | Frontend Developer | UI for login and account creation |
| Mouawad | Frontend + Documentation | UI for account/profile management, documentation of stories/backlog |

## 1) What the project is about

This project is a student-oriented meal-planning platform. In the current sprint scope, it provides:

- User registration with hashed password storage.
- User login with JWT-based access tokens.
- Refresh-token flow using HTTP-only cookies.
- Protected frontend routes that require authentication.
- User profile updates (date of birth, sex, height, weight, allergies, dietary preferences).

The app is organized as a monorepo with:

- `frontend/`: React + Vite client application.
- `backend/`: NestJS API with Prisma + PostgreSQL.

## 2) This project was built using the following stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS (+ DaisyUI)

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT auth (`@nestjs/jwt` + `jsonwebtoken`)
- `bcrypt` for password hashing
- `cookie-parser` for refresh token cookie handling

### Tooling

- ESLint
- Jest (backend unit/e2e test setup)
- Docker Compose (PostgreSQL service)

## 3) Requirements

Before running the project, make sure you have:

- Node.js 20+ (recommended LTS)
- npm 10+
- Docker + Docker Compose (recommended for local PostgreSQL)

You also need environment variables for the backend.

Create `backend/.env` with at least:

```env
PORT=3000
JWT_SECRET=your-super-secret-key
DATABASE_URL=postgresql://mealmajor:mealmajor@localhost:5433/mealmajor
```

> Notes
>
> - Frontend default URL expects backend on `http://localhost:3000`.
> - CORS is currently configured for frontend origin `http://localhost:5173`.

## 4) Usage (how to run it)

### Step A — Start the database

From `backend/`:

```bash
npm install
npm run build
docker compose up -d
```

Then apply Prisma migrations:

```bash
npx prisma migrate deploy
```

(If you are developing locally and want to create/apply dev migrations, use `npx prisma migrate dev` instead.)

### Step B — Run the backend API

From `backend/`:

```bash
npm install
npm run start:dev
```

Backend runs on:

- `http://localhost:3000`

### Step C — Run the frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend runs on:

- `http://localhost:5173`

## API overview (current implemented endpoints)

### Auth (`/auth`)

- `POST /auth/register` — register a user
- `POST /auth/login` — login; returns access token and sets refresh-token cookie
- `POST /auth/refresh` — refresh access token using cookie
- `POST /auth/logout` — clear refresh-token cookie

### Users (`/users`)

- `PATCH /users/:id/profile` — update profile fields

## Project structure

```text
.
├── backend/        # NestJS API + Prisma + PostgreSQL
├── frontend/       # React/Vite client
├── README.md       # Main project documentation
├── sprint-plan.md
└── Contribution-log.md
```

## Development scripts

### Frontend (`frontend/package.json`)

- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build
- `npm run lint` — run ESLint
- `npm run preview` — preview production build

### Backend (`backend/package.json`)

- `npm run start:dev` — run Nest in watch mode
- `npm run build` — compile backend
- `npm run lint` — run ESLint (auto-fix enabled)
- `npm run test` — unit tests
- `npm run test:e2e` — end-to-end tests

## Current scope and next steps

Current implementation is focused on authentication and account/profile management. Future iterations can extend MealMajor with:

- Meal planning workflows
- Grocery tracking
- Recipe recommendation features
- Expanded authorization and profile personalization

## Team

| Team Member | Role |
|------------|------|
| Taras | Backend Developer |
| Ishika | Backend + Documentation |
| Nigel | Backend Developer |
| Dylan | Frontend Developer |
| Mouawad | Frontend + Documentation |
