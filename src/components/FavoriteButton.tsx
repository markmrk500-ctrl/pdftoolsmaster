import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

interface Props {
  toolPath: string;
  className?: string;
}

export const FavoriteButton = ({ toolPath, className }: Props) => {
  const { favorites, toggle, isSignedIn } = useFavorites();
  const isFav = favorites.has(toolPath);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(toolPath);
  };

  if (!isSignedIn) {
    return (
      <Link
        to="/auth"
        onClick={(e) => e.stopPropagation()}
        aria-label="Sign in to save as favorite"
        className={cn(
          "p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-accent transition-colors",
          className
        )}
      >
        <Heart className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFav}
      className={cn(
        "p-1.5 rounded-full transition-colors",
        isFav ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-accent",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
    </button>
  );
};
