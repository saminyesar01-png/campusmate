# CampusMate

**CampusMate** is an all-in-one university companion platform connecting students, teachers, and administrators.

## 🗂️ Project Structure

```
campusmate/
├── campusmate-web/     # React.js web application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route pages
│   │   │   ├── auth/   # Login, Register
│   │   │   ├── student/ # Student dashboard & features
│   │   │   ├── teacher/ # Teacher dashboard & features
│   │   │   └── admin/   # Admin dashboard & features
│   │   ├── lib/        # Supabase client, helpers
│   │   ├── context/    # React context (auth, etc.)
│   │   ├── hooks/      # Custom React hooks
│   │   └── styles/     # Global CSS
│   └── package.json
├── supabase/
│   └── migrations/     # SQL migration files
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | React.js + React Router |
| Mobile App | Flutter (Phase 2) |
| Backend & DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |

## 👥 User Roles

| Role | Platform | Key Features |
|---|---|---|
| **Student** | Web + Mobile | Dashboard, Routine, CGPA, Materials, Lost & Found |
| **Teacher** | Web | Announcements, Upload Materials, Manage Assignments |
| **Admin** | Web | Manage Users, Courses, Events, Announcements |

## 🚀 Development Phases

### Phase 1 — MVP
- Authentication (login/register with role)
- Student dashboard
- Class routine & schedule
- Campus announcements
- Teacher announcement publishing
- Admin user management

### Phase 2 — Expansion
- Assignment & deadline tracker
- CGPA calculator
- Study material upload & sharing
- Campus events
- Lost & found board

### Phase 3 — Advanced
- AI-powered study assistant (summarize lecture notes)
- Smart notifications
- Analytics dashboard
- Mobile app (Flutter)

## ⚙️ Getting Started

### 1. Install Node.js
Download from: https://nodejs.org (choose LTS version)

### 2. Set up Supabase
1. Go to https://supabase.com and create a free account
2. Create a new project named `campusmate`
3. Copy your **Project URL** and **anon public** API key
4. Run the SQL in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor

### 3. Configure environment
```bash
cd campusmate-web
cp .env.example .env
# Edit .env and paste your Supabase URL and anon key
```

### 4. Install & run
```bash
npm install
npm start
```

## 📐 Database Schema

See `supabase/migrations/001_initial_schema.sql` for the full schema.

**Core tables:**
- `profiles` — User profiles (extends Supabase auth.users)
- `departments` — University departments
- `courses` — Courses / subjects
- `enrollments` — Student ↔ course enrollments
- `announcements` — Campus-wide or course-specific announcements
- `class_schedule` — Weekly class routine

## 🌱 Pilot University
East West University (expandable to other universities)
