// USA (en-US) vs UK (en-GB) copy variants. Toggled from top-right.
export const LANGS = {
  "en-US": {
    label: "USA",
    flag: "US",
    // Sign-in
    brand_tag: "Knowledge check, sharpened.",
    brand_sub: "Five questions. One minute of focus. A colorful scorecard.",
    signin_title: "Sign in and start",
    signin_sub: "Enter your details to begin the quiz.",
    name: "Full Name",
    name_ph: "Alex Morgan",
    email: "Work Email",
    email_ph: "alex@company.com",
    department: "Department (optional)",
    department_ph: "Marketing, Engineering, ...",
    start_quiz: "Start the Quiz",
    signing_in: "Signing in...",
    invalid_email: "Please enter a valid email address.",
    name_required: "Name is required.",
    // Quiz
    question_of: "Question",
    of: "of",
    next: "Next",
    submit: "Submit Quiz",
    submitting: "Scoring...",
    select_answer: "Select an answer to continue",
    // Scorecard
    your_score: "Your Score",
    show_review: "Show detailed answers",
    hide_review: "Hide detailed answers",
    your_answer: "Your answer",
    correct_answer: "Correct answer",
    explanation: "Explanation",
    finish: "Finish & close session",
    not_answered: "Not answered",
    // Wait screen
    wait_title: "A quiz is in progress",
    wait_sub: "Only one participant can play at a time. We will let you in as soon as it wraps up.",
    checking: "Checking...",
    try_again: "Check again",
    // Admin
    admin_title: "Admin Console",
    admin_login: "Admin sign-in",
    admin_password: "Password",
    enter: "Enter",
    logout: "Log out",
    upload_bank: "Upload / replace question bank",
    upload_hint: "Excel file (.xlsx) — columns: Question ID, Question Text, Option A-D, Correct Option, Summary/Explanation",
    upload_btn: "Choose file",
    replace_bank: "Replace bank",
    participants: "Participants",
    stats_total: "Total sign-ins",
    stats_completed: "Completed",
    stats_in_progress: "In progress",
    stats_questions: "Questions in bank",
    stats_avg: "Average score",
    col_name: "Name",
    col_email: "Email",
    col_dept: "Department",
    col_signin: "Signed in",
    col_completed: "Completed",
    col_score: "Score",
    col_status: "Status",
    status_in_progress: "In progress",
    status_completed: "Completed",
    status_abandoned: "Abandoned",
    force_release: "Force release session",
    // Result bands
    band_5: "Bullseye. Flawless run.",
    band_4: "Sharp. One from perfect.",
    band_3: "Solid effort — plenty of room to climb.",
    band_2: "A start. Come back and beat it.",
    band_1: "Rough round. Reset and retry.",
    band_0: "Zero — but every expert started here.",
  },
  "en-GB": {
    label: "UK",
    flag: "GB",
    brand_tag: "Knowledge check, sharpened.",
    brand_sub: "Five questions. One minute of focus. A colourful scorecard.",
    signin_title: "Sign in and start",
    signin_sub: "Enter your details to begin the quiz.",
    name: "Full Name",
    name_ph: "Alex Morgan",
    email: "Work Email",
    email_ph: "alex@company.com",
    department: "Department (optional)",
    department_ph: "Marketing, Engineering, ...",
    start_quiz: "Start the Quiz",
    signing_in: "Signing in...",
    invalid_email: "Please enter a valid email address.",
    name_required: "Name is required.",
    question_of: "Question",
    of: "of",
    next: "Next",
    submit: "Submit Quiz",
    submitting: "Marking...",
    select_answer: "Select an answer to continue",
    your_score: "Your Score",
    show_review: "Show detailed answers",
    hide_review: "Hide detailed answers",
    your_answer: "Your answer",
    correct_answer: "Correct answer",
    explanation: "Explanation",
    finish: "Finish & close session",
    not_answered: "Not answered",
    wait_title: "A quiz is in progress",
    wait_sub: "Only one participant can play at a time. We will let you in as soon as it wraps up.",
    checking: "Checking...",
    try_again: "Check again",
    admin_title: "Admin Console",
    admin_login: "Admin sign-in",
    admin_password: "Password",
    enter: "Enter",
    logout: "Log out",
    upload_bank: "Upload / replace question bank",
    upload_hint: "Excel file (.xlsx) — columns: Question ID, Question Text, Option A-D, Correct Option, Summary/Explanation",
    upload_btn: "Choose file",
    replace_bank: "Replace bank",
    participants: "Participants",
    stats_total: "Total sign-ins",
    stats_completed: "Completed",
    stats_in_progress: "In progress",
    stats_questions: "Questions in bank",
    stats_avg: "Average score",
    col_name: "Name",
    col_email: "Email",
    col_dept: "Department",
    col_signin: "Signed in",
    col_completed: "Completed",
    col_score: "Score",
    col_status: "Status",
    status_in_progress: "In progress",
    status_completed: "Completed",
    status_abandoned: "Abandoned",
    force_release: "Force release session",
    band_5: "Bullseye. Flawless run.",
    band_4: "Sharp. One from perfect.",
    band_3: "Solid effort — plenty of room to climb.",
    band_2: "A start. Come back and beat it.",
    band_1: "Rough round. Reset and retry.",
    band_0: "Zero — but every expert started here.",
  },
};

export const DEFAULT_LANG = "en-US";

export const useLang = () => {
  // simple non-hook lookup
  const stored = typeof window !== "undefined" ? localStorage.getItem("qs_lang") : null;
  return stored && LANGS[stored] ? stored : DEFAULT_LANG;
};

export const t = (lang, key) => (LANGS[lang] && LANGS[lang][key]) || LANGS[DEFAULT_LANG][key] || key;

export const scoreBand = (score, lang) => {
  const key = `band_${score}`;
  return t(lang, key);
};

export const scoreEmoji = (score) => {
  if (score === 5) return "🏆";
  if (score === 4) return "🎯";
  if (score === 3) return "🚀";
  if (score === 2) return "🌱";
  if (score === 1) return "🧭";
  return "🫥";
};
