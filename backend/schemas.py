from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr


# ── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "patient"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime


# ── Patients ────────────────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str
    blood_type: Optional[str] = None
    nik: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergy_notes: Optional[str] = None

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    nik: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergy_notes: Optional[str] = None
    is_active: Optional[bool] = None

class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    patient_code: str
    full_name: str
    date_of_birth: date
    gender: str
    blood_type: Optional[str]
    nik: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    allergy_notes: Optional[str]
    is_active: bool
    created_at: datetime


# ── Doctors ─────────────────────────────────────────────────────────────────

class SpecializationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str

class DoctorCreate(BaseModel):
    full_name: str
    license_number: str
    specialization_id: Optional[UUID] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    consultation_fee: Decimal = Decimal("0")

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    license_number: Optional[str] = None
    specialization_id: Optional[UUID] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    consultation_fee: Optional[Decimal] = None
    is_active: Optional[bool] = None

class DoctorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    doctor_code: str
    full_name: str
    license_number: str
    phone: Optional[str]
    email: Optional[str]
    consultation_fee: Decimal
    is_active: bool
    specialization: Optional[SpecializationResponse]
    created_at: datetime


# ── Services ─────────────────────────────────────────────────────────────────

class ServiceCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str

class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    code: str
    name: str
    description: Optional[str]
    base_price: Decimal
    duration_minutes: int
    is_active: bool
    category: Optional[ServiceCategoryResponse]


# ── Appointments ──────────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    patient_id: UUID
    doctor_id: UUID
    service_id: Optional[UUID] = None
    scheduled_at: datetime
    end_at: Optional[datetime] = None
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    doctor_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    scheduled_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    status: Optional[str] = None
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    appointment_code: str
    patient_id: UUID
    doctor_id: UUID
    service_id: Optional[UUID]
    scheduled_at: datetime
    end_at: Optional[datetime]
    status: str
    chief_complaint: Optional[str]
    notes: Optional[str]
    created_at: datetime


# ── Medical Records ───────────────────────────────────────────────────────────

class MedicalRecordCreate(BaseModel):
    appointment_id: UUID
    patient_id: UUID
    doctor_id: UUID
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    vital_signs: Optional[dict] = None
    attachments: Optional[list] = None

class MedicalRecordUpdate(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    vital_signs: Optional[dict] = None
    attachments: Optional[list] = None

class MedicalRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    appointment_id: UUID
    patient_id: UUID
    doctor_id: UUID
    subjective: Optional[str]
    objective: Optional[str]
    assessment: Optional[str]
    plan: Optional[str]
    vital_signs: Optional[dict]
    created_at: datetime


# ── Inventory ─────────────────────────────────────────────────────────────────

class ProductCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str

class ProductCreate(BaseModel):
    code: str
    name: str
    product_category_id: Optional[UUID] = None
    description: Optional[str] = None
    unit: str = "pcs"
    purchase_price: Decimal = Decimal("0")
    selling_price: Decimal = Decimal("0")
    stock_quantity: int = 0
    minimum_stock: int = 5
    is_prescription: bool = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    product_category_id: Optional[UUID] = None
    unit: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    minimum_stock: Optional[int] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    code: str
    name: str
    unit: str
    purchase_price: Decimal
    selling_price: Decimal
    stock_quantity: int
    minimum_stock: int
    is_active: bool
    category: Optional[ProductCategoryResponse]

class StockMovementCreate(BaseModel):
    product_id: UUID
    type: str  # "in" | "out" | "adjustment"
    quantity: int
    notes: Optional[str] = None

class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    product_id: UUID
    type: str
    quantity: int
    notes: Optional[str]
    created_at: datetime


# ── Billing ───────────────────────────────────────────────────────────────────

class InvoiceItemCreate(BaseModel):
    item_type: str  # "service" | "product"
    service_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    description: str
    quantity: int = 1
    unit_price: Decimal

class InvoiceItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    item_type: str
    description: str
    quantity: int
    unit_price: Decimal
    subtotal: Optional[Decimal]

class InvoiceCreate(BaseModel):
    patient_id: UUID
    appointment_id: Optional[UUID] = None
    due_at: Optional[datetime] = None
    discount_amount: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    notes: Optional[str] = None
    items: list[InvoiceItemCreate] = []

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    discount_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    invoice_number: str
    patient_id: UUID
    status: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    issued_at: datetime
    items: list[InvoiceItemResponse]

class PaymentCreate(BaseModel):
    invoice_id: UUID
    amount: Decimal
    method: str
    reference_code: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    invoice_id: UUID
    payment_number: str
    amount: Decimal
    method: str
    status: str
    reference_code: Optional[str]
    paid_at: Optional[datetime]
    created_at: datetime
