const TOKEN_KEY = "aquaflow-token";
const USER_KEY = "aquaflow-user";

export type StoredUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as StoredUser) : null;
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function toggleTheme() {
  const bridge = (window as Window & { __aquaflowTheme?: { isDarkMode: boolean; setIsDarkMode: (value: boolean) => void } }).__aquaflowTheme;
  if (bridge) {
    bridge.setIsDarkMode(!bridge.isDarkMode);
  }
}

