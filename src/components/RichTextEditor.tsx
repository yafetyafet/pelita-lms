"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered,
  IndentIncrease, IndentDecrease, Undo2, Redo2, RemoveFormatting, Baseline,
  Highlighter, Minus,
} from "lucide-react"
import { keHtmlAman, sanitasiHtml, keTeksPolos } from "@/lib/logic/rich-text"

/**
 * Penyunting teks berformat ala MS Word untuk butir soal.
 * Tanpa dependensi: memakai contentEditable + document.execCommand.
 * Nilai yang dikeluarkan berupa HTML yang sudah disanitasi.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis pertanyaan...",
  minHeight = 110,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const terakhir = useRef<string>("")
  const [aktif, setAktif] = useState<Record<string, boolean>>({})
  const [kosong, setKosong] = useState(!keTeksPolos(value))

  // Sinkronkan dari luar hanya jika berbeda dari ketikan terakhir —
  // menulis ulang innerHTML saat mengetik akan memindahkan kursor.
  useEffect(() => {
    if (!ref.current) return
    if (value === terakhir.current) return
    const html = keHtmlAman(value)
    ref.current.innerHTML = html
    terakhir.current = value
    setKosong(!keTeksPolos(html) && !/<(hr|table)/i.test(html))
  }, [value])

  const emit = () => {
    if (!ref.current) return
    const raw = ref.current.innerHTML
    const teks = keTeksPolos(raw)
    const html = teks || /<(hr|table)/i.test(raw) ? sanitasiHtml(raw) : ""
    setKosong(!html)
    terakhir.current = html
    onChange(html)
  }

  const perbaruiStatus = () => {
    try {
      setAktif({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        subscript: document.queryCommandState("subscript"),
        superscript: document.queryCommandState("superscript"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      })
    } catch { /* abaikan */ }
  }

  const jalankan = (cmd: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand("styleWithCSS", false, "true")
    document.execCommand(cmd, false, arg)
    emit()
    perbaruiStatus()
  }

  /** Spasi baris diterapkan ke blok (paragraf) yang tersentuh seleksi. */
  const aturSpasi = (nilai: string) => {
    const el = ref.current
    const sel = window.getSelection()
    if (!el || !sel || !sel.rangeCount) return
    el.focus()
    // Pastikan teks berada di dalam paragraf.
    if (!el.querySelector("p,div,li,h1,h2,h3,h4,blockquote")) {
      document.execCommand("formatBlock", false, "p")
    }
    const range = sel.getRangeAt(0)
    const blok = Array.from(el.querySelectorAll<HTMLElement>("p,div,li,h1,h2,h3,h4,blockquote"))
      .filter((b) => range.intersectsNode(b))
    blok.forEach((b) => (b.style.lineHeight = nilai))
    emit()
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData("text/html")
    if (!html) return // teks polos: biarkan perilaku bawaan
    e.preventDefault()
    const bersih = sanitasiHtml(html.replace(/^[\s\S]*<body[^>]*>|<\/body>[\s\S]*$/gi, ""))
    document.execCommand("insertHTML", false, bersih)
    emit()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault()
      jalankan(e.shiftKey ? "outdent" : "indent")
    }
  }

  const Btn = ({
    cmd, arg, title, children, on,
  }: { cmd?: string; arg?: string; title: string; children: React.ReactNode; on?: () => void }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => (on ? on() : cmd && jalankan(cmd, arg))}
      className={`h-7 min-w-7 px-1.5 rounded-md flex items-center justify-center transition text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm ${
        cmd && aktif[cmd] ? "bg-white text-rose-600 shadow-sm ring-1 ring-rose-200" : ""
      }`}
    >
      {children}
    </button>
  )

  const Sep = () => <span className="w-px h-5 bg-slate-300/80 mx-0.5" />
  const ik = "w-3.5 h-3.5"

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-rose-200 focus-within:border-rose-300 transition">
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 bg-slate-100/80 border-b border-slate-200">
        <select
          title="Gaya paragraf"
          defaultValue=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { if (e.target.value) jalankan("formatBlock", e.target.value); e.target.value = "" }}
          className="h-7 text-[10px] px-1 rounded-md border border-slate-200 bg-white text-slate-700"
        >
          <option value="" disabled>Paragraf</option>
          <option value="p">Normal</option>
          <option value="h3">Judul</option>
          <option value="h4">Sub-judul</option>
          <option value="blockquote">Kutipan</option>
        </select>
        <select
          title="Ukuran huruf"
          defaultValue=""
          onChange={(e) => { if (e.target.value) jalankan("fontSize", e.target.value); e.target.value = "" }}
          className="h-7 text-[10px] px-1 rounded-md border border-slate-200 bg-white text-slate-700"
        >
          <option value="" disabled>Ukuran</option>
          <option value="2">Kecil</option>
          <option value="3">Normal</option>
          <option value="4">Besar</option>
          <option value="5">Lebih besar</option>
          <option value="6">Sangat besar</option>
        </select>
        <select
          title="Spasi baris"
          defaultValue=""
          onChange={(e) => { if (e.target.value) aturSpasi(e.target.value); e.target.value = "" }}
          className="h-7 text-[10px] px-1 rounded-md border border-slate-200 bg-white text-slate-700"
        >
          <option value="" disabled>Spasi</option>
          <option value="1">1.0</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2">2.0</option>
        </select>
        <Sep />
        <Btn cmd="bold" title="Tebal (Ctrl+B)"><Bold className={ik} /></Btn>
        <Btn cmd="italic" title="Miring (Ctrl+I)"><Italic className={ik} /></Btn>
        <Btn cmd="underline" title="Garis bawah (Ctrl+U)"><Underline className={ik} /></Btn>
        <Btn cmd="strikeThrough" title="Coret"><Strikethrough className={ik} /></Btn>
        <Btn cmd="subscript" title="Subskrip (H₂O)"><Subscript className={ik} /></Btn>
        <Btn cmd="superscript" title="Superskrip (x²)"><Superscript className={ik} /></Btn>
        <label title="Warna teks" className="h-7 w-7 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-white text-slate-600 relative">
          <Baseline className={ik} />
          <input type="color" defaultValue="#dc2626" onChange={(e) => jalankan("foreColor", e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
        <label title="Warna sorot" className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-white text-slate-600 relative">
          <Highlighter className={ik} />
          <input type="color" defaultValue="#fef08a" onChange={(e) => jalankan("hiliteColor", e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
        <Sep />
        <Btn cmd="justifyLeft" title="Rata kiri"><AlignLeft className={ik} /></Btn>
        <Btn cmd="justifyCenter" title="Rata tengah"><AlignCenter className={ik} /></Btn>
        <Btn cmd="justifyRight" title="Rata kanan"><AlignRight className={ik} /></Btn>
        <Btn cmd="justifyFull" title="Rata kiri-kanan"><AlignJustify className={ik} /></Btn>
        <Sep />
        <Btn cmd="insertUnorderedList" title="Daftar berpoin"><List className={ik} /></Btn>
        <Btn cmd="insertOrderedList" title="Daftar bernomor"><ListOrdered className={ik} /></Btn>
        <Btn cmd="outdent" title="Kurangi indentasi (Shift+Tab)"><IndentDecrease className={ik} /></Btn>
        <Btn cmd="indent" title="Tambah indentasi (Tab)"><IndentIncrease className={ik} /></Btn>
        <Btn cmd="insertHorizontalRule" title="Garis pemisah"><Minus className={ik} /></Btn>
        <Sep />
        <Btn cmd="removeFormat" title="Hapus format"><RemoveFormatting className={ik} /></Btn>
        <Btn cmd="undo" title="Urungkan (Ctrl+Z)"><Undo2 className={ik} /></Btn>
        <Btn cmd="redo" title="Ulangi (Ctrl+Y)"><Redo2 className={ik} /></Btn>
      </div>

      <div className="relative">
        {kosong && (
          <span className="absolute left-3 top-2.5 text-[12px] text-slate-400 pointer-events-none">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onKeyUp={perbaruiStatus}
          onMouseUp={perbaruiStatus}
          className="konten-soal px-3 py-2.5 text-[12px] text-slate-900 outline-none max-h-[420px] overflow-y-auto"
          style={{ minHeight }}
        />
      </div>
    </div>
  )
}

/** Menampilkan isi soal berformat dengan aman (juga mendukung teks polos lama). */
export function RichTextView({ html, className = "" }: { html: string | null | undefined; className?: string }) {
  return (
    <div
      className={`konten-soal ${className}`}
      dangerouslySetInnerHTML={{ __html: keHtmlAman(html) }}
    />
  )
}
