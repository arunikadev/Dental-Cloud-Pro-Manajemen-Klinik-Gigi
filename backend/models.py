import enum
import uuid
from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric,
    SmallInteger, String, Text, Computed,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    doctor = "doctor"
    patient = "patient"
    cashier = "cashier"

class GenderType(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class AppointmentStatus(str, enum.Enum):
    scheduled = "scheduled"
    confirmed = "confirmed"
    checked_in = "checked_in"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    partial = "partial"
    paid = "paid"
    refunded = "refunded"
    cancelled = "cancelled"

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    debit_card = "debit_card"
    credit_card = "credit_card"
    transfer = "transfer"
    insurance = "insurance"
    qris = "qris"

class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    issued = "issued"
    paid = "paid"
    overdue = "overdue"
    cancelled = "cancelled"


# ── Models ──────────────────────────────────────────────────────────────────

def _uuid_pk():
    return Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

def _ts_created():
    return Column(DateTime(timezone=True), nullable=False, server_default=func.now())

def _ts_updated():
    return Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class User(Base):
    __tablename__ = "users"
    id            = _uuid_pk()
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role          = Column(SAEnum(UserRole, name="user_role", create_type=False), nullable=False, default=UserRole.patient)
    is_active     = Column(Boolean, nullable=False, default=True)
    last_login_at = Column(DateTime(timezone=True))
    created_at    = _ts_created()
    updated_at    = _ts_updated()


class Patient(Base):
    __tablename__ = "patients"
    id                      = _uuid_pk()
    user_id                 = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), unique=True)
    patient_code            = Column(String(20), unique=True, nullable=False)
    full_name               = Column(String(255), nullable=False)
    date_of_birth           = Column(Date, nullable=False)
    gender                  = Column(SAEnum(GenderType, name="gender_type", create_type=False), nullable=False)
    blood_type              = Column(String(5))
    nik                     = Column(String(20), unique=True)
    phone                   = Column(String(20))
    email                   = Column(String(255))
    address                 = Column(Text)
    emergency_contact_name  = Column(String(255))
    emergency_contact_phone = Column(String(20))
    allergy_notes           = Column(Text)
    is_active               = Column(Boolean, nullable=False, default=True)
    registered_at           = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at              = _ts_created()
    updated_at              = _ts_updated()


class Specialization(Base):
    __tablename__ = "specializations"
    id   = _uuid_pk()
    name = Column(String(100), unique=True, nullable=False)


class Doctor(Base):
    __tablename__ = "doctors"
    id                = _uuid_pk()
    user_id           = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), unique=True)
    doctor_code       = Column(String(20), unique=True, nullable=False)
    full_name         = Column(String(255), nullable=False)
    specialization_id = Column(UUID(as_uuid=True), ForeignKey("specializations.id"))
    license_number    = Column(String(100), unique=True, nullable=False)
    phone             = Column(String(20))
    email             = Column(String(255))
    consultation_fee  = Column(Numeric(12, 2), nullable=False, default=0)
    is_active         = Column(Boolean, nullable=False, default=True)
    created_at        = _ts_created()
    updated_at        = _ts_updated()
    specialization    = relationship("Specialization", lazy="selectin")


class ServiceCategory(Base):
    __tablename__ = "service_categories"
    id          = _uuid_pk()
    name        = Column(String(100), unique=True, nullable=False)
    description = Column(Text)


class Service(Base):
    __tablename__ = "services"
    id                  = _uuid_pk()
    service_category_id = Column(UUID(as_uuid=True), ForeignKey("service_categories.id"))
    code                = Column(String(50), unique=True, nullable=False)
    name                = Column(String(255), nullable=False)
    description         = Column(Text)
    base_price          = Column(Numeric(12, 2), nullable=False, default=0)
    duration_minutes    = Column(SmallInteger, nullable=False, default=30)
    is_active           = Column(Boolean, nullable=False, default=True)
    created_at          = _ts_created()
    updated_at          = _ts_updated()
    category            = relationship("ServiceCategory", lazy="selectin")


class Appointment(Base):
    __tablename__ = "appointments"
    id               = _uuid_pk()
    appointment_code = Column(String(30), unique=True, nullable=False)
    patient_id       = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id        = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    service_id       = Column(UUID(as_uuid=True), ForeignKey("services.id"))
    scheduled_at     = Column(DateTime(timezone=True), nullable=False)
    end_at           = Column(DateTime(timezone=True))
    status           = Column(SAEnum(AppointmentStatus, name="appointment_status", create_type=False), nullable=False, default=AppointmentStatus.scheduled)
    chief_complaint  = Column(Text)
    notes            = Column(Text)
    created_by       = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at       = _ts_created()
    updated_at       = _ts_updated()
    patient          = relationship("Patient", lazy="selectin")
    doctor           = relationship("Doctor", lazy="selectin")
    service          = relationship("Service", lazy="selectin")


class MedicalRecord(Base):
    __tablename__ = "medical_records"
    id             = _uuid_pk()
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id     = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    doctor_id      = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    subjective     = Column(Text)
    objective      = Column(Text)
    assessment     = Column(Text)
    plan           = Column(Text)
    vital_signs    = Column(JSONB)
    attachments    = Column(JSONB)
    created_at     = _ts_created()
    updated_at     = _ts_updated()
    patient        = relationship("Patient", lazy="selectin")
    doctor         = relationship("Doctor", lazy="selectin")


class ProductCategory(Base):
    __tablename__ = "product_categories"
    id          = _uuid_pk()
    name        = Column(String(100), unique=True, nullable=False)
    description = Column(Text)


class Product(Base):
    __tablename__ = "products"
    id                  = _uuid_pk()
    product_category_id = Column(UUID(as_uuid=True), ForeignKey("product_categories.id"))
    code                = Column(String(50), unique=True, nullable=False)
    name                = Column(String(255), nullable=False)
    description         = Column(Text)
    unit                = Column(String(30), nullable=False, default="pcs")
    purchase_price      = Column(Numeric(12, 2), nullable=False, default=0)
    selling_price       = Column(Numeric(12, 2), nullable=False, default=0)
    stock_quantity      = Column(Integer, nullable=False, default=0)
    minimum_stock       = Column(Integer, nullable=False, default=5)
    is_prescription     = Column(Boolean, nullable=False, default=False)
    is_active           = Column(Boolean, nullable=False, default=True)
    created_at          = _ts_created()
    updated_at          = _ts_updated()
    category            = relationship("ProductCategory", lazy="selectin")


class StockMovement(Base):
    __tablename__ = "stock_movements"
    id           = _uuid_pk()
    product_id   = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    type         = Column(String(20), nullable=False)
    quantity     = Column(Integer, nullable=False)
    reference_id = Column(UUID(as_uuid=True))
    notes        = Column(Text)
    created_by   = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at   = _ts_created()


class Invoice(Base):
    __tablename__ = "invoices"
    id              = _uuid_pk()
    invoice_number  = Column(String(30), unique=True, nullable=False)
    appointment_id  = Column(UUID(as_uuid=True), ForeignKey("appointments.id"))
    patient_id      = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    issued_at       = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    due_at          = Column(DateTime(timezone=True))
    status          = Column(SAEnum(InvoiceStatus, name="invoice_status", create_type=False), nullable=False, default=InvoiceStatus.draft)
    subtotal        = Column(Numeric(12, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(12, 2), nullable=False, default=0)
    tax_amount      = Column(Numeric(12, 2), nullable=False, default=0)
    total_amount    = Column(Numeric(12, 2), nullable=False, default=0)
    notes           = Column(Text)
    created_by      = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at      = _ts_created()
    updated_at      = _ts_updated()
    patient         = relationship("Patient", lazy="selectin")
    items           = relationship("InvoiceItem", lazy="selectin", cascade="all, delete-orphan")
    payments        = relationship("Payment", lazy="selectin")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id          = _uuid_pk()
    invoice_id  = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    item_type   = Column(String(20), nullable=False)
    service_id  = Column(UUID(as_uuid=True), ForeignKey("services.id"))
    product_id  = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    description = Column(String(255), nullable=False)
    quantity    = Column(Integer, nullable=False, default=1)
    unit_price  = Column(Numeric(12, 2), nullable=False)
    subtotal    = Column(Numeric(12, 2), Computed("quantity * unit_price", persisted=True))


class Payment(Base):
    __tablename__ = "payments"
    id             = _uuid_pk()
    invoice_id     = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    payment_number = Column(String(30), unique=True, nullable=False)
    amount         = Column(Numeric(12, 2), nullable=False)
    method         = Column(SAEnum(PaymentMethod, name="payment_method", create_type=False), nullable=False)
    status         = Column(SAEnum(PaymentStatus, name="payment_status", create_type=False), nullable=False, default=PaymentStatus.pending)
    reference_code = Column(String(100))
    paid_at        = Column(DateTime(timezone=True))
    notes          = Column(Text)
    created_by     = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at     = _ts_created()
