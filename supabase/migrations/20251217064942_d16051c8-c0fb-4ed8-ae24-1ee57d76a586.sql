-- Add price column to courses table
ALTER TABLE public.courses ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN features TEXT[] DEFAULT '{}';