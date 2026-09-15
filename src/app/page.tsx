import { Download, Handshake, Sparkles, UserCog } from "lucide-react";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ApplicationTrendChart } from "@/components/dashboard/application-trend-chart";
import { LeadFunnel } from "@/components/dashboard/lead-funnel";
import { IntakeOverview } from "@/components/dashboard/intake-overview";
import { OfficePerformanceChart } from "@/components/dashboard/office-performance-chart";
import { PerformanceTable } from "@/components/dashboard/performance-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Top10LeadSources } from "@/components/dashboard/top-10-lead-sources";
import { getAgentPerformance, getCounsellorPerformance } from "@/lib/mock/dashboard";

export default function DashboardPage() {
  const counsellors = getCounsellorPerformance();
  const agents = getAgentPerformance();

  return (
    <div className="flex flex-col gap-7">
      {/* Top Overview Banner inspired by Blomstra / Clinexa */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3" />
              Admissions Live
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Last updated: Today, 14 Sep 2026
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pipeline & Performance Overview
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Monitor real-time applicant progression, branch targets, and counsellor conversion.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground card-shadow transition-all hover:bg-surface-hover hover:border-border-strong active:scale-95"
          >
            <Download className="size-3.5 text-muted-foreground" />
            Export Report
          </button>
        </div>
      </div>

      {/* Hero Stat Cards with Interactive Status Carousel & Sparklines */}
      <StatCards />

      {/* Trend & Funnel Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ApplicationTrendChart />
        </div>
        <LeadFunnel />
      </div>

      {/* Intake Pipeline & Branch Performance Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <IntakeOverview />
        <OfficePerformanceChart />
      </div>

      {/* Performance Tables Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PerformanceTable
          title="Counsellor Performance"
          subtitle="Applications handled this year, by counsellor"
          rows={counsellors}
          nameLabel="Counsellor"
          icon={UserCog}
        />
        <PerformanceTable
          title="Agent Performance"
          subtitle="Applications handled this year, by partner agent"
          rows={agents}
          nameLabel="Agent"
          icon={Handshake}
          iconBg="bg-success-soft"
          iconColor="text-success"
        />
      </div>

      {/* Recent Activities & Top 10 Lead Sources Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 2xl:col-span-7">
          <RecentActivity />
        </div>
        <div className="xl:col-span-5 2xl:col-span-5">
          <Top10LeadSources />
        </div>
      </div>
    </div>
  );
}
