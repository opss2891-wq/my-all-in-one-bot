ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS description text;
COMMENT ON COLUMN public.messages.description IS 'Optional note/description added below the main message content';