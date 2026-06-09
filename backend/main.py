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
