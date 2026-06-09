"use client";

import { useState, useEffect, useRef, use } from "react";
import {
  ArrowLeft, Printer, CheckCircle, Clock, CreditCard, Banknote,
  Smartphone, X, Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateLong, formatTime } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

// ─── Payment Modal ────────────────────────────────────────────────
function PaymentModal({ open, onClose, invoice, onSuccess }: {
  open: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess: () => void;
}) {
  const [method, setMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = Number(invoice?.total_amount || 0);
  const paid = Number(amountPaid) || 0;
  const change = Math.max(0, paid - total);

  const handlePay = async () => {
    if (paid < total) { setError("Jumlah bayar kurang!"); return; }
    setSaving(true);
    setError("");
    try {
      const payNum = `PAY-${Date.now().toString().slice(-8)}`;
      await apiFetch(`/invoices/${invoice.id}`, {
        method: 'POST',
        body: JSON.stringify({
          payment_number: payNum,
          amount: total,
          method: method,
          notes: change > 0 ? `Kembalian: ${formatCurrency(change)}` : null,
        }),
      });

      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "Gagal memproses pembayaran.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const methods = [
    { key: "cash", label: "Tunai", icon: Banknote },
    { key: "transfer", label: "Transfer", icon: CreditCard },
    { key: "qris", label: "QRIS", icon: Smartphone },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 md:pl-[276px]"
      onClick={onClose}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[480px] max-w-[calc(100vw-2rem)] border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Proses Pembayaran</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{invoice?.invoice_number}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          {/* Total */}
          <div className="text-center bg-gradient-to-br from-[#0D5A94] to-[#0a4a7a] rounded-xl p-5 text-white">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Total Tagihan</p>
            <p className="text-3xl font-black mt-1">{formatCurrency(total)}</p>
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {methods.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.key}
                    onClick={() => setMethod(m.key)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      method === m.key
                        ? "bg-[#0D5A94] text-white border-[#0D5A94] shadow-lg shadow-blue-900/20"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0D5A94]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Jumlah Dibayar (Rp)
            </label>
            <Input
              type="number"
              min={0}
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              placeholder={total.toString()}
              className="text-lg font-bold rounded-xl h-12"
              autoFocus
            />
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 flex-wrap">
            {[total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000].filter((v, i, a) => a.indexOf(v) === i).map(amount => (
              <button
                key={amount}
                onClick={() => setAmountPaid(amount.toString())}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:bg-blue-900/20 dark:hover:bg-blue-900/20 hover:border-[#0D5A94] transition-colors"
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>

          {/* Change */}
          {paid >= total && paid > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Kembalian</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(change)}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
          <Button
            onClick={handlePay}
            disabled={saving || paid < total}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {saving ? "Memproses..." : "Konfirmasi Bayar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt Component ─────────────────────────────────────────────
function ReceiptView({ invoice, items, payment }: { invoice: any; items: any[]; payment: any }) {
  return (
    <div id="receipt-content" className="bg-white dark:bg-slate-900 text-black p-6 w-[300px] mx-auto text-xs font-mono">
      {/* Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <p className="text-base font-black tracking-wide">🦷 KLINIK GIGI</p>
        <p className="text-[10px] text-gray-500 mt-1">Jl. Contoh No. 123, Kota</p>
        <p className="text-[10px] text-gray-500">Telp: (021) 1234567</p>
      </div>

      {/* Invoice info */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3 space-y-1">
        <div className="flex justify-between"><span className="text-gray-500">No:</span><span className="font-bold">{invoice.invoice_number}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tgl:</span><span>{formatDateLong(invoice.issued_at)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Jam:</span><span>{formatTime(invoice.issued_at)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Pasien:</span><span className="font-bold">{invoice.patients?.full_name || "—"}</span></div>
      </div>

      {/* Items */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        {items.map((item, i) => (
          <div key={i} className="mb-1.5">
            <p className="font-semibold">{item.description}</p>
            <div className="flex justify-between text-gray-600">
              <span>{item.quantity}x {formatCurrency(item.unit_price)}</span>
              <span>{formatCurrency(item.quantity * item.unit_price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal || invoice.total_amount)}</span></div>
        {Number(invoice.discount_amount) > 0 && (
          <div className="flex justify-between text-red-600"><span>Diskon</span><span>-{formatCurrency(invoice.discount_amount)}</span></div>
        )}
        <div className="flex justify-between font-black text-sm border-t border-gray-400 pt-1 mt-1">
          <span>TOTAL</span><span>{formatCurrency(invoice.total_amount)}</span>
        </div>
      </div>

      {/* Payment info */}
      {payment && (
        <div className="border-t border-dashed border-gray-400 pt-3 mb-3 space-y-1">
          <div className="flex justify-between"><span>Metode:</span><span className="uppercase font-bold">{payment.method}</span></div>
          <div className="flex justify-between"><span>Dibayar:</span><span>{formatCurrency(payment.amount)}</span></div>
          {payment.notes && payment.notes.includes("Kembalian") && (
            <div className="flex justify-between font-bold"><span>Kembalian:</span><span>{payment.notes.replace("Kembalian: ", "")}</span></div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center border-t border-dashed border-gray-400 pt-3 mt-3">
        <p className="font-bold">Terima Kasih!</p>
        <p className="text-[10px] text-gray-500 mt-1">Semoga lekas sembuh 😊</p>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/invoices/${id}`);
      if (data.invoice) {
        setInvoice(data.invoice);
        setItems(data.items || []);
        setPayment(data.payment || null);
      } else {
        setInvoice(data);
        setItems(data.items || []);
        setPayment(data.payments?.[0] || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (!loading && invoice && searchParams.get("print") === "1") {
      setShowReceipt(true);
    }
  }, [loading, invoice, searchParams]);

  const handlePrint = () => {
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const isPaid = invoice?.status === "paid";

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-48" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400 text-lg">Tagihan tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/billing")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-content, #receipt-content * { visibility: visible !important; }
          #receipt-content { position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: 300px; }
        }
      `}</style>

      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-500 print:hidden">
        {/* Back + Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => router.push("/billing")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0D5A94] dark:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Tagihan
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2 text-sm">
              <Printer className="h-4 w-4" /> Cetak Struk
            </Button>
            {!isPaid && (
              <Button
                onClick={() => setShowPayModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 h-10 px-5 shadow-lg shadow-emerald-600/20"
              >
                <CreditCard className="h-4 w-4" /> Bayar Sekarang
              </Button>
            )}
          </div>
        </div>

        {/* INVOICE PAPER DESIGN */}
        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden relative">
          
          {/* Header Banner */}
          <div className={`px-8 py-6 flex items-center justify-between text-white ${
            isPaid ? "bg-emerald-600" : "bg-[#0D5A94]"
          }`}>
            <div>
              <h1 className="text-3xl font-black tracking-wider uppercase opacity-90">Invoice</h1>
              <p className="font-mono text-sm opacity-80 mt-1">{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase shadow-sm ${
                isPaid ? "bg-white dark:bg-slate-900 text-emerald-700" : "bg-white dark:bg-slate-900 text-[#0D5A94] dark:text-blue-400"
              }`}>
                {isPaid ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                {isPaid ? "LUNAS" : "BELUM DIBAYAR"}
              </span>
            </div>
          </div>

          {/* Clinic & Patient Info */}
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-dashed border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ditagihkan Kepada:</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{invoice.patients?.full_name || "—"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">ID: {invoice.patients?.patient_code}</p>
              {invoice.patients?.phone && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{invoice.patients.phone}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informasi Tagihan:</p>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-slate-500 dark:text-slate-400 mr-2">Tanggal Terbit:</span> <span className="font-semibold text-slate-900 dark:text-white">{formatDateLong(invoice.issued_at)}</span></p>
                <p><span className="text-slate-500 dark:text-slate-400 mr-2">Waktu:</span> <span className="font-semibold text-slate-900 dark:text-white">{formatTime(invoice.issued_at)}</span></p>
                {payment?.paid_at && (
                  <p><span className="text-slate-500 dark:text-slate-400 mr-2">Dibayar Pada:</span> <span className="font-semibold text-emerald-600">{formatDateLong(payment.paid_at)}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-8">
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Layanan & Deskripsi</th>
                    <th className="px-5 py-3 text-center text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 w-24">Qty</th>
                    <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 w-36">Harga (Rp)</th>
                    <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 w-40">Subtotal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Tidak ada item layanan.</td></tr>
                  ) : items.map((item, i) => (
                    <tr key={i} className="even:bg-slate-50/50 dark:even:bg-slate-800/30">
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{item.description}</td>
                      <td className="px-5 py-4 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                      <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-300">{formatCurrency(item.unit_price)}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.quantity * item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Payment summary */}
          <div className="p-8 pt-0 flex flex-col md:flex-row gap-8 justify-between">
            {/* Notes or Payment Detail */}
            <div className="flex-1">
              {payment ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle className="h-5 w-5" /> Detail Pembayaran
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Metode</p>
                      <p className="font-semibold text-slate-900 dark:text-white uppercase mt-0.5">{payment.method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">No Referensi</p>
                      <p className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5">{payment.payment_number}</p>
                    </div>
                    {payment.notes && (
                      <div className="col-span-2">
                         <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catatan Tambahan</p>
                         <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{payment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : invoice.notes ? (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Catatan:</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{invoice.notes}</p>
                </div>
              ) : (
                <div className="hidden md:block text-slate-400 italic text-sm pt-4">Terima kasih atas kunjungan Anda.</div>
              )}
            </div>

            {/* Pricing totals */}
            <div className="md:w-80 space-y-3 shrink-0 bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(invoice.subtotal || invoice.total_amount)}</span>
              </div>
              
              {Number(invoice.discount_amount) > 0 && (
                <div className="flex justify-between items-center text-sm font-medium text-rose-500">
                  <span>Diskon</span>
                  <span className="font-bold">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              
              {Number(invoice.tax_amount) > 0 && (
                <div className="flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                  <span>Pajak (PPN)</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              
              <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-600 flex justify-between items-end">
                <span className="font-black text-slate-900 dark:text-white">TOTAL</span>
                <span className={`text-2xl font-black ${isPaid ? "text-emerald-600" : "text-[#0D5A94] dark:text-blue-400"}`}>
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>

              {isPaid && (
                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-600 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Total Dibayar</span>
                  <span className="font-black text-emerald-600">{formatCurrency(payment?.amount || invoice.total_amount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt (hidden, shown for print) */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 md:pl-[276px] print:bg-transparent print:backdrop-blur-none" onClick={() => setShowReceipt(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b print:hidden">
              <h3 className="font-bold text-sm">Preview Struk</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => window.print()} className="bg-[#0D5A94] text-white gap-1.5 text-xs">
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
                <button onClick={() => setShowReceipt(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <ReceiptView invoice={invoice} items={items} payment={payment} />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={showPayModal}
        onClose={() => setShowPayModal(false)}
        invoice={invoice}
        onSuccess={fetchData}
      />
    </>
  );
}
