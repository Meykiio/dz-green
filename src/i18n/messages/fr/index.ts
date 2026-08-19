import type { Messages } from "../en";
import { account } from "./account";
import { content } from "./content";
import { forms } from "./forms";
import { shell } from "./shell";
import { staff } from "./staff";

/** French (Français) — Algerian audience. */
export const fr: Messages = {
  ...shell,
  ...content,
  ...forms,
  ...account,
  staff,
};
