-- ============================================================
-- CampusMate – Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('student', 'teacher', 'admin')),
  student_id text,          -- e.g. "2021-1-60-100"
  phone text,
  avatar_url text,
  department_id uuid,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
create table public.departments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,       -- e.g. "Computer Science & Engineering"
  code text not null unique, -- e.g. "CSE"
  created_at timestamptz default now() not null
);

-- Add foreign key for profiles.department_id
alter table public.profiles
  add constraint profiles_department_fk
  foreign key (department_id) references public.departments(id);

-- ============================================================
-- COURSES
-- ============================================================
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique, -- e.g. "CSE101"
  name text not null,
  credit_hours numeric(3,1) not null default 3.0,
  department_id uuid references public.departments(id),
  teacher_id uuid references public.profiles(id),
  semester text,             -- e.g. "Fall 2026"
  section text,              -- e.g. "01"
  created_at timestamptz default now() not null
);

-- ============================================================
-- ENROLLMENTS (Student ↔ Course)
-- ============================================================
create table public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  grade text,                -- e.g. "A+", "B", "F" (null if ongoing)
  enrolled_at timestamptz default now() not null,
  unique(student_id, course_id)
);

-- ============================================================
-- CLASS SCHEDULE (Weekly routine)
-- ============================================================
create table public.class_schedule (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  start_time time not null,  -- e.g. 08:00
  end_time time not null,    -- e.g. 09:30
  room text,                 -- e.g. "AB-301"
  created_at timestamptz default now() not null
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id),
  course_id uuid references public.courses(id), -- null = campus-wide
  is_pinned boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
create table public.assignments (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  course_id uuid references public.courses(id) on delete cascade,
  teacher_id uuid references public.profiles(id),
  due_date timestamptz not null,
  total_marks numeric(5,2),
  created_at timestamptz default now() not null
);

-- ============================================================
-- STUDY MATERIALS
-- ============================================================
create table public.study_materials (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  file_url text not null,     -- Supabase Storage URL
  file_type text,             -- "pdf", "pptx", "docx", etc.
  course_id uuid references public.courses(id) on delete cascade,
  uploader_id uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- CAMPUS EVENTS
-- ============================================================
create table public.campus_events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  organizer_id uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- LOST & FOUND
-- ============================================================
create table public.lost_found (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('lost', 'found')),
  item_name text not null,
  description text,
  location text,
  image_url text,
  reporter_id uuid references public.profiles(id),
  is_resolved boolean default false,
  created_at timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.class_schedule enable row level security;
alter table public.announcements enable row level security;
alter table public.assignments enable row level security;
alter table public.study_materials enable row level security;
alter table public.campus_events enable row level security;
alter table public.lost_found enable row level security;

-- PROFILES: Users can read all profiles, only update their own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

-- DEPARTMENTS: Readable by all, writable by admin only
create policy "Departments are viewable by all"
  on public.departments for select
  to authenticated using (true);

create policy "Only admins can manage departments"
  on public.departments for all
  to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- COURSES: Readable by all, writable by admin/teacher
create policy "Courses viewable by authenticated users"
  on public.courses for select
  to authenticated using (true);

create policy "Teachers and admins can manage courses"
  on public.courses for all
  to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher','admin'))
  );

-- ENROLLMENTS: Students see their own, admins see all
create policy "Students see own enrollments"
  on public.enrollments for select
  to authenticated using (
    student_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher','admin'))
  );

-- CLASS SCHEDULE: Viewable by all authenticated
create policy "Class schedule viewable by all"
  on public.class_schedule for select
  to authenticated using (true);

create policy "Teachers and admins can manage schedule"
  on public.class_schedule for all
  to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher','admin'))
  );

-- ANNOUNCEMENTS: Viewable by all, created by teacher/admin
create policy "Announcements viewable by all"
  on public.announcements for select
  to authenticated using (true);

create policy "Teachers and admins can create announcements"
  on public.announcements for insert
  to authenticated with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher','admin'))
  );

create policy "Authors can update their announcements"
  on public.announcements for update
  to authenticated using (author_id = auth.uid());

-- ASSIGNMENTS: Viewable by enrolled students + teacher
create policy "Assignments viewable by authenticated"
  on public.assignments for select
  to authenticated using (true);

create policy "Teachers can manage assignments"
  on public.assignments for all
  to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher','admin'))
  );

-- STUDY MATERIALS: Viewable by all
create policy "Study materials viewable by all"
  on public.study_materials for select
  to authenticated using (true);

create policy "Teachers can upload materials"
  on public.study_materials for insert
  to authenticated with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher','admin'))
  );

-- CAMPUS EVENTS: Viewable by all
create policy "Events viewable by all"
  on public.campus_events for select
  to authenticated using (true);

create policy "Admins manage events"
  on public.campus_events for all
  to authenticated using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- LOST & FOUND: Everyone can post and view
create policy "Lost and found viewable by all"
  on public.lost_found for select
  to authenticated using (true);

create policy "Authenticated users can post lost and found"
  on public.lost_found for insert
  to authenticated with check (reporter_id = auth.uid());

create policy "Reporters can update their own posts"
  on public.lost_found for update
  to authenticated using (reporter_id = auth.uid());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SEED DATA (Departments)
-- ============================================================
insert into public.departments (name, code) values
  ('Computer Science & Engineering', 'CSE'),
  ('Electrical & Electronic Engineering', 'EEE'),
  ('Business Administration', 'BBA'),
  ('English', 'ENG'),
  ('Law', 'LAW');
