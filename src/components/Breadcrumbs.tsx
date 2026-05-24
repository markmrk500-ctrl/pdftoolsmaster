import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  name: string;
  url: string;
}

export const Breadcrumbs = ({ items }: { items: Crumb[] }) => (
  <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-4">
    <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <li className="flex items-center gap-1">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-primary">
          <Home className="h-3 w-3" /> Home
        </Link>
      </li>
      {items.map((item, i) => (
        <li key={item.url} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {i === items.length - 1 ? (
            <span className="text-foreground font-medium" aria-current="page">{item.name}</span>
          ) : (
            <Link to={item.url} className="hover:text-primary">{item.name}</Link>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
