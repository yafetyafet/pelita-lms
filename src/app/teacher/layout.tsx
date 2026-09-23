import { jagaPerangkat } from "@/lib/auth/session"
import { MobileShell } from "@/components/layout/MobileShell"
import { TeacherBottomNav } from "@/components/layout/TeacherBottomNav"

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Satu akun = satu perangkat: begitu akun dipakai masuk di tempat lain,
  // sesi ini dialihkan ke halaman masuk berikut alasannya.
  await jagaPerangkat()

  return (
    <MobileShell currentRole="teacher">
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar relative print:overflow-visible print:block">
        {children}
      </div>
      <div className="flex-none" data-no-cetak><TeacherBottomNav /></div>
    </MobileShell>
  )
}
