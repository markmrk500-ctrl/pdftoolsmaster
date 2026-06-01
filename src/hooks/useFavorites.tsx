import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_favorites")
      .select("tool_path")
      .eq("user_id", user.id);
    if (!error && data) setFavorites(new Set(data.map((r) => r.tool_path)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (toolPath: string) => {
      if (!user) {
        toast({
          title: "Sign in to save favorites",
          description: "Create a free account to save your favorite tools.",
        });
        return false;
      }
      const isFav = favorites.has(toolPath);
      if (isFav) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("tool_path", toolPath);
        if (error) {
          toast({ title: "Couldn't remove favorite", description: error.message, variant: "destructive" });
          return false;
        }
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(toolPath);
          return next;
        });
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, tool_path: toolPath });
        if (error) {
          toast({ title: "Couldn't add favorite", description: error.message, variant: "destructive" });
          return false;
        }
        setFavorites((prev) => new Set(prev).add(toolPath));
      }
      return true;
    },
    [user, favorites]
  );

  return { favorites, toggle, loading, isSignedIn: !!user };
};
