/**
 * Mock data untuk development.
 * Ganti dengan Supabase client / API calls di production.
 */

import {
  Patient, Doctor, Appointment, MedicalRecord,
  Product, Invoice, DashboardStats, Notification,
} from "@/types";

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const mockStats: DashboardStats = {
  todayAppointments: 14,
  totalPatients: 1284,
  monthlyRevenue: 48750000,
  criticalStock: 3,
  pendingInvoices: 7,
  completedToday: 9,
};

// ─── Patients ─────────────────────────────────────────────────────────────────
export const mockPatients: Patient[] = [
  { id:"p1", patient_code:"P-000001", full_name:"Budi Santoso", date_of_birth:"1985-03-12", gender:"male", blood_type:"O", phone:"081234567890", email:"budi@email.com", is_active:true, created_at:"2024-01-15T08:00:00Z", allergy_notes:"Penisilin" },
  { id:"p2", patient_code:"P-000002", full_name:"Siti Rahayu", date_of_birth:"1992-07-22", gender:"female", blood_type:"A", phone:"087654321000", email:"siti@email.com", is_active:true, created_at:"2024-01-20T09:30:00Z" },
  { id:"p3", patient_code:"P-000003", full_name:"Ahmad Fauzi", date_of_birth:"1978-11-05", gender:"male", blood_type:"B", phone:"085556667777", is_active:true, created_at:"2024-02-01T10:00:00Z", allergy_notes:"Ibuprofen" },
  { id:"p4", patient_code:"P-000004", full_name:"Dewi Permata", date_of_birth:"2000-04-18", gender:"female", blood_type:"AB", phone:"081122334455", email:"dewi@email.com", is_active:true, created_at:"2024-02-10T14:00:00Z" },
  { id:"p5", patient_code:"P-000005", full_name:"Rudi Hartono", date_of_birth:"1970-09-30", gender:"male", phone:"082233445566", is_active:true, created_at:"2024-03-05T11:00:00Z" },
];

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const mockDoctors: Doctor[] = [
  { id:"d1", doctor_code:"D-001", full_name:"drg. Sarah Amelia, Sp.Ort", license_number:"SIP-001/2024", specialization_id:"s1", phone:"081111222233", consultation_fee:250000, is_active:true },
  { id:"d2", doctor_code:"D-002", full_name:"drg. Bima Pratama, Sp.BM", license_number:"SIP-002/2024", specialization_id:"s2", phone:"082222333344", consultation_fee:300000, is_active:true },
  { id:"d3", doctor_code:"D-003", full_name:"drg. Anisa Putri", license_number:"SIP-003/2024", phone:"083333444455", consultation_fee:200000, is_active:true },
];

// ─── Appointments ─────────────────────────────────────────────────────────────
export const mockAppointments: Appointment[] = [
  { id:"a1", appointment_code:"APT-20240501-001", patient_id:"p1", patient:mockPatients[0], doctor_id:"d1", doctor:mockDoctors[0], scheduled_at:"2024-05-01T08:00:00Z", status:"completed", chief_complaint:"Behel berkala", created_at:"2024-04-28T10:00:00Z" },
  { id:"a2", appointment_code:"APT-20240501-002", patient_id:"p2", patient:mockPatients[1], doctor_id:"d2", doctor:mockDoctors[1], scheduled_at:"2024-05-01T09:00:00Z", status:"in_progress", chief_complaint:"Pencabutan gigi geraham", created_at:"2024-04-29T14:00:00Z" },
  { id:"a3", appointment_code:"APT-20240501-003", patient_id:"p3", patient:mockPatients[2], doctor_id:"d3", doctor:mockDoctors[2], scheduled_at:"2024-05-01T10:00:00Z", status:"checked_in", chief_complaint:"Tambal gigi berlubang", created_at:"2024-04-30T09:00:00Z" },
  { id:"a4", appointment_code:"APT-20240501-004", patient_id:"p4", patient:mockPatients[3], doctor_id:"d1", doctor:mockDoctors[0], scheduled_at:"2024-05-01T11:00:00Z", status:"confirmed", chief_complaint:"Konsultasi kawat gigi", created_at:"2024-05-01T07:00:00Z" },
  { id:"a5", appointment_code:"APT-20240501-005", patient_id:"p5", patient:mockPatients[4], doctor_id:"d2", doctor:mockDoctors[1], scheduled_at:"2024-05-01T13:00:00Z", status:"scheduled", chief_complaint:"Scaling rutin", created_at:"2024-05-01T08:00:00Z" },
];

// ─── Products (Inventory) ─────────────────────────────────────────────────────
export const mockProducts: Product[] = [
  { id:"pr1", code:"PRD-001", name:"Amoxicillin 500mg", unit:"strip", purchase_price:15000, selling_price:25000, stock_quantity:50, minimum_stock:20, is_prescription:true, is_active:true },
  { id:"pr2", code:"PRD-002", name:"Gloves Latex (Box)", unit:"box", purchase_price:45000, selling_price:75000, stock_quantity:3, minimum_stock:10, is_prescription:false, is_active:true },
  { id:"pr3", code:"PRD-003", name:"Cotton Roll", unit:"pak", purchase_price:12000, selling_price:20000, stock_quantity:2, minimum_stock:15, is_prescription:false, is_active:true },
  { id:"pr4", code:"PRD-004", name:"Lidocaine HCl 2%", unit:"vial", purchase_price:35000, selling_price:60000, stock_quantity:25, minimum_stock:10, is_prescription:true, is_active:true },
  { id:"pr5", code:"PRD-005", name:"Composite Resin A2", unit:"syringe", purchase_price:120000, selling_price:200000, stock_quantity:8, minimum_stock:5, is_prescription:false, is_active:true },
];

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const mockInvoices: Invoice[] = [
  { id:"i1", invoice_number:"INV-20240501-001", patient_id:"p1", patient:mockPatients[0], issued_at:"2024-05-01T10:00:00Z", status:"paid", subtotal:600000, discount_amount:0, tax_amount:0, total_amount:600000, items:[] },
  { id:"i2", invoice_number:"INV-20240501-002", patient_id:"p2", patient:mockPatients[1], issued_at:"2024-05-01T11:00:00Z", status:"issued", subtotal:550000, discount_amount:50000, tax_amount:0, total_amount:500000, items:[] },
  { id:"i3", invoice_number:"INV-20240430-003", patient_id:"p3", patient:mockPatients[2], issued_at:"2024-04-30T15:00:00Z", status:"overdue", subtotal:350000, discount_amount:0, tax_amount:0, total_amount:350000, items:[] },
];

// ─── Notifications ────────────────────────────────────────────────────────────
export const mockNotifications: Notification[] = [
  { id:"n1", user_id:"u1", type:"stock_alert", title:"Stok Kritis", body:"Gloves Latex tersisa 3 box (minimum 10)", is_read:false, created_at:"2024-05-01T07:00:00Z" },
  { id:"n2", user_id:"u1", type:"appointment_reminder", title:"Jadwal Hari Ini", body:"14 janji temu terjadwal hari ini", is_read:false, created_at:"2024-05-01T07:00:00Z" },
  { id:"n3", user_id:"u1", type:"system", title:"Backup Sukses", body:"Database backup berhasil pukul 02:00", is_read:true, created_at:"2024-05-01T02:00:00Z" },
];
