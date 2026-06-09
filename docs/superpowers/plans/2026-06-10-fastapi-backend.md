# FastAPI Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI backend on Railway that replaces all Next.js API routes, connects to Supabase PostgreSQL via SQLAlchemy async, and authenticates users with JWT from the `public.users` table.

**Architecture:** Single FastAPI app with modular routers (auth, patients, appointments, medical_records, inventory, billing, doctors, services, users). SQLAlchemy 2.x async ORM maps to the existing schema without migrations. Frontend Next.js migrated to call FastAPI via a centralized `api-client.ts`.

**Tech Stack:** FastAPI, SQLAlchemy 2.x (async), asyncpg, python-jose[cryptography], passlib[bcrypt], Pydantic v2, pytest, httpx, pytest-asyncio

---

## File Map

**New files — backend/:**
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/Procfile`
- `backend/database.py` — async engine + SessionLocal
- `backend/models.py` — all ORM models
- `backend/schemas.py` — all Pydantic v2 schemas
- `backend/dependencies.py` — get_db, JWT utils, get_current_user, require_role
- `backend/main.py` — app, CORS, router registration
- `backend/routers/__init__.py`
- `backend/routers/auth.py`
- `backend/routers/patients.py`
- `backend/routers/doctors.py`
- `backend/routers/services.py`
- `backend/routers/appointments.py`
- `backend/routers/medical_records.py`
- `backend/routers/inventory.py`
- `backend/routers/billing.py`
- `backend/routers/users.py`
- `backend/seed.py` — seed demo accounts into public.users
- `backend/tests/__init__.py`
- `backend/tests/conftest.py`
- `backend/tests/test_auth.py`
- `backend/tests/test_patients.py`

**New files — frontend:**
- `src/lib/api-client.ts`

**Modified files — frontend:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(dashboard)/patients/page.tsx`
- `src/app/(dashboard)/appointments/page.tsx`
- `src/app/(dashboard)/billing/page.tsx`
- `src/app/(dashboard)/inventory/page.tsx`
- `src/app/(dashboard)/medical-records/page.tsx`
- `src/app/(dashboard)/users/page.tsx`

**Deleted:**
- `src/app/api/` (entire folder)

---

## Task 1: Backend scaffold

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/Procfile`
- Create: `backend/routers/__init__.py`
- Create: `backend/tests/__init__.py`

- [ ] **Step 1: Create `backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
pydantic[email]==2.9.2
httpx==0.27.2
pytest==8.3.3
pytest-asyncio==0.24.0
```

- [ ] **Step 1b: Create `backend/pytest.ini`**

```ini
[pytest]
asyncio_mode = auto
```

This is required for pytest-asyncio ≥ 0.21 to handle `async def` test functions and `scope="session"` async fixtures automatically.

- [ ] **Step 2: Create `backend/.env.example`**

```
# Supabase direct connection (Project Settings > Database > Connection string > URI, mode: Session)
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SECRET_KEY=changeme-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 3: Create `backend/Procfile`**

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

- [ ] **Step 4: Create empty init files**

`backend/routers/__init__.py` — empty file  
`backend/tests/__init__.py` — empty file

- [ ] **Step 5: Create Python virtual environment and install deps**

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Expected: all packages install without error.

- [ ] **Step 6: Copy `.env.example` to `.env` and fill in real values**

Get `DATABASE_URL` from Supabase Dashboard → Project Settings → Database → Connection string → URI (Session mode). Replace `[YOUR-PASSWORD]` with your DB password.

Generate `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: scaffold backend directory with requirements and config"
```

---

## Task 2: database.py

**Files:**
- Create: `backend/database.py`

- [ ] **Step 1: Create `backend/database.py`**

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"ssl": "require"},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass
```

- [ ] **Step 2: Commit**

```bash
git add backend/database.py
git commit -m "feat: add async SQLAlchemy database setup"
```

---

## Task 3: models.py

**Files:**
- Create: `backend/models.py`

- [ ] **Step 1: Create `backend/models.py`**

```python
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/models.py
git commit -m "feat: add SQLAlchemy ORM models mirroring existing schema"
```

---

## Task 4: schemas.py

**Files:**
- Create: `backend/schemas.py`

- [ ] **Step 1: Create `backend/schemas.py`**

```python
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/schemas.py
git commit -m "feat: add Pydantic v2 schemas for all modules"
```

---

## Task 5: dependencies.py

**Files:**
- Create: `backend/dependencies.py`

- [ ] **Step 1: Create `backend/dependencies.py`**

```python
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal
from models import User, UserRole

import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_role(*roles: UserRole):
    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return _checker
```

- [ ] **Step 2: Commit**

```bash
git add backend/dependencies.py
git commit -m "feat: add JWT utilities and FastAPI dependencies"
```

---

## Task 6: Test setup + auth router

**Files:**
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`
- Create: `backend/routers/auth.py`

- [ ] **Step 1: Create `backend/tests/conftest.py`**

```python
import os
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from dotenv import load_dotenv

load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", os.getenv("DATABASE_URL"))


@pytest_asyncio.fixture(scope="session")
async def client():
    from main import app
    from dependencies import get_db

    test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"ssl": "require"})
    TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    await test_engine.dispose()
```

- [ ] **Step 2: Write failing tests in `backend/tests/test_auth.py`**

```python
import pytest

@pytest.mark.asyncio
async def test_register_new_user(client):
    response = await client.post("/auth/register", json={
        "email": "testuser_plan@example.com",
        "password": "TestPass@123",
        "role": "patient",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser_plan@example.com"
    assert data["role"] == "patient"
    assert "id" in data

@pytest.mark.asyncio
async def test_login_valid_credentials(client):
    # register first
    await client.post("/auth/register", json={
        "email": "testlogin_plan@example.com",
        "password": "TestPass@123",
    })
    response = await client.post("/auth/login", json={
        "email": "testlogin_plan@example.com",
        "password": "TestPass@123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/auth/register", json={
        "email": "testwrong_plan@example.com",
        "password": "TestPass@123",
    })
    response = await client.post("/auth/login", json={
        "email": "testwrong_plan@example.com",
        "password": "WrongPassword",
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_protected_endpoint_without_token(client):
    response = await client.get("/patients")
    assert response.status_code == 403
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd backend
pytest tests/test_auth.py -v
```

Expected: ImportError or 404 errors (routers not registered yet).

- [ ] **Step 4: Create `backend/routers/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, verify_password, hash_password, create_access_token
from models import User, UserRole
from schemas import LoginRequest, TokenResponse, RegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    token = create_access_token(str(user.id), user.role.value)
    return TokenResponse(access_token=token)


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        role = UserRole(body.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
```

- [ ] **Step 5: Create `backend/main.py` (minimal, just for tests to run)**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Klinik Gigi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000"), "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth
app.include_router(auth.router)
```

- [ ] **Step 6: Run tests — should pass now**

```bash
cd backend
pytest tests/test_auth.py -v
```

Expected: 4 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/routers/auth.py backend/tests/conftest.py backend/tests/test_auth.py backend/main.py
git commit -m "feat: add auth router with login and register endpoints"
```

---

## Task 7: Patients router + tests

**Files:**
- Create: `backend/tests/test_patients.py`
- Create: `backend/routers/patients.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_patients.py`**

```python
import pytest

async def get_auth_token(client, email, password="TestPass@123"):
    await client.post("/auth/register", json={"email": email, "password": password})
    r = await client.post("/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]

@pytest.mark.asyncio
async def test_list_patients_requires_auth(client):
    response = await client.get("/patients")
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_create_and_list_patient(client):
    token = await get_auth_token(client, "admin_patients@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post("/patients", headers=headers, json={
        "full_name": "Budi Santoso",
        "date_of_birth": "1990-05-15",
        "gender": "male",
        "phone": "081234567890",
    })
    assert create_resp.status_code == 201
    patient = create_resp.json()
    assert patient["full_name"] == "Budi Santoso"
    assert patient["patient_code"].startswith("P-")

    list_resp = await client.get("/patients", headers=headers)
    assert list_resp.status_code == 200
    assert any(p["id"] == patient["id"] for p in list_resp.json())

@pytest.mark.asyncio
async def test_get_patient_by_id(client):
    token = await get_auth_token(client, "admin_getpatient@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    create = await client.post("/patients", headers=headers, json={
        "full_name": "Siti Rahayu",
        "date_of_birth": "1985-03-20",
        "gender": "female",
    })
    pid = create.json()["id"]
    resp = await client.get(f"/patients/{pid}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Siti Rahayu"

@pytest.mark.asyncio
async def test_update_patient(client):
    token = await get_auth_token(client, "admin_updatepatient@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    create = await client.post("/patients", headers=headers, json={
        "full_name": "Ahmad Fauzi",
        "date_of_birth": "2000-01-01",
        "gender": "male",
    })
    pid = create.json()["id"]
    resp = await client.put(f"/patients/{pid}", headers=headers, json={"phone": "089999999"})
    assert resp.status_code == 200
    assert resp.json()["phone"] == "089999999"
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend
pytest tests/test_patients.py -v
```

Expected: 404 (route not found) or import errors.

- [ ] **Step 3: Create `backend/routers/patients.py`**

```python
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_user
from models import Patient, User
from schemas import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter(prefix="/patients", tags=["patients"])


async def _generate_patient_code(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(Patient))
    count = result.scalar() + 1
    return f"P-{datetime.now().year}{count:04d}"


@router.get("", response_model=list[PatientResponse])
async def list_patients(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).where(Patient.is_active == True).order_by(Patient.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("", response_model=PatientResponse, status_code=201)
async def create_patient(
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    code = await _generate_patient_code(db)
    patient = Patient(**body.model_dump(), patient_code=code)
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: UUID,
    body: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(patient, field, value)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.is_active = False
    await db.commit()
```

- [ ] **Step 4: Register router in `main.py`**

Add to `main.py`:
```python
from routers import auth, patients
app.include_router(auth.router)
app.include_router(patients.router)
```

- [ ] **Step 5: Run tests — should pass**

```bash
cd backend
pytest tests/test_patients.py -v
```

Expected: 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/routers/patients.py backend/tests/test_patients.py backend/main.py
git commit -m "feat: add patients CRUD router"
```

---

## Task 8: Doctors router

**Files:**
- Create: `backend/routers/doctors.py`

- [ ] **Step 1: Create `backend/routers/doctors.py`**

```python
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_user
from models import Doctor, User
from schemas import DoctorCreate, DoctorUpdate, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["doctors"])


async def _generate_doctor_code(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(Doctor))
    count = result.scalar() + 1
    return f"D-{count:03d}"


@router.get("", response_model=list[DoctorResponse])
async def list_doctors(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Doctor).where(Doctor.is_active == True).order_by(Doctor.full_name))
    return result.scalars().all()


@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.post("", response_model=DoctorResponse, status_code=201)
async def create_doctor(body: DoctorCreate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    code = await _generate_doctor_code(db)
    doctor = Doctor(**body.model_dump(), doctor_code=code)
    db.add(doctor)
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.put("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(doctor_id: UUID, body: DoctorUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(doctor, field, value)
    await db.commit()
    await db.refresh(doctor)
    return doctor


@router.delete("/{doctor_id}", status_code=204)
async def delete_doctor(doctor_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.is_active = False
    await db.commit()
```

- [ ] **Step 2: Register in `main.py`**

```python
from routers import auth, patients, doctors
app.include_router(doctors.router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/routers/doctors.py backend/main.py
git commit -m "feat: add doctors CRUD router"
```

---

## Task 9: Services router

**Files:**
- Create: `backend/routers/services.py`

- [ ] **Step 1: Create `backend/routers/services.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_user
from models import Service, User
from schemas import ServiceResponse

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceResponse])
async def list_services(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Service).where(Service.is_active == True).order_by(Service.name))
    return result.scalars().all()
```

- [ ] **Step 2: Register in `main.py`** and commit

```python
from routers import auth, patients, doctors, services
app.include_router(services.router)
```

```bash
git add backend/routers/services.py backend/main.py
git commit -m "feat: add services read-only router"
```

---

## Task 10: Appointments router

**Files:**
- Create: `backend/routers/appointments.py`

- [ ] **Step 1: Create `backend/routers/appointments.py`**

```python
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_user
from models import Appointment, User
from schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter(prefix="/appointments", tags=["appointments"])


async def _generate_appointment_code(db: AsyncSession) -> str:
    now = datetime.now()
    result = await db.execute(select(func.count()).select_from(Appointment))
    count = result.scalar() + 1
    return f"APT-{now.strftime('%Y%m%d')}-{count:03d}"


@router.get("", response_model=list[AppointmentResponse])
async def list_appointments(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Appointment).order_by(Appointment.scheduled_at.desc()))
    return result.scalars().all()


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.post("", response_model=AppointmentResponse, status_code=201)
async def create_appointment(
    body: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = await _generate_appointment_code(db)
    appt = Appointment(**body.model_dump(), appointment_code=code, created_by=current_user.id)
    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: UUID, body: AppointmentUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(appt, field, value)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.delete("/{appointment_id}", status_code=204)
async def cancel_appointment(appointment_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = "cancelled"
    await db.commit()
```

- [ ] **Step 2: Register in `main.py`** and commit

```python
from routers import auth, patients, doctors, services, appointments
app.include_router(appointments.router)
```

```bash
git add backend/routers/appointments.py backend/main.py
git commit -m "feat: add appointments CRUD router"
```

---

## Task 11: Medical records router

**Files:**
- Create: `backend/routers/medical_records.py`

- [ ] **Step 1: Create `backend/routers/medical_records.py`**

```python
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_user
from models import MedicalRecord, User
from schemas import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordResponse

router = APIRouter(prefix="/medical-records", tags=["medical-records"])


@router.get("", response_model=list[MedicalRecordResponse])
async def list_records(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(MedicalRecord).order_by(MedicalRecord.created_at.desc()))
    return result.scalars().all()


@router.get("/{record_id}", response_model=MedicalRecordResponse)
async def get_record(record_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(MedicalRecord).where(MedicalRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return record


@router.post("", response_model=MedicalRecordResponse, status_code=201)
async def create_record(body: MedicalRecordCreate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    record = MedicalRecord(**body.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.put("/{record_id}", response_model=MedicalRecordResponse)
async def update_record(record_id: UUID, body: MedicalRecordUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(MedicalRecord).where(MedicalRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(record, field, value)
    await db.commit()
    await db.refresh(record)
    return record
```

- [ ] **Step 2: Register in `main.py`** and commit

```python
from routers import auth, patients, doctors, services, appointments, medical_records
app.include_router(medical_records.router)
```

```bash
git add backend/routers/medical_records.py backend/main.py
git commit -m "feat: add medical records CRUD router"
```

---

## Task 12: Inventory router

**Files:**
- Create: `backend/routers/inventory.py`

- [ ] **Step 1: Create `backend/routers/inventory.py`**

```python
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_user
from models import Product, StockMovement, User
from schemas import ProductCreate, ProductUpdate, ProductResponse, StockMovementCreate, StockMovementResponse

router = APIRouter(tags=["inventory"])


@router.get("/products", response_model=list[ProductResponse])
async def list_products(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Product).where(Product.is_active == True).order_by(Product.name))
    return result.scalars().all()


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(body: ProductCreate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    product = Product(**body.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: UUID, body: ProductUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/stock-movements", response_model=list[StockMovementResponse])
async def list_movements(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(StockMovement).order_by(StockMovement.created_at.desc()))
    return result.scalars().all()


@router.post("/stock-movements", response_model=StockMovementResponse, status_code=201)
async def create_movement(
    body: StockMovementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product_result = await db.execute(select(Product).where(Product.id == body.product_id))
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movement = StockMovement(**body.model_dump(), created_by=current_user.id)
    if body.type == "in":
        product.stock_quantity += body.quantity
    elif body.type == "out":
        product.stock_quantity -= body.quantity
    elif body.type == "adjustment":
        product.stock_quantity = body.quantity

    db.add(movement)
    await db.commit()
    await db.refresh(movement)
    return movement
```

- [ ] **Step 2: Register in `main.py`** and commit

```python
from routers import auth, patients, doctors, services, appointments, medical_records, inventory
app.include_router(inventory.router)
```

```bash
git add backend/routers/inventory.py backend/main.py
git commit -m "feat: add inventory router (products + stock movements)"
```

---

## Task 13: Billing router

**Files:**
- Create: `backend/routers/billing.py`

- [ ] **Step 1: Create `backend/routers/billing.py`**

```python
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_user
from models import Invoice, InvoiceItem, Payment, User
from schemas import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse,
    PaymentCreate, PaymentResponse,
)

router = APIRouter(tags=["billing"])


async def _generate_invoice_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(Invoice))
    count = result.scalar() + 1
    return f"INV-{datetime.now().strftime('%Y%m%d')}-{count:03d}"


async def _generate_payment_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(Payment))
    count = result.scalar() + 1
    return f"PAY-{datetime.now().strftime('%Y%m%d')}-{count:03d}"


@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Invoice).order_by(Invoice.issued_at.desc()))
    return result.scalars().all()


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.post("/invoices", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    body: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice_number = await _generate_invoice_number(db)
    items_data = body.items
    invoice_data = body.model_dump(exclude={"items"})
    invoice = Invoice(**invoice_data, invoice_number=invoice_number, created_by=current_user.id)
    db.add(invoice)
    await db.flush()  # get invoice.id before adding items

    for item_data in items_data:
        item = InvoiceItem(**item_data.model_dump(), invoice_id=invoice.id)
        db.add(item)

    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(invoice_id: UUID, body: InvoiceUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(invoice, field, value)
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.get("/payments", response_model=list[PaymentResponse])
async def list_payments(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Payment).order_by(Payment.created_at.desc()))
    return result.scalars().all()


@router.post("/payments", response_model=PaymentResponse, status_code=201)
async def create_payment(
    body: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment_number = await _generate_payment_number(db)
    payment = Payment(
        **body.model_dump(),
        payment_number=payment_number,
        status="paid",
        paid_at=datetime.utcnow(),
        created_by=current_user.id,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment
```

- [ ] **Step 2: Register in `main.py`** and commit

```python
from routers import auth, patients, doctors, services, appointments, medical_records, inventory, billing
app.include_router(billing.router)
```

```bash
git add backend/routers/billing.py backend/main.py
git commit -m "feat: add billing router (invoices + payments)"
```

---

## Task 14: Users router (admin only)

**Files:**
- Create: `backend/routers/users.py`

- [ ] **Step 1: Create `backend/routers/users.py`**

```python
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, require_role
from models import User, UserRole
from schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])

_admin_only = require_role(UserRole.admin)


@router.get("", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), _: User = Depends(_admin_only)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(_admin_only)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=204)
async def deactivate_user(user_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(_admin_only)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    await db.commit()
```

- [ ] **Step 2: Register in `main.py`** and commit

```python
from routers import auth, patients, doctors, services, appointments, medical_records, inventory, billing, users
app.include_router(users.router)
```

```bash
git add backend/routers/users.py backend/main.py
git commit -m "feat: add admin-only users router"
```

---

## Task 15: Finalize main.py

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Rewrite `backend/main.py` with all routers**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import auth, patients, doctors, services, appointments, medical_records, inventory, billing, users

app = FastAPI(title="Klinik Gigi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(services.router)
app.include_router(appointments.router)
app.include_router(medical_records.router)
app.include_router(inventory.router)
app.include_router(billing.router)
app.include_router(users.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 2: Start the server locally and verify**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Open browser at `http://localhost:8000/docs` — Swagger UI should show all endpoints.

- [ ] **Step 3: Run full test suite**

```bash
cd backend
pytest tests/ -v
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "feat: finalize main.py with all routers and health endpoint"
```

---

## Task 16: Seed script

**Files:**
- Create: `backend/seed.py`

- [ ] **Step 1: Create `backend/seed.py`**

```python
"""
Run once to seed demo accounts into public.users table.
Usage: python seed.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from dotenv import load_dotenv
import os

load_dotenv()
from models import User, UserRole
from dependencies import hash_password
from database import Base

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, connect_args={"ssl": "require"})
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

DEMO_USERS = [
    {"email": "admin@dentalcloud.id",  "password": "Admin@1234",  "role": UserRole.admin},
    {"email": "dokter@dentalcloud.id", "password": "Dokter@1234", "role": UserRole.doctor},
    {"email": "kasir@dentalcloud.id",  "password": "Kasir@1234",  "role": UserRole.cashier},
]

async def seed():
    async with SessionLocal() as db:
        for demo in DEMO_USERS:
            result = await db.execute(select(User).where(User.email == demo["email"]))
            if result.scalar_one_or_none():
                print(f"  skip {demo['email']} (already exists)")
                continue
            user = User(
                email=demo["email"],
                password_hash=hash_password(demo["password"]),
                role=demo["role"],
            )
            db.add(user)
            print(f"  created {demo['email']} ({demo['role'].value})")
        await db.commit()
    print("Seed complete.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
```

- [ ] **Step 2: Run the seed script**

```bash
cd backend
python seed.py
```

Expected output:
```
  created admin@dentalcloud.id (admin)
  created dokter@dentalcloud.id (doctor)
  created kasir@dentalcloud.id (cashier)
Seed complete.
```

- [ ] **Step 3: Test login with seeded user**

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@dentalcloud.id", "password": "Admin@1234"}'
```

Expected: `{"access_token": "eyJ...", "token_type": "bearer"}`

- [ ] **Step 4: Commit**

```bash
git add backend/seed.py
git commit -m "feat: add demo user seed script for public.users table"
```

---

## Task 17: Frontend — api-client.ts

**Files:**
- Create: `src/lib/api-client.ts`

- [ ] **Step 1: Create `src/lib/api-client.ts`**

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
```

- [ ] **Step 2: Add env var to `.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-client.ts .env.local
git commit -m "feat: add api-client.ts for FastAPI integration"
```

---

## Task 18: Update login page

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Read current login page**

Read `src/app/(auth)/login/page.tsx` to understand the current form structure and state management.

- [ ] **Step 2: Replace the submit handler**

Find the form submit handler (wherever `supabase.auth.signInWithPassword` or the current fetch to `/api/auth` is called) and replace with:

```typescript
import { apiFetch, setToken } from "@/lib/api-client";

// Inside the submit handler:
const data = await apiFetch<{ access_token: string; token_type: string }>(
  "/auth/login",
  {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }
);
setToken(data.access_token);
router.push("/dashboard");
```

- [ ] **Step 3: Remove any Supabase auth imports from this file**

Delete lines importing `supabase` or `createClient` that are no longer used after the change.

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/login/page.tsx
git commit -m "feat: migrate login page to FastAPI JWT auth"
```

---

## Task 19: Update register page

**Files:**
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Read current register page**

Read `src/app/(auth)/register/page.tsx` to understand current form structure.

- [ ] **Step 2: Replace submit handler**

Find the submit handler and replace with:

```typescript
import { apiFetch } from "@/lib/api-client";

// Inside the submit handler:
await apiFetch("/auth/register", {
  method: "POST",
  body: JSON.stringify({ email, password, role: "patient" }),
});
router.push("/login");
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/register/page.tsx
git commit -m "feat: migrate register page to FastAPI"
```

---

## Task 20: Update dashboard pages

**Files:**
- Modify: `src/app/(dashboard)/patients/page.tsx`
- Modify: `src/app/(dashboard)/appointments/page.tsx`
- Modify: `src/app/(dashboard)/billing/page.tsx`
- Modify: `src/app/(dashboard)/billing/[id]/page.tsx`
- Modify: `src/app/(dashboard)/inventory/page.tsx`
- Modify: `src/app/(dashboard)/medical-records/page.tsx`
- Modify: `src/app/(dashboard)/users/page.tsx`

- [ ] **Step 1: Update patients page**

Read `src/app/(dashboard)/patients/page.tsx`. Find every `fetch("/api/patients"...)` call and replace:

```typescript
// Before:
const res = await fetch("/api/patients");
const data = await res.json();

// After:
import { apiFetch } from "@/lib/api-client";
const data = await apiFetch<Patient[]>("/patients");
```

Apply the same pattern for POST/PUT/DELETE calls:
```typescript
// Before:
await fetch("/api/patients", { method: "POST", body: JSON.stringify(payload) });

// After:
await apiFetch("/patients", { method: "POST", body: JSON.stringify(payload) });
```

- [ ] **Step 2: Update appointments page**

Read `src/app/(dashboard)/appointments/page.tsx`. Replace all `fetch("/api/appointments"...)` with `apiFetch("/appointments"...)`.

Also update the form components that call these APIs: `src/components/features/appointments/appointment-form-dialog.tsx`.

- [ ] **Step 3: Update billing pages**

Read `src/app/(dashboard)/billing/page.tsx` and `src/app/(dashboard)/billing/[id]/page.tsx`. Replace all `fetch("/api/invoices"...)` with `apiFetch("/invoices"...)`.

- [ ] **Step 4: Update inventory page**

Read `src/app/(dashboard)/inventory/page.tsx`. Replace `fetch("/api/..."...)` with `apiFetch("/products"...)`.

- [ ] **Step 5: Update medical-records page**

Read `src/app/(dashboard)/medical-records/page.tsx`. Replace with `apiFetch("/medical-records"...)`.

- [ ] **Step 6: Update users page**

Read `src/app/(dashboard)/users/page.tsx`. Replace with `apiFetch("/users"...)`.

- [ ] **Step 7: Commit all dashboard updates**

```bash
git add src/app/(dashboard)/
git add src/components/features/
git commit -m "feat: migrate all dashboard pages to FastAPI via api-client"
```

---

## Task 21: Remove old Next.js API routes

**Files:**
- Delete: `src/app/api/` (entire folder)

- [ ] **Step 1: Verify no remaining imports from `src/app/api/`**

```bash
# Run in project root:
grep -r "/api/" src/app/\(dashboard\) src/app/\(auth\) src/components
```

Expected: no matches (all references should now use `apiFetch` pointing to FastAPI).

- [ ] **Step 2: Delete the folder**

```bash
# PowerShell:
Remove-Item -Recurse -Force src/app/api
```

- [ ] **Step 3: Confirm Next.js build has no errors**

```bash
npm run build
```

Expected: build succeeds without errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Next.js API routes replaced by FastAPI"
```

---

## Task 22: Railway deployment config

**Files:**
- Create: `backend/railway.toml`

- [ ] **Step 1: Create `backend/railway.toml`**

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
```

- [ ] **Step 2: Deploy to Railway**

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Set root directory to `backend/`
3. Add environment variables (from `.env.example`):
   - `DATABASE_URL` — Supabase connection string
   - `SECRET_KEY` — generated 32-char hex string
   - `ALGORITHM` — `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` — `480`
   - `FRONTEND_URL` — your Vercel URL
4. Deploy and wait for health check to pass
5. Copy the Railway URL (e.g. `https://klinik-gigi-backend.up.railway.app`)

- [ ] **Step 3: Update Vercel env var**

In Vercel project settings → Environment Variables:
```
NEXT_PUBLIC_API_URL = https://klinik-gigi-backend.up.railway.app
```

Redeploy the Vercel project.

- [ ] **Step 4: Run seed on production**

```bash
cd backend
DATABASE_URL="<railway-supabase-url>" python seed.py
```

Or run it via Railway's "Run command" feature.

- [ ] **Step 5: Test production login**

Open the Vercel URL, log in with `admin@dentalcloud.id` / `Admin@1234`. Confirm the dashboard loads data from Railway.

- [ ] **Step 6: Commit**

```bash
git add backend/railway.toml
git commit -m "feat: add Railway deployment config"
```

---

## Summary

| Phase | Tasks | Output |
|-------|-------|--------|
| Backend foundation | 1–5 | database.py, models.py, schemas.py, dependencies.py |
| Auth | 6 | /auth/login, /auth/register with tests |
| Data routers | 7–14 | All CRUD endpoints with tests for patients |
| Assembly | 15–16 | main.py wired, demo users seeded |
| Frontend migration | 17–21 | api-client.ts, pages updated, old routes deleted |
| Deployment | 22 | Railway + Vercel live |
