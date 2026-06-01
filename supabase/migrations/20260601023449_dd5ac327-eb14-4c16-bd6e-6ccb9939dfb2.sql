-- Favorites table for signed-in users
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_path)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
ON public.user_favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
ON public.user_favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.user_favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);