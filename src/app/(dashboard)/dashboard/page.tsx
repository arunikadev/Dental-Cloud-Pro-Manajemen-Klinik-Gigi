"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, CalendarIcon, Users, AlertTriangle, DollarSign, MoreVertical, Settings, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatTime, getInitials, formatCurrency } from "@/lib/utils";
import { APPOINTMENT_STATUS_MAP } from "@/constants";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    todayAppointments: 5,
    totalPatients: 0,
    monthlyRevenue: 0,
    criticalStock: 3,
    completedToday: 2
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<{ name: string; qty: number; unit: string; urgent: boolean }[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      // Count Patients
      const { count: totalPatients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      // Calculate Monthly Revenue
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total_amount")
        .eq("status", "paid")
        .gte("issued_at", startOfMonth);
      
      const monthlyRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;

      // Fetch Low Stock Products (stock_quantity <= minimum_stock)
      const { data: lowStock } = await supabase
        .from("products")
        .select("name, stock_quantity, minimum_stock, unit, is_active")
        .eq("is_active", true)
        .filter("stock_quantity", "lte", "minimum_stock")
        .order("stock_quantity", { ascending: true })
        .limit(5);

      const mappedLowStock = (lowStock || []).map((p) => ({
        name: p.name,
        qty: p.stock_quantity,
        unit: `${p.unit} tersisa`,
        urgent: p.stock_quantity === 0 || p.stock_quantity < p.minimum_stock / 2,
      }));

      setLowStockItems(mappedLowStock);
      setStats(prev => ({
        ...prev,
        totalPatients: totalPatients || 0,
        monthlyRevenue,
        criticalStock: mappedLowStock.length,
      }));

      // Fetch Recent Appointments
      const { data: apts } = await supabase
        .from("appointments")
        .select("*, patient:patients(full_name), doctor:doctors(full_name)")
        .order("scheduled_at", { ascending: false })
        .limit(4);
      
      if (apts) setRecentAppointments(apts);
    }
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0D5A94] dark:text-blue-400">Clinic Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Welcome back. Here is what is happening at DentalCloud today.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => {
              const csv = "Laporan Dashboard DentalCloud\n" + new Date().toLocaleDateString("id-ID");
              const blob = new Blob([csv], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "laporan-dashboard.txt"; a.click();
            }}
            className="flex-1 sm:flex-none border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold gap-2"
          >
            <Download className="h-4 w-4" />
            Ekspor Laporan
          </Button>
          <Button
            onClick={() => router.push("/appointments")}
            className="flex-1 sm:flex-none bg-[#0D5A94] hover:bg-[#004271] text-white font-semibold gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Kelola Kalender
          </Button>
        </div>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[#0D5A94] dark:text-blue-400">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <span className="text-[#006b57] dark:text-green-400 text-[11px] font-bold bg-[#006b57]/10 px-2 py-1 rounded">
                +12% vs last week
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Today's Appointments</p>
            <h3 className="text-3xl font-extrabold text-[#0D5A94] dark:text-blue-400">{stats.todayAppointments}</h3>
            <p className="text-xs text-slate-400 mt-2">{stats.completedToday} completed, {stats.todayAppointments - stats.completedToday} pending</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-teal-50 rounded-lg text-[#006b57] dark:text-green-400">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-[#006b57] dark:text-green-400 text-[11px] font-bold bg-[#006b57]/10 px-2 py-1 rounded">
                New patients (+4)
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Patients</p>
            <h3 className="text-3xl font-extrabold text-[#0D5A94] dark:text-blue-400">{stats.totalPatients.toLocaleString("id-ID")}</h3>
            <p className="text-xs text-slate-400 mt-2">Active records updated daily</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="text-red-600 text-[11px] font-bold bg-red-50 px-2 py-1 rounded">
                Attention Required
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Critical Stock Items</p>
            <h3 className="text-3xl font-extrabold text-red-600">0{stats.criticalStock}</h3>
            <p className="text-xs text-slate-400 mt-2">Items below safety threshold</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-[#0D5A94] dark:text-blue-400">
                <Banknote className="h-7 w-7" />
              </div>
              <span className="text-[#006b57] dark:text-green-400 text-[11px] font-bold bg-[#006b57]/10 px-2 py-1 rounded">
                On track
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Weekly Revenue</p>
            <h3 className="text-3xl font-extrabold text-[#0D5A94] dark:text-blue-400">{formatCurrency(stats.monthlyRevenue || 14250000)}</h3>
            <p className="text-xs text-slate-400 mt-2">Target: {formatCurrency(15000000)} (95%)</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Bento Layout Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Appointments (Col 8) */}
        <Card className="col-span-1 lg:col-span-8 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-[#0D5A94] dark:text-blue-400">Recent Appointments</CardTitle>
              <p className="text-xs text-slate-400 mt-1">Live view of current and upcoming sessions</p>
            </div>
            <Button variant="link" className="text-[#0D5A94] dark:text-blue-400 font-bold">View All</Button>
          </CardHeader>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Procedure</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Doctor</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Belum ada jadwal janji temu
                    </td>
                  </tr>
                ) : recentAppointments.map((apt) => {
                  const statusInfo = APPOINTMENT_STATUS_MAP[apt.status as keyof typeof APPOINTMENT_STATUS_MAP] || { color: "text-slate-500 dark:text-slate-400", label: apt.status };
                  return (
                    <tr key={apt.id} className="hover:bg-teal-50/30 transition-colors even:bg-slate-50 dark:bg-slate-800 dark:even:bg-slate-800">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-blue-100 text-[#0D5A94] dark:text-blue-400">
                            <AvatarFallback className="text-[10px] font-bold bg-blue-100 text-[#0D5A94] dark:text-blue-400">
                              {getInitials(apt.patient?.full_name || "U K")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{apt.patient?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{apt.chief_complaint || "-"}</td>
                      <td className="px-6 py-4 font-medium">{formatTime(apt.scheduled_at)}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{apt.doctor?.full_name?.split(",")[0].replace("drg. ", "Dr. ") || "Dokter"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${statusInfo.color}`}>
                           <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
                           {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:bg-slate-100 dark:bg-slate-800">
                           <MoreVertical className="h-4 w-4" />
                         </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Side Panel (Col 4) */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          
          {/* Revenue Goal Card */}
          <div className="bg-[#0d5a94] text-white p-6 rounded-xl relative overflow-hidden shadow-sm">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Weekly Goal</h3>
              <p className="text-blue-100 text-xs mb-6">You are 95% towards your weekly revenue target. Keep it up!</p>
              <div className="w-full bg-white dark:bg-slate-900/20 h-2 rounded-full mb-4">
                <div className="bg-[#76f9d6] w-[95%] h-full rounded-full"></div>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span>{formatCurrency(stats.monthlyRevenue || 14250000)}</span>
                <span className="text-blue-200">Goal: {formatCurrency(15000000)}</span>
              </div>
            </div>
             <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                <DollarSign className="h-40 w-40" />
             </div>
          </div>

          {/* Low Stock Alerts */}
          <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="p-6 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#0D5A94] dark:text-blue-400">Low Stock</h3>
                <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {stats.criticalStock} ALERTS
                </span>
              </div>
            </div>
            <CardContent className="p-6 pt-0 space-y-4">
               {lowStockItems.length === 0 ? (
                 <p className="text-sm text-slate-400 text-center py-3">✅ Semua stok dalam kondisi aman</p>
               ) : (
                 lowStockItems.map((item, i) => (
                   <div key={i} className={`flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border-l-4 ${item.urgent ? 'border-red-500' : 'border-amber-400'}`}>
                     <div>
                       <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.name}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400">{item.qty} {item.unit}</p>
                     </div>
                     <Link href="/inventory">
                       <Button
                         variant="ghost"
                         className="text-[#0D5A94] dark:text-blue-400 text-[12px] font-bold hover:bg-white dark:bg-slate-900 px-2 py-1 h-auto transition-colors"
                       >
                         Kelola
                       </Button>
                     </Link>
                   </div>
                 ))
               )}
               <Link href="/inventory">
                 <Button
                   variant="outline"
                   className="w-full mt-4 border-[#0D5A94] text-[#0D5A94] dark:text-blue-400 hover:bg-[#0D5A94] hover:text-white transition-all font-bold"
                 >
                   Kelola Inventaris
                 </Button>
               </Link>
            </CardContent>
          </Card>

          {/* Clinical Tip Card */}
          <div className="relative group h-40 rounded-xl overflow-hidden cursor-pointer bg-slate-900">
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-5 z-10">
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Clinic Resources</span>
                <h4 className="text-white font-bold leading-tight">Digital X-Ray Systems Maintenance Guide</h4>
             </div>
             <div className="absolute inset-0 bg-slate-800 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                 <Settings className="w-16 h-16 text-slate-700 dark:text-slate-300 opacity-50" />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
