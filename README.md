# The Wyldrift

Secure Node.js + Express + MongoDB + Cloudinary admin product system.

## Repo layout

- **`backend/`** — Express API (`server.js`), routes, models, config, seeds, and **`backend/.env`** (secrets live here only).
- **`frontend/`** — Vite + React storefront and admin UI.
- **`backend/legacy-server/`** — older experimental server (JSON file + Cloudinary); not used by `npm start`.

There is **no** `package.json` at the repo root — install and run commands are always from **`backend/`** or **`frontend/`**.

## Setup

### 1. Install dependencies

From the repo root folder:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment file

Copy the example and edit **`backend/.env`** (Mongo, Cloudinary, JWT, admin passkey):

```bash
cp backend/.env.example backend/.env
```

### 3. Seed admin (once)

```bash
cd backend
npm run seed:admin
```

### 4. Run the **backend** (API only — no React UI on this port)

```bash
cd backend
npm run dev
```

Uses **nodemon** and **`API_ONLY=1`**: **does not** serve `frontend/dist`. Opening **http://localhost:8080/** shows a small JSON welcome; all real traffic is under **`/api/*`**.

Check the API:

```bash
curl -s http://localhost:8080/api
```

**Production-style (built React + API on the same port, no auto-restart):**

```bash
cd backend
npm start
```

`npm start` serves the built UI from **`frontend/dist`** (run `cd ../frontend && npm run build` first if needed).

### 5. Run **backend + frontend** together (dev)

Install both packages first (step 1). Then:

```bash
cd backend
npm run dev:all
```

That starts the API and Vite; open the **Vite** URL from the terminal (often **http://localhost:5173**). `/api` is proxied to port **8080**.

### 6. Production-style (single port: UI + API)

Build the React app, then start Node:

```bash
cd frontend && npm run build
cd ../backend && npm start
```

Open **http://localhost:8080** (built UI + `/api` on the same origin).

## API

Auth:

- `POST /api/admin/login`

Products:

- `POST /api/products`
- `GET /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

Admin product create/update/delete routes require:

```http
Authorization: Bearer <jwt>
```

Product image uploads use `multipart/form-data` with the field name `images`.

## GitHub

Git is initialized locally. To connect this folder to a GitHub repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/thewyldrift.git
git branch -M main
git add .
git commit -m "Initial secure product admin system"
git push -u origin main
```

## MongoDB

This app expects MongoDB at **`MONGODB_URI`** in **`backend/.env`**.

Options:

- Local MongoDB Community Server: install it, start the service, then use `mongodb://127.0.0.1:27017/thewyldrift`.
- MongoDB Atlas: create a free cluster and put your Atlas connection string in **`backend/.env`**.

## Notes

- **`backend/.env`** is ignored by Git.
- The admin passkey is read from `.env` only during `npm run seed:admin`, hashed with bcrypt, and saved in MongoDB.
- Cloudinary `publicId` values are saved with image URLs so replaced/deleted product images can be removed from Cloudinary.
