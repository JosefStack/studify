-- ============================================================
-- StudyFlow — Supabase Database Migration
-- Run this in the Supabase SQL Editor for project: zvjurirrkthtlngstyuk
-- ============================================================

-- 1. Profiles (extends auth.users 1-to-1)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  school_email  TEXT,
  theme         TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, school_email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  subject       TEXT,
  priority      TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status        TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date      DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notes
CREATE TABLE IF NOT EXISTS public.notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT,
  subject       TEXT,
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Schedule Events
CREATE TABLE IF NOT EXISTS public.schedule_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  subject       TEXT,
  location      TEXT,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  color         TEXT DEFAULT '#2EAADC',
  recurring     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pomodoro Sessions
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  subject         TEXT,
  duration_mins   INT DEFAULT 25,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  was_completed   BOOLEAN DEFAULT FALSE
);

-- 6. User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id               UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pomodoro_work_mins    INT DEFAULT 25,
  pomodoro_break_mins   INT DEFAULT 5,
  pomodoro_long_mins    INT DEFAULT 15,
  notify_email          BOOLEAN DEFAULT TRUE,
  notify_deadline       BOOLEAN DEFAULT TRUE,
  study_goal_hrs        INT DEFAULT 4
);

-- Auto-create settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings    ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "users_own_profile" ON public.profiles
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Tasks
CREATE POLICY "users_own_tasks" ON public.tasks
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notes
CREATE POLICY "users_own_notes" ON public.notes
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Schedule events
CREATE POLICY "users_own_schedule" ON public.schedule_events
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Pomodoro sessions
CREATE POLICY "users_own_sessions" ON public.pomodoro_sessions
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- User settings
CREATE POLICY "users_own_settings" ON public.user_settings
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Updated_at auto-update triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at  BEFORE UPDATE ON public.tasks  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER notes_updated_at  BEFORE UPDATE ON public.notes  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
