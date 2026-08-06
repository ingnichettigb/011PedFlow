export const APP_CODE = "012PedFlow";
export const APP_NAME = "PedFlow";
export const TERMS_VERSION = "v1";

export const KEYS = {
  verifiedEmail: `${APP_CODE}:verifiedEmail`,
  licenseId: `${APP_CODE}:licenseId`,
  consent: `${APP_CODE}:consent`,
  activated: `${APP_CODE}:activated`,
  lastLicenseCheck: `${APP_CODE}:lastLicenseCheck`,
  licenseInvalidReason: `${APP_CODE}:licenseInvalidReason`,
} as const;

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function set(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage non disponibile */
  }
}
function del(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage non disponibile */
  }
}

export const getVerifiedEmail = () => get(KEYS.verifiedEmail);
export const setVerifiedEmail = (email: string) => set(KEYS.verifiedEmail, email);

export const getLicenseId = () => get(KEYS.licenseId);
export const setLicenseId = (id: string) => set(KEYS.licenseId, id);

export const hasConsent = () => get(KEYS.consent) === "1";
export const setConsent = () => set(KEYS.consent, "1");

export const isActivated = () => get(KEYS.activated) === "1";
export const setActivated = () => set(KEYS.activated, "1");

export const getLastLicenseCheck = () => Number(get(KEYS.lastLicenseCheck) ?? 0);
export const setLastLicenseCheck = (ts: number) => set(KEYS.lastLicenseCheck, String(ts));

export type LicenseInvalidReason = "expired" | "deactivated" | "not_found";
export const getLicenseInvalidReason = () =>
  (get(KEYS.licenseInvalidReason) as LicenseInvalidReason | null) ?? null;
export const setLicenseInvalidReason = (reason: LicenseInvalidReason) =>
  set(KEYS.licenseInvalidReason, reason);

/** Azzera tutto lo stato del gate (pulsante "Esci"). */
export function clearGateState() {
  del(KEYS.verifiedEmail);
  del(KEYS.licenseId);
  del(KEYS.consent);
  del(KEYS.activated);
  del(KEYS.lastLicenseCheck);
}

/** Azzera solo licenza/consenso/attivazione, mantenendo l'email verificata. */
export function clearLicenseState() {
  del(KEYS.licenseId);
  del(KEYS.consent);
  del(KEYS.activated);
  del(KEYS.lastLicenseCheck);
}
