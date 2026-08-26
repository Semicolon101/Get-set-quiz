import React from "react";
import { LANGS } from "@/lib/i18n";

export const LanguageToggle = ({ lang, setLang }) => {
  return (
    <div
      className="inline-flex items-center rounded-full p-1 qs-surface"
      data-testid="language-toggle"
      role="tablist"
      aria-label="Language toggle"
    >
      {Object.keys(LANGS).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            data-testid={`lang-${code}`}
            role="tab"
            aria-selected={active}
            onClick={() => setLang(code)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors duration-200 ${
              active ? "bg-stone-900 text-white" : "text-stone-700 hover:text-stone-900"
            }`}
          >
            {LANGS[code].label}
          </button>
        );
      })}
    </div>
  );
};
