import { PageHeader } from "@/components/layout/page-header"
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen"

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Training dashboard"
        description="Pick a property, underwrite it and submit. You're scored on how close your Mid revenue forecast is to the analyst's."
      />
      <DashboardScreen />
    </>
  )
}
