
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body_part TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight NUMERIC,
  notes TEXT,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts"
ON public.workouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts"
ON public.workouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
ON public.workouts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
ON public.workouts FOR DELETE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workouts_updated_at
BEFORE UPDATE ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_workouts_user_date ON public.workouts(user_id, workout_date DESC);
CREATE INDEX idx_workouts_user_exercise ON public.workouts(user_id, exercise_name);
