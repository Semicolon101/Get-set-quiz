import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck } from "@phosphor-icons/react";

import { LangContext } from "@/App";
import { t } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BrandMark } from "@/components/BrandMark";
import { signIn, getSessionStatus } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const { lang, setLang } = useContext(LangContext);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // On mount, check if a global quiz is already in progress
    (async () => {
      try {
        const r = await getSessionStatus();
        if (r.data.active) setBusy(true);
      } catch (_) { /* ignore */ }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error(t(lang, "name_required"));
    if (!EMAIL_RE.test(email)) return toast.error(t(lang, "invalid_email"));
    setLoading(true);
    try {
      const r = await signIn({ name, email, department, language: lang });
      // Persist in session storage
      sessionStorage.setItem("qs_participant_id", r.data.participant_id);
      sessionStorage.setItem("qs_questions", JSON.stringify(r.data.questions));
      sessionStorage.setItem("qs_name", name.trim());
      navigate("/quiz");
    } catch (err) {
      if (err?.response?.status === 423) {
        navigate("/wait");
        return;
      }
      const msg = err?.response?.data?.detail || err.message || "Sign in failed";
      toast.error(typeof msg === "string" ? msg : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col" data-testid="signin-page">
      {/* Top bar */}
      <header className="w-full flex items-center justify-between px-6 sm:px-10 py-5">
        <BrandMark />
        <div className="flex items-center gap-3">
          <button
            data-testid="admin-link"
            onClick={() => navigate("/admin")}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ShieldCheck size={14} weight="duotone" /> Admin
          </button>
          <LanguageToggle lang={lang} setLang={setLang} />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 grid lg:grid-cols-2 gap-10 lg:gap-16 px-6 sm:px-10 lg:px-20 pt-8 pb-16 max-w-[1400px] w-full mx-auto">
        {/* Left brand panel */}
        <section className="flex flex-col justify-center">
          <span
            className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-white border border-black/5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600"
            data-testid="tagline-pill"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--qs-amber)] qs-pulse-ring" />
            Internal knowledge check
          </span>
          <div className="mt-6 flex items-center gap-5 sm:gap-8">
            <img
              src="https://customer-assets-lxgj4vgw.emergentagent.net/job_quizspark/artifacts/o0ky5dp3_download%20%281%29.png"
              alt="Quiz illustration"
              data-testid="hero-illustration"
              className="qs-float shrink-0 w-28 sm:w-40 lg:w-52 h-auto select-none pointer-events-none"
              draggable={false}
            />
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[0.95] text-stone-900">
              Five sharp<br />
              <span className="relative inline-block">
                <span className="relative z-10">questions.</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-[color:var(--qs-cyan)]/70 -z-0" />
              </span>
              <br />One score.
            </h1>
          </div>
          <p className="mt-6 text-lg text-stone-600 max-w-md leading-relaxed">
            {t(lang, "brand_sub")} Signed in, straight into the ring — no filler, no fluff.
          </p>

          <div className="mt-10 hidden lg:grid grid-cols-3 gap-3 max-w-md">
            {[
              { c: "var(--qs-cyan)", l: "Random 5", s: "of 100" },
              { c: "var(--qs-green)", l: "One shot", s: "no repeats" },
              { c: "var(--qs-amber)", l: "Instant", s: "scorecard" },
            ].map((s, i) => (
              <div key={i} className="qs-surface rounded-2xl p-4">
                <div className="h-2 w-8 rounded-full mb-3" style={{ background: s.c }} />
                <div className="font-display text-xl text-stone-900">{s.l}</div>
                <div className="text-xs text-stone-500 mt-1">{s.s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Right form panel */}
        <section className="flex items-center">
          <div className="qs-surface rounded-3xl w-full p-8 sm:p-10">
            {busy ? (
              <div data-testid="busy-warning" className="mb-6 rounded-2xl p-4 bg-[color:var(--qs-orange)]/10 border border-[color:var(--qs-orange)]/30 text-sm text-stone-800">
                A quiz is currently in progress. Signing in now will send you to the wait screen.
              </div>
            ) : null}
            <div className="mb-6">
              <h2 className="font-display text-3xl sm:text-4xl text-stone-900">{t(lang, "signin_title")}</h2>
              <p className="text-stone-500 mt-2 text-base">{t(lang, "signin_sub")}</p>
            </div>
            <form onSubmit={submit} className="space-y-5" data-testid="signin-form">
              <Field
                label={t(lang, "name")}
                testId="name-input"
                value={name}
                onChange={setName}
                placeholder={t(lang, "name_ph")}
                autoFocus
              />
              <Field
                label={t(lang, "email")}
                testId="email-input"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder={t(lang, "email_ph")}
              />
              <Field
                label={t(lang, "department")}
                testId="department-input"
                value={department}
                onChange={setDepartment}
                placeholder={t(lang, "department_ph")}
                optional
              />
              <button
                type="submit"
                disabled={loading}
                data-testid="start-quiz-button"
                className="qs-btn-primary w-full flex items-center justify-center gap-2 group hover:!text-[color:var(--qs-amber)]"
              >
                {loading ? t(lang, "signing_in") : t(lang, "start_quiz")}
                <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-[11px] text-stone-400 text-center pt-1">
                By starting, you agree to the internal event terms. Emails are visible only in the admin console.
              </p>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

const Field = ({ label, value, onChange, placeholder, type = "text", testId, autoFocus, optional }) => (
  <label className="block" data-testid={`${testId}-label`}>
    <span className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500 flex items-center justify-between">
      <span>{label}</span>
      {optional ? <span className="text-stone-400 normal-case tracking-normal font-medium">optional</span> : null}
    </span>
    <input
      data-testid={testId}
      type={type}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full h-14 rounded-xl bg-white border border-black/10 px-4 text-base text-stone-900 placeholder:text-stone-400 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--qs-amber)] focus-visible:border-[color:var(--qs-amber)] transition-colors"
    />
  </label>
);
