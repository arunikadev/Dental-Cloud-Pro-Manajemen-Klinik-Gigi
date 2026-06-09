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
