"use client";

import { useState, useEffect, Suspense } from "react";
import { useRole } from "@/contexts/role-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Printer, Edit, AlertTriangle, Image as ImageIcon, FileText, LayoutGrid, Pill, X, Save, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

// ─── Modal Edit Patient Details ────────────────────────────────────────────
function EditDetailsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "Eleanor Fitzgerald", dob: "1989-05-12", gender: "Perempuan", phone: "+1 (555) 012-3456", email: "eleanor.f@email.com", address: "123 Oak Street, Portland" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); onClose(); }, 1000);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 md:pl-[276px]" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full  border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Data Pasien</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-lg font-semibold text-center">✓ Data pasien berhasil diperbarui!</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Tanggal Lahir</label>
              <Input type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Jenis Kelamin</label>
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#0D5A94]/30">
                <option>Laki-laki</option><option>Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">No. Telepon</label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-10 rounded-xl" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Alamat</label>
              <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="h-10 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#0D5A94] hover:bg-[#004271] text-white font-bold gap-2 px-6">
            <Save className="h-4 w-4" />{saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Issue New Prescription ──────────────────────────────────────────
function PrescriptionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ drug: "", dosage: "", duration: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!form.drug) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); onClose(); setForm({ drug: "", dosage: "", duration: "", notes: "" }); }, 1000);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 md:pl-[276px]" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full  border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resep Obat Baru</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-lg font-semibold text-center">✓ Resep berhasil diterbitkan!</div>}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nama Obat *</label>
            <Input value={form.drug} onChange={e => setForm(p => ({ ...p, drug: e.target.value }))} placeholder="cth: Amoxicillin 500mg" className="h-10 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Dosis</label>
              <Input value={form.dosage} onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))} placeholder="3x sehari" className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Durasi</label>
              <Input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="5 hari" className="h-10 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Catatan</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Diminum setelah makan..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#0D5A94]/30 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving || !form.drug} className="bg-[#006b57] hover:bg-[#004a3c] text-white font-bold gap-2 px-6">
            <Pill className="h-4 w-4" />{saving ? "Menerbitkan..." : "Terbitkan Resep"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Utama ──────────────────────────────────────────────────────────
function MedicalRecordsContent() {
  const { isDoctor, isLoading: roleLoading } = useRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patient_id');
  
  const [patient, setPatient] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("All Record Types");

  useEffect(() => {
    if (!roleLoading && !isDoctor) router.replace("/dashboard");
  }, [roleLoading, isDoctor, router]);

  useEffect(() => {
    async function load() {
      if (!patientId) { setLoadingPatient(false); return; }
      try {
        const data = await apiFetch('/patients');
        const found = (data as any[]).find((p:any) => p.id === patientId);
        if (found) setPatient(found);
      } catch (e) { console.error(e); }
      setLoadingPatient(false);
    }
    load();
  }, [patientId]);

  if (roleLoading || loadingPatient) return <div className="flex items-center justify-center h-64 text-slate-400">Memuat data...</div>;
  if (!isDoctor) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500 dark:text-slate-400">
      <ShieldAlert className="h-12 w-12 text-red-400" />
      <p className="font-semibold">Halaman ini hanya untuk Dokter.</p>
    </div>
  );

  const handleConfirmAttendance = () => {
    setShowConfirmToast(true);
    setTimeout(() => setShowConfirmToast(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 max-w-7xl mx-auto">
      <EditDetailsModal open={showEdit} onClose={() => setShowEdit(false)} />
      <PrescriptionModal open={showPrescription} onClose={() => setShowPrescription(false)} />

      {/* Toast Confirm Attendance */}
      {showConfirmToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#0D5A94] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right-4">
          <span className="text-lg">✓</span>
          <div>
            <p className="font-bold text-sm">Kehadiran dikonfirmasi!</p>
            <p className="text-xs text-blue-200">Jadwal Nov 12 telah diperbarui.</p>
          </div>
          <button onClick={() => setShowConfirmToast(false)}><X className="h-4 w-4 text-blue-300" /></button>
        </div>
      )}

      {/* ── Patient Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-400">{getInitials(patient?.full_name || "Eleanor Fitzgerald")}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#76f9d6] text-[#002019] px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-white dark:border-slate-900">
              AKTIF
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D5A94] dark:text-blue-400">{patient?.full_name || "Eleanor Fitzgerald"}</h2>
              <span className="text-slate-400 text-sm font-medium">{patient?.patient_code || "#PAT-99201"}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-slate-600 dark:text-slate-300 text-sm mt-2">
              <span className="font-medium">{patient?.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() + " tahun" : "34 tahun"}</span>
              <span className="font-medium capitalize">{patient?.gender === 'male' ? 'Laki-laki' : patient?.gender === 'female' ? 'Perempuan' : 'Perempuan'}</span>
              <span className="font-medium">{patient?.phone || "+1 (555) 012-3456"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={handlePrint} variant="outline" className="flex-1 sm:flex-none border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold gap-2">
            <Printer className="h-4 w-4" /> Cetak File
          </Button>
          <Button onClick={() => setShowEdit(true)} className="flex-1 sm:flex-none bg-[#0D5A94] hover:bg-[#004271] text-white font-semibold gap-2">
            <Edit className="h-4 w-4" /> Edit Detail
          </Button>
        </div>
      </div>

      {/* ── Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-6 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex shrink-0 items-center justify-center text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-3">Peringatan Medis Kritis</h3>
            <div className="flex flex-wrap gap-3">
              {[["ALERGI PENISILIN", "red"], ["SENSITIF LATEX", "red"], ["DIABETES TIPE 2", "amber"]].map(([label, color]) => (
                <Badge key={label} variant="outline" className={`bg-white dark:bg-slate-900 border-${color}-200 text-${color}-700 py-1.5 px-3 gap-2`}>
                  <span className={`w-2 h-2 rounded-full bg-${color}-500`} /> {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xs font-bold text-slate-400 mb-4 tracking-widest uppercase">Ringkasan</h3>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-sm text-slate-500 dark:text-slate-400">Kunjungan Terakhir</span><span className="text-sm font-bold text-slate-900 dark:text-white">14 Okt 2023</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500 dark:text-slate-400">Skor Kebersihan</span><span className="text-sm font-bold text-[#006b57] dark:text-green-400">8.5 / 10</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500 dark:text-slate-400">Tagihan</span><span className="text-sm font-bold text-red-600">Rp 0</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── History & Sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* History Timeline */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#0D5A94] dark:text-blue-400">Riwayat Klinis</h3>
            <select
              value={historyFilter}
              onChange={e => setHistoryFilter(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#0D5A94]/20 text-slate-700 dark:text-slate-200"
            >
              <option>All Record Types</option>
              <option>Treatments</option>
              <option>Diagnoses</option>
            </select>
          </div>

          <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100 dark:bg-slate-800 dark:before:bg-slate-800">
            {/* Record 1 */}
            {(historyFilter === "All Record Types" || historyFilter === "Treatments") && (
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-[#0D5A94] flex items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-[#0D5A94]" />
                </div>
                <Card className="border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">14 Okt 2023 • 10:30</span>
                          <span className="px-2 py-0.5 bg-[#76f9d6]/30 text-[#00725d] rounded-full text-[10px] font-bold">SELESAI</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Scaling & Deep Root Planing</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Oleh drg. Bima Pratama, Sp.BM</p>
                      </div>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">#TRT-00942</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Diagnosis</span>
                        <p className="text-sm font-semibold text-[#0D5A94] dark:text-blue-400">Gingivitis - Grade II</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Anestesi</span>
                        <p className="text-sm font-semibold text-[#0D5A94] dark:text-blue-400">Topical Gel (Lidokain 5%)</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-50 dark:bg-blue-900/20/50 dark:bg-blue-900/10 p-4 rounded-lg italic border border-blue-100/50">
                      &quot;Pasien melaporkan sensitivitas ringan di kuadran kiri bawah. Scaling selesai dengan perdarahan minimal. Gingiva menunjukkan inflamasi sedang.&quot;
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-wrap gap-4">
                      <Button variant="link" className="text-[#0D5A94] dark:text-blue-400 text-xs font-bold p-0 h-auto gap-1"><ImageIcon className="h-3.5 w-3.5" /> Foto Intraoral (4)</Button>
                      <Button variant="link" className="text-[#0D5A94] dark:text-blue-400 text-xs font-bold p-0 h-auto gap-1"><FileText className="h-3.5 w-3.5" /> Laporan Lab</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Record 2 */}
            {(historyFilter === "All Record Types" || historyFilter === "Treatments") && (
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center z-10" />
                <Card className="border-slate-100 dark:border-slate-800 shadow-sm opacity-80">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">22 Agu 2023 • 14:15</span>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Tambal Gigi (Resin Komposit)</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gigi #14 Disto-Oklusal</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 mt-3">
                      <p className="text-sm text-slate-600 dark:text-slate-300">Restorasi Kelas II selesai. Oklusi diperiksa dan disesuaikan. Shade A2 digunakan.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {historyFilter === "Diagnoses" && (
              <div className="text-center py-8 text-slate-400 text-sm">Tidak ada data diagnosis terpisah untuk ditampilkan.</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dental Chart */}
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-xs font-bold text-[#0D5A94] dark:text-blue-400 mb-4 flex items-center gap-2 tracking-widest uppercase">
                <LayoutGrid className="h-4 w-4" /> Status Odontogram
              </h3>
              <div className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center p-4 border border-dashed border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-8 gap-1 w-full h-full content-start">
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <div key={n} className={`w-full h-8 rounded flex items-center justify-center text-[10px] font-bold ${n === 3 ? "bg-red-100 border border-red-200 text-red-600" : "bg-blue-50 dark:bg-blue-900/30 text-[#0D5A94] dark:text-blue-400"}`}>{n}</div>
                  ))}
                  {[32,31,30,29,28,27,26,25].map(n => (
                    <div key={n} className={`w-full h-8 rounded flex items-center justify-center text-[10px] font-bold mt-1 ${n === 29 ? "bg-amber-100 border border-amber-200 text-amber-600 dark:text-amber-400" : "bg-blue-50 dark:bg-blue-900/30 text-[#0D5A94] dark:text-blue-400"}`}>{n}</div>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded" /><span className="text-slate-500 dark:text-slate-400">Perlu Ekstraksi</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded" /><span className="text-slate-500 dark:text-slate-400">Pemantauan Karies</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Active Medications */}
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-xs font-bold text-[#0D5A94] dark:text-blue-400 mb-4 flex items-center gap-2 tracking-widest uppercase">
                <Pill className="h-4 w-4" /> Obat Aktif
              </h3>
              <div className="space-y-4">
                <div className="border-l-2 border-[#006b57] pl-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Chlorhexidine Gluconate 0.12%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Obat Kumur - 15ml dua kali sehari</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase">Berakhir 28 Okt 2023</p>
                </div>
              </div>
              <Button
                onClick={() => setShowPrescription(true)}
                variant="outline"
                className="w-full mt-6 border-slate-200 dark:border-slate-700 text-[#0D5A94] dark:text-blue-400 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 font-bold text-xs h-9"
              >
                Terbitkan Resep Baru
              </Button>
            </CardContent>
          </Card>

          {/* Next Appointment */}
          <div className="bg-[#0D5A94] rounded-xl p-6 text-white shadow-md shadow-blue-900/20">
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-4">Jadwal Berikutnya</h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-white dark:bg-slate-900/10 rounded-xl flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold opacity-90">NOV</span>
                <span className="text-xl font-black">12</span>
              </div>
              <div>
                <p className="font-bold text-base">Pemeriksaan & Polishing</p>
                <p className="text-xs opacity-80 mt-0.5">09:30 - Ruang 2B</p>
              </div>
            </div>
            <Button
              onClick={handleConfirmAttendance}
              className="w-full bg-white dark:bg-slate-900 text-[#0D5A94] dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20 font-black text-xs h-10 tracking-wide"
            >
              KONFIRMASI KEHADIRAN
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MedicalRecordsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400">Memuat...</div>}>
      <MedicalRecordsContent />
    </Suspense>
  );
}
