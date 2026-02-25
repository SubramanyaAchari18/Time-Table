
-- =============================================
-- SUBJECTS
-- =============================================
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  priority TEXT NOT NULL DEFAULT 'medium',
  study_goals TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subjects" ON public.subjects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SCHEDULES (timetable entries)
-- =============================================
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own schedules" ON public.schedules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- STUDY SESSIONS (timer completions)
-- =============================================
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  gems_earned INTEGER NOT NULL DEFAULT 0,
  rating INTEGER,
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- DAILY PROGRESS (streaks & daily stats)
-- =============================================
CREATE TABLE public.daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_study_seconds INTEGER NOT NULL DEFAULT 0,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  gems_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily progress" ON public.daily_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- ACHIEVEMENTS (definitions)
-- =============================================
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  rarity TEXT NOT NULL DEFAULT 'common',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  gems_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are publicly readable" ON public.achievements
  FOR SELECT USING (true);

-- =============================================
-- USER ACHIEVEMENTS (unlocked)
-- =============================================
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- NOTES FOLDERS
-- =============================================
CREATE TABLE public.notes_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.notes_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own folders" ON public.notes_folders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_notes_folders_updated_at
  BEFORE UPDATE ON public.notes_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- NOTES FILES
-- =============================================
CREATE TABLE public.notes_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.notes_folders(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notes_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own files" ON public.notes_files
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SEED ACHIEVEMENTS
-- =============================================
INSERT INTO public.achievements (name, description, icon, rarity, requirement_type, requirement_value, gems_reward) VALUES
  ('First Steps', 'Complete your first study session', 'footprints', 'common', 'sessions_completed', 1, 5),
  ('Getting Started', 'Study for a total of 1 hour', 'clock', 'common', 'total_study_hours', 1, 10),
  ('Consistent Learner', 'Maintain a 3-day study streak', 'flame', 'common', 'streak_days', 3, 15),
  ('Week Warrior', 'Maintain a 7-day study streak', 'fire', 'uncommon', 'streak_days', 7, 30),
  ('Dedicated Scholar', 'Complete 25 study sessions', 'book-open', 'uncommon', 'sessions_completed', 25, 25),
  ('Marathon Studier', 'Study for a total of 10 hours', 'timer', 'uncommon', 'total_study_hours', 10, 40),
  ('Study Master', 'Complete 100 study sessions', 'graduation-cap', 'rare', 'sessions_completed', 100, 100),
  ('Unstoppable', 'Maintain a 30-day study streak', 'zap', 'rare', 'streak_days', 30, 75),
  ('Gem Collector', 'Earn 500 gems', 'gem', 'rare', 'gems_earned', 500, 50),
  ('Legend', 'Maintain a 100-day study streak', 'crown', 'legendary', 'streak_days', 100, 200);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_subjects_user ON public.subjects(user_id);
CREATE INDEX idx_schedules_user_day ON public.schedules(user_id, day_of_week);
CREATE INDEX idx_sessions_user ON public.study_sessions(user_id);
CREATE INDEX idx_sessions_user_started ON public.study_sessions(user_id, started_at DESC);
CREATE INDEX idx_daily_progress_user_date ON public.daily_progress(user_id, date DESC);
CREATE INDEX idx_notes_folders_user ON public.notes_folders(user_id);
CREATE INDEX idx_notes_files_user ON public.notes_files(user_id);
CREATE INDEX idx_notes_files_folder ON public.notes_files(folder_id);
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
