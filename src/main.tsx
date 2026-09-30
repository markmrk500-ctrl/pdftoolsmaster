import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Drop build-time head tags; react-helmet-async sets them per route.
document.querySelectorAll('link[rel="canonical"]:not([data-rh]), meta[property^="og:"]:not([data-rh])').forEach((el) => el.remove());
createRoot(document.getElementById("root")!).render(<App />);
