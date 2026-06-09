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
