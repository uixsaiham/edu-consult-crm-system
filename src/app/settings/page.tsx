"use client";

import { useState } from "react";
import {
  Building2,
  Check,
  MessageSquare,
  Save,
  Shield,
  Zap,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { defaultSettings, type OrganizationSettings } from "@/lib/mock/system";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState<OrganizationSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<"general" | "leads" | "whatsapp" | "security">("general");
  const [savedFeedback, setSavedFeedback] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
    }, 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            System Settings
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure agency parameters, counselor lead distribution rules, WhatsApp API hooks, and security policies.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold shadow-xs transition-all active:scale-95",
              savedFeedback
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {savedFeedback ? (
              <>
                <Check className="size-3.5" />
                <span>Changes Saved!</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 transition-colors",
            activeTab === "general"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Building2 className="size-4" />
          <span>General Organization</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leads")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 transition-colors",
            activeTab === "leads"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Zap className="size-4" />
          <span>Lead Automation & Routing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("whatsapp")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 transition-colors",
            activeTab === "whatsapp"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="size-4" />
          <span>WhatsApp Business API</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 transition-colors",
            activeTab === "security"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Shield className="size-4" />
          <span>Security & Access</span>
        </button>
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* 1. General Organization Tab */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <CardHeader
                title="Company & Legal Profile"
                description="Public-facing identity and official portal address."
              />
              <div className="mt-4 flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-medium text-foreground">Organization Legal Name</label>
                  <input
                    type="text"
                    value={settings.orgName}
                    onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground">Student Portal URL</label>
                  <input
                    type="url"
                    value={settings.portalUrl}
                    onChange={(e) => setSettings({ ...settings, portalUrl: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground">Compliance & Support Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader
                title="Regional & Currency Defaults"
                description="Default values applied to admissions calculations and reporting."
              />
              <div className="mt-4 flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-medium text-foreground">Default Accounting Currency</label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="GBP (£)">GBP (£) - British Pound</option>
                    <option value="USD ($)">USD ($) - US Dollar</option>
                    <option value="EUR (€)">EUR (€) - Euro</option>
                    <option value="BDT (৳)">BDT (৳) - Bangladeshi Taka</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-foreground">Primary Destination Market</label>
                  <select
                    value={settings.primaryDestination}
                    onChange={(e) => setSettings({ ...settings, primaryDestination: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Ireland">Ireland</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-foreground">Operational Timezone</label>
                  <input
                    type="text"
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground">Current Academic Cycle</label>
                  <input
                    type="text"
                    value={settings.academicYear}
                    onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 2. Lead Automation & Routing Tab */}
        {activeTab === "leads" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <CardHeader
                title="Counselor Assignment Engine"
                description="Control how new WhatsApp, Web, and Walk-in leads are allocated."
              />
              <div className="mt-4 flex flex-col gap-4 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <span className="font-semibold text-foreground block">
                      Automatic Lead Distribution
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Instantly assign incoming student inquiries to online counselors.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoAssignLeads}
                    onChange={(e) => setSettings({ ...settings, autoAssignLeads: e.target.checked })}
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground">Allocation Algorithm</label>
                  <select
                    value={settings.assignmentAlgorithm}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        assignmentAlgorithm: e.target.value as OrganizationSettings["assignmentAlgorithm"],
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="Round-Robin by Branch">Round-Robin by Branch</option>
                    <option value="Language & Country Matching">Language & Destination Matching</option>
                    <option value="Equal Workload Capacity">Equal Workload Capacity</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-foreground">
                    Dormancy Archival Threshold (Days)
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={180}
                    value={settings.dormancyThresholdDays}
                    onChange={(e) =>
                      setSettings({ ...settings, dormancyThresholdDays: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Unresponsive leads past this day threshold will be queued for compliance archive.
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader
                title="Capacity Guardrails"
                description="Counselor workload limits and fair-share queue protection."
              />
              <div className="mt-4 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                  <div>
                    <span className="font-medium text-foreground">Max Active Leads per Senior Counselor</span>
                    <span className="text-[11px] text-muted-foreground block">Hard cap: 75 leads</span>
                  </div>
                  <span className="rounded-md bg-background px-2.5 py-1 font-bold text-primary border border-border">
                    75
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                  <div>
                    <span className="font-medium text-foreground">Max Active Leads per Junior Counselor</span>
                    <span className="text-[11px] text-muted-foreground block">Hard cap: 50 leads</span>
                  </div>
                  <span className="rounded-md bg-background px-2.5 py-1 font-bold text-primary border border-border">
                    50
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                  <div>
                    <span className="font-medium text-foreground">Escalation Timeout for Uncontacted Leads</span>
                    <span className="text-[11px] text-muted-foreground block">Reassign if not contacted</span>
                  </div>
                  <span className="rounded-md bg-background px-2.5 py-1 font-bold text-primary border border-border">
                    15 mins
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 3. WhatsApp Business API Tab */}
        {activeTab === "whatsapp" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <CardHeader
                title="Meta Cloud API Gateway"
                description="Direct webhook integration with Meta WhatsApp Business Platform."
              />
              <div className="mt-4 flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-medium text-foreground">Incoming Webhook Callback URL</label>
                  <input
                    type="text"
                    value={settings.whatsAppWebhookUrl}
                    onChange={(e) => setSettings({ ...settings, whatsAppWebhookUrl: e.target.value })}
                    className="mt-1 w-full font-mono rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Verify this URL in Meta App Dashboard &gt; Webhooks &gt; messages
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <span className="font-semibold text-foreground block">
                      Automated First-Response Greeting
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Send instant welcome message when a new student messages any branch line.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.whatsAppAutoGreeting}
                    onChange={(e) => setSettings({ ...settings, whatsAppAutoGreeting: e.target.checked })}
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground">Greeting Message Template</label>
                  <textarea
                    rows={4}
                    value={settings.defaultGreetingText}
                    onChange={(e) => setSettings({ ...settings, defaultGreetingText: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader
                title="WhatsApp Health & Verification"
                description="Status of cloud webhook listeners across international lines."
              />
              <div className="mt-4 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                      Webhook Listener Status: Healthy (200 OK)
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    Ping 42ms
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                  <p className="font-medium text-foreground">Verified Connected Lines:</p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5">
                    <li>Dhaka Flagship Hotline (+880 1711-892400)</li>
                    <li>London HQ Admissions Line (+44 7700 900340)</li>
                    <li>Sylhet Hub Counseling Desk (+880 1819-445100)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 4. Security & Access Tab */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <CardHeader
                title="Authentication & Session Policies"
                description="Enforce security measures for counselors and managers."
              />
              <div className="mt-4 flex flex-col gap-4 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <span className="font-semibold text-foreground block">
                      Enforce Two-Factor Authentication (2FA)
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Require OTP authenticator code for all staff members at login.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.twoFactorEnforced}
                    onChange={(e) => setSettings({ ...settings, twoFactorEnforced: e.target.checked })}
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground">
                    Idle Session Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Automatically sign out inactive counselor terminals to protect student PII data.
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader
                title="GDPR & Data Protection"
                description="Statutory controls for student document confidentiality."
              />
              <div className="mt-4 flex flex-col gap-3 text-xs">
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="font-semibold text-foreground block">
                    Student Document Access Audit
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Every download of student passports, bank statements, and transcripts is logged with counselor IP and timestamp.
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <span className="font-semibold text-foreground block">
                    Automated Data Retention Purge
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Student records older than 6 years past graduation are flagged for GDPR compliance review and deletion.
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </form>
    </div>
  );
}
