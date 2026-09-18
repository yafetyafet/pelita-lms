"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  MessagesSquare,
  Plus,
  Send,
  X,
  Pin,
  Lock,
  AlertTriangle,
  CornerDownRight,
} from "lucide-react"
import { getCurrentUser } from "@/app/actions/auth"
import {
  getForumDiscussions,
  createForumDiscussion,
  addForumReply,
} from "@/app/actions/forum"

const WARNA_ROLE: Record<string, string> = {
  TEACHER: "bg-emerald-100 text-emerald-700",
  ADMIN: "bg-slate-800 text-white",
  STUDENT: "bg-blue-100 text-blue-700",
  DUDI: "bg-purple-100 text-purple-700",
}

const LABEL_ROLE: Record<string, string> = {
  TEACHER: "Guru",
  ADMIN: "Admin",
  STUDENT: "Siswa",
  DUDI: "Mitra",
}

export default function StudentForumPage() {
  const [me, setMe] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [creating, setCreating] = useState(false)

  const [openId, setOpenId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replying, setReplying] = useState(false)

  const load = async () => {
    const [user, data] = await Promise.all([getCurrentUser(), getForumDiscussions()])
    setMe(user)
    setItems(data)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const classId = me?.studentClasses?.[0]?.classInfo?.id
  const className = me?.studentClasses?.[0]?.classInfo?.name

  const buat = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setCreating(true)

    const res = await createForumDiscussion({
      title,
      content,
      // Diskusi siswa selalu masuk ke ruang kelasnya sendiri.
      classId: classId || undefined,
    })
    setCreating(false)

    if (res.error) {
      setError(res.error)
      return
    }
    setTitle("")
    setContent("")
    setShowForm(false)
    await load()
  }

  const balas = async (discussionId: string) => {
    if (!replyText.trim()) return
    setError("")
    setReplying(true)
    const res = await addForumReply(discussionId, replyText)
    setReplying(false)

    if (res.error) {
      setError(res.error)
      return
    }
    setReplyText("")
    await load()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-xs text-slate-500">Memuat forum diskusi...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/student"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Forum Diskusi
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {className ? `Ruang kelas ${className}` : "Diskusi umum sekolah"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showForm ? "Tutup" : "Topik"}</span>
        </button>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {showForm && (
        <form
          onSubmit={buat}
          className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2"
        >
          <h3 className="text-xs font-bold text-slate-900">Buat Topik Baru</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul pertanyaan atau topik"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Jelaskan pertanyaanmu dengan runtut supaya mudah dijawab..."
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-y"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{creating ? "Mengirim..." : "Kirim Topik"}</span>
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-3">
          <MessagesSquare className="w-12 h-12 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Diskusi</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Jadilah yang pertama membuka topik. Guru dan teman sekelasmu dapat
            membalas di sini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((d) => {
            const isOpen = openId === d.id
            return (
              <div
                key={d.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {d.isPinned && (
                        <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                      {d.isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {d.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          WARNA_ROLE[d.author?.role] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {LABEL_ROLE[d.author?.role] || d.author?.role}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {d.author?.name} •{" "}
                        {new Date(d.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {d.classInfo?.name && (
                    <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">
                      {d.classInfo.name}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {d.content}
                </p>

                <button
                  onClick={() => {
                    setOpenId(isOpen ? null : d.id)
                    setReplyText("")
                  }}
                  className="self-start text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <MessagesSquare className="w-3 h-3" />
                  {d.replies.length} balasan
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    {d.replies.map((r: any) => (
                      <div
                        key={r.id}
                        className="flex gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                WARNA_ROLE[r.author?.role] ||
                                "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {LABEL_ROLE[r.author?.role] || r.author?.role}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700">
                              {r.author?.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                            {r.content}
                          </p>
                        </div>
                      </div>
                    ))}

                    {d.isLocked ? (
                      <p className="text-[11px] text-slate-500 italic flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> Diskusi ini sudah ditutup guru.
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tulis balasan..."
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                        <button
                          onClick={() => balas(d.id)}
                          disabled={replying || !replyText.trim()}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-40"
                        >
                          {replying ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
