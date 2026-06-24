"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Stethoscope, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { apiFetch, setToken } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", remember: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ access_token: string; token_type: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        }
      );
      setToken(data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal. Periksa email dan password Anda.");
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
        <div className="absolute inset-0 bg-[#004271]/40 mix-blend-multiply z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
        <div className="relative z-20 flex flex-col justify-end p-12 lg:p-16 w-full h-full">
          <div className="">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">DentalCloud Pro</span>
            </div>
            <p className="text-2xl font-semibold text-white mb-4 leading-tight">Precision in Clinical Management.</p>
            <p className="text-base text-white/70 leading-relaxed">
              Streamline your practice workflow, enhance patient care, and maintain absolute data integrity with our sterile, high-efficiency cloud platform.
            </p>
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/20">
              <div className="text-center">
                <p className="text-2xl font-black text-white">10+</p>
                <p className="text-xs text-white/60 font-medium mt-1">Pasien Aktif</p>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">99.9%</p>
                <p className="text-xs text-white/60 font-medium mt-1">Uptime</p>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#76f9d6]">HIPAA</p>
                <p className="text-xs text-white/60 font-medium mt-1">Compliant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Side ── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col justify-center px-6 sm:px-12 md:px-20 py-12 bg-white relative">
        <div className="w-full max-w-[420px] mx-auto">

          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:mb-12">
            <div className="w-9 h-9 rounded-xl bg-[#0d5a94] flex items-center justify-center shadow-md shadow-blue-900/20">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-[#0d5a94] tracking-tight">DentalCloud Pro</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 mb-2 leading-tight tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 text-sm leading-relaxed">Enter your clinical credentials to access the secure portal.</p>
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@klinik.com"
                  className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0d5a94] focus:ring-2 focus:ring-[#0d5a94]/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 h-11 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#0d5a94] focus:ring-2 focus:ring-[#0d5a94]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-[#0d5a94] focus:ring-[#0d5a94]/30"
                />
                <span className="text-sm text-slate-500 select-none">Ingat saya</span>
              </label>
              <Link href="/forgot-password" className="text-xs font-bold text-[#0d5a94] hover:text-[#004271] transition-colors">
                Lupa password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 bg-[#0d5a94] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#004271] transition-colors shadow-md shadow-blue-900/20 focus:outline-none focus:ring-2 focus:ring-[#0d5a94]/50 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Masuk...</>
              ) : (
                "Masuk ke Klinik"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Belum terdaftar?{" "}
              <Link href="/register" className="font-bold text-[#0d5a94] hover:text-[#004271] underline decoration-[#0d5a94]/30 underline-offset-4 transition-colors">
                Daftarkan klinik Anda
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center px-8">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure 256-bit Encrypted Connection • HIPAA Compliant
          </p>
        </div>
      </div>
    </div>
  );
}
