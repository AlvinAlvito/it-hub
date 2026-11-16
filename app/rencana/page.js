import { getProjects } from "@/lib/data";
import { todayWIB } from "@/lib/dates";
import { PageHead } from "@/components/ui";
import PlanViews from "@/components/PlanViews";

export const dynamic = "force-dynamic";

export default async function Rencana({ searchParams }) {
  const projects = await getProjects();
  return (
    <>
      <PageHead kicker="Rencana kerja" title="Rencana IT November 2026 – April 2027">
        Apa yang dikerjakan, kapan, dan sejauh mana progresnya. Lihat sebagai timeline, kalender, atau daftar proyek.
      </PageHead>
      <div className="wrap">
        <PlanViews projects={projects} today={todayWIB()} initial={searchParams.view || "timeline"} />
      </div>
    </>
  );
}
