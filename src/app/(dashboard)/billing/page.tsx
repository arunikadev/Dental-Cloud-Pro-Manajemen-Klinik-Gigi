"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CreditCard, Download, FileText, Filter, PlusCircle, Search,
  DollarSign, ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
  X, User, Stethoscope, CheckSquare, ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

// ─── Modal Buat Tagihan Baru ────────────────────────────────────────────────
function CreateInvoiceModal({ open, onClose, onSuccess }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [form, setForm] = useState({
    patient_id: "",
    service_ids: [] as string[],
    payment_method: "tunai",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!open) return;
    apiFetch('/patients')
      .then(data => { if (Array.isArray(data)) setPatients(data); });
    apiFetch('/services')
      .then(data => { if (Array.isArray(data)) setServices(data); });
  }, [open]);

  const [discount, setDiscount] = useState(0);

  const selectedServices = services.filter(s => form.service_ids.includes(s.id));
  const subtotal = selectedServices.reduce((sum, s) => sum + Number(s.base_price), 0);
  const totalAmount = Math.max(0, subtotal - discount);

  const toggleService = (id: string) => {
    setForm(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(id)
        ? prev.service_ids.filter(x => x !== id)
        : [...prev.service_ids, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.patient_id) { setToast("Pilih pasien terlebih dahulu!"); return; }
    if (form.service_ids.length === 0) { setToast("Pilih minimal 1 layanan!"); return; }
    setIsSaving(true);
    try {
      const now = new Date();
      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Date.now().toString().slice(-4)}`;
      const result = await apiFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          invoice: {
            invoice_number: invoiceNumber,
            patient_id: form.patient_id,
            subtotal: subtotal,
            discount_amount: discount,
            tax_amount: 0,
            total_amount: totalAmount,
            status: "issued",
            issued_at: now.toISOString(),
            notes: form.notes || null,
          },
          items: selectedServices.map(s => ({
            item_type: "service",
            service_id: s.id,
            description: s.name,
            quantity: 1,
            unit_price: Number(s.base_price),
          })),
        }),
      });
      onSuccess();
      onClose();
      setForm({ patient_id: "", service_ids: [], payment_method: "tunai", notes: "" });
      setDiscount(0);
    } catch (err: any) {
      setToast(err.message || "Gagal menyimpan tagihan.");
    } finally {
      setIsSaving(false);
    }
  };

  const [patientSearch, setPatientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  const filteredPatients = useMemo(() =>
    patients.filter(p =>
      (p.full_name || "").toLowerCase().includes(patientSearch.toLowerCase()) ||
      (p.patient_code || "").toLowerCase().includes(patientSearch.toLowerCase())
    ), [patients, patientSearch]);

  const filteredServices = useMemo(() =>
    services.filter(s =>
      (s.name || "").toLowerCase().includes(serviceSearch.toLowerCase()) ||
      (s.code || "").toLowerCase().includes(serviceSearch.toLowerCase())
    ), [services, serviceSearch]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 md:pl-[276px]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buat Tagihan Baru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Isi data pasien dan layanan yang diberikan</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {toast && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg flex items-center justify-between">
              {toast}
              <button onClick={() => setToast("")}><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* Pilih Pasien */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              <User className="inline h-3.5 w-3.5 mr-1" /> Pasien
            </label>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {/* Search pasien */}
              <div className="relative border-b border-slate-100 dark:border-slate-800">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Cari nama atau ID pasien..."
                  className="w-full pl-8 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>
              {/* Selected display */}
              {form.patient_id && (() => {
                const sel = patients.find(p => p.id === form.patient_id);
                return sel ? (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-sm">
                    <span className="font-semibold text-[#0D5A94] dark:text-blue-400">{sel.full_name} <span className="text-xs font-normal text-slate-400">({sel.patient_code})</span></span>
                    <button onClick={() => setForm(p => ({ ...p, patient_id: "" }))} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null;
              })()}
              {/* List */}
              <div className="max-h-40 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Pasien tidak ditemukan</p>
                ) : filteredPatients.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setForm(prev => ({ ...prev, patient_id: p.id })); setPatientSearch(""); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-0 ${
                      form.patient_id === p.id ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.full_name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{p.patient_code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pilih Layanan */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Stethoscope className="inline h-3.5 w-3.5 mr-1" /> Layanan
              </label>
              {form.service_ids.length > 0 && (
                <span className="bg-[#0D5A94] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {form.service_ids.length} dipilih
                </span>
              )}
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {/* Search layanan */}
              <div className="relative border-b border-slate-100 dark:border-slate-800">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  placeholder="Cari layanan..."
                  className="w-full pl-8 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredServices.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Memuat layanan...</p>
                ) : filteredServices.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                      form.service_ids.includes(s.id)
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.code}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#0D5A94] dark:text-blue-400">{formatCurrency(s.base_price)}</span>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        form.service_ids.includes(s.id)
                          ? "bg-[#0D5A94] border-[#0D5A94]"
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {form.service_ids.includes(s.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diskon + Catatan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Diskon (Rp)</label>
              <Input
                type="number"
                min={0}
                value={discount || ""}
                onChange={e => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="rounded-xl border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Catatan (Opsional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={1}
                placeholder="Tambahkan catatan..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0D5A94]/30 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0 rounded-b-2xl">
          <div>
            {discount > 0 && <p className="text-xs text-red-500 font-medium">Diskon: -{formatCurrency(discount)}</p>}
            <p className="text-xs text-slate-400">{form.service_ids.length} layanan • Subtotal {formatCurrency(subtotal)}</p>
            <p className="text-2xl font-black text-[#0D5A94] dark:text-blue-400">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Batal</Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="bg-[#0D5A94] hover:bg-[#004271] text-white font-bold px-6">
              {isSaving ? "Menyimpan..." : "Simpan Tagihan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Utama ──────────────────────────────────────────────────────────
export default function BillingPage() {
  const [activeStatus, setActiveStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [successToast, setSuccessToast] = useState("");
  const PER_PAGE = 10;

  const router = useRouter();

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/invoices');
      if (Array.isArray(data)) setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const displayStatus = inv.status === "paid" ? "Lunas" : inv.status === "cancelled" ? "Batal" : "Pending";
      const name = inv.patients?.full_name || "";
      const matchStatus = activeStatus === "Semua" || displayStatus === activeStatus;
      const matchSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.invoice_number || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [invoices, activeStatus, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PER_PAGE));
  const pagedInvoices = filteredInvoices.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = useMemo(() => {
    let revenue = 0, outstanding = 0, successfulCount = 0;
    invoices.forEach(inv => {
      if (inv.status === "paid") { revenue += Number(inv.total_amount || 0); successfulCount++; }
      else { outstanding += Number(inv.total_amount || 0); }
    });
    return { revenue, outstanding, successfulCount };
  }, [invoices]);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-[1440px] mx-auto">
      <CreateInvoiceModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => { fetchInvoices(); setSuccessToast("Tagihan berhasil dibuat!"); setTimeout(() => setSuccessToast(""), 3000); }}
      />

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 text-sm font-semibold animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle className="h-4 w-4" />
          {successToast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0D5A94] dark:text-blue-400">Kasir & Pembayaran</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola transaksi pasien, faktur, dan laporan pendapatan klinik.</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#0D5A94] hover:bg-[#004271] text-white font-bold shadow-lg shadow-blue-900/10 gap-2 h-11 px-6"
        >
          <PlusCircle className="h-5 w-5" /> Buat Tagihan Baru
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> Bulan Ini
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Pendapatan</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.revenue)}</h3>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center mb-4">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Belum Dibayar</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatCurrency(stats.outstanding)}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Dari {invoices.length - stats.successfulCount} tagihan aktif</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="h-5 w-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Transaksi Berhasil</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.successfulCount}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Transaksi lunas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="h-5 w-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Tagihan</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{invoices.length}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Semua tagihan terdaftar</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabel Tagihan ── */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider whitespace-nowrap">
              Daftar Tagihan
            </h3>
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              {["Semua", "Lunas", "Pending"].map(status => (
                <Button
                  key={status}
                  variant="ghost"
                  onClick={() => { setActiveStatus(status); setPage(1); }}
                  className={`px-4 py-1.5 h-auto text-xs font-bold rounded-none ${
                    activeStatus === status
                      ? "bg-[#0D5A94] text-white hover:bg-[#004271] hover:text-white"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64 mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari pasien, no. invoice..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-9 h-9 text-sm rounded-full bg-white dark:bg-slate-800"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const csv = ["No. Invoice,Pasien,Tanggal,Total,Status",
                  ...filteredInvoices.map(i =>
                    `${i.invoice_number},${i.patients?.full_name || ""},${formatDateShort(i.issued_at)},${i.total_amount},${i.status === "paid" ? "Lunas" : "Pending"}`
                  )].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "tagihan.csv"; a.click();
              }}
              className="text-slate-400 hover:text-[#0D5A94] dark:text-blue-400 shrink-0 h-9 w-9"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <tr>
                {["No. Invoice", "Pasien", "Tanggal", "Total", "Status", "Aksi"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest ${i === 4 ? "text-center" : i === 5 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : pagedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <FileText className="h-7 w-7 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-semibold">Belum ada tagihan</p>
                      <p className="text-xs text-slate-400 max-w-xs">Buat tagihan baru dengan menekan tombol &quot;Buat Tagihan Baru&quot; di atas.</p>
                    </div>
                  </td>
                </tr>
              ) : pagedInvoices.map(inv => {
                const isPaid = inv.status === "paid";
                return (
                  <tr key={inv.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer even:bg-slate-50 dark:bg-slate-800 dark:even:bg-slate-800" onClick={() => router.push(`/billing/${inv.id}`)}>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{inv.patients?.full_name || "—"}</p>
                      <p className="text-[10px] text-slate-400">Tindakan Medis</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{formatDateShort(inv.issued_at)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-emerald-500" : "bg-amber-50 dark:bg-amber-900/200"}`} />
                        {isPaid ? "Lunas" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0D5A94] dark:text-blue-400" onClick={() => router.push(`/billing/${inv.id}`)} title="Lihat Detail">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0D5A94] dark:text-blue-400" onClick={() => router.push(`/billing/${inv.id}?print=1`)} title="Cetak Struk">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination — hanya tampil jika > 1 halaman */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Menampilkan {Math.min((page - 1) * PER_PAGE + 1, filteredInvoices.length)}–{Math.min(page * PER_PAGE, filteredInvoices.length)} dari {filteredInvoices.length} tagihan
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 text-xs font-bold p-0 ${page === p ? "bg-[#0D5A94] text-white hover:bg-[#004271]" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}
                >
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
