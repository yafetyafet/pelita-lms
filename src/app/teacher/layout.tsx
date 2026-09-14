import { MobileShell } from "@/components/layout/MobileShell"
import { TeacherBottomNav } from "@/components/layout/TeacherBottomNav"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MobileShell currentRole="teacher">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      <TeacherBottomNav />
    </MobileShell>
  )
}
