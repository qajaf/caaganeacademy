-- Create dictionary table
CREATE TABLE public.dictionary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  pronunciation_url TEXT,
  meaning TEXT NOT NULL,
  example_sentence TEXT,
  example_sentence_meaning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dictionary ENABLE ROW LEVEL SECURITY;

-- Admins can manage dictionary entries
CREATE POLICY "Admins can manage dictionary" 
ON public.dictionary 
FOR ALL 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Approved students can view dictionary
CREATE POLICY "Approved students can view dictionary" 
ON public.dictionary 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_dictionary_updated_at
  BEFORE UPDATE ON public.dictionary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add DELETE policy for course access (so admin can remove students)
CREATE POLICY "Admins can delete course access"
ON public.student_course_access
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for playlist access (so admin can remove students)
CREATE POLICY "Admins can delete playlist access"
ON public.student_playlist_access
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));