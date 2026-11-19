-- =========================================================================
-- APEX-CS: Group Examination & Classroom Review Center Tables
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================================

-- 1. Create exam_rooms table
CREATE TABLE IF NOT EXISTS public.exam_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code varchar(10) UNIQUE NOT NULL,
  host_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  level text NOT NULL DEFAULT 'professional', -- 'professional' | 'sub'
  question_count int NOT NULL DEFAULT 50,
  time_limit_minutes int NOT NULL DEFAULT 45,
  status text NOT NULL DEFAULT 'waiting', -- 'waiting' | 'in_progress' | 'completed'
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of locked question UUIDs
  created_at timestamptz DEFAULT now()
);

-- 2. Create room_participants table
CREATE TABLE IF NOT EXISTS public.room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.exam_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL DEFAULT 'Reviewee',
  score int DEFAULT 0,
  correct_count int DEFAULT 0,
  duration_seconds int DEFAULT 0,
  is_finished boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  submitted_at timestamptz
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.exam_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Allow authenticated and anonymous examinees to access rooms
CREATE POLICY "Allow public read of active rooms"
  ON public.exam_rooms FOR SELECT
  USING (true);

CREATE POLICY "Allow insert of rooms"
  ON public.exam_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow host or proctor to update room status"
  ON public.exam_rooms FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read of participants"
  ON public.room_participants FOR SELECT
  USING (true);

CREATE POLICY "Allow participant record creation"
  ON public.room_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow participant score submission"
  ON public.room_participants FOR UPDATE
  USING (true);

-- 5. Enable Realtime Broadcasting & Changes for Room Tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
