import { MobileShell } from "@/components/layout/MobileShell"
import { StudentBottomNav } from "@/components/layout/StudentBottomNav"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MobileShell currentRole="student">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <StudentBottomNav />
    </MobileShell>
  )
}
