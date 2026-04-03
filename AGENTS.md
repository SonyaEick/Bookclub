# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## What this project is

**Eliminator** is a real-time "book eliminator" app for a book club (GNO Book Club). Users submit candidate books, then repeatedly eliminate a random book until one winner remains. Elimination events are broadcast in real time to all connected clients via WebSocket.

## Project structure

This is a monorepo with two independently-run services:

- `server/` — Python/FastAPI backend with SQLite via SQLAlchemy (raw Core, not ORM)
- `frontend/` — React 19 + Vite SPA with MUI components

## Running the project

**Backend** (from `server/`):
```
uvicorn main:app --reload
```
Runs on `http://localhost:8000`. FastAPI auto-generates docs at `/docs`.

**Frontend** (from `frontend/`):
```
npm run dev
```
Runs on `http://localhost:5173` by default. The frontend hardcodes `http://localhost:8000` and `ws://localhost:8000/ws` as the backend URLs — both services must be running simultaneously.

## Key commands

| Task | Directory | Command |
|------|-----------|---------|
| Lint frontend | `frontend/` | `npm run lint` |
| Build frontend | `frontend/` | `npm run build` |
| Preview production build | `frontend/` | `npm run preview` |

There are no backend tests or linting scripts configured.

## Architecture

### Backend (`server/`)

- `main.py` — FastAPI app entry point; mounts two routers and configures CORS (currently `allow_origins=["*"]`)
- `api/books.py` — REST endpoints: `GET /books/`, `POST /books/add/`, `POST /books/eliminate/`. The eliminate endpoint randomly picks and deletes a book, then broadcasts the result over WebSocket.
- `api/websocket.py` — WebSocket endpoint (`/ws`) and a singleton `ConnectionManager` that tracks active connections and broadcasts JSON messages to all of them. The `manager` singleton is imported directly by `books.py` to trigger broadcasts on elimination.
- `db/session.py` — SQLite database setup (`books.db` in `server/`). Uses SQLAlchemy Core (not ORM): raw `Table`/`Column` definitions and `SessionLocal`.
- `models/book.py` — Defines the `books` table schema and calls `metadata.create_all(engine)` on import, so the table is created automatically on startup.

### Frontend (`frontend/src/`)

- `App.jsx` — Router shell with an MUI `AppBar` and a hamburger `Drawer` for navigation. Two routes: `/` (HomePage) and `/add` (AddBookForm).
- `pages/HomePage.jsx` — Core game page. Manages all state (`books`, `lastEliminated`, `winner`). Opens a WebSocket connection on mount to receive `eliminated` and `winner` events, then refreshes the book list accordingly.
- `components/` — Stateless display components:
  - `BookList.jsx` — renders the current book list
  - `Controls.jsx` — "Eliminate Random Book" button; disabled when `books.length <= 1`
  - `Winner.jsx` — shown when a winner has been declared
  - `AddBookForm.jsx` — form to POST a new book title to the backend
- `styles/` — Per-component CSS files plus a global `index.css`

### Data flow

1. Books are stored in `server/books.db` (SQLite, persisted on disk).
2. A `POST /books/eliminate/` call picks a random book, deletes it, and broadcasts `{eliminated: title}` (or `{winner: title}` if only one remains) to all WebSocket clients.
3. `HomePage` receives the WebSocket message and re-fetches the book list to stay in sync.
