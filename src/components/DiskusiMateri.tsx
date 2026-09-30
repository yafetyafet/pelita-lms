"use client"

import React, { useState, useEffect } from "react"
import { getMaterialComments, addMaterialComment } from "@/app/actions/material"
import { Send, MessageSquare } from "lucide-react"

export function DiskusiMateri({ materialId }: { materialId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [text, setText] = useState("")

  const loadComments = async () => {
    setLoading(true)
    const data = await getMaterialComments(materialId)
    setComments(data)
    setLoading(false)
  }

  useEffect(() => {
    loadComments()
  }, [materialId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    const res = await addMaterialComment(materialId, text)
    setSubmitting(false)
    if (res.error) {
      alert(res.error)
    } else {
      setText("")
      loadComments()
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-4 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-600" />
        Ruang Diskusi Modul
      </h3>

      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
        {loading ? (
          <p className="text-xs text-slate-500 italic">Memuat diskusi...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Belum ada diskusi untuk materi ini. Jadilah yang pertama berkomentar!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`p-3 rounded-2xl text-xs flex flex-col gap-1 ${c.user.role === 'TEACHER' ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{c.user.name}</span>
                <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{c.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
        <input 
          type="text" 
          placeholder="Tulis pertanyaan atau diskusi..."
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
        />
        <button 
          type="submit" 
          disabled={submitting || !text.trim()}
          className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}
