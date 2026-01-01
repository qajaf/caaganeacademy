-- Add is_free column to courses table for free courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false;

-- Create table for deleted items (recycle bin)
CREATE TABLE IF NOT EXISTS public.deleted_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  item_data jsonb NOT NULL,
  deleted_at timestamp with time zone DEFAULT now(),
  deleted_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on deleted_items
ALTER TABLE public.deleted_items ENABLE ROW LEVEL SECURITY;

-- Only admins can manage deleted items
CREATE POLICY "Admins can manage deleted items"
ON public.deleted_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add course_id to lessons table for direct lessons (without playlist)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id);

-- Update lessons RLS policy to allow viewing direct course lessons
DROP POLICY IF EXISTS "Approved students can view published lessons" ON public.lessons;
CREATE POLICY "Approved students can view published lessons"
ON public.lessons
FOR SELECT
USING (
  (is_published = true) AND is_approved(auth.uid())
);

-- Create table for admin notifications/messages to students
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'general',
  target_type text NOT NULL DEFAULT 'all',
  target_user_ids uuid[] DEFAULT NULL,
  target_course_id uuid REFERENCES public.courses(id) DEFAULT NULL,
  is_sent boolean DEFAULT false,
  sent_via text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone DEFAULT NULL,
  created_by uuid NOT NULL
);

-- Enable RLS on admin_messages
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can manage admin messages
CREATE POLICY "Admins can manage admin messages"
ON public.admin_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add selected_course_id to profiles for course selection during registration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_course_id uuid REFERENCES public.courses(id);