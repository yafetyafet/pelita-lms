import React from 'react'

export default function TeacherForumPage() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Forum Diskusi</h1>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-600 text-sm">Belum ada diskusi baru di kelas Anda.</p>
      </div>
    </div>
  )
}