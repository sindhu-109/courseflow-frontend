const SESSION_KEY = "courseflow-session";

const canUseSessionStorage = () => typeof window !== "undefined" && Boolean(window.sessionStorage);

const readSession = () => {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSession = (user) => {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = () => readSession();

export const getRole = () => {
  const session = readSession();
  return session?.role || null;
};

export const isLoggedIn = () => Boolean(readSession());
