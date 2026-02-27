# MealMajor

Hungry Hackers — SOEN 341 (Winter 2026)

MealMajor is a full-stack web application that helps students manage day to day nutrition planning.

In **Sprint 2**, the project expands beyond authentication to introduce **Recipe Management and Discovery**, enabling users to create, search, and filter recipes within the platform.

---

## 📌 Project Overview

MealMajor is a student-oriented nutrition platform designed to support:

* Secure user accounts
* Personalized dietary preferences
* Recipe creation and management
* Advanced recipe filtering

Sprint 2 builds directly on the secure authentication foundation from Sprint 1 and introduces core functionality required for meal planning workflows in future sprints.

---

## 🎯 Sprint 2 Scope

The following features are fully implemented in this sprint:

### 🍳 Recipe Management

* Create recipes
* Edit existing recipes
* Delete recipes
* Store detailed recipe attributes:

  * Ingredients
  * Preparation steps
  * Preparation time
  * Cook time
  * Difficulty
  * Cost
  * Dietary tags
  * Servings

### 🔎 Search & Filtering

* Search recipes by title
* Filter recipes by:

  * Time
  * Difficulty
  * Cost
  * Dietary tag
  * Servings

### 🔗 Chrome Extension Integration (Special Feature)

* Chrome extension for Metro grocery platform
* Scraping algorithm to extract cart item data
* POST request to send scraped data to MealMajor backend

This extension lays groundwork for future grocery tracking features.

---

## 🧱 Architecture

The project remains structured as a monorepo:

```
.
├── backend/        # NestJS API + Prisma + PostgreSQL
├── frontend/       # React + Vite client
├── chrome-extension/  # Metro scraping extension
├── README.md
├── sprint-plan.md
└── Contribution-log.md
```

---

## 🛠️ Technology Stack

### Frontend

* React 19
* TypeScript
* Vite
* React Router
* Tailwind CSS
* DaisyUI

### Backend

* Node.js
* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT Authentication
* bcrypt
* cookie-parser

### Extension

* Chrome Extension API
* DOM scraping logic
* Fetch API for POST integration

### Tooling

* ESLint
* Jest (unit & e2e testing)
* Docker Compose (PostgreSQL)

---

## ⚙️ Requirements

Before running the project, ensure you have:

* Node.js v20+
* npm v10+
* Docker & Docker Compose
* Google Chrome (for extension testing)

Environment variables remain the same as Sprint 1:

```
PORT=3000
JWT_SECRET=your-super-secret-key
DATABASE_URL=postgresql://mealmajor:mealmajor@localhost:5433/mealmajor
```

---

## ▶️ Running the Project

### Step 1 — Start Database

From backend/:

```
npm install
docker compose up -d
npx prisma migrate deploy
```

For development migrations:

```
npx prisma migrate dev
```

---

### Step 2 — Run Backend API

```
cd backend
npm run start:dev
```

Backend runs at:

```
http://localhost:3000
```

---

### Step 3 — Run Frontend

```
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 🔌 API Endpoints (Sprint 2 Additions)

### Recipes (/recipes)

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| POST   | /recipes     | Create a new recipe |
| GET    | /recipes     | Get all recipes     |
| GET    | /recipes/:id | Get single recipe   |
| PATCH  | /recipes/:id | Update recipe       |
| DELETE | /recipes/:id | Delete recipe       |

### Filtering & Search

| Method | Endpoint         | Description                                   |
| ------ | ---------------- | --------------------------------------------- |
| GET    | /recipes?search= | Search by title                               |
| GET    | /recipes?filter= | Filter by difficulty, time, cost, dietary tag |

---

## 📜 Development Scripts

### Frontend

```
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend

```
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

---

## 🚀 Improvements from Sprint 1

* Extended Prisma schema to include Recipe model
* Implemented CRUD operations with validation
* Added frontend filtering logic and UI controls
* Integrated extension-to-backend communication
* Expanded unit and integration testing

---

## 👥 Team — Hungry Hackers

| Name    | Role                          |
| ------- | ----------------------------- |
| Taras   | Backend & Chrome Extension    |
| Ishika  | Frontend (Search & Filtering) |
| Nigel   | Backend (Recipe API)          |
| Dylan   | Frontend (Recipe UI & Pages)  |
| Mouawad | Documentation & Testing       |

