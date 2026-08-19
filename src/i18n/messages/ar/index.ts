import type { Messages } from "../en";
import { account } from "./account";
import { content } from "./content";
import { forms } from "./forms";
import { shell } from "./shell";
import { staff } from "./staff";

/** Arabic (العربية) — Algerian audience, Modern Standard Arabic. */
export const ar: Messages = {
  ...shell,
  ...content,
  ...forms,
  ...account,
  staff,
};
