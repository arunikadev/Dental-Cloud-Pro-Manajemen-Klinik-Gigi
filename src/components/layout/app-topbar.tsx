"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Search, Settings, ChevronDown, Check, AlertCircle, CalendarClock, PhoneCall, Cake, ServerCog, X, LogOut, User, Moon, Sun, FileText, Package, Users } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockNotifications } from "@/lib/mock-data";
import { formatRelative } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NOTIFICATION_TYPE_ICON: Record<string, React.ReactNode> = {
  stock_alert:           <AlertCircle className="h-4 w-4 text-red-500" />,
  appointment_reminder:  <CalendarClock className="h-4 w-4 text-blue-500" />,
  follow_up:             <PhoneCall className="h-4 w-4 text-orange-500" />,
  birthday:              <Cake className="h-4 w-4 text-purple-500" />,
  system:                <ServerCog className="h-4 w-4 text-slate-500" />,
};

const SEARCH_SUGGESTIONS = [
  { label: "Halaman Pasien", desc: "Daftar semua pasien terdaftar", href: "/patients", icon: Users },
  { label: "Rekam Medis", desc: "Catatan klinis dan riwayat perawatan", href: "/medical-records", icon: FileText },
  { label: "Inventaris", desc: "Stok obat dan alat klinis", href: "/inventory", icon: Package },
  { label: "Kasir & Billing", desc: "Tagihan dan transaksi pembayaran", href: "/billing", icon: CalendarClock },
];

export function AppTopbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const unreadCount = mockNotifications.filter((n) => !n.is_read).length;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [userRole, setUserRole] = useState("admin");
  const [userName, setUserName] = useState("Loading...");

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user?.user_metadata?.role || "admin";
      const name = data.session?.user?.user_metadata?.full_name || data.session?.user?.email || "User";
      setUserRole(role);
      setUserName(name);
    });
  }, []);

  useEffect(() => {
    if (showSearchModal) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearchModal]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter(s =>
    search === "" || s.label.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuggestionClick = (href: string) => {
    setShowSearchModal(false);
    setSearch("");
    router.push(href);
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-0 md:left-[260px] z-40 flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md px-4 md:px-8 shadow-sm shadow-slate-200/40 dark:shadow-none">
        {/* ── Search (Desktop) ── */}
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            readOnly
            onClick={() => setShowSearchModal(true)}
            placeholder="Cari pasien, rekam medis, stok..."
            className="pl-9 rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-[#0d5a94] h-9 cursor-pointer"
          />

        </div>

        {/* Mobile Search Button */}
        <button
          className="sm:hidden p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          onClick={() => setShowSearchModal(true)}
        >
          <Search className="h-5 w-5" />
        </button>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none focus:ring-2 focus:ring-[#0d5a94]">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifikasi</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs h-5 px-1.5">
                      {unreadCount} baru
                    </Badge>
                  )}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {mockNotifications.map((notif) => (
                <DropdownMenuItem key={notif.id} className="flex items-start gap-3 py-3 cursor-pointer">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mt-0.5">
                    {NOTIFICATION_TYPE_ICON[notif.type] ?? <Bell className="h-4 w-4 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.is_read ? "font-semibold" : "font-medium"}`}>
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">{formatRelative(notif.created_at)}</p>
                  </div>
                  {notif.is_read && <Check className="h-3 w-3 text-slate-300 mt-1 shrink-0" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/notifications" className="justify-center text-xs font-semibold text-[#0d5a94] w-full flex">
                  Lihat Semua Notifikasi
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex outline-none focus:ring-2 focus:ring-[#0d5a94]"
              title="Toggle Dark Mode"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}

          {/* Settings shortcut → App Settings (admin only) */}
          {userRole === "admin" && (
            <Link
              href="/pengaturan"
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex"
              title="Pengaturan Aplikasi"
            >
              <Settings className="h-5 w-5" />
            </Link>
          )}

          {/* Divider */}
          <div className="mx-1 h-7 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 transition-colors outline-none focus:ring-2 focus:ring-[#0d5a94]">
              <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                <AvatarFallback className="bg-[#0d5a94] text-white text-xs font-semibold uppercase">
                  {userName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left mr-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none truncate max-w-[120px]">{userName}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium capitalize">{userRole}</p>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-slate-500 font-normal">Masuk sebagai</DropdownMenuLabel>
              <DropdownMenuItem disabled className="font-bold text-[#0d5a94] text-sm">
                {userName}
              </DropdownMenuItem>
            </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                <User className="h-4 w-4 text-slate-400 mr-2" /> Profil Saya
              </DropdownMenuItem>
              {userRole === "admin" && (
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/pengaturan")}>
                  <Settings className="h-4 w-4 text-slate-400 mr-2" /> Pengaturan
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Global Search Modal ── */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
          onClick={() => { setShowSearchModal(false); setSearch(""); }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full  overflow-hidden border border-slate-100 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari pasien, rekam medis, inventaris..."
                className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                onKeyDown={e => {
                  if (e.key === "Escape") { setShowSearchModal(false); setSearch(""); }
                }}
              />
              <button
                onClick={() => { setShowSearchModal(false); setSearch(""); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Suggestions */}
            <div className="p-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
                {search ? `Hasil untuk "${search}"` : "Navigasi Cepat"}
              </p>
              <div className="space-y-0.5">
                {filteredSuggestions.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.href}
                      onClick={() => handleSuggestionClick(s.href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-[#0d5a94] dark:text-blue-400 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{s.label}</p>
                        <p className="text-xs text-slate-500 truncate">{s.desc}</p>
                      </div>
                      <kbd className="hidden group-hover:inline-flex h-5 items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] text-slate-500">
                        →
                      </kbd>
                    </button>
                  );
                })}
                {filteredSuggestions.length === 0 && (
                  <div className="px-3 py-6 text-center text-slate-400 text-sm">
                    Tidak ada hasil untuk &quot;{search}&quot;
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[10px] text-slate-400">
              <span><kbd className="font-mono font-bold">↵</kbd> Pilih</span>
              <span><kbd className="font-mono font-bold">Esc</kbd> Tutup</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
