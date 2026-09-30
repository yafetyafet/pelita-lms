import { jagaPerangkat } from "@/lib/auth/session"
import { MobileShell } from "@/components/layout/MobileShell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Satu akun = satu perangkat: begitu akun dipakai masuk di tempat lain,
  // sesi ini dialihkan ke halaman masuk berikut alasannya.
  await jagaPerangkat()

  return (
    <MobileShell currentRole="admin">
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar relative">
        {children}
      </div>
    </MobileShell>
  )
}
