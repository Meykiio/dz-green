/**
 * English message catalogue — the source of truth for the message shape.
 * `Messages` is derived from this object, so every other locale is checked
 * against it at compile time (a missing or misspelled key fails `tsc`).
 *
 * Keys are grouped by surface. Add new keys here first, then to ar.ts / fr.ts.
 */
export const en = {
  lang: {
    label: "Language",
    english: "English",
    arabic: "العربية",
    french: "Français",
  },
  theme: {
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
  },
  nav: {
    brand: "Green Algeria",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    main: "Main",
    sections: "Sections",
    menu: "Menu",
    map: "Map",
    plantShort: "Plant",
    careShort: "Care",
    fireShort: "Fire",
    plant: "I planted a tree",
    care: "Log care",
    fire: "Report a fire",
    about: "About",
    activity: "My activity",
    moderate: "Moderate",
    admin: "Admin",
    profile: "Profile",
    signIn: "Sign in",
    signOut: "Sign out",
  },
  common: {
    loading: "Loading…",
    pleaseWait: "Please wait…",
    retry: "Try again",
    goHome: "Go home",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
  },
  notFound: {
    title: "Page not found",
    body: "The page you're looking for doesn't exist or has been moved.",
    cta: "Go home",
  },
  error: {
    title: "This page didn't load",
    body: "Something went wrong on our end. You can try refreshing or head back home.",
  },
};

export type Messages = typeof en;
