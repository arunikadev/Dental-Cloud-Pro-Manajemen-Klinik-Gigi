# FastAPI Backend Design — Manajemen Operasional Klinik Gigi

**Date:** 2026-06-10  
**Branch:** feature/fastapi-backend  
**Status:** Approved

---

## 1. Tujuan

Menambahkan FastAPI sebagai backend terpisah yang menggantikan Next.js API routes (`src/app/api/`). Frontend Next.js tetap di Vercel, backend FastAPI di-deploy ke Railway, dan database tetap menggunakan Supabase PostgreSQL yang sudah ada (schema tidak diubah).

---

## 2. Arsitektur

```
Next.js (Vercel)
      │
      │  HTTP + Authorization: Bearer <JWT>
      ▼
FastAPI (Railway)
  ├── /auth              → login, register
  ├── /patients          → CRUD pasien
  ├── /appointments      → CRUD janji temu
  ├── /medical-records   → rekam medis (SOAP)
  ├── /inventory         → produk + stock movements
  ├── /billing           → invoice + pembayaran
  ├── /doctors           → data dokter + jadwal
  ├── /services          → layanan klinik (read-heavy)
  └── /users             → manajemen user (admin only)
      │
      │  asyncpg (PostgreSQL direct connection)
      ▼
Supabase PostgreSQL
(schema tidak diubah, triggers & RLS tetap ada)
```

---

## 3. Tech Stack Backend

| Komponen | Library |
|----------|---------|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x (async) |
| Driver DB | asyncpg |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| Validasi | Pydantic v2 |
| Server | Uvicorn |
| Config | python-dotenv |

---

## 4. Struktur Folder Backend

```
backend/
├── main.py              # FastAPI app, CORS middleware, router registration
├── database.py          # async engine, SessionLocal, Base
├── models.py            # SQLAlchemy ORM models (mirror schema.sql)
├── schemas.py           # Pydantic schemas (request & response shapes)
├── dependencies.py      # get_db(), get_current_user()
├── requirements.txt
├── .env                 # DATABASE_URL, SECRET_KEY, dll (tidak di-commit)
└── routers/
    ├── auth.py          # POST /auth/login, POST /auth/register
    ├── patients.py      # GET/POST/PUT/DELETE /patients, /patients/{id}
    ├── appointments.py  # GET/POST/PUT/DELETE /appointments, /appointments/{id}
    ├── medical_records.py
    ├── inventory.py     # /products, /products/{id}, /stock-movements
    ├── billing.py       # /invoices, /invoices/{id}, /payments
    ├── doctors.py       # /doctors, /doctors/{id}
    ├── services.py      # /services (GET only untuk frontend)
    └── users.py         # /users — admin role required
```

---

## 5. Auth Flow

1. Frontend kirim `POST /auth/login` dengan `{ email, password }`
2. FastAPI verifikasi password dengan `passlib.verify` terhadap `password_hash` di tabel `users`
3. FastAPI return `{ access_token, token_type: "bearer" }` — JWT expire 8 jam
4. Frontend simpan token di `localStorage`
5. Setiap request berikutnya sertakan header `Authorization: Bearer <token>`
6. Dependency `get_current_user()` di-inject ke semua protected endpoints — decode JWT, load user dari DB

**JWT payload:** `{ sub: user_id, role: user_role, exp: ... }`

---

## 6. Pola REST per Modul

Konsisten di semua router:

| Method | Path | Aksi |
|--------|------|------|
| GET | `/patients` | List semua (dengan pagination & filter) |
| GET | `/patients/{id}` | Detail satu record |
| POST | `/patients` | Buat baru |
| PUT | `/patients/{id}` | Update |
| DELETE | `/patients/{id}` | Hapus (soft delete via `is_active=false`) |

---

## 7. Perubahan Frontend

**Dihapus:**
- `src/app/api/` (seluruh folder — 7 route files)

**Ditambah:**
- `src/lib/api-client.ts` — wrapper fetch ke FastAPI, otomatis attach Bearer token

**Diupdate:**
- `src/app/(auth)/login/page.tsx` → panggil `POST /auth/login`, simpan JWT
- `src/app/(auth)/register/page.tsx` → panggil `POST /auth/register`
- Semua halaman dashboard → gunakan `apiFetch()` dari `api-client.ts`

---

## 8. Catatan Penting: Tabel `users` vs `auth.users`

Supabase punya dua tabel user yang berbeda:
- `auth.users` — tabel internal Supabase Auth (dipakai seed-users.sql saat ini)
- `public.users` — tabel custom di schema.sql dengan kolom `password_hash`

**FastAPI akan menggunakan `public.users`**, bukan `auth.users`. Artinya:
- Demo accounts di `auth.users` tidak bisa login ke FastAPI
- Perlu seed ulang `public.users` dengan passlib bcrypt hash (dilakukan via script seed FastAPI)
- Format bcrypt passlib (`$2b$...`) kompatibel dengan pgcrypto `crypt()` (`$2a$...`)

---

## 9. Environment Variables

**FastAPI (`.env` di Railway):**
```
# Supabase direct connection — tambahkan ?ssl=require untuk production
DATABASE_URL=postgresql+asyncpg://<user>:<pass>@db.<project-ref>.supabase.co:5432/postgres?ssl=require
SECRET_KEY=<random 32+ char string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
FRONTEND_URL=https://<nama-project>.vercel.app
```

**Next.js (`.env.local` di Vercel):**
```
NEXT_PUBLIC_API_URL=https://<nama-project>.up.railway.app
```

---

## 10. CORS

FastAPI dikonfigurasi dengan `CORSMiddleware`:
- `allow_origins`: URL Vercel production + `http://localhost:3000` untuk dev
- `allow_methods`: `["*"]`
- `allow_headers`: `["*"]`
- `allow_credentials`: `True`

---

## 11. Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend (Next.js) | Vercel | Sudah ada, tambah env var `NEXT_PUBLIC_API_URL` |
| Backend (FastAPI) | Railway | Buat service baru, connect ke Supabase DB |
| Database (PostgreSQL) | Supabase | Tidak berubah |

Railway start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 12. Yang Tidak Diubah

- Schema database (`database/schema.sql`) — tidak ada migrasi
- Tabel, index, trigger, RLS policy di Supabase
- Komponen UI Next.js (`src/components/`)
- Halaman dashboard (`src/app/(dashboard)/`) — hanya update fetch calls
