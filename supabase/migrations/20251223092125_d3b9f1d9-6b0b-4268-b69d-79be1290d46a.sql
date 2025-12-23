-- Add lesson locking columns
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS unlock_date timestamp with time zone DEFAULT NULL;

-- Update existing lessons to be unlocked (since they were already accessible)
UPDATE public.lessons SET is_locked = false WHERE is_published = true;