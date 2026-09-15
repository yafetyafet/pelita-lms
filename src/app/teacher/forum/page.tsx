"use client"

import React from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  MessageSquare, 
  Users, 
  Sparkles,
  Send,
  BookOpen
} from "lucide-react"

export default function TeacherForumPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link 
            href="/teacher"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Forum Diskusi</h2>
            <p className="text-[11px] text-slate-500 font-medium">Ruang Tanya Jawab Guru & Siswa</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Forum
        </span>
      </div>

      {/* Empty State - Beautiful Design */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
          <MessageSquare className="w-10 h-10 text-pink-400" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800">Belum Ada Diskusi</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            Forum diskusi akan aktif ketika ada materi atau tugas yang dibagikan. Siswa dan guru dapat berdiskusi terkait topik pembelajaran di sini.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex flex-col items-center gap-1.5">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span className="text-[10px] font-bold text-slate-700">Upload Materi</span>
            <span className="text-[9px] text-slate-500">Diskusi muncul otomatis</span>
          </div>
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex flex-col items-center gap-1.5">
            <Users className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-700">Interaksi Kelas</span>
            <span className="text-[9px] text-slate-500">Jawab pertanyaan siswa</span>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200/60 rounded-3xl text-xs text-slate-700 leading-relaxed">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-xl bg-pink-100 text-pink-600">
            <Send className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800">Cara Kerja Forum Diskusi</span>
        </div>
        <ul className="flex flex-col gap-1.5 text-[11px] text-slate-600 ml-1">
          <li className="flex items-start gap-1.5">
            <span className="text-pink-500 font-bold">1.</span>
            Upload materi di halaman dashboard atau materi
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-pink-500 font-bold">2.</span>
            Siswa akan melihat dan bisa bertanya melalui kolom diskusi per materi
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-pink-500 font-bold">3.</span>
            Guru membalas pertanyaan siswa langsung dari forum ini
          </li>
        </ul>
      </div>
    </div>
  )
}