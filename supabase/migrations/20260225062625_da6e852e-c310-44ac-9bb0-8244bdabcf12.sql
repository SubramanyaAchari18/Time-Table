
-- Storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', false);

-- Users can upload to their own folder
CREATE POLICY "Users upload own materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own materials
CREATE POLICY "Users view own materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own materials
CREATE POLICY "Users delete own materials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own materials
CREATE POLICY "Users update own materials"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
