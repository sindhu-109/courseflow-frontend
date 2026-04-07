import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://courseflow-backend-vlcq.onrender.com",
});

API.interceptors.request.use((config) => {
  try {
    const rawSession = window.sessionStorage.getItem("courseflow-session");
    const session = rawSession ? JSON.parse(rawSession) : null;
    const token = session?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore session parsing issues and send the request without auth headers.
  }

  return config;
});

export default API;
