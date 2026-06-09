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
