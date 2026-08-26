import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, UploadSimple, SignOut, Users, CheckCircle, Hourglass, BookOpen, ChartBar, Warning } from "@phosphor-icons/react";

import { LangContext } from "@/App";
import { t } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BrandMark } from "@/components/BrandMark";
import {
  adminLogin,
  adminGetParticipants,
  adminGetStats,
  adminUploadQuestions,
  adminForceRelease,
} from "@/lib/api";

export default function AdminPage() {
  const { lang, setLang } = useContext(LangContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Try password from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("qs_admin_pw");
    if (stored) {
      setPassword(stored);
      // verify on the fly
      (async () => {
        try {
          await adminLogin(stored);
          setAuthed(true);
        } catch {
          sessionStorage.removeItem("qs_admin_pw");
        }
      })();
    }
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(password);
      sessionStorage.setItem("qs_admin_pw", password);
      setAuthed(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [p, s] = await Promise.all([
        adminGetParticipants(password),
        adminGetStats(password),
      ]);
      setParticipants(p.data);
      setStats(s.data);
    } catch (err) {
      toast.error("Failed to load admin data");
    }
  };

  useEffect(() => {
    if (authed) loadData();
  }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = () => {
    sessionStorage.removeItem("qs_admin_pw");
    setAuthed(false);
    setPassword("");
    navigate("/");
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await adminUploadQuestions(password, file);
      toast.success(`Replaced bank: ${r.data.inserted} questions loaded`);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const forceRelease = async () => {
    if (!window.confirm("Force-release the current session lock?")) return;
    try {
      await adminForceRelease(password);
      toast.success("Session released");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to release");
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen w-full flex flex-col" data-testid="admin-login-page">
        <header className="w-full flex items-center justify-between px-6 sm:px-10 py-5">
          <BrandMark />
          <LanguageToggle lang={lang} setLang={setLang} />
        </header>
        <main className="flex-1 flex items-center justify-center px-6">
          <form onSubmit={login} className="qs-surface rounded-3xl w-full max-w-md p-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
              <ShieldCheck size={14} weight="duotone" /> Restricted
            </div>
            <h1 className="font-display text-4xl mt-6 text-stone-900">{t(lang, "admin_login")}</h1>
            <p className="text-stone-500 mt-2 text-sm">Password-protected admin console.</p>
            <label className="block mt-6">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">{t(lang, "admin_password")}</span>
              <input
                data-testid="admin-password-input"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full h-14 rounded-xl bg-white border border-black/10 px-4 text-base text-stone-900 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--qs-cyan)] focus-visible:border-[color:var(--qs-cyan)]"
              />
            </label>
            <button
              data-testid="admin-login-submit"
              type="submit"
              disabled={loading || !password}
              className="qs-btn-primary mt-6 w-full hover:!text-[color:var(--qs-cyan)]"
            >
              {loading ? "..." : t(lang, "enter")}
            </button>
            <button
              type="button"
              data-testid="admin-back-home"
              onClick={() => navigate("/")}
              className="mt-4 w-full text-sm text-stone-500 hover:text-stone-800 transition-colors"
            >
              ← Back to home
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col" data-testid="admin-panel">
      <header className="w-full flex items-center justify-between px-6 sm:px-10 py-5">
        <BrandMark />
        <div className="flex items-center gap-3">
          <button
            data-testid="admin-logout"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <SignOut size={14} weight="bold" /> {t(lang, "logout")}
          </button>
          <LanguageToggle lang={lang} setLang={setLang} />
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-10 pb-16 w-full max-w-7xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">Console</div>
            <h1 className="font-display text-4xl sm:text-5xl text-stone-900 mt-2">{t(lang, "admin_title")}</h1>
          </div>
          <button
            data-testid="admin-force-release"
            onClick={forceRelease}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700 transition-colors"
          >
            <Warning size={14} weight="bold" /> {t(lang, "force_release")}
          </button>
        </div>

        {/* Stats */}
        {stats ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard testId="stat-total" icon={<Users size={20} weight="duotone" />} accent="var(--qs-cyan)" label={t(lang, "stats_total")} value={stats.total_participants} />
            <StatCard testId="stat-completed" icon={<CheckCircle size={20} weight="duotone" />} accent="var(--qs-green)" label={t(lang, "stats_completed")} value={stats.completed} />
            <StatCard testId="stat-in-progress" icon={<Hourglass size={20} weight="duotone" />} accent="var(--qs-orange)" label={t(lang, "stats_in_progress")} value={stats.in_progress} />
            <StatCard testId="stat-questions" icon={<BookOpen size={20} weight="duotone" />} accent="var(--qs-amber)" label={t(lang, "stats_questions")} value={stats.total_questions} />
            <StatCard testId="stat-avg" icon={<ChartBar size={20} weight="duotone" />} accent="var(--qs-cyan)" label={t(lang, "stats_avg")} value={`${stats.avg_score || 0}`} />
          </div>
        ) : null}

        {/* Upload */}
        <div className="mt-8 qs-surface rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <div className="font-display text-xl text-stone-900">{t(lang, "upload_bank")}</div>
            <div className="text-xs text-stone-500 mt-1 max-w-xl">{t(lang, "upload_hint")}</div>
          </div>
          <label className="qs-btn-primary inline-flex items-center gap-2 hover:!text-[color:var(--qs-cyan)] cursor-pointer" data-testid="upload-label">
            <UploadSimple size={16} weight="bold" />
            {uploading ? "Uploading..." : t(lang, "replace_bank")}
            <input
              ref={fileRef}
              data-testid="upload-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Participants table */}
        <div className="mt-8 qs-surface rounded-2xl overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-black/5">
            <div className="font-display text-xl text-stone-900">{t(lang, "participants")}</div>
            <div className="text-xs text-stone-500 font-medium">{participants.length} total</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="participants-table">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-stone-500 border-b border-black/5">
                  <th className="px-6 py-3 font-bold">{t(lang, "col_name")}</th>
                  <th className="px-6 py-3 font-bold">{t(lang, "col_email")}</th>
                  <th className="px-6 py-3 font-bold hidden sm:table-cell">{t(lang, "col_dept")}</th>
                  <th className="px-6 py-3 font-bold hidden md:table-cell">{t(lang, "col_signin")}</th>
                  <th className="px-6 py-3 font-bold hidden md:table-cell">{t(lang, "col_completed")}</th>
                  <th className="px-6 py-3 font-bold">{t(lang, "col_score")}</th>
                  <th className="px-6 py-3 font-bold">{t(lang, "col_status")}</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-stone-400 italic">No participants yet.</td>
                  </tr>
                ) : participants.map((p, i) => (
                  <tr key={p.id} data-testid={`participant-row-${i}`} className="border-b border-black/5 last:border-b-0 hover:bg-stone-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-900">{p.name}</td>
                    <td className="px-6 py-4 text-stone-700">{p.email}</td>
                    <td className="px-6 py-4 text-stone-600 hidden sm:table-cell">{p.department || "—"}</td>
                    <td className="px-6 py-4 text-stone-600 hidden md:table-cell">{formatTs(p.sign_in_timestamp)}</td>
                    <td className="px-6 py-4 text-stone-600 hidden md:table-cell">{p.completion_timestamp ? formatTs(p.completion_timestamp) : "—"}</td>
                    <td className="px-6 py-4 font-bold text-stone-900 tabular-nums">
                      {p.score != null ? `${p.score} / ${p.total || 5}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={p.status} lang={lang} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

const StatCard = ({ icon, label, value, accent, testId }) => (
  <div className="qs-surface rounded-2xl p-5" data-testid={testId}>
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${accent}22`, color: "#1C1917" }}>
        {icon}
      </span>
      <span className="text-[11px] uppercase font-bold tracking-[0.14em] text-stone-500">{label}</span>
    </div>
    <div className="font-display text-3xl mt-3 text-stone-900 tabular-nums">{value}</div>
  </div>
);

const StatusPill = ({ status, lang }) => {
  const map = {
    completed: { c: "var(--qs-green)", label: t(lang, "status_completed") },
    in_progress: { c: "var(--qs-cyan)", label: t(lang, "status_in_progress") },
    abandoned: { c: "var(--qs-orange)", label: t(lang, "status_abandoned") },
  };
  const cfg = map[status] || map.in_progress;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: `${cfg.c}22`, color: "#1C1917" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.c }} />
      {cfg.label}
    </span>
  );
};

const formatTs = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
};
