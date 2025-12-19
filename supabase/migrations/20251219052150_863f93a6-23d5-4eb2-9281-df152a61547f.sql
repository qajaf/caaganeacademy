-- Add referral_source column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_source text;

-- Update default value for is_approved to true (auto-approve new students)
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT true;

-- Create notifications table for admin-to-student messages
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can mark notifications as read"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);