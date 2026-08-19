import { account } from "./account";
import { content } from "./content";
import { forms } from "./forms";
import { shell } from "./shell";

/**
 * English catalogue — the source of truth for the message shape. `Messages` is
 * derived from this merged object, so every other locale is checked against it
 * at compile time (a missing or misspelled key fails `tsc`).
 */
export const en = {
  ...shell,
  ...content,
  ...forms,
  ...account,
};

export type Messages = typeof en;
