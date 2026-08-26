import React, { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import SignInPage from "@/pages/SignIn";
import QuizPage from "@/pages/Quiz";
import ScorecardPage from "@/pages/Scorecard";
import WaitPage from "@/pages/Wait";
import AdminPage from "@/pages/Admin";
import { DEFAULT_LANG, LANGS } from "@/lib/i18n";

export const LangContext = React.createContext({ lang: DEFAULT_LANG, setLang: () => {} });

function App() {
  const [lang, setLangState] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_LANG;
    const stored = localStorage.getItem("qs_lang");
    return stored && LANGS[stored] ? stored : DEFAULT_LANG;
  });

  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem("qs_lang", l); } catch (_) { /* ignore */ }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div className="App qs-noise">
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SignInPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/scorecard" element={<ScorecardPage />} />
            <Route path="/wait" element={<WaitPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </LangContext.Provider>
  );
}

export default App;
