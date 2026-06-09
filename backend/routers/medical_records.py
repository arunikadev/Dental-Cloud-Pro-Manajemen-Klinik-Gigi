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
