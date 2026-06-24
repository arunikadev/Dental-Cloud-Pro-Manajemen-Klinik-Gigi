"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, Shield, Search, MoreVertical, UserPlus,
  Crown, Stethoscope, Receipt, X, RefreshCw,
  CheckCircle2, AlertTriangle, Loader2, UserX, Eye, EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRole } from "@/contexts/role-context";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppUser {
  id: string;
  email: string;
  role: "admin" | "doctor" | "cashier" | "patient";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  admin:   { label: "Admin",   icon: Crown,       color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
  doctor:  { label: "Dokter",  icon: Stethoscope, color: "text-[#0D5A94] dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  cashier: { label: "Kasir",   icon: Receipt,     color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
  patient: { label: "Pasien",  icon: Users,       color: "text-slate-600 dark:text-slate-400",   bg: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(d: string | null) {
  if (!d) return "Belum pernah";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

// ─── Modal Tambah Akun ────────────────────────────────────────────────────────
function AddUserModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", role: "cashier" });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Email dan password wajib diisi."); return; }
    if (form.password.length < 8) { setError("Password minimal 8 karakter."); return; }
    if (form.password !== form.confirmPassword) { setError("Konfirmasi password tidak cocok."); return; }

    setSaving(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password, role: form.role }),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        onSuccess();
        setForm({ email: "", password: "", confirmPassword: "", role: "cashier" });
      }, 1500);
    } catch (e: any) {
      setError(e?.message || "Gagal membuat akun. Email mungkin sudah terdaftar.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 md:pl-[276px]" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0D5A94]/10 rounded-lg flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-[#0D5A94] dark:text-blue-400" />
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white">Tambah Akun Baru</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
              <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-xl">
              <CheckCircle2 className="h-4 w-4 shrink-0" />Akun berhasil dibuat!
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Alamat Email *</label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="nama@klinik.com"
              className="h-10 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Role / Jabatan *</label>
            <select
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0D5A94]/30"
            >
              <option value="admin">Admin</option>
              <option value="doctor">Dokter</option>
              <option value="cashier">Kasir</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Password *</label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min. 8 karakter"
                className="h-10 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Konfirmasi Password *</label>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Ulangi password"
              className="h-10 rounded-xl"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || success}
            className="bg-[#0D5A94] hover:bg-[#004271] text-white font-bold gap-2 px-6"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Menyimpan...</> : "Buat Akun"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Konfirmasi Nonaktifkan ─────────────────────────────────────────────
function DeactivateModal({ user, onClose, onConfirm }: { user: AppUser; onClose: () => void; onConfirm: () => void }) {
  const [loading, setLoading] = useState(false);
  const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.patient;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 md:pl-[276px]" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Nonaktifkan Akun?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Pengguna <span className="font-bold text-slate-800 dark:text-white">{user.email}</span> tidak akan bisa login lagi.
          </p>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.color} ${cfg.bg}`}>
            <cfg.icon className="h-3.5 w-3.5" />{cfg.label}
          </span>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirm();
              setLoading(false);
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Nonaktifkan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { isAdmin, isLoading: roleLoading } = useRole();
  const router = useRouter();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AppUser | null>(null);

  // RBAC guard
  useEffect(() => {
    if (!roleLoading && !isAdmin) router.replace("/dashboard");
  }, [roleLoading, isAdmin, router]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<AppUser[]>("/users");
      setUsers(data);
    } catch (e) {
      console.error("Gagal fetch users:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && isAdmin) fetchUsers();
  }, [roleLoading, isAdmin]);

  const handleDeactivate = async (userId: string) => {
    try {
      await apiFetch(`/users/${userId}`, { method: "DELETE" });
      setDeactivateTarget(null);
      fetchUsers();
    } catch (e) {
      console.error("Gagal nonaktifkan:", e);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminCount = users.filter(u => u.role === "admin").length;
  const doctorCount = users.filter(u => u.role === "doctor").length;
  const cashierCount = users.filter(u => u.role === "cashier").length;

  if (roleLoading || isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-[#0D5A94]" />
    </div>
  );
  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500 max-w-6xl mx-auto">
      {/* Modal */}
      <AddUserModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchUsers} />
      {deactivateTarget && (
        <DeactivateModal
          user={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={() => handleDeactivate(deactivateTarget.id)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0D5A94] dark:text-blue-400">Kelola Pengguna</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manajemen akun dan hak akses sistem.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchUsers}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 gap-2 font-semibold"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            onClick={() => setShowAdd(true)}
            className="bg-[#0D5A94] hover:bg-[#004271] text-white font-bold gap-2 shadow-lg shadow-blue-900/20"
          >
            <UserPlus className="h-4 w-4" /> Tambah Akun
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Akun", value: totalUsers, icon: Users, color: "text-[#0D5A94] dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Aktif", value: activeUsers, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Admin", value: adminCount, icon: Crown, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Dokter", value: doctorCount, icon: Stethoscope, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
        ].map((s, i) => (
          <Card key={i} className="border-slate-100 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabel Pengguna */}
      <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari email pengguna..."
              className="pl-9 h-9 text-sm rounded-full bg-white dark:bg-slate-800"
            />
          </div>
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            {[["all", "Semua"], ["admin", "Admin"], ["doctor", "Dokter"], ["cashier", "Kasir"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterRole(val)}
                className={`px-4 py-1.5 text-xs font-bold transition-colors ${filterRole === val ? "bg-[#0D5A94] text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                {["Pengguna", "Role", "Status", "Login Terakhir", "Terdaftar", "Aksi"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    {search ? "Tidak ditemukan pengguna dengan email tersebut." : "Belum ada pengguna."}
                  </td>
                </tr>
              ) : filtered.map(user => {
                const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.patient;
                const RoleIcon = cfg.icon;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    {/* Pengguna */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-xl">
                          <AvatarFallback className={`text-xs font-bold rounded-xl ${cfg.bg} ${cfg.color}`}>
                            {getInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{user.email}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.color} ${cfg.bg}`}>
                        <RoleIcon className="h-3.5 w-3.5" />{cfg.label}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Nonaktif
                        </span>
                      )}
                    </td>
                    {/* Login Terakhir */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {timeAgo(user.last_login_at)}
                    </td>
                    {/* Terdaftar */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {fmtDate(user.created_at)}
                    </td>
                    {/* Aksi */}
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuSeparator />
                          {user.is_active && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => setDeactivateTarget(user)}
                            >
                              <UserX className="h-4 w-4 mr-2" />Nonaktifkan
                            </DropdownMenuItem>
                          )}
                          {!user.is_active && (
                            <DropdownMenuItem className="text-slate-400 cursor-not-allowed" disabled>
                              Sudah nonaktif
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span> dari {totalUsers} pengguna
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="h-3.5 w-3.5" />
            Hanya admin yang bisa melihat halaman ini
          </div>
        </div>
      </Card>
    </div>
  );
}
