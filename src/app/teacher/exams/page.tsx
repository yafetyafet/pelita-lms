import React from 'react'

export default function TeacherExamsPage() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Jadwal Ujian CBT</h1>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-600 text-sm">Belum ada jadwal ujian yang aktif.</p>
      </div>
    </div>
  )
}