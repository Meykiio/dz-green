import { chrome } from "./ar/chrome";
import { home } from "./ar/home";
import { forms } from "./ar/forms";
import { info } from "./ar/info";
import { moderation } from "./ar/moderation";
import { meta } from "./ar/meta";
import { errors } from "./ar/errors";

import { en } from "./en/index";

export type Dict = typeof en;

export const ar = { chrome, home, forms, info, moderation, meta, errors };

export { en };
