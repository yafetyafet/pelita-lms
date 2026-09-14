import { MobileShell } from "@/components/layout/MobileShell"

export default function DudiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MobileShell currentRole="dudi">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </MobileShell>
  )
}
