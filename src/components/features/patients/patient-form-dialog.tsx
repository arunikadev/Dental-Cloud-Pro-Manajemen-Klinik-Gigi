"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api-client";
import { CheckCircle } from "lucide-react";

// Zod schema for patient validation
const patientSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap harus minimal 3 karakter"),
  nik: z.string().length(16, "NIK harus 16 digit angka").regex(/^\d+$/, "NIK hanya boleh berisi angka"),
  dateOfBirth: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.enum(["male", "female", "other"] as [string, ...string[]]).describe("Pilih jenis kelamin"),
  phone: z.string().min(10, "Nomor HP tidak valid").regex(/^\+?[0-9]+$/, "Nomor HP hanya boleh berisi angka"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  address: z.string().min(10, "Alamat terlalu singkat"),
  bloodType: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientFormDialog({ open, onOpenChange }: PatientFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "",
      nik: "",
      dateOfBirth: "",
      gender: undefined,
      phone: "",
      email: "",
      address: "",
      bloodType: "",
    },
  });

  const selectedGender = watch("gender");

  const onSubmit = async (data: PatientFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      // Create a unique patient code
      const patientCode = `PAT-${Math.floor(10000 + Math.random() * 90000)}`;
      
      const dataApi = await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify({
          full_name: data.fullName,
          nik: data.nik,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          phone: data.phone,
          email: data.email || null,
          address: data.address,
          blood_type: data.bloodType || null,
          is_active: true,
        }),
      });

      setSuccessMsg("Pasien berhasil disimpan!");
      reset();
      setTimeout(() => {
        setSuccessMsg("");
        onOpenChange(false);
      }, 1500);
    } catch (error: any) {
      const msg = error?.message || error?.details || JSON.stringify(error) || "Terjadi kesalahan.";
      console.error("Error saving patient:", msg);
      setErrorMsg(`Gagal menyimpan: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
        <div className="bg-[#0D5A94] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Tambah Pasien Baru</DialogTitle>
            <DialogDescription className="text-blue-100 opacity-90">
              Masukkan data rekam medis awal pasien ke dalam sistem.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-slate-700 font-semibold">Nama Lengkap</Label>
            <Input id="fullName" {...register("fullName")} placeholder="Cth: Budi Santoso" className={errors.fullName ? "border-red-500" : ""} />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nik" className="text-slate-700 font-semibold">No. KTP (NIK)</Label>
              <Input id="nik" {...register("nik")} placeholder="16 Digit NIK" className={errors.nik ? "border-red-500" : ""} />
              {errors.nik && <p className="text-xs text-red-500">{errors.nik.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-slate-700 font-semibold">Tanggal Lahir</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} className={errors.dateOfBirth ? "border-red-500" : ""} />
              {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>}
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Jenis Kelamin</Label>
            <div className="flex gap-2">
              {([
                { value: "male", label: "Laki-laki" },
                { value: "female", label: "Perempuan" },
              ] as const).map(g => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setValue("gender", g.value, { shouldValidate: true })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    selectedGender === g.value
                      ? "bg-[#0D5A94] text-white border-[#0D5A94]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#0D5A94]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 font-semibold">Nomor HP</Label>
              <Input id="phone" {...register("phone")} placeholder="0812..." className={errors.phone ? "border-red-500" : ""} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email (Opsional)</Label>
              <Input id="email" type="email" {...register("email")} placeholder="budi@email.com" className={errors.email ? "border-red-500" : ""} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          {/* Blood Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType" className="text-slate-700 font-semibold">Gol. Darah (Opsional)</Label>
              <select
                id="bloodType"
                {...register("bloodType")}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-[#0D5A94]/30"
              >
                <option value="">-- Pilih --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700 font-semibold">Alamat Lengkap</Label>
              <Input id="address" {...register("address")} placeholder="Jln. Raya No. 123..." className={errors.address ? "border-red-500" : ""} />
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 hover:text-slate-700 font-semibold">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#006b57] hover:bg-[#005141] text-white font-bold">
              {isSubmitting ? "Menyimpan..." : "Simpan Pasien"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

