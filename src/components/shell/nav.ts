import type { LucideIcon } from "lucide-react";
import {
  Droplets,
  FileText,
  Flame,
  HandHeart,
  Info,
  LayoutDashboard,
  ListChecks,
  Map as MapIcon,
  ScrollText,
  ShieldCheck,
  Sprout,
  TreePine,
} from "lucide-react";

/** App-wide nav items, shared by the top-bar drawer and the staff sidebar. */
export interface NavItem {
  to: string;
  key: string;
  icon: LucideIcon;
  tone?: string;
  /** Role gate: "user" | "moderator" | "admin" — filtered in AppShell. */
  requires?: "user" | "moderator" | "admin";
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", key: "map", icon: MapIcon },
  { to: "/restore", key: "restore", icon: TreePine, tone: "text-plant" },
  { to: "/plant", key: "plant", icon: Sprout, tone: "text-plant" },
  { to: "/care", key: "care", icon: Droplets, tone: "text-care" },
  { to: "/fire", key: "fire", icon: Flame, tone: "text-fire" },
  { to: "/about", key: "about", icon: Info },
  { to: "/volunteer", key: "volunteer", icon: HandHeart },
  { to: "/privacy", key: "privacy", icon: ScrollText },
  { to: "/terms", key: "terms", icon: FileText },
  { to: "/activity", key: "activity", icon: ListChecks, requires: "user" },
  { to: "/moderate", key: "moderate", icon: ShieldCheck, requires: "moderator" },
  { to: "/admin", key: "admin", icon: LayoutDashboard, requires: "admin" },
];

/** Three labeled groups of 6 / 3 / 3. Keys → chrome.navGroup.* */
export const GROUP_SPECS: { key: "explore" | "contribute" | "workspace"; items: string[] }[] = [
  { key: "explore", items: ["map", "restore", "about", "volunteer", "privacy", "terms"] },
  { key: "contribute", items: ["plant", "care", "fire"] },
  { key: "workspace", items: ["activity", "moderate", "admin"] },
];
