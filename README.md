# Insighta Labs+: Profile Intelligence Backend

This is the core API for **Insighta Labs+**, a secure, multi-interface platform for managing profile data. It serves as the single source of truth for both the Web Portal and the CLI tool, enforcing strict authentication, role-based access control, and API versioning.

## 🏗️ System Architecture

- **Runtime**: Node.js with Express.js.
- **Database**: Supabase (PostgreSQL) for structured profile and user data.
- **Authentication**: GitHub OAuth 2.0 with PKCE (Proof Key for Code Exchange).
- **Session Management**: Secure HttpOnly cookies for Web and JWT-based refresh cycles for CLI.

## 🚀 Key Features

### 1. Natural Language Search

The backend features a robust regex-based parser (`parser.js`) that translates human-readable strings into database queries.

- **Capabilities**: Filters by gender, age groups, specific age ranges ("over 30", "under 25"), and 45+ supported countries.

### 2. Role-Based Access Control (RBAC)

User permissions are strictly enforced via centralized middleware.

- **Analyst**: Read-only access to profiles and search.
- **Admin**: Full CRUD permissions, including profile creation (`POST /api/v1/profiles`) and high-volume CSV exports.
- **Account Safety**: Suspended users (`is_active: false`) are automatically denied access across all interfaces.

### 3. API Standards & Security

- **Versioning**: All profile endpoints require `X-API-Version: 1`.
- **Rate Limiting**:
  - Auth routes: 10 requests/minute.
  - Standard routes: 60 requests/minute per user.
- **Logging**: Every request is logged with method, endpoint, status code, and response time for audit trails.

## 🛠️ API Reference

### Authentication

| Method | Endpoint                | Description                                         |
| :----- | :---------------------- | :-------------------------------------------------- |
| `GET`  | `/auth/github`          | Initiates GitHub OAuth flow                         |
| `GET`  | `/auth/github/callback` | Handles callback and issues secure tokens           |
| `POST` | `/auth/refresh`         | Rotates expired access tokens using a refresh token |
| `POST` | `/auth/logout`          | Invalidates current session and clears cookies      |

### Profiles (Requires `X-API-Version: 1`)

| Method | Endpoint                             | Description                                                    |
| :----- | :----------------------------------- | :------------------------------------------------------------- |
| `GET`  | `/api/v1/profiles`                   | Paginated list of profiles                                     |
| `GET`  | `/api/v1/profiles/search?q=`         | Natural language profile search                                |
| `POST` | `/api/v1/profiles`                   | **Admin Only:** Create profile from external intelligence APIs |
| `GET`  | `/api/v1/profiles/export?format=csv` | **Admin Only:** Generate and download CSV report               |

## 📦 Token Lifecycle

| Token Type        | Expiry    | Storage Location                     |
| :---------------- | :-------- | :----------------------------------- |
| **Access Token**  | 3 Minutes | HttpOnly Cookie (Web) / Memory (CLI) |
| **Refresh Token** | 5 Minutes | Database (Revocable)                 |

_Each refresh operation invalidates the previous refresh token to prevent replay attacks._

## 🛠️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mariioox/hng-stage-3-backend.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file with:
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY`
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
   - `JWT_SECRET`
4. **Run in development**:
   ```bash
   npm run dev
   ```
