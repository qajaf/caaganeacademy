-- Add instructor field to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_name TEXT DEFAULT 'Caagane';

-- Create storage bucket for course files (PDFs, resources)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course-files
CREATE POLICY "Admins can upload course files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-files' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update course files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-files' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete course files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-files' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Approved students can view course files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-files' AND
  (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_approved = true) OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

-- Storage policies for thumbnails (public read)
CREATE POLICY "Admins can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'thumbnails' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- Add video_stop_second to student_progress for tracking where student stopped
ALTER TABLE public.student_progress ADD COLUMN IF NOT EXISTS video_stop_second INTEGER DEFAULT 0;
ALTER TABLE public.student_progress ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER DEFAULT 0;