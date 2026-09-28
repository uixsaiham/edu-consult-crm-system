"use client";

import type { ComponentType } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Agreement02Icon,
  Archive02Icon,
  Book02Icon,
  Building03Icon,
  Chatting01Icon,
  DashboardSquare02Icon,
  DocumentValidationIcon,
  EarthIcon,
  MoneyBag02Icon,
  Mortarboard02Icon,
  School01Icon,
  Settings02Icon,
  Target02Icon,
  UserGroupIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";

export type NavIcon = ComponentType<{ className?: string }>;

/** Wraps a Hugeicons glyph so it takes a className like the rest of the icon set. */
function hugeicon(icon: IconSvgElement, name: string): NavIcon {
  const Icon = ({ className }: { className?: string }) => <HugeiconsIcon icon={icon} size={20} strokeWidth={1.7} className={className} />;
  Icon.displayName = name;
  return Icon;
}

export const navIcons = {
  dashboard: hugeicon(DashboardSquare02Icon, "DashboardIcon"),
  leads: hugeicon(UserMultiple02Icon, "LeadsIcon"),
  applications: hugeicon(DocumentValidationIcon, "ApplicationsIcon"),
  communications: hugeicon(Chatting01Icon, "CommunicationsIcon"),
  countries: hugeicon(EarthIcon, "CountriesIcon"),
  institutions: hugeicon(School01Icon, "InstitutionsIcon"),
  courses: hugeicon(Book02Icon, "CoursesIcon"),
  office: hugeicon(Building03Icon, "OfficeIcon"),
  people: hugeicon(UserGroupIcon, "PeopleIcon"),
  agents: hugeicon(Agreement02Icon, "AgentsIcon"),
  targets: hugeicon(Target02Icon, "TargetsIcon"),
  finance: hugeicon(MoneyBag02Icon, "FinanceIcon"),
  training: hugeicon(Mortarboard02Icon, "TrainingIcon"),
  archived: hugeicon(Archive02Icon, "ArchivedIcon"),
  settings: hugeicon(Settings02Icon, "SettingsIcon"),
};
