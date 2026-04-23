# ROBOX Robot Fleet Management System

Full-stack robot fleet dashboard built with:

- Frontend: Next.js App Router + Tailwind CSS
- Backend: Node.js + Express
- Data persistence: JSON file (`backend/data/robots.json`)
- Authentication: API key via `x-api-key`

## Dataset Integration

The provided dataset file `industrial_robot_control_6G_network.csv` is loaded into:

- `backend/data/robots.json`

The conversion preserves the original dataset columns and adds normalized fleet fields used by the UI:

- `id`, `name`, `status`, `battery`, `location`, `model`, `lastMaintenance`

The app remains dynamic and renders all available fields from the dataset.

## Folder Structure

```text
.
├─ backend/
│  ├─ data/robots.json
│  ├─ src/
│  │  ├─ middleware/apiKey.js
│  │  ├─ routes/robots.js
│  │  ├─ config.js
│  │  ├─ dataStore.js
│  │  └─ server.js
│  └─ .env.example
├─ frontend/
│  ├─ src/app/
│  │  ├─ robots/new/page.tsx
│  │  ├─ robots/[id]/page.tsx
│  │  └─ page.tsx
│  ├─ src/components/
│  ├─ src/lib/
│  └─ .env.local.example
└─ industrial_robot_control_6G_network.csv
```

## Backend API

Base URL: `http://localhost:4000`

Required header for protected routes:

```http
x-api-key: robox-secret-key
```

Routes:

- `GET /health`
- `GET /robots?status=&location=&search=&page=&limit=`
- `GET /robots/:id`
- `POST /robots`
- `PUT /robots/:id`
- `DELETE /robots/:id`

Notes:

- `PUT` updates any robot field dynamically.
- `POST` accepts dynamic fields and auto-generates `id` if omitted.
- Returns proper status codes (`200`, `201`, `400`, `401`, `404`, `500`).

## Swagger API Documentation

Interactive OpenAPI documentation is available through Swagger UI.

- URL: `http://localhost:3000/api-docs`
- Auth type: API Key (`x-api-key` header)
- API key value for local development: `robox-secret-key`

### What You Can Do in Swagger UI

- Browse all robot endpoints grouped under the `Robots` tag
- Review request and response schemas (including the reusable `Robot` schema)
- Execute API calls directly from the browser
- View success and error response examples (`200`, `201`, `400`, `404`, `500`)

### Using Authorized Requests

1. Open `/api-docs` in your browser.
2. Click `Authorize`.
3. Enter your API key for `x-api-key`:

```text
robox-secret-key
```

4. Run any endpoint from the Swagger UI.

### Run with Swagger Enabled

Swagger is automatically enabled by the backend server.

```bash
cd backend
npm install
npm run dev
```

Then open:

```text
http://localhost:3000/api-docs
```

## Frontend Pages

- Dashboard (`/`)
  - Dynamic dataset table
  - Search + status/location filters
  - Pagination
  - Status badges (active/idle/error)
  - Battery progress indicators
- Add Robot (`/robots/new`)
  - Dynamic form based on dataset fields
- Robot Details (`/robots/[id]`)
  - View/edit all fields
  - Delete robot

## Run Locally

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:4000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 3) Environment Files

- Copy `backend/.env.example` to `backend/.env` (optional)
- Copy `frontend/.env.local.example` to `frontend/.env.local` (optional)

Defaults are already configured for local development.
