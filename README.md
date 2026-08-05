# 🎫 HelpDesk

> A complete, production-ready IT support ticketing system — built for teams of any size.

HelpDesk is a **full-stack web application** that lets your team manage customer support requests (called "tickets") from start to finish. Think of it like a professional version of an email inbox — but specifically designed for support teams, with automation, reporting, and a self-service portal built in.

**Who is this for?**
- 🏢 **Companies** that need to manage IT support or customer service requests
- 👨‍💼 **Admins** who want full visibility, reports, and control over the support workflow
- 🧑‍💻 **Support agents (Staff)** who need a clean workspace to handle tickets efficiently
- 👤 **End users (Customers)** who want to submit issues and track their progress

**Built with:**
- **Backend:** PHP 8.3 + Laravel 13 (REST API)
- **Frontend:** React 19 (Single Page Application)
- **Database:** MySQL, MariaDB, or SQLite

---

## 📋 Table of Contents

- [What Can HelpDesk Do?](#-what-can-helpdesk-do)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites — What You Need Before Installing](#-prerequisites--what-you-need-before-installing)
- [Installation Guide](#-installation-guide)
  - [Step 1 — Get the code](#step-1--get-the-code)
  - [Step 2 — Set up the Backend](#step-2--set-up-the-backend)
  - [Step 3 — Set up the Frontend](#step-3--set-up-the-frontend)
- [Running the Project](#-running-the-project)
- [Default Login Credentials](#-default-login-credentials)
- [Environment Variables Explained](#-environment-variables-explained)
- [All Features Explained in Detail](#-all-features-explained-in-detail)
- [Role & Permission System](#-role--permission-system)
- [API Reference](#-api-reference)
- [Scheduled Background Jobs](#-scheduled-background-jobs)
- [Production Deployment](#-production-deployment-notes)
- [License](#-license)

---

## 🚀 What Can HelpDesk Do?

Here is a plain-English overview of every major capability:

| Area | What it does |
|------|--------------|
| 🎫 Ticketing | Create, track, reply to, and close support requests |
| ⏰ SLA Management | Automatically set deadlines and warn when tickets are overdue |
| 🤖 Automation | Auto-assign tickets to agents and auto-escalate ignored tickets |
| 📚 Knowledge Base | A self-service library of help articles for users |
| 🏢 Departments | Organise your team into departments |
| 📣 Announcements | Broadcast messages to all users (e.g. maintenance notices) |
| 📊 Analytics | Charts and tables showing ticket volume, agent performance, CSAT |
| 👨💻 Staff Tools | Personal queue, availability toggle, batch reply |
| 👤 Customer Portal | A friendly interface for end-users to submit and track tickets |
| 🔔 Notifications | In-app bell + email alerts for every important event |
| 🔒 Security | 2FA login, login history, full audit trail |
| ⭐ Ratings & Surveys | Users rate resolved tickets and fill in satisfaction surveys |

---

## 🛠 Tech Stack

| Layer | Technology | Why it's used |
|-------|-----------|---------------|
| Backend API | PHP 8.3 + Laravel 13 | Handles all business logic, database, and email |
| Frontend UI | React 19 + React Router 7 | Fast, interactive single-page application |
| Charts | Recharts | Dashboard graphs and trend charts |
| Database | MySQL / MariaDB / SQLite | Stores all tickets, users, and settings |
| Authentication | Laravel Sanctum | Secure token-based login for the SPA |
| Build Tool | Vite 8 | Fast frontend bundler and dev server |
| HTTP Client | Axios | Makes API calls from React to Laravel |
| Email | Laravel Mail | Sends notification emails (log locally, SMTP in production) |
| Queue | Laravel Queue | Processes emails in the background so the UI stays fast |
| Scheduler | Laravel Scheduler | Runs automatic jobs (escalation, token cleanup) on a timer |

---

## 📁 Project Structure

The project is split into two folders inside the main `helpdesk/` directory:

```
helpdesk/
├── helpdesk-backend/      ← Laravel REST API (the "brain")
└── helpdesk-frontend/     ← React SPA (the "face")
```

**Backend layout:**
```
helpdesk-backend/
├── app/
│   ├── Http/Controllers/Api/   ← One controller per feature (tickets, users, KB, etc.)
│   ├── Models/                 ← Database table representations
│   ├── Services/               ← Core business logic
│   │   ├── TicketService.php       (create, update, merge, snooze)
│   │   ├── SlaService.php          (calculate SLA deadlines)
│   │   ├── AutoAssignService.php   (round-robin agent assignment)
│   │   ├── EscalationService.php   (process escalation rules)
│   │   └── BusinessCalendarService.php (business hours + holidays)
│   ├── Notifications/          ← Email + in-app notification templates
│   └── Policies/               ← Who is allowed to do what
├── database/
│   ├── migrations/             ← 30+ files that create the database tables
│   └── seeders/                ← Demo data: users, tickets, categories
└── routes/
    ├── api.php                 ← All API endpoint definitions
    └── console.php             ← Scheduled job definitions
```

**Frontend layout:**
```
helpdesk-frontend/src/
├── api/              ← Functions that call the backend API
├── components/       ← Reusable UI pieces (Navbar, Notifications, etc.)
├── context/          ← Global state (logged-in user, toasts, notifications)
└── pages/
    ├── admin/          ← Admin-only pages (dashboard, users, settings)
    ├── auth/           ← Login and Register pages
    ├── tickets/        ← Ticket list, ticket detail, create ticket
    ├── staff/          ← Staff dashboard and quick actions
    ├── customer/       ← Customer portal (my tickets, wizard, survey)
    └── kb/             ← Knowledge base browse and manage
```

---

## ✅ Prerequisites — What You Need Before Installing

Before you can run HelpDesk, you need to install a few tools on your computer. Don't worry — each one has a simple installer.

### 1. PHP 8.3 or higher
PHP is the programming language the backend runs on.
- **macOS:** `brew install php` (requires [Homebrew](https://brew.sh))
- **Windows:** Download from [windows.php.net](https://windows.php.net/download/) or use [XAMPP](https://www.apachefriends.org/)
- **Ubuntu/Debian:** `sudo apt install php8.3 php8.3-mbstring php8.3-xml php8.3-sqlite3 php8.3-mysql php8.3-curl`

Required PHP extensions: `pdo`, `pdo_mysql`, `pdo_sqlite`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`

### 2. Composer
Composer is PHP's package manager (like npm but for PHP).
- Download the installer from [getcomposer.org](https://getcomposer.org/download/)
- **macOS/Linux:** `brew install composer` or follow the site instructions
- **Windows:** Download and run `Composer-Setup.exe`

### 3. Node.js 18+ and npm
Node.js runs the frontend build tools.
- Download from [nodejs.org](https://nodejs.org/) — choose the **LTS** version
- npm is included automatically with Node.js

### 4. A Database
You need one of these (pick the easiest for your setup):
- **SQLite** — No installation needed. Just a single file. Perfect for local development.
- **MySQL 8.0+** — Download from [mysql.com](https://dev.mysql.com/downloads/) or use `brew install mysql`
- **MariaDB 10.4+** — Download from [mariadb.org](https://mariadb.org/download/)

> 💡 **Recommendation for beginners:** Use SQLite. It requires zero setup and works out of the box.

### Verify everything is installed

Run these commands in your terminal. Each should print a version number:

```bash
php -v
# Expected: PHP 8.3.x ...

composer -V
# Expected: Composer version 2.x.x ...

node -v
# Expected: v18.x.x or higher

npm -v
# Expected: 9.x.x or higher
```

If any command says "not found", go back and install that tool first.

---

## 🚀 Installation Guide

Follow these steps in order. The whole process takes about 10–15 minutes.

---

### Step 1 — Get the code

Open your terminal and run:

```bash
git clone https://github.com/sarojsardar/helpdesk.git
cd helpdesk
```

This downloads the project into a folder called `helpdesk` and moves you into it.

> Don't have Git? Download it from [git-scm.com](https://git-scm.com/downloads) or download the ZIP directly from GitHub.

---

### Step 2 — Set up the Backend

The backend is the Laravel API that powers everything behind the scenes.

```bash
cd helpdesk-backend
```

#### 2a. Install PHP packages

```bash
composer install
```

This downloads all the PHP libraries the project needs. It may take 1–2 minutes.

#### 2b. Create your environment file

```bash
cp .env.example .env
```

This creates a `.env` file — a private configuration file that holds your database credentials, mail settings, etc. **Never commit this file to Git.**

#### 2c. Configure the `.env` file

Open `.env` in any text editor and update the following sections:

**App settings:**
```env
APP_NAME="HelpDesk"
APP_URL=http://localhost:8000
APP_ENV=local
APP_DEBUG=true
```

**Database — choose ONE option:**

```env
# OPTION A: SQLite (recommended for beginners — no database server needed)
DB_CONNECTION=sqlite
# Leave all other DB_ lines commented out or remove them
# A file at database/database.sqlite will be created automatically
```

```env
# OPTION B: MySQL (if you have MySQL installed)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=helpdesk
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

**Mail — for local development, use `log` (emails are saved to a log file instead of actually sent):**
```env
MAIL_MAILER=log
MAIL_FROM_ADDRESS="noreply@helpdesk.com"
MAIL_FROM_NAME="HelpDesk"
```

**Queue — use `database` for local development (no Redis needed):**
```env
QUEUE_CONNECTION=database
```

#### 2d. Generate the application key

```bash
php artisan key:generate
```

This creates a unique secret key used to encrypt data. You only need to run this once.

#### 2e. Create the database (MySQL only — skip if using SQLite)

```bash
mysql -u root -p -e "CREATE DATABASE helpdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Enter your MySQL password when prompted.

#### 2f. Run database migrations

```bash
php artisan migrate
```

This creates all the database tables (tickets, users, categories, etc.). You should see a list of migrations being applied.

> If using SQLite and the file doesn't exist yet, run: `touch database/database.sqlite` first.

#### 2g. Seed demo data (highly recommended)

```bash
php artisan db:seed
```

This creates:
- 3 demo user accounts (admin, staff, user)
- Sample ticket categories
- Sample tickets with replies

Without this step, the app will be empty and you'll need to create everything manually.

#### 2h. Create the storage symlink

```bash
php artisan storage:link
```

This allows uploaded file attachments to be served publicly. You'll see: `The [public/storage] link has been connected to [storage/app/public].`

---

### Step 3 — Set up the Frontend

The frontend is the React app that users see in their browser.

```bash
cd ../helpdesk-frontend
```

#### 3a. Install JavaScript packages

```bash
npm install
```

This downloads all the JavaScript libraries. May take 1–2 minutes.

#### 3b. Check the API URL

Open `helpdesk-frontend/.env` and confirm it points to your backend:

```env
VITE_API_URL=http://localhost:8000/api
```

This is already correct for local development. Only change it if your backend runs on a different port.

---

## ▶️ Running the Project

You need to start up to **4 terminal windows** depending on which features you want active.

---

### Terminal 1 — Start the Backend API (required)

```bash
cd helpdesk-backend
php artisan serve
```

You should see:
```
INFO  Server running on [http://127.0.0.1:8000].
```

Leave this terminal running. The API is now available at `http://localhost:8000`.

---

### Terminal 2 — Start the Frontend (required)

Open a **new terminal window**, then:

```bash
cd helpdesk-frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser. The app is now running!

---

### Terminal 3 — Queue Worker (needed for emails)

Open a **new terminal window**, then:

```bash
cd helpdesk-backend
php artisan queue:listen
```

This processes background jobs like sending email notifications. Without this, emails will queue up but never actually send.

---

### Terminal 4 — Scheduler (needed for auto-escalation)

Open a **new terminal window**, then:

```bash
cd helpdesk-backend
php artisan schedule:work
```

This runs automatic background tasks every minute — including escalation rules (every 5 min) and token cleanup (daily).

---

> 💡 **Quick start:** Only Terminals 1 and 2 are required to use the app. Start with those, then add 3 and 4 when you need emails and automation.

---

## 🔑 Default Login Credentials

After running `php artisan db:seed`, three accounts are ready to use:

| Role | Email | Password | What they can do |
|------|-------|----------|------------------|
| **Admin** | admin@helpdesk.com | password | Everything — all tickets, all users, all settings, reports |
| **Staff** | staff@helpdesk.com | password | Handle assigned tickets, pick up unassigned ones, use KB |
| **User** | user@helpdesk.com | password | Submit tickets, track their own tickets, browse KB |

> ⚠️ **Important:** Change these passwords before deploying to any real environment.

---

## 🌍 Environment Variables Explained

Environment variables are settings stored in `.env` files. They keep sensitive information (like passwords) out of your code.

### Backend — `helpdesk-backend/.env`

| Variable | What it does | Example value |
|----------|--------------|---------------|
| `APP_KEY` | Secret encryption key. Auto-generated by `php artisan key:generate`. Never share this. | `base64:abc123...` |
| `APP_NAME` | The name shown in emails and browser tabs | `HelpDesk` |
| `APP_URL` | The full URL where the backend runs | `http://localhost:8000` |
| `APP_ENV` | Set to `local` for development, `production` for live servers | `local` |
| `APP_DEBUG` | Set to `true` to see detailed error messages. Always `false` in production. | `true` |
| `DB_CONNECTION` | Which database to use: `sqlite` or `mysql` | `sqlite` |
| `DB_HOST` | Database server address (MySQL only) | `127.0.0.1` |
| `DB_PORT` | Database port (MySQL default is 3306) | `3306` |
| `DB_DATABASE` | Name of the database (MySQL only) | `helpdesk` |
| `DB_USERNAME` | Database login username (MySQL only) | `root` |
| `DB_PASSWORD` | Database login password (MySQL only) | `secret` |
| `MAIL_MAILER` | How to send emails. Use `log` locally (saves to file), `smtp` in production | `log` |
| `MAIL_HOST` | Your SMTP server address (production only) | `smtp.mailgun.org` |
| `MAIL_PORT` | SMTP port (587 for TLS, 465 for SSL) | `587` |
| `MAIL_USERNAME` | SMTP login username | `your@email.com` |
| `MAIL_PASSWORD` | SMTP login password | `yourpassword` |
| `MAIL_FROM_ADDRESS` | The "From" email address on all outgoing emails | `noreply@helpdesk.com` |
| `MAIL_FROM_NAME` | The "From" name on all outgoing emails | `HelpDesk` |
| `QUEUE_CONNECTION` | How background jobs are queued. Use `database` locally, `redis` in production | `database` |
| `FILESYSTEM_DISK` | Where uploaded files are stored. Use `local` locally, `s3` for AWS S3 | `local` |
| `SANCTUM_STATEFUL_DOMAINS` | Which frontend domains are allowed to use cookie auth | `localhost:5173` |

### Frontend — `helpdesk-frontend/.env`

| Variable | What it does | Example value |
|----------|--------------|---------------|
| `VITE_API_URL` | The full URL of the backend API. The React app sends all requests here. | `http://localhost:8000/api` |

> 💡 In production, change `VITE_API_URL` to your live API domain, e.g. `https://api.yourdomain.com/api`

---

## 📖 All Features Explained in Detail

### 🎫 1. Tickets — The Core of HelpDesk

A **ticket** is a support request. When someone has a problem (e.g. "My laptop won't connect to WiFi"), they create a ticket. The support team works on it until it's resolved.

**Every ticket has:**
- **Title** — a short summary of the problem
- **Description** — the full details of the issue
- **Priority** — how urgent it is:
  - `low` — not urgent, can wait
  - `medium` — normal priority
  - `high` — needs attention soon
  - `critical` — drop everything, fix this now
- **Status** — where it is in the workflow:
  - `open` — just created, not yet being worked on
  - `in_progress` — an agent is actively working on it
  - `resolved` — the agent believes the issue is fixed
  - `closed` — fully done, no more action needed
- **Category** — what type of issue it is (e.g. "Network", "Hardware", "Software")
- **Assigned Agent** — which staff member is responsible for it

**What you can do with tickets:**
- **Reply** — add a message to the ticket thread (like an email conversation)
- **Internal Note** — add a private comment only staff/admin can see (shown in amber). Useful for notes like "waiting on vendor callback"
- **Attach files** — upload screenshots, logs, or documents
- **Add tags** — colour-coded labels like `bug`, `urgent`, `waiting-on-user`
- **Snooze** — temporarily hide a ticket until a future date (e.g. "remind me about this on Monday")
- **Merge** — if two tickets are about the same issue, merge them into one. All replies and files move to the target ticket.
- **Export** — download the current filtered ticket list as a CSV spreadsheet

---

### ⚡ 2. Canned Responses

Canned responses are **pre-written reply templates** that agents can insert with one click.

**Example:** Instead of typing "Thank you for contacting support. We will respond within 4 hours." every time, save it once as a canned response and insert it instantly.

- Admin and staff create canned responses at **Admin → Canned Responses**
- When replying to a ticket, click the ⚡ button to search and insert one
- Saves time and keeps replies consistent across the team

---

### 📝 3. Ticket Templates

Ticket templates are **pre-filled ticket forms** for common request types.

**Example:** A template called "New Employee Onboarding" pre-fills the title, description, category, and priority. HR just picks that template instead of filling everything from scratch.

- Admin creates templates at **Admin → Ticket Templates**
- Each template can pre-fill: title, description, category, priority, and custom fields
- Users see templates as clickable cards in Step 1 of the Ticket Wizard

---

### 🏷️ 4. Tags

Tags are **colour-coded labels** you attach to tickets for flexible organisation.

**Example:** Tag a ticket with `billing`, `vip-customer`, or `waiting-on-vendor` to make it easy to filter later.

- Admin creates tags with a name and hex colour at **Admin → Tags**
- Staff/admin toggle tags on/off on any ticket detail page
- Filter the ticket list by tag using the dropdown filter

---

### ⏰ 5. SLA Management — Service Level Agreements

An SLA is a **promise about response time**. For example: "We will respond to critical issues within 15 minutes."

HelpDesk automatically calculates deadlines when a ticket is created:

| Priority | First Response Due | Resolution Due |
|----------|--------------------|----------------|
| Critical | 15 minutes | 1 hour |
| High | 30 minutes | 4 hours |
| Medium | 2 hours | 8 hours |
| Low | 4 hours | 24 hours |

**Visual warnings appear on every ticket:**
- 🔴 **Overdue** badge — the deadline has already passed
- 🟡 **Due Soon** badge — the deadline is approaching

**Custom SLA Policies:** Admin can create named policies with different targets and assign them to specific categories. For example, the "VIP Customers" category could have a 10-minute critical response time.

**Business Hours:** SLA timers only count during your configured working hours. If a ticket arrives at 5pm Friday and your office closes at 6pm, the SLA clock pauses over the weekend and resumes Monday morning.

---

### 🤖 6. Automation

**Auto-Assignment:** When a new ticket is created, HelpDesk automatically assigns it to the staff member with the fewest open tickets. This ensures work is distributed fairly without a manager having to do it manually.

**Escalation Rules:** Admin can define rules that automatically take action when tickets are ignored. For example:
- *"If a ticket is unassigned for more than 30 minutes, bump its priority to High"*
- *"If a ticket is overdue by 1 hour, assign it to the senior agent"*
- *"If there has been no reply for 2 hours, send a notification to the manager"*

The scheduler checks these rules every 5 minutes automatically.

---

### 📚 7. Knowledge Base

The Knowledge Base (KB) is a **library of help articles** — like an FAQ or documentation site built into HelpDesk.

**Why it matters:** If users can find answers themselves, they don't need to create tickets. This reduces the support team's workload.

**How it works:**
- Admin/staff write articles and organise them into KB categories
- Articles can be `published` (visible to all) or `draft` (work in progress)
- Articles can be marked `internal` (only visible to staff/admin, not regular users)
- Users can search articles by keyword or browse by category
- Users can vote **Helpful** or **Not Helpful** on each article
- Each article tracks how many times it has been viewed
- When a user creates a ticket, the Ticket Wizard suggests relevant KB articles — they might solve the problem without needing a ticket at all

---

### 🏢 8. Departments

Departments let you **organise your team** into groups like "IT", "HR", "Finance".

- Admin creates departments at **Admin → Departments**
- Users and staff are assigned to a department from **Admin → Users**
- The department name appears on user profiles and in the user management table
- Useful for filtering and reporting by team

---

### 📣 9. Announcements

Announcements let admin **broadcast messages to everyone** using the system.

**Example uses:**
- "The system will be down for maintenance on Saturday 10pm–2am"
- "New ticket submission policy effective from Monday"
- "Critical security update — please change your password"

Each announcement has:
- **Type** — `info` (blue), `warning` (yellow), or `critical` (red)
- **Title and body** — the message content
- **Expiry date** — optional, the announcement disappears automatically after this date

Active announcements appear as a **dismissible banner** at the top of every page.

---

### 📊 10. Analytics & Reports

The **Admin Dashboard** shows live statistics at a glance:
- Total open, in-progress, resolved, and critical tickets
- Number of overdue tickets
- Average resolution time
- Overall CSAT (Customer Satisfaction) score

The **Reports page** has four detailed views:
- **Ticket Volume** — a bar chart showing how many tickets were created each day over the last 30 days. Helps spot busy periods.
- **CSAT Trend** — a line chart of average satisfaction scores over the last 6 months. Shows if service quality is improving.
- **Category Heatmap** — a table showing ticket count and SLA breach rate per category. Helps identify which areas have the most problems.
- **Agent Performance** — a table per agent showing: tickets assigned, tickets resolved, overdue count, average resolution time, and average CSAT rating.

---

### 👨‍💻 11. Staff Dashboard & Tools

Every staff member gets a **personal dashboard** showing only their own work:
- Active tickets assigned to them
- Critical and overdue tickets
- Tickets resolved today
- Replies sent today
- SLA compliance percentage
- Average resolution time
- Personal CSAT score

**My Queue** — a table of all tickets assigned to the logged-in agent, with SLA due times highlighted in red if overdue. A one-click **Resolve** button lets agents close tickets without opening them.

**Unassigned Pool** — a list of tickets nobody has picked up yet. Any staff member can click **Pick Up** to assign it to themselves.

**Availability Toggle** — staff can set their status in the navbar:
- `Online` — available, will receive auto-assigned tickets
- `Busy` — available but lower priority for auto-assignment
- `Offline` — not available, auto-assignment skips them entirely

**Quick Actions** — select multiple tickets and send the same reply to all of them at once. Useful for mass updates like "We are aware of this issue and working on a fix."

---

### 👤 12. Customer Portal

The customer portal is a **simplified, friendly interface** for end-users (not staff).

**My Tickets page** (`/user/tickets`) — shows all the user's tickets as cards with a visual progress bar: Open → In Progress → Resolved → Closed.

**Ticket Wizard** — a guided 4-step process for creating a ticket:
1. Pick a category
2. See KB article suggestions (maybe the answer is already there)
3. Fill in the ticket form
4. Review and submit

**Ticket Detail** — users can see the full conversation thread, attached files, and a large step-by-step progress tracker.

**Reopen** — if a ticket was marked resolved but the problem isn't actually fixed, the user can reopen it with one click.

**Follow-up** — if a ticket is closed, the user can send a follow-up message without reopening it.

**Post-resolution Survey** — after a ticket is resolved, the user is prompted to fill in a satisfaction survey covering: overall experience, agent rating, resolution quality, and whether they would recommend the service.

---

### 🔔 13. Notifications

HelpDesk keeps everyone informed automatically.

**In-app notifications** — a bell icon in the navbar shows unread notifications with a count badge. Click it to see all notifications and mark them as read.

**Email notifications** are sent for:
- A new ticket is created
- A ticket is assigned to an agent
- A reply is added to a ticket
- A ticket's status changes
- A ticket is escalated by an escalation rule

---

### 🔒 14. Security Features

**Two-Factor Authentication (2FA):** Users can enable 2FA from their profile. When enabled, after entering their password they receive a 6-digit code by email and must enter it to complete login. This prevents unauthorised access even if a password is stolen.

**Login Audit Log:** Every login attempt (successful or failed) is recorded with the IP address and browser/device information. Admins can review this to spot suspicious activity.

**Full Audit Trail:** Every action taken on a ticket is logged — who created it, who replied, who changed the status, who merged it, who snoozed it, and when. Admins can view the complete history at **Admin → Audit Log**.

**Rate Limiting:** The API limits login attempts to 5 per minute to prevent brute-force attacks. General API usage is limited to 60 requests per minute.

---

### ⭐ 15. Satisfaction Ratings & Surveys

**Quick Rating:** After a ticket is resolved or closed, the user can give a 1–5 star rating with an optional comment directly on the ticket page.

**Full Survey:** Users are also prompted to complete a detailed survey with questions about:
- Overall experience (1–5 stars)
- Agent rating (1–5 stars)
- Resolution quality (1–5 stars)
- Would they recommend the service? (Yes/No)
- Free-text feedback

All ratings feed into the CSAT score shown on the admin dashboard and reports.

---

### 💾 16. Saved Filters

Saved filters let you **bookmark a search** so you can return to it instantly.

**Example:** You always want to see "open, critical tickets in the Network category assigned to me". Set those filters, click **Save Filter**, name it "My Critical Network Tickets", and it appears as a chip above the filter bar forever.

---

### 📦 17. Bulk Actions

Bulk actions let admin **update many tickets at once** instead of one by one.

1. On the ticket list, tick the checkboxes next to multiple tickets
2. A bulk action bar appears at the top
3. Choose an action: change status, change priority, assign to an agent, or close all
4. Click **Apply** — all selected tickets are updated instantly

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Authentication uses **Bearer tokens** via Laravel Sanctum.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Login and receive token |
| POST | `/api/logout` | Revoke current token |
| GET | `/api/me` | Get authenticated user |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/profile` | Update name / email |
| PUT | `/api/profile/password` | Change password |
| POST | `/api/2fa/send` | Send OTP to email |
| POST | `/api/2fa/verify` | Verify OTP and toggle 2FA |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List tickets (filtered, paginated) |
| GET | `/api/tickets/export` | Export tickets to CSV |
| POST | `/api/tickets` | Create a ticket |
| GET | `/api/tickets/{id}` | Get ticket detail |
| PUT | `/api/tickets/{id}` | Update ticket |
| DELETE | `/api/tickets/{id}` | Delete ticket (admin) |
| PATCH | `/api/tickets/{id}/status` | Update status |
| PATCH | `/api/tickets/{id}/assign` | Assign to agent |
| POST | `/api/tickets/{id}/merge` | Merge into another ticket |
| PATCH | `/api/tickets/{id}/snooze` | Snooze ticket until date |
| DELETE | `/api/tickets/{id}/snooze` | Remove snooze |
| POST | `/api/tickets/bulk` | Bulk update tickets (admin) |
| PUT | `/api/tickets/{id}/tags` | Sync tags on ticket |

### Replies & Attachments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/{id}/replies` | Add reply or internal note |
| POST | `/api/tickets/{id}/attachments` | Upload attachment |
| DELETE | `/api/attachments/{id}` | Delete attachment |

### Ratings & Surveys
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/{id}/rating` | Rate a resolved ticket (1–5) |
| GET | `/api/customer/tickets/{id}/survey` | Get post-resolution survey |
| POST | `/api/customer/tickets/{id}/survey` | Submit survey response |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List all tags |
| POST | `/api/tags` | Create tag (admin) |
| PUT | `/api/tags/{id}` | Update tag (admin) |
| DELETE | `/api/tags/{id}` | Delete tag (admin) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create category (admin) |
| PUT | `/api/categories/{id}` | Update category (admin) |
| DELETE | `/api/categories/{id}` | Delete category (admin) |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List departments |
| GET | `/api/departments/{id}` | Get department |
| POST | `/api/departments` | Create department (admin) |
| PUT | `/api/departments/{id}` | Update department (admin) |
| DELETE | `/api/departments/{id}` | Delete department (admin) |

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kb/articles` | List articles (search, filter by category) |
| GET | `/api/kb/articles/{slugOrId}` | Get article detail (increments view count) |
| POST | `/api/kb/articles` | Create article (admin/staff) |
| PUT | `/api/kb/articles/{id}` | Update article |
| DELETE | `/api/kb/articles/{id}` | Delete article |
| POST | `/api/kb/articles/{id}/vote` | Vote helpful / not helpful |
| GET | `/api/kb/categories` | List KB categories |
| POST | `/api/kb/categories` | Create KB category (admin) |
| PUT | `/api/kb/categories/{id}` | Update KB category |
| DELETE | `/api/kb/categories/{id}` | Delete KB category |

### SLA Policies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sla-policies` | List SLA policies |
| POST | `/api/sla-policies` | Create policy (admin) |
| PUT | `/api/sla-policies/{id}` | Update policy |
| DELETE | `/api/sla-policies/{id}` | Delete policy |

### Escalation Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/escalation-rules` | List rules |
| POST | `/api/escalation-rules` | Create rule (admin) |
| PUT | `/api/escalation-rules/{id}` | Update rule |
| DELETE | `/api/escalation-rules/{id}` | Delete rule |

### Ticket Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ticket-templates` | List templates |
| POST | `/api/ticket-templates` | Create template (admin) |
| PUT | `/api/ticket-templates/{id}` | Update template |
| DELETE | `/api/ticket-templates/{id}` | Delete template |

### Business Hours & Holidays
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/business-hours` | Get weekly schedule |
| PUT | `/api/business-hours` | Update weekly schedule (admin) |
| GET | `/api/business-hours/holidays` | List holidays |
| POST | `/api/business-hours/holidays` | Add holiday (admin) |
| DELETE | `/api/business-hours/holidays/{id}` | Remove holiday |

### Announcements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements/active` | Get active announcements (all users) |
| GET | `/api/announcements` | List all announcements (admin) |
| POST | `/api/announcements` | Create announcement (admin) |
| PUT | `/api/announcements/{id}` | Update announcement |
| DELETE | `/api/announcements/{id}` | Delete announcement |

### Staff
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff/dashboard` | Staff personal dashboard data |
| GET | `/api/staff/status` | Get availability status |
| PUT | `/api/staff/status` | Update availability status |
| POST | `/api/staff/batch-reply` | Send same reply to multiple tickets |

### Customer Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer/summary` | Ticket counts and avg resolution for user |
| POST | `/api/customer/tickets/{id}/reopen` | Reopen a resolved ticket |
| POST | `/api/customer/tickets/{id}/follow-up` | Send follow-up on closed ticket |

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

### Stats, Reports & Audit
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

### Canned Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/canned-responses` | List canned responses |
| POST | `/api/canned-responses` | Create (admin/staff) |
| PUT | `/api/canned-responses/{id}` | Update |
| DELETE | `/api/canned-responses/{id}` | Delete |

---

## 👥 Role & Permission System

HelpDesk has three user roles. Each role sees a different version of the app.

**Admin** — full control over everything. Manages users, settings, reports, and all tickets.

**Staff** — support agents. Can handle tickets assigned to them, pick up unassigned tickets, write KB articles, and use quick actions. Cannot see tickets belonging to other agents unless they are unassigned.

**User** — end customers. Can only see and manage their own tickets. Access the customer portal, KB, and submit surveys.

| Action | User | Staff | Admin |
|--------|:----:|:-----:|:-----:|
| Register / Login | ✅ | ✅ | ✅ |
| Create ticket | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ |
| View assigned tickets | — | ✅ | ✅ |
| View all tickets | — | — | ✅ |
| Reply to ticket | ✅ | ✅ | ✅ |
| Post internal note | — | ✅ | ✅ |
| Change ticket status | — | ✅ | ✅ |
| Assign ticket | — | ✅ | ✅ |
| Snooze ticket | — | ✅ | ✅ |
| Merge tickets | — | — | ✅ |
| Bulk actions | — | — | ✅ |
| Export tickets (CSV) | — | — | ✅ |
| Upload / delete attachments | ✅ (own) | ✅ | ✅ |
| Rate ticket | ✅ | — | — |
| Submit survey | ✅ | — | — |
| Reopen / follow-up ticket | ✅ | — | — |
| Browse Knowledge Base | ✅ | ✅ | ✅ |
| Create / edit KB articles | — | ✅ | ✅ |
| Manage users | — | — | ✅ |
| Manage categories & tags | — | — | ✅ |
| Manage departments | — | — | ✅ |
| Manage SLA policies | — | — | ✅ |
| Manage escalation rules | — | — | ✅ |
| Manage ticket templates | — | — | ✅ |
| Manage business hours | — | — | ✅ |
| Manage announcements | — | — | ✅ |
| View reports & audit log | — | — | ✅ |
| Set availability status | — | ✅ | ✅ |
| Batch reply (quick actions) | — | ✅ | ✅ |

---

## 🗺 How-To Guide

### First time setup as Admin
1. Log in with `admin@helpdesk.com` / `password`
2. Go to **Admin → Categories** and create your ticket categories (e.g. "Network", "Hardware", "Software")
3. Go to **Admin → Departments** and create your departments
4. Go to **Admin → Users** and assign staff to departments
5. Go to **Admin → Business Hours** and set your working hours and holidays
6. Go to **Admin → SLA Policies** to customise response targets if needed
7. Go to **Admin → Escalation Rules** to set up automatic escalation
8. Go to **Admin → Ticket Templates** to create common ticket types
9. Go to **Admin → Canned Responses** to create reply shortcuts for your team

### How a User submits a ticket
1. Log in and click **+ New Ticket**
2. The Ticket Wizard opens — pick a category
3. KB article suggestions appear — check if the answer is already there
4. Fill in the title, description, and priority
5. Review the summary and click **Submit**
6. The ticket is auto-assigned to an available agent and SLA deadlines are set
7. The user receives an email confirmation

### How a Staff agent handles a ticket
1. Log in — the Staff Dashboard shows your queue and any unassigned tickets
2. Click a ticket to open it
3. Read the description and any previous replies
4. Type a reply and click **Send Reply** (or toggle **Internal Note** for a private comment)
5. Use the ⚡ button to insert a canned response
6. Change the **Status** dropdown to `in_progress` while working on it
7. When done, change status to `resolved`
8. The user receives an email and is prompted to rate the ticket

### How to merge duplicate tickets
1. Open the ticket you want to **keep** (the target)
2. Scroll to the **Merge** panel at the bottom
3. Enter the ID of the duplicate ticket
4. Click **Merge** — all replies and attachments from the duplicate move here
5. The duplicate ticket is automatically closed

### How to snooze a ticket
1. Open a ticket as staff or admin
2. Find the snooze control and pick a future date/time
3. The ticket disappears from the active queue until that time
4. Click **Unsnooze** at any time to bring it back immediately

### How to set up 2FA
1. Go to **My Profile** (click your name in the navbar)
2. Scroll to **Two-Factor Authentication**
3. Click **Enable 2FA** — a 6-digit code is sent to your email
4. Enter the code to confirm
5. On your next login, you will be asked for a code after your password

---

## ⏰ Scheduled Background Jobs

HelpDesk runs two automatic background jobs when the scheduler is active:

| Job | Runs every | What it does |
|-----|------------|--------------|
| `tickets:escalate` | 5 minutes | Checks all open tickets against your escalation rules and applies any matching actions (bump priority, reassign, notify) |
| `sanctum:prune-expired` | Daily | Deletes expired login tokens from the database to keep it clean |

**To run the scheduler locally:**
```bash
cd helpdesk-backend
php artisan schedule:work
```

**To run the scheduler in production** (add this one line to your server's crontab):
```cron
* * * * * cd /path/to/helpdesk-backend && php artisan schedule:run >> /dev/null 2>&1
```

> The cron fires every minute. Laravel's scheduler internally decides which jobs are due to run at that moment.

---

## 🏗 Production Deployment Notes

1. Set `APP_ENV=production` and `APP_DEBUG=false` in `.env`
2. Set `MAIL_MAILER=smtp` and configure your SMTP credentials
3. Set `QUEUE_CONNECTION=redis` for better queue performance (requires Redis)
4. Run performance caches after deployment:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
5. Use **Supervisor** to keep the queue worker running:
   ```ini
   [program:helpdesk-worker]
   command=php /path/to/helpdesk-backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
   autostart=true
   autorestart=true
   stopasgroup=true
   killasgroup=true
   numprocs=2
   ```
6. Add the scheduler cron (see Scheduled Jobs above)
7. Build the frontend for production:
   ```bash
   cd helpdesk-frontend
   npm run build
   # Serve the dist/ folder via Nginx or any static host
   ```
8. Configure your web server:
   - Point **Nginx/Apache** to `helpdesk-backend/public` for the API
   - Serve `helpdesk-frontend/dist` as a static SPA (with a catch-all to `index.html`)
   - Set `CORS` allowed origins in `config/cors.php` to match your frontend domain

**Example Nginx config for the SPA:**
```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    root /var/www/helpdesk-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Example Nginx config for the API:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/helpdesk-backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

## 📄 License

MIT — free to use, modify, and distribute.
