-- EDUGURU AI DATABASE SCHEMA
-- Execute this in the Supabase SQL Editor to set up the tables.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- Added for authentication
    class_level TEXT NOT NULL, -- "Class 1-5", "Class 6-8", "Class 9-12", "College"
    preferred_language TEXT DEFAULT 'English',
    favorite_subjects TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access for users" ON public.users FOR ALL USING (true);

-- 2. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access for subjects" ON public.subjects FOR ALL USING (true);

-- Insert default subjects
INSERT INTO public.subjects (name) 
VALUES 
    ('Mathematics Teacher'),
    ('Science Teacher'),
    ('English Teacher'),
    ('Coding Teacher'),
    ('General Knowledge Teacher')
ON CONFLICT (name) DO NOTHING;

-- 3. LEARNING HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.learning_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    question TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.learning_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access for learning history" ON public.learning_history FOR ALL USING (true);

-- 4. PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    score INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    weak_topic TEXT,
    strong_topic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access for progress" ON public.progress FOR ALL USING (true);

-- 5. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 8, -- 5 MCQs, 2 Short, 1 App-based (usually weighted)
    date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access for quizzes" ON public.quizzes FOR ALL USING (true);
