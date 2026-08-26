import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowClockwise } from "@phosphor-icons/react";

import { LangContext } from "@/App";
import { t } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BrandMark } from "@/components/BrandMark";
import { getSessionStatus } from "@/lib/api";

export default function WaitPage() {
  const { lang, setLang } = useContext(LangContext);
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(null);
  const [participantName, setParticipantName] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const r = await getSessionStatus();
      if (!r.data.active) {
        navigate("/", { replace: true });
      } else {
        setRemaining(r.data.remaining_seconds);
        setParticipantName(r.data.participant_name);
      }
    } catch (_) { /* ignore */ }
    finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const id = setInterval(checkStatus, 6000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen w-full flex flex-col" data-testid="wait-page">
      <header className="w-full flex items-center justify-between px-6 sm:px-10 py-5">
        <BrandMark />
        <LanguageToggle lang={lang} setLang={setLang} />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-16">
        <div className="qs-surface rounded-3xl max-w-lg w-full p-10 text-center">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--qs-orange)]/15 qs-pulse-ring">
            <Lock size={32} weight="duotone" className="text-[color:var(--qs-orange)]" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl mt-6 text-stone-900" data-testid="wait-title">
            {t(lang, "wait_title")}
          </h1>
          <p className="mt-3 text-stone-600 text-base leading-relaxed">{t(lang, "wait_sub")}</p>

          {participantName ? (
            <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 text-xs font-bold text-stone-700" data-testid="wait-current-player">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--qs-orange)]" />
              Playing now: {participantName}
            </div>
          ) : null}

          {typeof remaining === "number" ? (
            <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500" data-testid="wait-remaining">
              Session auto-releases in ~{Math.max(0, Math.floor(remaining / 60))}m {Math.max(0, remaining % 60)}s
            </div>
          ) : null}

          <button
            data-testid="wait-check-again"
            onClick={checkStatus}
            disabled={checking}
            className="qs-btn-primary mt-8 inline-flex items-center gap-2 hover:!text-[color:var(--qs-orange)]"
          >
            <ArrowClockwise size={18} weight="bold" className={checking ? "animate-spin" : ""} />
            {checking ? t(lang, "checking") : t(lang, "try_again")}
          </button>
        </div>
      </main>
    </div>
  );
}
