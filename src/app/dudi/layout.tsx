import { MobileShell } from "@/components/layout/MobileShell"

export default function DudiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MobileShell currentRole="dudi">
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar relative">
        {children}
      </div>
    </MobileShell>
  )
}
