import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

import { LangContext } from "@/App";
import { t } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BrandMark } from "@/components/BrandMark";
import { submitQuiz, closeSession } from "@/lib/api";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizPage() {
  const { lang, setLang } = useContext(LangContext);
  const navigate = useNavigate();

  const participantId = sessionStorage.getItem("qs_participant_id");
  const questions = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("qs_questions") || "[]"); }
    catch { return []; }
  }, []);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { question_uuid: 'A' }
  const [submitting, setSubmitting] = useState(false);
  const [slideKey, setSlideKey] = useState(0);

  useEffect(() => {
    if (!participantId || questions.length === 0) {
      navigate("/", { replace: true });
    }
  }, [participantId, questions, navigate]);

  // Confirm before leaving mid-quiz
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  if (!participantId || questions.length === 0) return null;

  const q = questions[current];
  const selected = answers[q.id];
  const total = questions.length;
  const progressPct = ((current + (selected ? 1 : 0)) / total) * 100;
  const isLast = current === total - 1;

  const pickOption = (letter) => {
    setAnswers((prev) => ({ ...prev, [q.id]: letter }));
  };

  const next = () => {
    if (!selected) return toast.error(t(lang, "select_answer"));
    if (isLast) return doSubmit();
    setCurrent((c) => c + 1);
    setSlideKey((k) => k + 1);
  };

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        participant_id: participantId,
        answers: questions.map((qq) => ({
          question_id: qq.id,
          selected_option: answers[qq.id] || "",
        })),
      };
      const r = await submitQuiz(payload);
      sessionStorage.setItem("qs_result", JSON.stringify(r.data));
      navigate("/scorecard");
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Submit failed";
      toast.error(typeof msg === "string" ? msg : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const optionText = (letter) => q[`option_${letter.toLowerCase()}`];

  return (
    <div className="min-h-screen w-full flex flex-col" data-testid="quiz-page">
      <header className="w-full flex items-center justify-between px-6 sm:px-10 py-5">
        <BrandMark compact />
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-600 hidden sm:inline" data-testid="progress-label">
            {t(lang, "question_of")} <span className="text-stone-900">{current + 1}</span> {t(lang, "of")} {total}
          </span>
          <LanguageToggle lang={lang} setLang={setLang} />
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-6 sm:px-10 mt-2">
        <div className="h-2 rounded-full bg-black/5 overflow-hidden max-w-3xl mx-auto" data-testid="progress-bar">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, var(--qs-cyan), #33e6ff)" }}
          />
        </div>
      </div>

      <main className="flex-1 px-6 sm:px-10 pt-10 pb-16 w-full">
        <div className="max-w-3xl mx-auto" key={slideKey}>
          <div className="qs-slide-in">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
              {q.question_id}
            </div>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mt-3 text-stone-900"
              data-testid="question-text"
            >
              {q.question_text}
            </h2>

            <ul className="mt-8 grid gap-3.5" data-testid="options-list">
              {LETTERS.map((letter) => {
                const active = selected === letter;
                return (
                  <li key={letter}>
                    <button
                      type="button"
                      data-testid={`mcq-option-${letter}`}
                      onClick={() => pickOption(letter)}
                      className={`w-full text-left flex items-start gap-4 rounded-2xl p-5 sm:p-6 bg-white border transition-[transform,border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--qs-cyan)] ${
                        active
                          ? "border-[color:var(--qs-cyan)] shadow-[0_10px_30px_rgba(0,240,255,0.18)] bg-[color:var(--qs-cyan)]/5"
                          : "border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:border-black/10"
                      }`}
                    >
                      <span
                        className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                          active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="pt-1.5 text-base sm:text-lg text-stone-800 flex-1">{optionText(letter)}</span>
                      {active ? (
                        <CheckCircle size={22} weight="fill" className="text-[color:var(--qs-cyan)] mt-1.5" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 flex items-center justify-between gap-4">
              <div className="text-sm text-stone-500">
                {selected ? (
                  <span className="text-stone-800 font-semibold">✓ Answer locked</span>
                ) : (
                  t(lang, "select_answer")
                )}
              </div>
              <button
                data-testid="next-question-button"
                onClick={next}
                disabled={!selected || submitting}
                className="qs-btn-primary inline-flex items-center gap-2 hover:!text-[color:var(--qs-cyan)]"
              >
                {isLast ? (submitting ? t(lang, "submitting") : t(lang, "submit")) : t(lang, "next")}
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
