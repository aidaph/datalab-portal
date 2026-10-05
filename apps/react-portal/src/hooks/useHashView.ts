import { useEffect, useState } from "react";

export type View = "home" | "help";

function currentView(): View {
  return window.location.hash === "#help" ? "help" : "home";
}

/** Which page to show, from the URL fragment (#help), so links can be shared. */
export function useHashView(): View {
  const [view, setView] = useState<View>(currentView);

  useEffect(() => {
    const onChange = () => {
      setView(currentView());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return view;
}
