import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window to the top of the page on every route change.
 * Ensures tools open in the workspace area (top) instead of the previous
 * scroll position.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Use 'auto' (instant) on navigation — feels snappier than smooth here.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
};
