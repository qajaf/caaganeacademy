-- Create table for chatbot conversations and escalations
CREATE TABLE public.chatbot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  is_escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  is_resolved BOOLEAN DEFAULT false,
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own messages"
ON public.chatbot_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON public.chatbot_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
ON public.chatbot_messages
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all messages"
ON public.chatbot_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all messages"
ON public.chatbot_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_chatbot_messages_updated_at
BEFORE UPDATE ON public.chatbot_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();