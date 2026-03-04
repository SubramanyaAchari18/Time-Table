-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Also fix other tables that have restrictive policies
DROP POLICY IF EXISTS "Achievements are publicly readable" ON public.achievements;
CREATE POLICY "Achievements are publicly readable"
  ON public.achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users manage own daily progress" ON public.daily_progress;
CREATE POLICY "Users manage own daily progress"
  ON public.daily_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own files" ON public.notes_files;
CREATE POLICY "Users manage own files"
  ON public.notes_files FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own folders" ON public.notes_folders;
CREATE POLICY "Users manage own folders"
  ON public.notes_folders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own schedules" ON public.schedules;
CREATE POLICY "Users manage own schedules"
  ON public.schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own sessions" ON public.study_sessions;
CREATE POLICY "Users manage own sessions"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own subjects" ON public.subjects;
CREATE POLICY "Users manage own subjects"
  ON public.subjects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users read own achievements" ON public.user_achievements;
CREATE POLICY "Users read own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);