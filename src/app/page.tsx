import { FilterBar } from "@/components/dashboard/filter-bar";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ApplicationTrendChart } from "@/components/dashboard/application-trend-chart";
import { LeadFunnel } from "@/components/dashboard/lead-funnel";
import { IntakeOverview } from "@/components/dashboard/intake-overview";
import { OfficePerformanceChart } from "@/components/dashboard/office-performance-chart";
import { TopLeadSourcesChart } from "@/components/dashboard/top-lead-sources-chart";
import { PerformanceTable } from "@/components/dashboard/performance-table";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getAgentPerformance, getCounsellorPerformance } from "@/lib/mock/dashboard";

export default function DashboardPage() {
  const counsellors = getCounsellorPerformance();
  const agents = getAgentPerformance();

  return (
    <div className="flex flex-col gap-5">
      <FilterBar />
      <StatCards />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ApplicationTrendChart />
        </div>
        <LeadFunnel />
      </div>

      <IntakeOverview />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OfficePerformanceChart />
        </div>
        <TopLeadSourcesChart />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PerformanceTable
          title="Counsellor Performance"
          subtitle="Applications handled this year, by counsellor"
          rows={counsellors}
          nameLabel="Counsellor"
        />
        <PerformanceTable
          title="Agent Performance"
          subtitle="Applications handled this year, by partner agent"
          rows={agents}
          nameLabel="Agent"
        />
      </div>

      <RecentActivity />
    </div>
  );
}
