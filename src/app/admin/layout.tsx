import { MobileShell } from "@/components/layout/MobileShell"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MobileShell currentRole="admin">
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        {children}
      </div>
    </MobileShell>
  )
}
