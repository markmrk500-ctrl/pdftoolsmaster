import { Rows3, Rows2, Minus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDensity, Density } from "@/hooks/useDensity";

const options: { value: Density; label: string; desc: string; icon: any }[] = [
  { value: "normal", label: "Normal", desc: "Default spacious layout", icon: Rows3 },
  { value: "compact", label: "Compact", desc: "Less chunky, tighter spacing", icon: Rows2 },
  { value: "sleek", label: "Sleek", desc: "Minimal, dense interface", icon: Minus },
];

export const DensityToggle = () => {
  const { density, setDensity } = useDensity();
  const Active = options.find((o) => o.value === density)?.icon ?? Rows3;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Interface density" title="Interface density">
          <Active className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Interface density</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => {
          const Icon = o.icon;
          return (
            <DropdownMenuItem
              key={o.value}
              onClick={() => setDensity(o.value)}
              className={density === o.value ? "bg-accent" : ""}
            >
              <Icon className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{o.label}</span>
                <span className="text-xs text-muted-foreground">{o.desc}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
