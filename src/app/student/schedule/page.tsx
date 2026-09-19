"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import { getCurrentUser } from "@/app/actions/auth"
import { getStudentSchedule } from "@/app/actions/student"
import { 
  ArrowLeft, 
  Clock, 
  UserRound,
  Calendar,
  MapPin
} from "lucide-react"

export default function SchedulePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState("Senin")

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]

  useEffect(() => {
    async function load() {
      const [user, scheds] = await Promise.all([getCurrentUser(), getStudentSchedule()])
      setCurrentUser(user)
      setSchedules(scheds)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat jadwal..." />
    )
  }

  const className = currentUser?.studentClasses?.[0]?.classInfo?.name || "Kelas"
  const hasScheduleModel = schedules.length > 0 && schedules[0]?.day

  // Filter by selected day
  const filteredSchedules = hasScheduleModel
    ? schedules.filter((s: any) => s.day === selectedDay)
    : []

  // Fallback: if schedule comes from ClassTeacher (no day field), show as simple list
  const fallbackSchedule = !hasScheduleModel ? schedules : []

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link href="/student" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Jadwal Pembelajaran</h2>
            <p className="text-[11px] text-slate-500 font-medium">{className} • Semester Ganjil</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
          Roster Aktif
        </span>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Jadwal</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Jadwal pelajaran belum diinput oleh guru atau admin. Jadwal akan muncul di sini setelah diatur.
            </p>
          </div>
        </div>
      ) : hasScheduleModel ? (
        <>
          {/* Day Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  selectedDay === d
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Schedule List */}
          <div className="flex flex-col gap-2.5">
            {filteredSchedules.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic bg-white rounded-3xl border border-slate-200/80">
                Tidak ada jadwal pada hari {selectedDay}
              </div>
            ) : (
              filteredSchedules.map((item: any, idx: number) => {
                const isUpacara = item.type === "UPACARA"
                const isPembiasaan = item.type === "PEMBIASAAN"
                const isSpecial = isUpacara || isPembiasaan

                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-3xl bg-white border transition-all flex flex-col gap-2 ${
                      isSpecial
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-slate-200/80 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSpecial ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        {isUpacara
                          ? "UPC"
                          : isPembiasaan
                            ? "PMB"
                            : /* Sebelumnya di sini ditampilkan tiga huruf pertama
                                 dari UUID mapel — misalnya "A3F". Pakai nama
                                 mapelnya. */
                              (item.subject?.name?.slice(0, 3).toUpperCase() || "MP")}
                      </div>

                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {/* Nama mapel didahulukan; sebelumnya setiap jadwal
                              reguler hanya bertuliskan kata "Pelajaran". */}
                          {item.subject?.name ||
                            item.label ||
                            (isUpacara
                              ? "Upacara Bendera"
                              : isPembiasaan
                                ? "Pembiasaan"
                                : "Pelajaran")}
                        </h4>

                        {item.teacher?.name && (
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <UserRound className="w-3 h-3 text-slate-400" /> {item.teacher.name}
                          </p>
                        )}

                        {item.room && (
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {item.room}
                          </p>
                        )}

                        {item.jamPelajaran?.name && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.jamPelajaran.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {item.sessionStart} - {item.sessionEnd} WIB
                      </span>
                      {item.type !== "REGULAR" && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      ) : (
        /* Fallback: simple subject list from ClassTeacher */
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mata Pelajaran Kelas Anda</h3>
          <div className="flex flex-col gap-2">
            {fallbackSchedule.map((s: any, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{s.mapel}</h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <UserRound className="w-3 h-3" /> {s.guru}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
