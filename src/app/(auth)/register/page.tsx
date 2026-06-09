"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Stethoscope, Mail, Lock, User, Building2, Phone, Loader2, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    clinicName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (!form.agreeTerms) {
      setError("Anda harus menyetujui syarat dan ketentuan.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password, role: "patient" }),
      });
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registrasi gagal. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left Decorative Side ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-slate-100 overflow-hidden">
        <img
          alt="Modern dental clinic environment"
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuDvmIz2S2mE9lqcKML-dm1oil-VMqGDdIvyaOzd3jLUG90Ykhqlo8MLDRKJh27UQxlvMWzRlXcKxZxAAolmQ8s_9vWhb0sBGOJa0s1lWS_CVj0dmMeA4hv-LsfNZDfPQdmkVKLLkUOwMm0BFvfCFOecbxk0A7xoICc9l_6kBcqT1g6XB-KWk1emu5kTUM6-tIO8jLxEIo2ZgWy_E12vQ-vNZohUEKL8r8skgcc-YBlSud-5CUJmF-QlidHvxrT-q9nDoXmGWSwPU"
        />
        <div className="absolute inset-0 bg-[#006b57]/40 mix-blend-multiply z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
        <div className="relative z-20 flex flex-col justify-end p-12 lg:p-16 w-full h-full">
          <div className="">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">DentalCloud Pro</span>
            </div>
            <p className="text-2xl font-semibold text-white mb-4 leading-tight">Mulai kelola klinik Anda secara profesional.</p>
            <p className="text-base text-white/70 leading-relaxed">
              Bergabunglah dengan ratusan klinik gigi yang telah mempercayakan manajemen operasional mereka kepada platform kami.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/20">
              {[
                { val: "500+", label: "Klinik Aktif" },
                { val: "2 Menit", label: "Setup Awal" },
                { val: "Gratis", label: "14 Hari Trial" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-black text-[#76f9d6]">{item.val}</p>
                  <p className="text-xs text-white/60 font-medium mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Side ── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col justify-center px-6 sm:px-12 md:px-20 py-8 bg-white relative overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto py-8">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 lg:mb-10">
            <div className="w-9 h-9 rounded-xl bg-[#0d5a94] flex items-center justify-center shadow-md shadow-blue-900/20">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-[#0d5a94] tracking-tight">DentalCloud Pro</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 mb-2 leading-tight tracking-tight">Daftar Klinik</h1>
            <p className="text-slate-500 text-sm leading-relaxed">Isi data berikut untuk membuat akun klinik Anda.</p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="fullName">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="fullName" type="text" required value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="drg. Sarah Amelia, Sp.Ort"
                  className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0d5a94] focus:ring-2 focus:ring-[#0d5a94]/20 transition-all"
                />
              </div>
            </div>

            {/* Clinic Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="clinicName">Nama Klinik</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="clinicName" type="text" required value={form.clinicName}
                  onChange={e => setForm(f => ({ ...f, clinicName: e.target.value }))}
                  placeholder="Klinik Gigi Sehat Abadi"
                  className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0d5a94] focus:ring-2 focus:ring-[#0d5a94]/20 transition-all"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="phone">No. HP</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="phone" type="tel" required value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0812..."
                    className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0d5a94] focus:ring-2 focus:ring-[#0d5a94]/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="email" type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="admin@klinik.com"
                    className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0d5a94] focus:ring-2 focus:ring-[#0d5a94]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="password" type={showPassword ? "text" : "password"} required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 karakter"
                  className="w-full pl-10 pr-12 h-11 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0d5a94] focus:ring-2 focus:ring-[#0d5a94]/20 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="confirmPassword">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="confirmPassword" type={showConfirm ? "text" : "password"} required value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Ulangi password Anda"
                  className="w-full pl-10 pr-12 h-11 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0d5a94] focus:ring-2 focus:ring-[#0d5a94]/20 transition-all"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={form.agreeTerms}
                onChange={e => setForm(f => ({ ...f, agreeTerms: e.target.checked }))}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#0d5a94] focus:ring-[#0d5a94]/30 shrink-0"
              />
              <span className="text-sm text-slate-500 leading-relaxed">
                Saya menyetujui{" "}
                <Link href="#" className="font-bold text-[#0d5a94] hover:underline">Syarat & Ketentuan</Link>
                {" "}dan{" "}
                <Link href="#" className="font-bold text-[#0d5a94] hover:underline">Kebijakan Privasi</Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 bg-[#0d5a94] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#004271] transition-colors shadow-md shadow-blue-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Mendaftar...</>
              ) : (
                "Daftarkan Klinik Saya"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-bold text-[#0d5a94] hover:text-[#004271] underline decoration-[#0d5a94]/30 underline-offset-4 transition-colors">
                Masuk sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-4 px-8">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure 256-bit Encrypted Connection • HIPAA Compliant
          </p>
        </div>
      </div>
    </div>
  );
}
