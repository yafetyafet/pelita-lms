"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowLeft, MessageSquare, Users, Sparkles, Send, BookOpen, Loader2, Plus, MessageCircle 
} from "lucide-react"
import { getForumDiscussions, createForumDiscussion, addForumReply } from "@/app/actions/teacher"

export default function TeacherForumPage() {
  const [discussions, setDiscussions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [activeDiscussion, setActiveDiscussion] = useState<string | null>(null)
  
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [replyContent, setReplyContent] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    const data = await getForumDiscussions()
    setDiscussions(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formContent.trim()) return
    setIsSubmitting(true)
    const res = await createForumDiscussion({ title: formTitle, content: formContent })
    if (res.error) {
      alert(res.error)
    } else {
      setFormTitle("")
      setFormContent("")
      setShowModal(false)
      loadData()
    }
    setIsSubmitting(false)
  }

  const handleReply = async (e: React.FormEvent, discussionId: string) => {
    e.preventDefault()
    if (!replyContent.trim()) return
    setIsSubmitting(true)
    const res = await addForumReply(discussionId, replyContent)
    if (res.error) {
      alert(res.error)
    } else {
      setReplyContent("")
      loadData()
    }
    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
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
        <button 
          onClick={() => setShowModal(true)}
          className="text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Buat Topik
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
          <span className="text-sm font-bold text-slate-600">Memuat Diskusi...</span>
        </div>
      ) : discussions.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Diskusi</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Jadilah yang pertama memulai diskusi! Kamu bisa bertanya, membagikan informasi, atau berdiskusi dengan siswa.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {discussions.map(d => (
            <div key={d.id} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3 transition">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{d.title}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                    <span className="font-bold text-blue-600">{d.author?.name}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{new Date(d.createdAt).toLocaleString("id-ID")}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <MessageCircle className="w-3 h-3" /> {d.replies?.length || 0}
                </span>
              </div>
              
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {d.content}
              </p>

              <div className="flex flex-col gap-2 mt-1">
                {d.replies?.map((r: any) => (
                  <div key={r.id} className="flex gap-2.5 items-start pl-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-blue-600">{r.author?.name.charAt(0)}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-2.5 flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-900">{r.author?.name}</span>
                        <span className="text-[9px] text-slate-400">{new Date(r.createdAt).toLocaleTimeString("id-ID", {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-xs text-slate-700">{r.content}</p>
                    </div>
                  </div>
                ))}

                {activeDiscussion === d.id ? (
                  <form onSubmit={(e) => handleReply(e, d.id)} className="flex gap-2 mt-2">
                    <input 
                      type="text" required value={replyContent} onChange={(e)=>setReplyContent(e.target.value)}
                      placeholder="Tulis balasan..." 
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-3 py-2 rounded-xl flex items-center justify-center disabled:opacity-50">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                    </button>
                    <button type="button" onClick={() => setActiveDiscussion(null)} className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Batal</button>
                  </form>
                ) : (
                  <button onClick={() => setActiveDiscussion(d.id)} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 self-start px-2 py-1 flex items-center gap-1 mt-1">
                    <MessageCircle className="w-3.5 h-3.5" /> Balas Diskusi
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Diskusi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Buat Topik Baru</h3>
            <form onSubmit={handleCreateDiscussion} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Judul Diskusi</label>
                <input required type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Contoh: Pertanyaan Materi Bab 1" className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Isi Pesan</label>
                <textarea required value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Jelaskan apa yang ingin kamu diskusikan..." rows={4} className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none resize-none" />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Memposting..." : "Posting Diskusi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}