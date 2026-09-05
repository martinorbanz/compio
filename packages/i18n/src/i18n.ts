import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import englishTranslation from "./locales/en.json";

export const DEFAULT_LOCALE = "en";

let initialized = false;

/** English-only for v1; additional locales register the same way once translated. */
export const initI18n = (): typeof i18next => {
  if (initialized) return i18next;

  initialized = true;
  void i18next.use(initReactI18next).init({
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    resources: {
      en: { translation: englishTranslation },
    },
    interpolation: { escapeValue: false },
  });

  return i18next;
};

export { i18next };
