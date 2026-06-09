"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarClock, CheckCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Pasien wajib dipilih"),
  doctor_id: z.string().min(1, "Dokter wajib dipilih"),
  scheduledAt: z.string().min(1, "Tanggal dan waktu wajib diisi"),
  chiefComplaint: z.string().min(5, "Keluhan wajib diisi minimal 5 karakter"),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultPatientId?: string;
}

export function AppointmentFormDialog({ open, onOpenChange, onSuccess, defaultPatientId }: AppointmentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<{id:string, full_name:string, patient_code?:string}[]>([]);
  const [doctors, setDoctors] = useState<{id:string, full_name:string, specialization?:string}[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    apiFetch('/patients').then(d => { if (Array.isArray(d)) setPatients(d); });
    apiFetch('/doctors').then(d => { if (Array.isArray(d)) setDoctors(d); });
  }, [open]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
  });

  useEffect(() => {
    if (open && defaultPatientId) {
      setValue("patient_id", defaultPatientId);
    }
  }, [open, defaultPatientId, setValue]);

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          appointment_code: `APT-${Date.now()}`,
          patient_id: data.patient_id,
          doctor_id: data.doctor_id,
          chief_complaint: data.chiefComplaint,
          notes: data.notes || null,
          scheduled_at: new Date(data.scheduledAt).toISOString(),
          status: "scheduled",
        }),
      });

      setSuccessMsg("Janji temu berhasil disimpan!");
      reset();
      onSuccess?.();
      setTimeout(() => {
        setSuccessMsg("");
        onOpenChange(false);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass = (hasError?: boolean) =>
    `flex h-10 w-full rounded-xl border ${hasError ? "border-red-400" : "border-slate-200"} bg-white dark:bg-slate-800 dark:text-white px-3 py-1 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#0D5A94]/30 transition-colors`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); setErrorMsg(""); setSuccessMsg(""); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden bg-white dark:bg-slate-900">
        <div className="bg-gradient-to-br from-[#0D5A94] to-[#0a4a7a] p-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <CalendarClock className="h-5 w-5 opacity-80" />
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Buat Janji Temu</DialogTitle>
            </DialogHeader>
          </div>
          <DialogDescription className="text-blue-100 text-sm mt-1">
            Isi detail jadwal konsultasi pasien berikut ini.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Pasien</Label>
              <select {...register("patient_id")} className={selectClass(!!errors.patient_id)}>
                <option value="">-- Pilih Pasien --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              {errors.patient_id && <p className="text-xs text-red-500">{errors.patient_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Dokter</Label>
              <select {...register("doctor_id")} className={selectClass(!!errors.doctor_id)}>
                <option value="">-- Pilih Dokter --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              {errors.doctor_id && <p className="text-xs text-red-500">{errors.doctor_id.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Tanggal &amp; Waktu</Label>
            <Input type="datetime-local" {...register("scheduledAt")} className={`rounded-xl ${errors.scheduledAt ? "border-red-400" : ""}`} />
            {errors.scheduledAt && <p className="text-xs text-red-500">{errors.scheduledAt.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">Keluhan Utama</Label>
            <Input {...register("chiefComplaint")} placeholder="Cth: Sakit gigi geraham kiri" className={`rounded-xl ${errors.chiefComplaint ? "border-red-400" : ""}`} />
            {errors.chiefComplaint && <p className="text-xs text-red-500">{errors.chiefComplaint.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider">
              Catatan <span className="text-slate-400 font-normal normal-case">(opsional)</span>
            </Label>
            <Input {...register("notes")} placeholder="Alergi obat, permintaan khusus, dsb." className="rounded-xl" />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
            <Button type="button" variant="ghost" onClick={() => { reset(); setErrorMsg(""); onOpenChange(false); }} className="text-slate-500 font-semibold">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#0D5A94] hover:bg-[#004271] text-white font-bold gap-2 px-6">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Janji"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


