import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretDown, CaretUp, Check, X } from "@phosphor-icons/react";

import { LangContext } from "@/App";
import { t, scoreBand, scoreEmoji } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BrandMark } from "@/components/BrandMark";

export default function ScorecardPage() {
  const { lang, setLang } = useContext(LangContext);
  const navigate = useNavigate();

  const result = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("qs_result") || "null"); }
    catch { return null; }
  }, []);

  const [showReview, setShowReview] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!result) navigate("/", { replace: true });
  }, [result, navigate]);

  useEffect(() => {
    if (!result) return;
    let raf;
    const start = performance.now();
    const target = result.score;
    const duration = 900;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedScore(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result]);

  const finish = () => {
    sessionStorage.removeItem("qs_participant_id");
    sessionStorage.removeItem("qs_questions");
    sessionStorage.removeItem("qs_result");
    sessionStorage.removeItem("qs_name");
    navigate("/", { replace: true });
  };

  if (!result) return null;

  const { score, total, review } = result;
  const emoji = scoreEmoji(score);
  const bandText = scoreBand(score, lang);

  return (
    <div className="min-h-screen w-full flex flex-col" data-testid="scorecard-page">
      <header className="w-full flex items-center justify-between px-6 sm:px-10 py-5">
        <BrandMark compact />
        <LanguageToggle lang={lang} setLang={setLang} />
      </header>

      <main className="flex-1 px-6 sm:px-10 pb-16 w-full">
        <div className="max-w-3xl mx-auto">
          <div className="qs-surface rounded-3xl p-8 sm:p-12 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
              {t(lang, "your_score")}
            </div>
            <div className="mt-6 flex items-baseline justify-center gap-3">
              <div
                className="font-display text-[9rem] leading-none text-stone-900 tabular-nums"
                data-testid="score-value"
              >
                {animatedScore}
              </div>
              <div className="font-display text-5xl text-stone-400 tabular-nums">/ {total}</div>
            </div>
            <div
              className="mt-4 inline-block text-7xl sm:text-8xl qs-pop-in"
              data-testid="score-emoji"
              aria-label={`Score band ${score}`}
            >
              {emoji}
            </div>
            <p className="mt-6 text-lg text-stone-700 max-w-md mx-auto font-medium" data-testid="score-band">
              {bandText}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                data-testid="toggle-review-button"
                onClick={() => setShowReview((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-bold transition-colors"
              >
                {showReview ? t(lang, "hide_review") : t(lang, "show_review")}
                {showReview ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
              </button>
              <button
                data-testid="finish-button"
                onClick={finish}
                className="qs-btn-primary hover:!text-[color:var(--qs-green)]"
              >
                {t(lang, "finish")}
              </button>
            </div>
          </div>

          {showReview ? (
            <div className="mt-8 space-y-4" data-testid="review-list">
              {review.map((r, i) => (
                <div
                  key={i}
                  className={`qs-surface rounded-2xl p-6 border-l-4 ${
                    r.is_correct ? "border-l-[color:var(--qs-green)]" : "border-l-[color:var(--qs-orange)]"
                  }`}
                  data-testid={`review-item-${i}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
                        {r.question_id} · Question {i + 1}
                      </div>
                      <h3 className="font-display text-xl text-stone-900 mt-2 leading-snug">
                        {r.question_text}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full ${
                        r.is_correct ? "bg-[color:var(--qs-green)]/20 text-stone-900" : "bg-[color:var(--qs-orange)]/20 text-stone-900"
                      }`}
                    >
                      {r.is_correct ? <Check size={18} weight="bold" /> : <X size={18} weight="bold" />}
                    </span>
                  </div>

                  <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl p-3 bg-stone-50 border border-black/5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        {t(lang, "your_answer")}
                      </div>
                      <div className="font-medium text-stone-800">
                        {r.user_answer ? (
                          <>
                            <span className="inline-block h-5 w-5 rounded bg-stone-200 text-center text-xs leading-5 font-bold mr-1.5">
                              {r.user_answer}
                            </span>
                            {r.options[r.user_answer]}
                          </>
                        ) : (
                          <span className="italic text-stone-400">{t(lang, "not_answered")}</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl p-3 bg-[color:var(--qs-green)]/10 border border-[color:var(--qs-green)]/30">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        {t(lang, "correct_answer")}
                      </div>
                      <div className="font-medium text-stone-800">
                        <span className="inline-block h-5 w-5 rounded bg-stone-900 text-white text-center text-xs leading-5 font-bold mr-1.5">
                          {r.correct_answer}
                        </span>
                        {r.options[r.correct_answer]}
                      </div>
                    </div>
                  </div>

                  {r.explanation ? (
                    <div className="mt-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        {t(lang, "explanation")}
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed">{r.explanation}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
