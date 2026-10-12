"use client"

import React, { useState } from "react"
import { Maximize2, X } from "lucide-react"

export function ImageWithZoom({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!src) return null

  return (
    <>
      <div className="relative group inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || "Gambar Soal"}
          className={className}
          onClick={() => setIsOpen(true)}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = "none"
          }}
          style={{ cursor: "zoom-in" }}
        />
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute bottom-2 right-2 hidden group-hover:flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-bold backdrop-blur-sm transition"
        >
          <Maximize2 className="w-3 h-3" />
          Perbesar
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex flex-col"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt || "Gambar Diperbesar"}
              className="max-w-full max-h-full object-contain cursor-zoom-out bg-white/5 rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
