import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 20000,
});

export const signIn = (payload) => api.post("/signin", payload);
export const submitQuiz = (payload) => api.post("/submit", payload);
export const getSessionStatus = () => api.get("/session/status");
export const closeSession = (participantId) =>
  api.post(`/session/close${participantId ? `?participant_id=${participantId}` : ""}`);

export const adminLogin = (password) => api.post("/admin/login", { password });
export const adminHeaders = (password) => ({ headers: { "X-Admin-Password": password } });
export const adminGetParticipants = (password) => api.get("/admin/participants", adminHeaders(password));
export const adminGetStats = (password) => api.get("/admin/stats", adminHeaders(password));
export const adminGetQuestionsCount = (password) => api.get("/admin/questions/count", adminHeaders(password));
export const adminUploadQuestions = (password, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/admin/questions/upload", fd, {
    headers: { "X-Admin-Password": password, "Content-Type": "multipart/form-data" },
  });
};
export const adminForceRelease = (password) => api.post("/admin/session/force-release", null, adminHeaders(password));
