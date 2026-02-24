
-- Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN avatar_url text;
ALTER TABLE public.profiles ADD COLUMN cargo text;
ALTER TABLE public.profiles ADD COLUMN data_nascimento date;
ALTER TABLE public.profiles ADD COLUMN telefone text;
ALTER TABLE public.profiles ADD COLUMN email_contato text;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
