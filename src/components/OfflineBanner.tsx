import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Shows a non-blocking banner when the browser loses connectivity.
 * Keeps the current page state intact — no reloads, no routing changes.
 * Auto-hides shortly after reconnection.
 */
export const OfflineBanner = () => {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setOnline(false);
      setJustReconnected(false);
    };
    const goOnline = () => {
      setOnline(true);
      setJustReconnected(true);
      window.setTimeout(() => setJustReconnected(false), 3000);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (online && !justReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium shadow-md transition-colors " +
        (online
          ? "bg-emerald-600 text-white"
          : "bg-amber-500 text-amber-950")
      }
    >
      {online ? (
        <>
          <Wifi className="h-4 w-4" />
          Back online — you can keep working.
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Connection lost. Your work is safe — we'll reconnect automatically.
        </>
      )}
    </div>
  );
};
