-- Add likes_english column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS likes_english boolean DEFAULT null;

-- Update referral_source to allow longer text input (person's name)
COMMENT ON COLUMN public.profiles.referral_source IS 'Name of person who referred the student or how they heard about us';