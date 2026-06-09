"use client";

import { useState } from "react";
import { Search, Filter, Download, Plus, MoreVertical, ChevronLeft, ChevronRight, Check, Users, TrendingUp, Hourglass, CheckCircle2, BriefcaseMedical, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDateShort, getInitials } from "@/lib/utils";
import { Patient } from "@/types";
import { useTable } from "@/hooks/use-table";
import { supabase } from "@/lib/supabase";
import { useEffect, useState as useReactState } from "react";
import { apiFetch } from "@/lib/api-client";
import { PatientFormDialog } from "@/components/features/patients/patient-form-dialog";
import { AppointmentFormDialog } from "@/components/features/appointments/appointment-form-dialog";
import { useRouter } from "next/navigation";

export default function PatientsPage() {
  const router = useRouter();
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [dbPatients, setDbPatients] = useReactState<Patient[]>([]);
  const [isLoading, setIsLoading] = useReactState(true);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<Patient[]>('/patients');
      setDbPatients(data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const {
    query, setQuery,
    rows: patients,
    page, setPage, totalPages,
    totalRows
  } = useTable<Patient>({
    data: dbPatients,
    searchKeys: ["full_name", "patient_code", "phone"],
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [appointmentPatientId, setAppointmentPatientId] = useState<string>("");

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0D5A94] dark:text-blue-400">Manajemen Pasien</h2>
          <p className="text-slate-500 dark:text-slate-400">Kelola dan lacak seluruh rekam medis pasien di satu tempat.</p>
        </div>
        <Button className="bg-[#0D5A94] hover:bg-[#004271] text-white" onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Pasien Baru
        </Button>
      </div>

      {/* ── Stats Bento ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Pasien", value: "1,284", icon: <Users className="h-6 w-6" />, bg: "bg-blue-50 dark:bg-blue-900/20", color: "text-[#0D5A94] dark:text-blue-400" },
          { label: "Baru Bulan Ini", value: "42", icon: <TrendingUp className="h-6 w-6" />, bg: "bg-green-50 dark:bg-green-900/20", color: "text-green-600 dark:text-green-400" },
          { label: "Kasus Aktif", value: "156", icon: <BriefcaseMedical className="h-6 w-6" />, bg: "bg-orange-50", color: "text-orange-600" },
          { label: "Selesai", value: "89%", icon: <CheckCircle2 className="h-6 w-6" />, bg: "bg-purple-50 dark:bg-purple-900/20", color: "text-purple-600 dark:text-purple-400" },
        ].map((stat, i) => (
          <Card key={i} className="border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Table Card ── */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-800 dark:text-white">Direktori Pasien</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Semua Pasien</Badge>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari ID, Nama, atau No. HP..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-900" 
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0" title="Filter">
              <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0" title="Export">
              <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </Button>
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">ID Pasien</th>
                <th className="px-6 py-4 font-bold tracking-wider">Nama Pasien</th>
                <th className="px-6 py-4 font-bold tracking-wider">No. HP</th>
                <th className="px-6 py-4 font-bold tracking-wider">Tgl Daftar</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {patients.length > 0 ? patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-blue-50/30 transition-colors group even:bg-slate-50 dark:bg-slate-800 dark:even:bg-slate-800">
                  <td className="px-6 py-4 font-semibold text-[#0D5A94] dark:text-blue-400">{patient.patient_code}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-slate-100 dark:border-slate-800">
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                          {getInitials(patient.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{patient.full_name}</p>
                        {patient.email && <p className="text-xs text-slate-400">{patient.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{patient.phone || "-"}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDateShort(patient.registered_at)}</td>
                  <td className="px-6 py-4">
                    <Badge className={patient.is_active ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-50 dark:bg-green-900/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"}>
                      {patient.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 hover:text-[#0D5A94] dark:text-blue-400 transition-colors outline-none">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/medical-records?patient_id=${patient.id}`)}>Lihat Profil</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/medical-records?patient_id=${patient.id}`)}>Rekam Medis</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAppointmentPatientId(patient.id); setIsAppointmentOpen(true); }}>Buat Janji Temu</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    {isLoading ? "Memuat data pasien..." : "Tidak ada pasien ditemukan."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan {patients.length} dari {totalRows} pasien
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm font-medium">{page}</span>
              <span className="text-xs text-slate-400">/ {totalPages}</span>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Promo Area ── */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 md:pl-[276px]" onClick={() => setShowCampaignModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-[#0D5A94] dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mulai Kampanye Pengingat</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sistem akan mengirim pengingat otomatis via WhatsApp/Email ke {dbPatients.length > 0 ? dbPatients.length : "semua"} pasien yang belum berkunjung lebih dari 6 bulan.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCampaignModal(false)} className="flex-1">Batal</Button>
              <Button className="flex-1 bg-[#0D5A94] hover:bg-[#004271] text-white font-bold" onClick={() => { setShowCampaignModal(false); alert("Kampanye berhasil dijadwalkan! Pengingat akan dikirim dalam 24 jam."); }}>
                Konfirmasi
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-[#0D5A94] p-8 text-white flex flex-col justify-center min-h-[200px]">
          <div className="relative z-10">
            <h4 className="text-xl font-bold mb-2">Automated Check-ups</h4>
            <p className="text-sm text-blue-100 mb-6 leading-relaxed">
              Jadwalkan pengingat pembersihan karang gigi otomatis untuk pasien yang belum berkunjung lebih dari 6 bulan.
            </p>
            <Button onClick={() => setShowCampaignModal(true)} className="bg-white dark:bg-slate-900 text-[#0D5A94] dark:text-blue-400 hover:bg-slate-50 dark:bg-slate-800 font-bold">
              Mulai Kampanye
            </Button>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 flex flex-col justify-center min-h-[200px]">
          <h4 className="text-xl font-bold text-[#0D5A94] dark:text-blue-400 mb-2">Dental Intelligence</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Alat diagnostik AI baru kami dapat membantu menganalisis X-ray digital untuk menemukan karies tahap awal dengan akurasi 98%.
          </p>
          <button onClick={() => router.push("/help")} className="text-[#0D5A94] dark:text-blue-400 font-bold text-sm hover:underline inline-flex items-center gap-1">
            Pelajari fitur AI <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <PatientFormDialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) fetchPatients(); // Refresh data when modal closes
      }} />

      <AppointmentFormDialog 
        open={isAppointmentOpen} 
        onOpenChange={setIsAppointmentOpen} 
        defaultPatientId={appointmentPatientId} 
      />
    </div>
  );
}
