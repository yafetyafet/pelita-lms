import { MobileShell } from "@/components/layout/MobileShell"
import { StudentBottomNav } from "@/components/layout/StudentBottomNav"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MobileShell currentRole="student">
      {/* `min-h-0` wajib. Anak flex secara bawaan tidak boleh lebih pendek
          dari isinya (min-height: auto), sehingga `overflow-y-auto` tidak
          pernah aktif: kolom ini memanjang melewati cangkang 100dvh, seluruh
          halaman ikut bergulir, dan navigasi bawah ikut terbawa ke atas. */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar relative">
        {children}
      </div>
      <div className="flex-none">
        <StudentBottomNav />
      </div>
    </MobileShell>
  )
}
