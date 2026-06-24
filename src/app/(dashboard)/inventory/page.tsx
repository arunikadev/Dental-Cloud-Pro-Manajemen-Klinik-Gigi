"use client";

import { useState, useMemo, useEffect } from "react";
import { useRole } from "@/contexts/role-context";
import { useRouter } from "next/navigation";
import { RefreshCw, PlusCircle, Package, AlertTriangle, AlertCircle, DollarSign, Download, MoreVertical, Search, ScanLine, ChevronLeft, ChevronRight, Activity, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  code: string;
  description?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
  is_active: boolean;
  category?: { name: string } | null;
};

type StockMovement = {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  notes?: string;
  created_at: string;
};

function getStatus(p: Product) {
  if (p.stock_quantity === 0) return "empty";
  if (p.stock_quantity <= p.minimum_stock) return "low";
  return "ok";
}


function AddProductModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", code: "", category: "Obat", stock: "", unit: "", purchase_price: "", selling_price: "", minimum_stock: "5" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name || !form.code) return;
    setSaving(true); setError("");
    try {
      const { apiFetch } = await import("@/lib/api-client");
      await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          unit: form.unit || "pcs",
          stock_quantity: Number(form.stock) || 0,
          minimum_stock: Number(form.minimum_stock) || 5,
          purchase_price: Number(form.purchase_price) || 0,
          selling_price: Number(form.selling_price) || 0,
        }),
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); onSuccess(); setForm({ name: "", code: "", category: "Obat", stock: "", unit: "", purchase_price: "", selling_price: "", minimum_stock: "5" }); }, 1200);
    } catch (e: any) {
      setError(e?.message || "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 md:pl-[276px]" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Produk Baru</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg font-semibold text-center">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nama Produk *</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="cth: Amoxicillin 500mg" className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Kode Produk *</label>
              <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="PH-AMX-500" className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Satuan</label>
              <Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="Box, Strip, Botol..." className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Stok Awal</label>
              <Input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="0" className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Stok Minimum</label>
              <Input type="number" value={form.minimum_stock} onChange={e => setForm(p => ({ ...p, minimum_stock: e.target.value }))} placeholder="5" className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Harga Beli</label>
              <Input type="number" value={form.purchase_price} onChange={e => setForm(p => ({ ...p, purchase_price: e.target.value }))} placeholder="0" className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Harga Jual</label>
              <Input type="number" value={form.selling_price} onChange={e => setForm(p => ({ ...p, selling_price: e.target.value }))} placeholder="0" className="h-10 rounded-xl" />
            </div>
          </div>
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-lg font-semibold text-center">✓ Produk berhasil ditambahkan!</div>}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name || !form.code} className="bg-[#0D5A94] hover:bg-[#004271] text-white font-bold gap-2 px-6">
            {saving ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RestockModal({ open, onClose, products, onSuccess }: { open: boolean; onClose: () => void; products: Product[]; onSuccess: () => void }) {
  const [selected, setSelected] = useState("");
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!selected || !qty) return;
    setSaving(true); setError("");
    try {
      const { apiFetch } = await import("@/lib/api-client");
      await apiFetch("/stock-movements", {
        method: "POST",
        body: JSON.stringify({ product_id: selected, type: "in", quantity: Number(qty), notes: "Restock manual" }),
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); onSuccess(); setSelected(""); setQty(""); }, 1200);
    } catch (e: any) {
      setError(e?.message || "Gagal menyimpan restock");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 md:pl-[276px]" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Restock Produk</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800"><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg font-semibold">{error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-lg font-semibold text-center">✓ Restock berhasil!</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Pilih Produk</label>
              <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#0D5A94]/30">
                <option value="">-- Pilih produk --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock_quantity} {p.unit})</option>)}
              </select>
            </div>  
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Jumlah Tambahan</label>
            <Input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="Masukkan jumlah..." className="h-10 rounded-xl" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={saving || !selected || !qty} className="bg-[#006b57] hover:bg-[#004a3c] text-white font-bold gap-2 px-6">
            <RefreshCw className="h-4 w-4" />{saving ? "Menyimpan..." : "Konfirmasi Restock"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { isDoctor, isAdmin, isLoading: roleLoading } = useRole();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const PER_PAGE = 5;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const [prods, movs] = await Promise.all([
        apiFetch<Product[]>("/products").catch(() => [] as Product[]),
        apiFetch<StockMovement[]>("/stock-movements").catch(() => [] as StockMovement[]),
      ]);
      setProducts(prods);
      setMovements(movs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && !isDoctor && !isAdmin) router.replace("/dashboard");
  }, [roleLoading, isDoctor, isAdmin, router]);

  useEffect(() => {
    if (!roleLoading && (isDoctor || isAdmin)) fetchData();
  }, [roleLoading, isDoctor, isAdmin]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const cat = p.category?.name || "Lainnya";
      const matchCat = activeCategory === "Semua" || cat === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  if (roleLoading || isLoading) return <div className="flex items-center justify-center h-64 text-slate-400">Memuat...</div>;
  if (!isDoctor && !isAdmin) return null;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Hitung stats
  const totalProduk = products.length;
  const stokMenipis = products.filter(p => getStatus(p) === "low").length;
  const stokHabis = products.filter(p => getStatus(p) === "empty").length;
  const nilaiInventaris = products.reduce((sum, p) => sum + p.stock_quantity * p.purchase_price, 0);
  const kategoriCount = new Set(products.map(p => p.category?.name || "Lainnya")).size;

  const statusBadge = (s: string) => {
    if (s === "ok") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Tersedia</span>;
    if (s === "low") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-orange-100 text-orange-700 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />Stok Menipis</span>;
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 uppercase"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Habis</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-[1440px] mx-auto">
      <AddProductModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchData} />
      <RestockModal open={showRestock} onClose={() => setShowRestock(false)} products={products} onSuccess={fetchData} />

      {/* Header — breadcrumb dihapus */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#004271] dark:text-white">Manajemen Inventaris</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau stok bahan klinis dan farmasi secara real-time.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button onClick={() => setShowRestock(true)} variant="outline" className="flex-1 md:flex-none border-2 border-[#006b57] text-[#006b57] dark:text-green-400 font-bold hover:bg-[#006b57]/5 gap-2">
            <RefreshCw className="h-4 w-4" /> Restock
          </Button>
          <Button onClick={() => setShowAdd(true)} className="flex-1 md:flex-none bg-[#0D5A94] hover:bg-[#004271] text-white font-bold shadow-lg shadow-blue-900/20 gap-2">
            <PlusCircle className="h-4 w-4" /> Tambah Produk
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm"><CardContent className="p-6">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-[#0D5A94] dark:text-blue-400 mb-4"><Package className="h-5 w-5" /></div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Produk</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalProduk}</h3>
          <p className="text-[10px] text-slate-400 mt-2">Dari {kategoriCount} kategori</p>
        </CardContent></Card>
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm"><CardContent className="p-6">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 mb-4"><AlertTriangle className="h-5 w-5" /></div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Stok Menipis</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stokMenipis}</h3>
          <p className="text-[10px] text-slate-400 mt-2">Perlu segera restock</p>
        </CardContent></Card>
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm"><CardContent className="p-6">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600 mb-4"><AlertCircle className="h-5 w-5" /></div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Stok Habis</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stokHabis}</h3>
          <p className="text-[10px] text-slate-400 mt-2">Perlu pengadaan segera</p>
        </CardContent></Card>
        <Card className="bg-[#0D5A94] border-transparent shadow-xl text-white"><CardContent className="p-6">
          <div className="w-10 h-10 bg-white dark:bg-slate-900/10 rounded-lg flex items-center justify-center text-white mb-4"><DollarSign className="h-5 w-5" /></div>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Nilai Inventaris</p>
          <h3 className="text-2xl font-black mt-1">{formatCurrency(nilaiInventaris)}</h3>
          <div className="w-full bg-white dark:bg-slate-900/20 h-1.5 rounded-full mt-4 overflow-hidden"><div className="bg-[#76f9d6] w-3/4 h-full rounded-full" /></div>
        </CardContent></Card>
      </div>

      {/* Katalog Produk */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider whitespace-nowrap">Katalog Produk</h3>
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              {["Semua", "Obat", "Alat"].map(cat => (
                <Button key={cat} variant="ghost" onClick={() => { setActiveCategory(cat); setPage(1); }}
                  className={`px-4 py-1.5 h-auto text-xs font-bold rounded-none ${activeCategory === cat ? "bg-[#0D5A94] text-white hover:bg-[#004271] hover:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700"}`}>
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Cari barang, SKU..." className="pl-9 h-9 text-sm rounded-full bg-white dark:bg-slate-800" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                {["Nama Produk", "Kategori", "Stok", "Satuan", "Status", "Aksi"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest ${i === 2 ? "text-center" : i === 5 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Tidak ada produk yang sesuai.</td></tr>
              ) : paged.map(item => {
                const cat = item.category?.name || "Lainnya";
                const status = getStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group even:bg-slate-50 dark:bg-slate-800 dark:even:bg-slate-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {cat === "Obat" ? <Activity className="h-4 w-4 text-slate-400" /> : <Package className="h-4 w-4 text-slate-400" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</p>
                          <p className="text-[10px] text-slate-400">Kode: {item.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${cat === "Obat" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"}`}>{cat}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-slate-900 dark:text-white">{item.stock_quantity}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">{item.unit}</td>
                    <td className="px-6 py-4">{statusBadge(status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button onClick={() => setShowRestock(true)} variant="ghost" size="sm" className="h-7 text-xs text-[#006b57] dark:text-green-400 hover:bg-emerald-50 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Restock</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0D5A94] dark:text-blue-400"><MoreVertical className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination — hanya tampil jika > 1 halaman */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Menampilkan <span className="text-slate-900 dark:text-white font-bold">{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)}</span> dari {filtered.length} produk
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button key={p} onClick={() => setPage(p)} className={`h-8 w-8 text-xs font-bold p-0 ${page === p ? "bg-[#0D5A94] text-white hover:bg-[#004271]" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}>{p}</Button>
              ))}
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </Card>

      {/* Pergerakan Stok */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Pergerakan Stok Terakhir</h4>
              <Button variant="link" className="text-xs text-[#0D5A94] dark:text-blue-400 font-bold p-0 h-auto">Lihat Semua</Button>
            </div>
            <div className="space-y-5">
              {movements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada pergerakan stok.</p>
              ) : movements.slice(0, 5).map((m) => {
                const prod = products.find(p => p.id === m.product_id);
                const isIn = m.type === "in";
                return (
                  <div key={m.id} className="flex items-start gap-4">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isIn ? "bg-green-500" : "bg-red-500"}`} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {isIn ? "Stok Masuk" : "Stok Keluar"}: {prod?.name || m.product_id}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isIn ? "+" : "-"}{m.quantity} {prod?.unit || ""} {m.notes ? `· ${m.notes}` : ""}
                      </p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardContent className="p-6">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Distribusi Vendor</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Ringkasan sumber pasokan dan keandalan pengadaan.</p>
            <div className="space-y-3">
              {[["Medline Industries", "bg-[#0D5A94]", "45%"], ["Patterson Dental", "bg-[#006b57]", "30%"], ["Lainnya", "bg-slate-200", "25%"]].map(([name, color, pct]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{pct}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAB Scan */}
      <button
        onClick={() => alert("Fitur scan barcode akan segera hadir.")}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#0D5A94] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50"
        title="Scan Barcode"
      >
        <ScanLine className="h-6 w-6" />
      </button>
    </div>
  );
}
