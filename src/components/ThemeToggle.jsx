import React from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

import { useApp } from "../state/AppContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useApp();
  const isDark = theme === "dark";
  
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
      <span className="text-sm">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
