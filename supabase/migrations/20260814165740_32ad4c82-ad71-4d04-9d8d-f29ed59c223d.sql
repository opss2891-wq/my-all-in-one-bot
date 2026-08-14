-- Create types for conversation colors and message types
DO $$ BEGIN
    CREATE TYPE public.app_conversation_color AS ENUM ('none', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.app_message_type AS ENUM ('note', 'tasks', 'credentials', 'links', 'code', 'file');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    archived BOOLEAN NOT NULL DEFAULT false,
    pinned BOOLEAN NOT NULL DEFAULT false,
    color public.app_conversation_color NOT NULL DEFAULT 'none',
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    type public.app_message_type NOT NULL,
    content TEXT,
    tasks JSONB,
    credential JSONB,
    links JSONB,
    code_data JSONB,
    file_data JSONB,
    images TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Legacy Tables
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    host TEXT,
    url TEXT,
    cred_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credentials TO authenticated;

GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.tasks TO service_role;
GRANT ALL ON public.credentials TO service_role;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own conversations" ON public.conversations
    FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own messages" ON public.messages
    FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tasks" ON public.tasks
    FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own credentials" ON public.credentials
    FOR ALL TO authenticated USING (auth.uid() = user_id);
