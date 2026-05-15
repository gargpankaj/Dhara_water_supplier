# 📘 AquaFlow Project Walkthrough

This document provides a comprehensive deep dive into the **AquaFlow** Water Supplier Management system, explaining the architecture, implementation choices, and module functionality.

---

## 🏗️ System Architecture

AquaFlow follows a modern decoupled architecture:

### 1. Backend (Python/FastAPI)
The backend is structured using a **Service-Repository Pattern** to ensure separation of concerns and testability.

- **`app/core/`**: Contains configuration (Pydantic Settings), security (JWT/Hashing), and core middleware (CORS, Rate Limiting).
- **`app/db/`**: Database session management and table initialization logic.
- **`app/models/`**: SQLAlchemy models defining the relational schema.
- **`app/schemas/`**: Pydantic models for request validation and response serialization.
- **`app/repositories/`**: Direct database interaction logic (CRUD).
- **`app/services/`**: Business logic orchestration (e.g., invoice generation, complex calculations).
- **`app/api/v1/`**: Router definitions and endpoint handlers.

### 2. Frontend (React/TypeScript/Vite)
A feature-based structure is used to keep the frontend scalable.

- **`src/features/`**: Modules like `auth`, `inventory`, and `billing` contain their own components, hooks, and types.
- **`src/hooks/`**: Custom hooks for global state and API interactions (TanStack Query).
- **`src/components/`**: Reusable UI primitives built with Tailwind CSS.
- **`src/lib/`**: Configuration for Axios, utility functions, and third-party library wrappers.

---

## 🧩 Module Breakdown

### 🔐 Authentication & Security
- **Implementation**: JWT-based stateless authentication.
- **Logic**: Users log in, receive an `access_token`, and store it in HTTP-only cookies or local storage.
- **RBAC**: Middleware checks user roles before allowing access to sensitive endpoints (e.g., only Admin can delete products).

### 📦 Inventory Management
- **Schema**: Tracks `Products`, `Categories`, and `StockLevels`.
- **Workflow**: Automated stock reduction upon invoice creation and restock alerts when levels drop below a threshold.
- **Pricing**: Supports price history, allowing the system to track how product costs change over time.

### 💳 Billing & Invoicing
- **PDF Generation**: Uses `ReportLab` to generate professional invoices on the fly.
- **Lifecycle**: Invoices move through states: `Draft` -> `Sent` -> `Paid` -> `Overdue`.
- **Payments**: Tracks partial payments and links them to specific invoices.

### 📈 CRM (Clients & Suppliers)
- **Client Profiles**: Stores contact info, delivery addresses, and outstanding balances.
- **Supplier Profiles**: Manages sourcing information and lead times.
- **Search**: A unified search engine filters through clients and suppliers using PostgreSQL text search.

---

## 🛠️ Tech Stack Decisions

| Component | Choice | Rationale |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI | High performance, automatic OpenAPI documentation, and native async support. |
| **Database** | PostgreSQL | Robust relational capabilities, ACID compliance, and excellent JSONB support. |
| **ORM** | SQLAlchemy 2.0 | Type-safe queries and powerful relational mapping. |
| **Frontend Framework** | React 19 | Modern component-based UI with excellent ecosystem support. |
| **Styling** | Tailwind CSS | Rapid UI development and highly maintainable utility classes. |
| **State Management** | React Query | Efficient server-state synchronization and caching. |

---

## 🚀 Deployment Strategy

### Backend (Render/Docker)
The backend is configured for deployment on **Render** via `render.yaml`. It uses a production-grade Gunicorn/Uvicorn worker configuration.

### Frontend (Vercel)
The frontend is optimized for **Vercel** with a custom `vercel.json` for SPA routing support.

---

## 🧪 Testing & Quality Assurance
- **Unit Testing**: Pytest is used for backend unit tests with a dedicated test database.
- **Linting**: `Ruff` ensures backend code quality, while `ESLint` and `Prettier` handle the frontend.
- **Type Checking**: Strict TypeScript and Pydantic validation ensure data integrity throughout the stack.

---

*This document is intended for developers and stakeholders to understand the internal workings of AquaFlow.*
