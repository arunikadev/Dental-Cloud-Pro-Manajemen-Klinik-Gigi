// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "doctor" | "patient" | "cashier";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type GenderType = "male" | "female" | "other";
export type PaymentStatus = "pending" | "partial" | "paid" | "refunded" | "cancelled";
export type PaymentMethod = "cash" | "debit_card" | "credit_card" | "transfer" | "insurance" | "qris";
export type InvoiceStatus = "draft" | "issued" | "paid" | "overdue" | "cancelled";
export type NotificationType = "appointment_reminder" | "follow_up" | "birthday" | "stock_alert" | "system";
export type AuditAction = "INSERT" | "UPDATE" | "DELETE";
export type ToothCondition =
  | "healthy" | "caries" | "filled" | "missing" | "crown" | "bridge"
  | "implant" | "root_canal" | "extraction_indicated" | "impacted"
  | "fractured" | "abscess" | "other";

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface Patient {
  id: string;
  user_id?: string;
  patient_code: string;
  full_name: string;
  date_of_birth: string;
  gender: GenderType;
  blood_type?: string;
  nik?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  allergy_notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id?: string;
  doctor_code: string;
  full_name: string;
  specialization_id?: string;
  specialization?: Specialization;
  license_number: string;
  phone?: string;
  email?: string;
  consultation_fee: number;
  is_active: boolean;
}

export interface Specialization {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  service_category_id?: string;
  code: string;
  name: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Appointment {
  id: string;
  appointment_code: string;
  patient_id: string;
  patient?: Patient;
  doctor_id: string;
  doctor?: Doctor;
  service_id?: string;
  service?: Service;
  scheduled_at: string;
  end_at?: string;
  status: AppointmentStatus;
  chief_complaint?: string;
  notes?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient?: Patient;
  doctor_id: string;
  doctor?: Doctor;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  vital_signs?: Record<string, string | number>;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface OdontogramTooth {
  id: string;
  odontogram_id: string;
  tooth_number: number;
  condition: ToothCondition;
  surfaces?: string[];
  notes?: string;
  treatment_done?: string;
}

export interface Odontogram {
  id: string;
  patient_id: string;
  recorded_at: string;
  notes?: string;
  teeth: OdontogramTooth[];
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  product_category_id?: string;
  category?: ProductCategory;
  code: string;
  name: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
  is_prescription: boolean;
  is_active: boolean;
}

// ─── Prescriptions ────────────────────────────────────────────────────────────

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  dosage?: string;
  duration_days?: number;
  notes?: string;
}

export interface Prescription {
  id: string;
  prescription_code: string;
  medical_record_id: string;
  patient_id: string;
  patient?: Patient;
  doctor_id: string;
  doctor?: Doctor;
  prescribed_at: string;
  dispensed_at?: string;
  items: PrescriptionItem[];
  notes?: string;
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type: "service" | "product";
  service_id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  appointment_id?: string;
  patient_id: string;
  patient?: Patient;
  issued_at: string;
  due_at?: string;
  status: InvoiceStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  items: InvoiceItem[];
  notes?: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  payment_number: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference_code?: string;
  paid_at?: string;
  notes?: string;
}

// ─── Notifications & Audit ────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  table_name: string;
  record_id?: string;
  action: AuditAction;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  changed_by?: string;
  ip_address?: string;
  changed_at: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  monthlyRevenue: number;
  criticalStock: number;
  pendingInvoices: number;
  completedToday: number;
}
