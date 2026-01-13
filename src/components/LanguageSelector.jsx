import React from "react";

import { useApp } from "../state/AppContext";

export default function LanguageSelector({ className = "" }) {
  const { language, setLanguage, t } = useApp();
  const options = [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
    { value: "es", label: "Español" }
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="language" className="text-sm text-gray-700 dark:text-gray-300">
        Language
      </label>
      <select
        id="language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
        aria-label={t("nav_settings")}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
