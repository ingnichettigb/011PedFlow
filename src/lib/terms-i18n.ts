import { APP_NAME, TERMS_VERSION } from "@/lib/app-config";

export type TermsLang = "it" | "en" | "de" | "es";

export type TermsContent = {
  title: string;
  version: string;
  intro: string;
  sections: { heading: string; body: string }[];
  checkbox: string;
  confirm: string;
  step: string;
};

const P = APP_NAME;

const it: TermsContent = {
  title: `Condizioni d'uso — ${P}`,
  version: `Versione ${TERMS_VERSION}`,
  step: "Passaggio 3 di 3 — leggi e accetta le condizioni d'uso per accedere al programma.",
  intro: `Le presenti condizioni regolano l'uso del software ${P} fornito da CorporateBoostService.`,
  sections: [
    { heading: "1. Oggetto", body: `Le condizioni disciplinano l'uso del software ${P}, concesso in licenza e non venduto.` },
    { heading: "2. Licenza d'uso", body: "La licenza è personale, non esclusiva e non trasferibile. A ogni codice PUK corrisponde un solo utilizzatore, in modo permanente." },
    { heading: "3. Pagamenti", body: "Paddle.com opera come Merchant of Record per la vendita delle licenze ed emette la relativa documentazione fiscale." },
    { heading: "4. Durata e cessazione", body: "La licenza resta valida fino alla scadenza indicata o alla sua disattivazione in caso di violazione delle presenti condizioni." },
    { heading: "5. Limitazioni d'uso", body: "Sono vietati decompilazione, rivendita, condivisione delle credenziali e ogni uso non espressamente autorizzato." },
    { heading: "6. Responsabilità", body: `I risultati prodotti da ${P} sono strumenti di supporto tecnico: la verifica finale e la responsabilità della classificazione restano dell'utilizzatore.` },
    { heading: "7. Dati personali (GDPR)", body: "I dati trattati (email, dati di licenza, log di attivazione) sono usati solo per erogare il servizio, in conformità al Regolamento UE 2016/679." },
    { heading: "8. Legge applicabile", body: "Le presenti condizioni sono regolate dalla legge italiana; foro competente esclusivo: Cremona." },
    { heading: "9. Modifiche", body: "In caso di aggiornamento delle condizioni sarà richiesta una nuova accettazione all'accesso successivo." },
  ],
  checkbox: "Ho letto e accetto le condizioni d'uso",
  confirm: "Accetto e accedo al programma",
};

const en: TermsContent = {
  title: `Terms of Use — ${P}`,
  version: `Version ${TERMS_VERSION}`,
  step: "Step 3 of 3 — read and accept the terms of use to access the program.",
  intro: `These terms govern the use of the ${P} software provided by CorporateBoostService.`,
  sections: [
    { heading: "1. Subject", body: `These terms govern the use of the ${P} software, which is licensed and not sold.` },
    { heading: "2. Licence", body: "The licence is personal, non-exclusive and non-transferable. Each PUK code is bound permanently to a single user." },
    { heading: "3. Payments", body: "Paddle.com acts as Merchant of Record for licence sales and issues the related tax documentation." },
    { heading: "4. Term and termination", body: "The licence remains valid until its expiry date or until deactivation in the event of a breach of these terms." },
    { heading: "5. Usage restrictions", body: "Decompilation, resale, credential sharing and any use not expressly authorised are prohibited." },
    { heading: "6. Liability", body: `Results produced by ${P} are technical support tools: final verification and responsibility for the classification remain with the user.` },
    { heading: "7. Personal data (GDPR)", body: "Processed data (email, licence data, activation logs) is used solely to deliver the service, in compliance with EU Regulation 2016/679." },
    { heading: "8. Governing law", body: "These terms are governed by Italian law; exclusive jurisdiction: Cremona, Italy." },
    { heading: "9. Changes", body: "If the terms are updated, a new acceptance will be requested at the next access." },
  ],
  checkbox: "I have read and accept the terms of use",
  confirm: "Accept and enter the program",
};

const de: TermsContent = {
  title: `Nutzungsbedingungen — ${P}`,
  version: `Version ${TERMS_VERSION}`,
  step: "Schritt 3 von 3 — lesen und akzeptieren Sie die Nutzungsbedingungen, um das Programm zu öffnen.",
  intro: `Diese Bedingungen regeln die Nutzung der Software ${P} von CorporateBoostService.`,
  sections: [
    { heading: "1. Gegenstand", body: `Diese Bedingungen regeln die Nutzung der Software ${P}, die lizenziert und nicht verkauft wird.` },
    { heading: "2. Lizenz", body: "Die Lizenz ist persönlich, nicht exklusiv und nicht übertragbar. Jeder PUK-Code ist dauerhaft einem einzigen Nutzer zugeordnet." },
    { heading: "3. Zahlungen", body: "Paddle.com handelt als Merchant of Record für den Lizenzverkauf und stellt die entsprechenden Belege aus." },
    { heading: "4. Laufzeit und Beendigung", body: "Die Lizenz gilt bis zum Ablaufdatum oder bis zur Deaktivierung bei Verstoß gegen diese Bedingungen." },
    { heading: "5. Nutzungsbeschränkungen", body: "Dekompilierung, Weiterverkauf, Weitergabe von Zugangsdaten und jede nicht ausdrücklich erlaubte Nutzung sind untersagt." },
    { heading: "6. Haftung", body: `Die von ${P} erzeugten Ergebnisse sind technische Hilfsmittel: Endprüfung und Verantwortung für die Einstufung bleiben beim Nutzer.` },
    { heading: "7. Personenbezogene Daten (DSGVO)", body: "Verarbeitete Daten (E-Mail, Lizenzdaten, Aktivierungsprotokolle) werden ausschließlich zur Leistungserbringung gemäß EU-Verordnung 2016/679 verwendet." },
    { heading: "8. Anwendbares Recht", body: "Es gilt italienisches Recht; ausschließlicher Gerichtsstand: Cremona (Italien)." },
    { heading: "9. Änderungen", body: "Bei Aktualisierung der Bedingungen ist beim nächsten Zugriff eine erneute Zustimmung erforderlich." },
  ],
  checkbox: "Ich habe die Nutzungsbedingungen gelesen und akzeptiere sie",
  confirm: "Akzeptieren und Programm öffnen",
};

const es: TermsContent = {
  title: `Condiciones de uso — ${P}`,
  version: `Versión ${TERMS_VERSION}`,
  step: "Paso 3 de 3 — lee y acepta las condiciones de uso para acceder al programa.",
  intro: `Estas condiciones regulan el uso del software ${P} proporcionado por CorporateBoostService.`,
  sections: [
    { heading: "1. Objeto", body: `Estas condiciones regulan el uso del software ${P}, que se licencia y no se vende.` },
    { heading: "2. Licencia", body: "La licencia es personal, no exclusiva y no transferible. Cada código PUK queda asignado de forma permanente a un único usuario." },
    { heading: "3. Pagos", body: "Paddle.com actúa como Merchant of Record en la venta de licencias y emite la documentación fiscal correspondiente." },
    { heading: "4. Duración y terminación", body: "La licencia es válida hasta su fecha de caducidad o hasta su desactivación en caso de incumplimiento de estas condiciones." },
    { heading: "5. Restricciones de uso", body: "Se prohíben la descompilación, la reventa, el uso compartido de credenciales y cualquier uso no autorizado expresamente." },
    { heading: "6. Responsabilidad", body: `Los resultados de ${P} son herramientas de apoyo técnico: la verificación final y la responsabilidad de la clasificación son del usuario.` },
    { heading: "7. Datos personales (RGPD)", body: "Los datos tratados (correo, datos de licencia, registros de activación) se usan solo para prestar el servicio, conforme al Reglamento UE 2016/679." },
    { heading: "8. Legislación aplicable", body: "Estas condiciones se rigen por la ley italiana; jurisdicción exclusiva: Cremona (Italia)." },
    { heading: "9. Modificaciones", body: "Si las condiciones se actualizan, se solicitará una nueva aceptación en el siguiente acceso." },
  ],
  checkbox: "He leído y acepto las condiciones de uso",
  confirm: "Aceptar y entrar en el programa",
};

export const TERMS: Record<TermsLang, TermsContent> = { it, en, de, es };

export function detectTermsLang(current?: string): TermsLang {
  const raw = (current ?? navigator.language ?? "en").slice(0, 2).toLowerCase();
  return (["it", "en", "de", "es"] as string[]).includes(raw) ? (raw as TermsLang) : "en";
}
