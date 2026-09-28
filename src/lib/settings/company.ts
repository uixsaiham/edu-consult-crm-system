"use client";

import { defaultCompanySettings, type CompanySettings } from "@/lib/mock/system";
import { createSettingsStore } from "./store";

export const companyStore = createSettingsStore<CompanySettings>("bhe-crm:company-settings", defaultCompanySettings);

/** Saved settings with any fields added since they were saved filled from the defaults. */
export const withDefaults = (s: Partial<CompanySettings>): CompanySettings => ({ ...defaultCompanySettings, ...s });
