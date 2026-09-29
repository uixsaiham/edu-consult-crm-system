export const dynamic = 'force-dynamic';

import { Download, Handshake, UserCog } from "lucide-react";
import { OperationsOverview } from "@/components/dashboard/operations-overview";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ApplicationTrendChart } from "@/components/dashboard/application-trend-chart";
import { LeadFunnel } from "@/components/dashboard/lead-funnel";
import { IntakeOverview } from "@/components/dashboard/intake-overview";
import { OfficePerformanceChart } from "@/components/dashboard/office-performance-chart";
import { PerformanceTable } from "@/components/dashboard/performance-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Top10LeadSources } from "@/components/dashboard/top-10-lead-sources";
import { operationsSnapshotDate } from "@/lib/mock/applications";
import { getAgentPerformance, getCounsellorPerformance } from "@/lib/mock/dashboard";
import { buttonSecondary } from "@/components/ui/button-styles";
import { cn } from "@/lib/utils";

const updatedLabel = new Date(`${operationsSnapshotDate}T00:00:00Z`).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default function DashboardPage() {
  const counsellors = getCounsellorPerformance();
  const agents = getAgentPerformance();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">Last 12 months · Updated {updatedLabel}</p>
        </div>
        <button
          type="button"
          className={cn(buttonSecondary, "self-start sm:self-auto")}
        >
          <Download className="size-4 text-muted-foreground" />
          Export report
        </button>
      </header>

      {/* Hero Stat Cards with Interactive Status Carousel & Sparklines */}
      <StatCards />

      {/* Keep cards within each dashboard row stretched to equal height. */}
      <OperationsOverview />

      {/* Trend and funnel share the row in a 60/40 ratio. */}
      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ApplicationTrendChart />
        <LeadFunnel />
      </div>

      {/* Intake Pipeline & Branch Performance Row */}
      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <IntakeOverview />
        <OfficePerformanceChart />
      </div>

      {/* Performance Tables Row */}
      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
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
      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
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
