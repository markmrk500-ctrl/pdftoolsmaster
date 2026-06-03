import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Density = "normal" | "compact" | "sleek";

const STORAGE_KEY = "pdfmaster-density";

interface DensityContextType {
  density: Density;
  setDensity: (d: Density) => void;
}

const DensityContext = createContext<DensityContextType>({
  density: "normal",
  setDensity: () => {},
});

export const DensityProvider = ({ children }: { children: ReactNode }) => {
  const [density, setDensityState] = useState<Density>(() => {
    if (typeof window === "undefined") return "normal";
    const stored = localStorage.getItem(STORAGE_KEY) as Density | null;
    return stored === "compact" || stored === "sleek" ? stored : "normal";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
    localStorage.setItem(STORAGE_KEY, density);
  }, [density]);

  return (
    <DensityContext.Provider value={{ density, setDensity: setDensityState }}>
      {children}
    </DensityContext.Provider>
  );
};

export const useDensity = () => useContext(DensityContext);
