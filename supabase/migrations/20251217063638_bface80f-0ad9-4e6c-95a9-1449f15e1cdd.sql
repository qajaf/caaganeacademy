-- Create courses table for multi-subject academy
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS policies for courses
CREATE POLICY "Anyone can view published courses"
ON public.courses
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can view all courses"
ON public.courses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add course_id to playlists table
ALTER TABLE public.playlists ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;

-- Create student course access table
CREATE TABLE public.student_course_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on student_course_access
ALTER TABLE public.student_course_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_course_access
CREATE POLICY "Users can view their own course access"
ON public.student_course_access
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all course access"
ON public.student_course_access
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can request course access"
ON public.student_course_access
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to check course access
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_course_access
    WHERE user_id = _user_id
      AND course_id = _course_id
      AND is_approved = true
  ) OR has_role(_user_id, 'admin'::app_role)
$$;

-- Update trigger for courses
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for student_course_access
CREATE TRIGGER update_student_course_access_updated_at
BEFORE UPDATE ON public.student_course_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();