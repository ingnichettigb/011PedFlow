export const APP_CODE = "012PedFlow";
export const VERIFIED_EMAIL_KEY = `verified_email:${APP_CODE}`;
export const ACTIVATED_KEY = `activated:${APP_CODE}`;

export function getVerifiedEmail(): string | null {
  try {
    return localStorage.getItem(VERIFIED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function setVerifiedEmail(email: string) {
  localStorage.setItem(VERIFIED_EMAIL_KEY, email);
}

export function clearVerifiedEmail() {
  localStorage.removeItem(VERIFIED_EMAIL_KEY);
  localStorage.removeItem(ACTIVATED_KEY);
}

export function isActivated(): boolean {
  try {
    return localStorage.getItem(ACTIVATED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setActivated() {
  localStorage.setItem(ACTIVATED_KEY, "true");
}