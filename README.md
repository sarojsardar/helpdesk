# 🎫 HelpDesk

A full-stack IT helpdesk ticketing system built with **Laravel 13** (REST API) and **React 19** (SPA frontend). Designed for teams that need a clean, fast, and feature-rich support workflow — from ticket creation to SLA tracking, agent assignment, and analytics.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Backend setup](#2-backend-setup)
  - [3. Frontend setup](#3-frontend-setup)
- [Running the Project](#-running-the-project)
- [Default Credentials](#-default-credentials)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Role & Permission System](#-role--permission-system)
- [Feature Guide](#-feature-guide)
- [Scheduled Jobs](#-scheduled-jobs)
- [Screenshots](#-screenshots)

---

## ✨ Features

### Core Ticketing
- Create, view, update, and delete support tickets
- Priority levels: `low`, `medium`, `high`, `critical`
- Status workflow: `open` → `in_progress` → `resolved` → `closed`
- File attachments per ticket
- Rich reply thread with **internal notes** (staff-only, hidden from users)
- **Canned responses** — pre-written reply templates for faster support
- **Ticket merging** — merge duplicate tickets, moving all replies and attachments to the target
- **Ticket tagging** — free-form color-coded tags for flexible categorization

### SLA Management
- Automatic SLA deadlines set on ticket creation based on priority:
  | Priority | First Response | Resolution |
  |----------|---------------|------------|
  | Critical | 15 min | 1 hour |
  | High | 30 min | 4 hours |
  | Medium | 2 hours | 8 hours |
  | Low | 4 hours | 24 hours |
- Visual SLA badges: **Overdue** and **Due Soon** warnings
- SLA breach tracking per ticket

### Automation
- **Auto-assignment** — new tickets are automatically assigned to the least-loaded active agent (round-robin by open ticket count)
- **Auto-escalation** — a scheduled job runs every 30 minutes and escalates overdue unassigned tickets up one priority level (e.g. `medium` → `high`)

### Analytics & Reporting
- Admin dashboard with live stat cards: open tickets, in-progress, resolved, critical, overdue, avg resolution time, CSAT score
- **Ticket volume trend** — bar chart of tickets created over the last 14/30 days
- **CSAT trend** — line chart of average satisfaction scores over the last 6 months
- **Category heatmap** — tickets per category with SLA breach rate progress bars
- **Agent performance table** — assigned, resolved, overdue counts, avg resolution hours, avg rating per agent

### Bulk Actions
- Select multiple tickets and apply: change status, change priority, assign to agent, or close all — in one click

### Saved Filters
- Save any combination of filters (status, priority, category, tag, search) as a named view
- Instantly re-apply saved filters from the ticket list

### Notifications
- In-app notification bell with unread count
- Email notifications for: ticket created, ticket assigned, reply added, status changed
- Mark individual or all notifications as read

### User & Access Management
- Three roles: `admin`, `staff`, `user`
- Admin can manage users, toggle active/inactive, change roles and departments
- Staff see only their assigned tickets (plus unassigned)
- Users see only their own tickets

### Security
- **Two-Factor Authentication (2FA)** — email OTP-based, toggle on/off from profile
- **Login audit log** — every login attempt is recorded with IP address and user agent
- **Audit trail** — every ticket action (created, assigned, replied, escalated, merged, status changed) is logged and viewable by admins
- Laravel Sanctum token authentication
- Rate limiting: 5 req/min on auth endpoints, 60 req/min on API

### Satisfaction Ratings
- Users can rate resolved/closed tickets 1–5 stars with an optional comment
- Ratings feed into the CSAT dashboard metrics

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.3, Laravel 13, Laravel Sanctum |
| Frontend | React 19, React Router 7, Recharts |
| Database | MySQL / MariaDB (SQLite supported for local dev) |
| Auth | Laravel Sanctum (token-based) |
| Build | Vite 8 |
| HTTP Client | Axios |

---

## 📁 Project Structure

```
helpdesk/
├── helpdesk-backend/          # Laravel REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # All API controllers
│   │   ├── Models/                 # Eloquent models
│   │   ├── Services/               # Business logic (TicketService, SlaService, AutoAssignService, EscalationService)
│   │   ├── Notifications/          # Email/DB notifications
│   │   └── Policies/               # Authorization policies
│   ├── database/
│   │   ├── migrations/             # All DB migrations
│   │   └── seeders/                # Demo data seeders
│   └── routes/
│       ├── api.php                 # All API routes
│       └── console.php             # Scheduled jobs
│
└── helpdesk-frontend/         # React SPA
    └── src/
        ├── api/                    # Axios API calls
        ├── components/             # Shared UI components
        ├── context/                # Auth, Toast, Notification contexts
        └── pages/
            ├── admin/              # Dashboard, Users, Categories, Tags, Reports, AuditLog, CannedResponses
            ├── auth/               # Login, Register
            └── tickets/            # TicketList, TicketDetail, CreateTicket
```

---

## ✅ Prerequisites

Make sure you have the following installed:

- **PHP** >= 8.3 with extensions: `pdo`, `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`
- **Composer** >= 2.x
- **Node.js** >= 18.x and **npm** >= 9.x
- **MySQL** >= 8.0 or **MariaDB** >= 10.4 (or SQLite for quick local setup)

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/sarojsardar/helpdesk.git
cd helpdesk
```

---

### 2. Backend setup

```bash
cd helpdesk-backend
```

**Install PHP dependencies**
```bash
composer install
```

**Copy and configure environment**
```bash
cp .env.example .env
```

Open `.env` and update the database section:

```env
APP_NAME="HelpDesk"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=helpdesk
DB_USERNAME=root
DB_PASSWORD=your_password

MAIL_MAILER=log        # Use 'smtp' in production
MAIL_FROM_ADDRESS="noreply@helpdesk.com"
MAIL_FROM_NAME="HelpDesk"
```

> **SQLite (quick start):** Set `DB_CONNECTION=sqlite` and leave the other DB lines commented. A `database/database.sqlite` file will be created automatically.

**Generate application key**
```bash
php artisan key:generate
```

**Create the database** (MySQL only — skip for SQLite)
```bash
mysql -u root -p -e "CREATE DATABASE helpdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

**Run migrations**
```bash
php artisan migrate
```

**Seed demo data** *(optional but recommended)*
```bash
php artisan db:seed
```

**Create storage symlink** (for file attachments)
```bash
php artisan storage:link
```

---

### 3. Frontend setup

```bash
cd ../helpdesk-frontend
```

**Install dependencies**
```bash
npm install
```

**Configure API URL**

The `.env` file is already set for local development:
```env
VITE_API_URL=http://localhost:8000/api
```

Change this if your backend runs on a different port or domain.

---

## ▶️ Running the Project

Open **two terminals**:

**Terminal 1 — Backend**
```bash
cd helpdesk-backend
php artisan serve
# API available at http://localhost:8000
```

**Terminal 2 — Frontend**
```bash
cd helpdesk-frontend
npm run dev
# App available at http://localhost:5173
```

> **Queue worker** (required for email notifications):
> ```bash
> cd helpdesk-backend
> php artisan queue:listen
> ```

> **Scheduler** (required for auto-escalation):
> ```bash
> cd helpdesk-backend
> php artisan schedule:work
> ```

---

## 🔑 Default Credentials

After running `php artisan db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@helpdesk.com | password |
| Staff | staff@helpdesk.com | password |
| User | user@helpdesk.com | password |

> ⚠️ Change these passwords immediately in any non-local environment.

---

## 🌍 Environment Variables

### Backend (`helpdesk-backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_KEY` | Laravel encryption key (auto-generated) | — |
| `APP_URL` | Backend base URL | `http://localhost` |
| `DB_CONNECTION` | Database driver (`mysql` or `sqlite`) | `sqlite` |
| `DB_DATABASE` | Database name | `laravel` |
| `DB_USERNAME` | Database username | — |
| `DB_PASSWORD` | Database password | — |
| `MAIL_MAILER` | Mail driver (`log`, `smtp`, `mailgun`) | `log` |
| `MAIL_HOST` | SMTP host | `127.0.0.1` |
| `MAIL_PORT` | SMTP port | `2525` |
| `MAIL_USERNAME` | SMTP username | — |
| `MAIL_PASSWORD` | SMTP password | — |
| `MAIL_FROM_ADDRESS` | Sender email address | `hello@example.com` |
| `QUEUE_CONNECTION` | Queue driver (`database`, `redis`, `sync`) | `database` |
| `FILESYSTEM_DISK` | Storage disk for attachments | `local` |

### Frontend (`helpdesk-frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Full URL to the Laravel API | `http://localhost:8000/api` |

---

## 📡 API Overview

All endpoints are prefixed with `/api`. Authentication uses **Bearer tokens** via Laravel Sanctum.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Login and receive token |
| POST | `/api/logout` | Revoke current token |
| GET | `/api/me` | Get authenticated user |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List tickets (filtered, paginated) |
| POST | `/api/tickets` | Create a ticket |
| GET | `/api/tickets/{id}` | Get ticket detail |
| PUT | `/api/tickets/{id}` | Update ticket |
| DELETE | `/api/tickets/{id}` | Delete ticket (admin) |
| PATCH | `/api/tickets/{id}/status` | Update status |
| PATCH | `/api/tickets/{id}/assign` | Assign to agent |
| POST | `/api/tickets/{id}/merge` | Merge into another ticket |
| POST | `/api/tickets/bulk` | Bulk update tickets |
| PUT | `/api/tickets/{id}/tags` | Sync tags on ticket |

### Replies & Attachments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/{id}/replies` | Add reply or internal note |
| POST | `/api/tickets/{id}/attachments` | Upload attachment |
| DELETE | `/api/attachments/{id}` | Delete attachment |

### Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/{id}/rating` | Rate a resolved ticket (1–5) |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List all tags |
| POST | `/api/tags` | Create tag (admin) |
| PUT | `/api/tags/{id}` | Update tag (admin) |
| DELETE | `/api/tags/{id}` | Delete tag (admin) |

### Saved Filters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/saved-filters` | List user's saved filters |
| POST | `/api/saved-filters` | Save a filter preset |
| DELETE | `/api/saved-filters/{id}` | Delete a saved filter |

### Users & Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (admin) |
| GET | `/api/users/agents` | List active staff agents with open ticket count |
| PUT | `/api/users/{id}` | Update user (admin) |

### Stats & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Full dashboard stats (admin) |
| GET | `/api/audit-log` | Paginated ticket event log (admin) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/{id}/read` | Mark one as read |
| POST | `/api/notifications/read-all` | Mark all as read |

### 2FA
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/2fa/send` | Send OTP to email |
| POST | `/api/2fa/verify` | Verify OTP and toggle 2FA |

### Canned Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/canned-responses` | List canned responses |
| POST | `/api/canned-responses` | Create (admin/staff) |
| PUT | `/api/canned-responses/{id}` | Update |
| DELETE | `/api/canned-responses/{id}` | Delete |

---

## 👥 Role & Permission System

| Action | User | Staff | Admin |
|--------|:----:|:-----:|:-----:|
| Create ticket | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ |
| View assigned tickets | — | ✅ | ✅ |
| View all tickets | — | — | ✅ |
| Reply to ticket | ✅ | ✅ | ✅ |
| Post internal note | — | ✅ | ✅ |
| Change ticket status | — | ✅ | ✅ |
| Assign ticket | — | ✅ | ✅ |
| Merge tickets | — | — | ✅ |
| Bulk actions | — | — | ✅ |
| Manage users | — | — | ✅ |
| Manage categories | — | — | ✅ |
| Manage tags | — | — | ✅ |
| View reports & audit log | — | — | ✅ |
| Rate ticket | ✅ | — | — |

---

## 🗺 Feature Guide

### Creating a Ticket
1. Log in as any role
2. Click **+ New Ticket**
3. Fill in title, description, priority, and category
4. On submission, the ticket is auto-assigned to the least-loaded agent and SLA deadlines are set

### Replying & Internal Notes
- Any participant can reply to a ticket
- Staff and admins can toggle **Internal Note** — these replies are hidden from the ticket owner and highlighted in amber
- Use **Canned Responses** (⚡ button) to insert pre-written templates

### Merging Tickets
1. Open the target ticket (the one to keep)
2. Scroll to the **Merge** panel (admin only)
3. Enter the source ticket ID and click **Merge**
4. All replies and attachments from the source are moved to the target; the source is closed

### Bulk Actions
1. On the ticket list, check the boxes next to tickets (admin only)
2. A bulk action bar appears — choose an action (status, priority, assign, close)
3. Select the value and click **Apply**

### Saved Filters
1. Apply any combination of filters on the ticket list
2. Click **💾 Save Filter** and give it a name
3. The saved filter appears as a chip above the filter bar — click to instantly re-apply

### Tags
1. Admin creates tags at **Admin → Tags** with a name and color
2. On any ticket detail page, staff/admin can toggle tags on/off
3. Filter tickets by tag from the ticket list dropdown

### Two-Factor Authentication
1. Go to **My Profile**
2. Under **Two-Factor Authentication**, click **Enable 2FA**
3. A 6-digit code is sent to your email — enter it to confirm
4. Repeat to disable

### Reports
Navigate to **Admin → Reports** to view:
- **CSAT Trend** — monthly average satisfaction scores
- **Ticket Volume** — daily ticket creation over 30 days
- **Category Heatmap** — breach rates per category
- **Agent Performance** — resolution stats and ratings per agent

---

## ⏰ Scheduled Jobs

The following jobs run automatically when the Laravel scheduler is active (`php artisan schedule:work`):

| Job | Frequency | Description |
|-----|-----------|-------------|
| Ticket escalation | Every 30 min | Escalates overdue unassigned tickets up one priority level |
| Sanctum token pruning | Daily | Removes expired API tokens |

To run the scheduler in production, add this cron entry to your server:

```cron
* * * * * cd /path/to/helpdesk-backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🏗 Production Deployment Notes

1. Set `APP_ENV=production` and `APP_DEBUG=false` in `.env`
2. Set `MAIL_MAILER=smtp` and configure your SMTP credentials
3. Set `QUEUE_CONNECTION=redis` for better queue performance (requires Redis)
4. Run `php artisan config:cache && php artisan route:cache` after deployment
5. Use a process manager (Supervisor) to keep the queue worker running:
   ```ini
   [program:helpdesk-worker]
   command=php /path/to/helpdesk-backend/artisan queue:work --sleep=3 --tries=3
   autostart=true
   autorestart=true
   ```
6. Build the frontend for production:
   ```bash
   cd helpdesk-frontend
   npm run build
   # Serve the dist/ folder via Nginx or any static host
   ```
7. Point your web server (Nginx/Apache) to `helpdesk-backend/public` for the API and serve `helpdesk-frontend/dist` for the SPA

---

## 📄 License

MIT — free to use, modify, and distribute.
