# MealMajor

Hungry Hackers — SOEN 341 (Winter 2026)

MealMajor is a full-stack web application that helps students manage day-to-day nutrition planning with weekly meal calendars, recipe management, and smart grocery integration.

---

## 📌 Project Overview

MealMajor is a student-oriented nutrition platform designed to support:

* Secure user accounts with JWT authentication
* Personalized dietary preferences
* Recipe creation, search, and filtering
* Weekly meal planning with drag-and-drop calendar
* Smart fridge inventory management
* Metro grocery cart integration via Chrome extension

The project progressed through four sprints, evolving from basic authentication to a complete meal planning ecosystem with grocery sync capabilities.

---

## 👥 Team — Hungry Hackers

| Name    | Student ID | GitHub ID        | Role                                      |
|---------|-----------|------------------|-------------------------------------------|
| Taras   | 40327546  | tarasbaranovskyy | Full-Stack & Metro Chrome Extension       |
| Ishika  | 40188558  | ishikapatel1     | Full-Stack (Search, Filtering, Testing)   |
| Nigel   | 40281248  | nigelkyle21      | Full-Stack (Recipe & Meal Plan CRUDs)     |
| Dylan   | 40263297  | dylanp3802       | Full-Stack (Recipe UI, Calendar Pages)    |
| Mouawad | 40201957  | mjbch24          | Documentation, Planning & Testing         |

---

##  Features

### 🔐 User Authentication (Sprint 1)
* Secure registration and login
* JWT token-based authentication
* Password hashing with bcrypt
* Profile management

### 🍳 Recipe Management (Sprint 2)
* Create, edit, and delete recipes
* Detailed recipe attributes (ingredients, steps, time, difficulty, cost, dietary tags, servings)
* Search recipes by title
* Filter by time, difficulty, cost, dietary tags, and servings

### 📅 Weekly Meal Planning (Sprint 3)
* Interactive weekly calendar view
* Drag-and-drop recipe assignment to meal slots
* Add meals via search modal
* Delete meals with one click
* Navigate between weeks
* Automatic fridge inventory updates

### 🛒 Smart Fridge & Grocery Integration (Sprint 3)
* Fridge inventory tracking
* Bi-directional sync: meal plans ↔ fridge inventory
* Metro Chrome extension for grocery cart scraping
* Automatic ingredient deduction when meals are planned
* Ingredient restoration when meals are deleted

---
## 🧱 Project Structure

```
.
├── backend/
│   ├── src/              # Application source code
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # User management
│   │   ├── recipes/      # Recipe CRUD operations
│   │   ├── meal-plans/   # Weekly meal planning
│   │   ├── inventory/    # Fridge inventory management
│   │   ├── metro/        # Metro grocery sync integration
│   │   ├── ai/           # AI features
│   │   └── prisma/       # Database client service
│   ├── tests/            # Unit tests (mirrors src/ structure)
│   ├── e2e/              # End-to-end integration tests
│   └── prisma/           # Database schema and migrations
├── frontend/
│   ├── src/
│   │   ├── pages/        # Application pages
│   │   ├── components/   # Reusable UI components
│   │   ├── utils/        # Utility functions (API client, auth, fridge)
│   │   ├── contexts/     # React contexts (AuthContext)
│   │   └── assets/       # Images and static assets
│   └── public/           # Public static files
├── extension/            # Chrome extension for Metro grocery sync
├── documentation/        # Sprint plans, meeting minutes, contribution logs
└── README.md
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
* DOM scraping for Metro grocery platform
* Fetch API for backend integration

### Testing & Quality
* Jest (unit & e2e testing)
* ESLint (static analysis)
* GitHub Actions (CI/CD)

### DevOps
* Docker & Docker Compose (PostgreSQL)
* Prisma migrations

---

## ⚙️ Requirements

Before running the project, ensure you have:

* Node.js v20+
* npm v10+
* Docker & Docker Compose
* Google Chrome (for extension testing)

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
JWT_SECRET=your-super-secret-key
DATABASE_URL=postgresql://mealmajor:mealmajor@localhost:5433/mealmajor
```

---

## ▶️ Running the Project

### Step 1 — Start Database

From `backend/`:

```bash
npm install
docker compose up -d
npx prisma migrate deploy
```

For development migrations:

```bash
npx prisma migrate dev
```

---

### Step 2 — Run Backend API

```bash
cd backend
npm run start:dev
```

Backend runs at: `http://localhost:3000`

---

### Step 3 — Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

### Step 4 — Install Chrome Extension (Optional)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Navigate to Metro grocery site and add items to cart
6. Click extension icon to sync with MealMajor

---

## 🔌 API Endpoints

### Authentication (/auth)
| Method | Endpoint         | Description           |
|--------|------------------|-----------------------|
| POST   | /auth/register   | Register new user     |
| POST   | /auth/login      | Login user            |
| POST   | /auth/refresh    | Refresh access token  |
| POST   | /auth/logout     | Logout user           |

### Users (/users)
| Method | Endpoint      | Description          |
|--------|---------------|----------------------|
| GET    | /users/me     | Get current user     |
| PATCH  | /users/me     | Update user profile  |

### Recipes (/recipes)
| Method | Endpoint         | Description                              |
|--------|------------------|------------------------------------------|
| POST   | /recipes         | Create a new recipe                      |
| GET    | /recipes         | Get all recipes (supports search/filter) |
| GET    | /recipes/:id     | Get single recipe                        |
| PATCH  | /recipes/:id     | Update recipe                            |
| DELETE | /recipes/:id     | Delete recipe                            |

### Meal Plans (/meal-plans)
| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | /meal-plans           | Add recipe to meal plan        |
| GET    | /meal-plans           | Get meal plans for date range  |
| DELETE | /meal-plans/:id       | Remove meal from plan          |

### Fridge Inventory (/metro/fridge)
| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | /metro/fridge    | Get fridge inventory     |
| POST   | /metro/sync      | Sync Metro cart to fridge|
| PATCH  | /metro/fridge    | Update inventory item    |
| DELETE | /metro/fridge/:id| Remove inventory item    |

---

## 📜 Development Scripts

### Frontend
```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

### Backend
```bash
npm run start:dev  # Start in watch mode
npm run build      # Build for production
npm run lint       # Run ESLint
npm run test       # Run unit tests
npm run test:e2e   # Run e2e tests
npm run test:cov   # Run tests with coverage
```

---

## 🧪 Testing

### Unit Tests
All unit tests are located in `backend/tests/` mirroring the `src/` structure:

```bash
cd backend
npm test
```

**Test Coverage:**
* Authentication service (8 tests)
* User service (6 tests)
* Recipe service (6 tests)
* Meal plans service (10 tests)
* Inventory utilities (6 tests)
* Metro integration (5 tests)

**Total: 41 unit tests** ✅


### CI/CD
All tests run automatically on GitHub Actions for every push and pull request.


---

## 📄 License

This project was developed as part of SOEN 341 - Software Process at Concordia University.

---
