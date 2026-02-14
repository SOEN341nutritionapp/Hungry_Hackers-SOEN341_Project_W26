# 🍽️ MealMajor  
**Hungry Hackers — SOEN 341 (Winter 2026)**

MealMajor is a full-stack web application that helps students manage day-to-day nutrition planning.  
In **Sprint 1**, the project focuses on **secure user account management**, laying the foundation for future meal-planning features.

---

## 📌 Project Overview

MealMajor is a student-oriented platform designed to eventually support:

- Meal planning  
- Grocery tracking  
- Simple recipe discovery  

The **current implementation** focuses strictly on **authentication and profile management**, ensuring a secure and extensible base for later sprints.

---

## 🎯 Sprint 1 Scope

The following features are fully implemented in this sprint:

- User registration with secure password hashing  
- User login with JWT-based authentication  
- Refresh-token flow using HTTP-only cookies  
- Protected frontend routes  
- Editable user profile data:
  - Date of birth
  - Sex
  - Height & weight
  - Allergies
  - Dietary preferences

---

## 🧱 Architecture

This project is structured as a **monorepo**:

```
.
├── backend/        # NestJS API + Prisma + PostgreSQL
├── frontend/       # React + Vite client
├── README.md       # Project documentation
├── sprint-plan.md
└── Contribution-log.md
```

---

## 🛠️ Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- DaisyUI

### Backend
- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication (`@nestjs/jwt`, `jsonwebtoken`)
- `bcrypt` for password hashing
- `cookie-parser` for refresh token handling

### Tooling
- ESLint
- Jest (unit & e2e testing)
- Docker Compose (PostgreSQL)

---

## ⚙️ Requirements

Before running the project, ensure you have:

- **Node.js** v20+ (LTS recommended)
- **npm** v10+
- **Docker & Docker Compose**

### Environment Variables

Create a `.env` file in `backend/`:

```
PORT=3000
JWT_SECRET=your-super-secret-key
DATABASE_URL=postgresql://mealmajor:mealmajor@localhost:5433/mealmajor
```

**Notes:**
- Frontend expects backend at `http://localhost:3000`
- CORS is configured for `http://localhost:5173`

---

## ▶️ Running the Project

### Step 1 — Start the Database

From the `backend/` directory:

```
npm install
npm run build
docker compose up -d
```

Apply Prisma migrations:

```
npx prisma migrate deploy
```

For development migrations:

```
npx prisma migrate dev
```

---

### Step 2 — Run the Backend API

```
cd backend
npm install
npm run start:dev
```

Backend runs at:

- `http://localhost:3000`

---

### Step 3 — Run the Frontend

```
cd frontend
npm install
npm run dev
```

Frontend runs at:

- `http://localhost:5173`

---

## 🔌 API Endpoints (Sprint 1)

### Authentication (`/auth`)

| Method | Endpoint | Description |
|------|---------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive access token |
| POST | `/auth/refresh` | Refresh access token via cookie |
| POST | `/auth/logout` | Clear refresh-token cookie |

### Users (`/users`)

| Method | Endpoint | Description |
|------|---------|-------------|
| PATCH | `/users/:id/profile` | Update user profile information |

---

## 📜 Development Scripts

### Frontend

```
npm run dev        # Start development server
npm run build      # Type-check & build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Backend

```
npm run start:dev  # Start NestJS in watch mode
npm run build      # Compile backend
npm run lint       # Run ESLint
npm run test       # Unit tests
npm run test:e2e   # End-to-end tests
```

---

## 🔮 Next Steps

Planned future iterations include:

- Meal planning workflows
- Grocery list tracking
- Recipe recommendations
- Expanded authorization and personalization features

---

## 👥 Team — Hungry Hackers

| Name | Role |
|------|-----|
| Taras | Backend Developer |
| Ishika | Backend & Documentation |
| Nigel | Backend Developer |
| Dylan | Frontend Developer |
| Mouawad | Frontend & Documentation |

---
