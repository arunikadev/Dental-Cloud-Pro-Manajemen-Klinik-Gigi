"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, FileText,
  Package, Receipt, BarChart3, Database,
  Stethoscope, LogOut, HelpCircle, CalendarPlus, X, Menu, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppointmentFormDialog } from "@/components/features/appointments/appointment-form-dialog";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/contexts/role-context";

const NAV_ITEMS = [
  // ── Semua Role ──────────────────────────────────────────────────────
  { label: "Dasbor",          href: "/dashboard",       icon: LayoutDashboard, roles: ["admin", "doctor", "cashier"] },
  { label: "Pasien",          href: "/patients",        icon: Users,           roles: ["admin", "doctor", "cashier"] },
  { label: "Jadwal",          href: "/appointments",    icon: CalendarDays,    roles: ["admin", "doctor", "cashier"] },

  // ── Klinis (Dokter saja) ─────────────────────────────────────────────
  { label: "Rekam Medis",     href: "/medical-records", icon: FileText,        roles: ["doctor"] },
  { label: "Inventaris",      href: "/inventory",       icon: Package,         roles: ["admin", "doctor"] },

  // ── Keuangan (Admin + Kasir) ─────────────────────────────────────────
  { label: "Kasir & Billing", href: "/billing",         icon: Receipt,         roles: ["admin", "cashier"] },

  // ── Manajemen (Admin saja) ───────────────────────────────────────────
  { label: "Laporan",         href: "/reports",         icon: BarChart3,       roles: ["admin"] },
  { label: "Pengguna",        href: "/users",            icon: UserCog,         roles: ["admin"] },
  { label: "Master Data",     href: "/settings",        icon: Database,        roles: ["admin"] },
];


export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const { role } = useRole();
  const userRole = role || "cashier"; // fallback paling terbatas

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  const SidebarContent = () => (
    <>
      {/* ── Logo ── */}
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d5a94] shadow-lg shadow-blue-900/20">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-[#0d5a94] leading-none">DentalCloud</h1>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Clinical Excellence
            </p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {visibleItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={label}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "nav-item-active font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0d5a94] dark:hover:text-blue-400"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-[#0d5a94]" : "text-slate-400")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* ── Footer ── */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-4 space-y-1">
        {/* CTA – New Appointment */}
        {(userRole === "admin" || userRole === "cashier") && (
          <button
            onClick={() => { setIsOpen(false); setIsAppointmentOpen(true); }}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#0d5a94] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/15 hover:bg-[#004271] active:scale-[0.98] transition-all duration-150 mb-3"
          >
            <CalendarPlus className="h-4 w-4" />
            Buat Janji Baru
          </button>
        )}

        <Link
          href="/help"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0d5a94] dark:hover:text-blue-400 transition-colors"
        >
          <HelpCircle className="h-[18px] w-[18px] text-slate-400" />
          Bantuan
        </Link>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-[18px] w-[18px]" />
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className="fixed top-3.5 left-4 z-50 md:hidden p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar – Desktop fixed, Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-[260px] flex-col border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-300",
          "md:translate-x-0",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Appointment Dialog */}
      <AppointmentFormDialog
        open={isAppointmentOpen}
        onOpenChange={setIsAppointmentOpen}
      />
    </>
  );
}



