-- Create student_playlist_access table for playlist-level access control
CREATE TABLE public.student_playlist_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, playlist_id)
);

-- Enable RLS
ALTER TABLE public.student_playlist_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all playlist access"
ON public.student_playlist_access
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own playlist access"
ON public.student_playlist_access
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can request playlist access"
ON public.student_playlist_access
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to check playlist access
CREATE OR REPLACE FUNCTION public.has_playlist_access(_user_id uuid, _playlist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_playlist_access
    WHERE user_id = _user_id
      AND playlist_id = _playlist_id
      AND is_approved = true
  ) OR has_role(_user_id, 'admin'::app_role)
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_student_playlist_access_updated_at
BEFORE UPDATE ON public.student_playlist_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();