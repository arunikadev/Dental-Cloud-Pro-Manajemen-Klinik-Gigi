# 🦷 DentalCloud Pro — Penjelasan Sistem Manajemen Klinik Gigi

> **Tugas Matakuliah:** Pemrograman Web Lanjutan  
> **Kelompok 12** — MOCH SYECH YUSUF M · AKHMAD HIDYAT · MUHAMMAD FADHIL MULYADI

---

## 1. Gambaran Umum Website

**DentalCloud Pro** adalah aplikasi manajemen operasional klinik gigi berbasis web yang mengintegrasikan seluruh proses bisnis klinik dalam satu platform digital. Sistem ini dirancang untuk menggantikan pencatatan manual dan menghadirkan efisiensi dalam pengelolaan pasien, jadwal dokter, rekam medis, inventaris, hingga keuangan.

### Tujuan Utama
- **Digitalisasi** seluruh alur kerja klinik gigi
- **Sentralisasi data** pasien, jadwal, dan keuangan dalam satu sistem
- **Kontrol akses berbasis peran** (RBAC) agar setiap pengguna hanya melihat fitur yang relevan
- **Transparansi keuangan** melalui modul billing dan laporan otomatis

---

## 2. Teknologi yang Digunakan

### Frontend
| Teknologi | Kegunaan |
|-----------|----------|
| **Next.js 14** (App Router) | Framework React untuk SSR & routing |
| **React** | Library UI utama |
| **Tailwind CSS** | Utility-first CSS framework |
| **Shadcn UI** | Komponen UI yang konsisten |
| **Lucide React** | Library ikon |
| **next-themes** | Toggle Dark/Light mode |

### Backend
| Teknologi | Kegunaan |
|-----------|----------|
| **FastAPI** (Python) | REST API backend yang cepat & async |
| **SQLAlchemy** (Async) | ORM untuk komunikasi dengan database |
| **PostgreSQL** | Database relasional utama |
| **Pydantic** | Validasi data request & response |
| **JWT (Jose)** | Autentikasi berbasis token |
| **Bcrypt / Passlib** | Hashing password yang aman |

### Database & Auth (Supabase)
| Teknologi | Kegunaan |
|-----------|----------|
| **Supabase** | PostgreSQL cloud + Auth terintegrasi |
| **Supabase Auth** | Manajemen sesi dan autentikasi user |

### Deployment
| Komponen | Platform |
|----------|----------|
| Backend | Railway (via `Procfile` & `railway.toml`) |
| Frontend | Vercel / local Next.js dev server |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Client                   │
│              Next.js 14 (App Router)                 │
│    Tailwind CSS · Shadcn UI · Supabase Auth Client   │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / REST API
                         │ JWT Token
         ┌───────────────▼───────────────┐
         │    FastAPI Backend (Python)    │
         │  Routers · Schemas · Models    │
         │   JWT Auth · Role Checking     │
         └───────────────┬───────────────┘
                         │ SQLAlchemy (Async)
         ┌───────────────▼───────────────┐
         │     Supabase (PostgreSQL)      │
         │  Auth · Database · Storage     │
         └───────────────────────────────┘
```

### Pola Arsitektur
- **Fullstack Terpisah**: Frontend (Next.js) dan Backend (FastAPI) berjalan sebagai layanan terpisah
- **API-First**: Semua interaksi data melalui REST API
- **RBAC (Role-Based Access Control)**: Setiap endpoint API dan halaman UI dikontrol berdasarkan peran pengguna

---

## 4. Role Pengguna (RBAC)

Sistem memiliki **3 peran aktif** yang dapat login ke dashboard:

| Peran | Kode | Deskripsi |
|-------|------|-----------|
| 🔴 **Admin** | `admin` | Super-user dengan akses penuh ke seluruh sistem |
| 🟢 **Dokter** | `doctor` | Akses klinis — jadwal, rekam medis, inventaris |
| 🟡 **Kasir** | `cashier` | Akses keuangan — billing, pembayaran, invoice |

> Terdapat juga role `patient` di level database, namun pasien tidak memiliki akses login ke dashboard web.

### Akun Demo
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@dentalcloud.id` | `Admin@1234` |
| Dokter | `dokter@dentalcloud.id` | `Dokter@1234` |
| Kasir | `kasir@dentalcloud.id` | `Kasir@1234` |

---

## 5. Sitemap & Daftar Halaman

### Struktur URL Lengkap

```
/                          → Redirect ke /dashboard (jika sudah login)
│
├── /login                 → Halaman Login
├── /register              → Halaman Registrasi
│
└── /dashboard (Auth Required)
    ├── /dashboard         → Dasbor Utama
    ├── /patients          → Manajemen Pasien
    ├── /appointments      → Jadwal & Janji Temu
    ├── /medical-records   → Rekam Medis
    ├── /inventory         → Inventaris (Obat & Alat)
    ├── /billing           → Kasir & Billing
    │   └── /billing/[id]  → Detail Invoice
    ├── /reports           → Laporan & Analitik
    ├── /users             → Manajemen Pengguna
    ├── /settings          → Master Data (Layanan, Dokter, dll)
    ├── /profile           → Profil Pengguna
    ├── /pengaturan        → Preferensi Akun
    └── /help              → Halaman Bantuan
```

---

## 6. Akses Halaman Per Role

### Matriks Akses

| Halaman | 🔴 Admin | 🟢 Dokter | 🟡 Kasir |
|---------|:--------:|:---------:|:--------:|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/patients` | ✅ | ✅ | ✅ |
| `/appointments` | ✅ | ✅ | ✅ |
| `/medical-records` | ❌ | ✅ | ❌ |
| `/inventory` | ❌ | ✅ | ❌ |
| `/billing` | ✅ | ❌ | ✅ |
| `/reports` | ✅ | ❌ | ❌ |
| `/users` | ✅ | ❌ | ❌ |
| `/settings` | ✅ | ❌ | ❌ |
| `/profile` | ✅ | ✅ | ✅ |
| `/help` | ✅ | ✅ | ✅ |

> Akses halaman dikontrol langsung di komponen sidebar (`app-sidebar.tsx`) menggunakan `RoleContext` yang membaca peran dari sesi Supabase Auth.

---

## 7. Penjelasan Detail Tiap Role

---

### 🔴 ADMIN — Akses Penuh

Admin adalah pengelola utama sistem. Ia dapat mengakses seluruh fitur dan memiliki otoritas tertinggi.

#### Halaman yang Dapat Diakses:

**📊 Dasbor (`/dashboard`)**
- Ringkasan statistik harian: jumlah janji temu, pasien baru, pendapatan hari ini
- Grafik pendapatan (chart)
- Status stok inventaris kritis
- Daftar janji temu terbaru

**👥 Pasien (`/patients`)**
- Melihat daftar seluruh pasien (tabel + pencarian)
- Mendaftarkan pasien baru (nama, NIK, tanggal lahir, golongan darah, kontak darurat, catatan alergi)
- Mengubah data pasien
- Menonaktifkan/mengaktifkan pasien

**📅 Jadwal (`/appointments`)**
- Melihat kalender janji temu (tampilan hari/minggu/bulan)
- Membuat janji temu baru
- Mengubah status janji (scheduled → confirmed → in_progress → completed)
- Membatalkan janji temu
- Shortcut "Buat Janji Baru" dari sidebar

**💰 Kasir & Billing (`/billing`)**
- Membuat invoice/tagihan pasca tindakan
- Menambahkan item tagihan (layanan + produk)
- Menerapkan diskon dan pajak
- Memproses pembayaran (Cash, Debit, Kredit, Transfer, QRIS, Asuransi)
- Melihat riwayat invoice dan pembayaran
- Melihat detail invoice (`/billing/[id]`)

**📈 Laporan (`/reports`)**  *(Admin Eksklusif)*
- Laporan pendapatan harian/bulanan
- Grafik statistik kunjungan pasien
- Analitik performa klinik

**👤 Pengguna (`/users`)**  *(Admin Eksklusif)*
- Melihat seluruh akun pengguna sistem
- Menonaktifkan/ban akun pengguna
- Mengelola akses dan status akun

**⚙️ Master Data (`/settings`)**  *(Admin Eksklusif)*
- Mengelola data Dokter (tambah, ubah, nonaktifkan)
- Mengelola Layanan Klinik (Scaling, Tambal, Cabut, dll + harga + durasi)
- Mengelola Kategori Layanan
- Mengatur tarif konsultasi dokter

---

### 🟢 DOKTER — Akses Klinis

Dokter berfokus pada aktivitas medis: melihat jadwal praktik, mencatat rekam medis, dan memantau stok obat.

#### Halaman yang Dapat Diakses:

**📊 Dasbor (`/dashboard`)**
- Melihat jadwal hari ini
- Statistik umum klinik (read-only)

**👥 Pasien (`/patients`)**
- Melihat data pasien yang terdaftar
- Mencari pasien berdasarkan nama/kode
- Melihat detail profil pasien (termasuk catatan alergi)

**📅 Jadwal (`/appointments`)**
- Melihat jadwal praktik pribadi
- Mengkonfirmasi kehadiran pasien (check-in)
- Mengubah status janji temu yang ditangani

**📋 Rekam Medis (`/medical-records`)**  *(Dokter Eksklusif)*
- Membuat rekam medis baru (format SOAP: Subjective, Objective, Assessment, Plan)
- Mencatat tanda vital pasien (vital signs dalam format JSONB)
- Menulis diagnosis dan rencana tindakan
- Menambahkan lampiran (foto rontgen, dokumen)
- Melihat riwayat rekam medis pasien

**📦 Inventaris (`/inventory`)**  *(Dokter Eksklusif)*
- Melihat daftar stok obat dan alat medis
- Memantau level stok (peringatan stok minimum)
- Mencatat penggunaan stok (stock movement: out)
- Melihat kategori produk (Obat, Alat Medis)

---

### 🟡 KASIR — Akses Keuangan

Kasir berfokus pada transaksi keuangan pasca tindakan medis.

#### Halaman yang Dapat Diakses:

**📊 Dasbor (`/dashboard`)**
- Melihat ringkasan pendapatan hari ini
- Daftar pasien yang perlu diproses pembayarannya

**👥 Pasien (`/patients`)**
- Mencari data pasien untuk keperluan billing
- Memverifikasi identitas pasien

**📅 Jadwal (`/appointments`)**
- Melihat jadwal untuk mengetahui pasien yang sudah selesai tindakan
- Membuat janji temu baru (via shortcut "Buat Janji Baru" di sidebar)

**💰 Kasir & Billing (`/billing`)**  *(Kasir Utama)*
- Membuat invoice berdasarkan janji temu yang selesai
- Menambahkan item tagihan (layanan medis + produk/obat)
- Menerapkan diskon dan pajak
- Memproses pembayaran dengan berbagai metode:
  - 💵 Tunai (Cash)
  - 💳 Kartu Debit
  - 💳 Kartu Kredit
  - 🏦 Transfer Bank
  - 📱 QRIS
  - 🏥 Asuransi
- Mencetak struk pembayaran
- Melihat riwayat transaksi

---

## 8. Fitur-Fitur Utama

### 🔐 Autentikasi & Keamanan
- Login dengan email + password via Supabase Auth
- JWT Token dengan masa berlaku 8 jam
- Password di-hash dengan Bcrypt
- Middleware proteksi halaman (redirect ke `/login` jika belum login)
- Role tersimpan di `user_metadata` Supabase

### 📅 Manajemen Janji Temu
- Status alur janji: `scheduled → confirmed → checked_in → in_progress → completed`
- Status alternatif: `cancelled`, `no_show`
- Kode janji otomatis: `APT-YYYYMMDD-NNN`
- Dialog cepat buat janji dari sidebar (Admin & Kasir)

### 📋 Rekam Medis (Format SOAP)
- **S**ubjective: Keluhan pasien
- **O**bjective: Hasil pemeriksaan objektif
- **A**ssessment: Diagnosis dokter
- **P**lan: Rencana tindakan/resep
- Tanda vital dalam format fleksibel (JSON)
- Lampiran (foto, dokumen)

### 💰 Sistem Billing
- Invoice otomatis dengan kode: `INV-YYYYMMDD-NNN`
- Item billing: layanan medis + produk/obat
- Dukungan diskon dan pajak
- Status invoice: `draft → issued → paid → overdue → cancelled`
- Pembayaran: `PAY-YYYYMMDD-NNN`
- Cetak struk

### 📦 Inventaris
- Stok obat dan alat medis
- Alert stok minimum (`minimum_stock`)
- Pergerakan stok: `in` (masuk) / `out` (keluar) / `adjustment` (penyesuaian)
- Kategori produk fleksibel
- Flag resep (`is_prescription`)

### 🎨 UI/UX
- **Dark Mode / Light Mode** toggle
- **Responsive** — sidebar drawer di mobile, fixed di desktop
- **Navigasi dinamis** — menu sidebar menyesuaikan role pengguna
- Komponen konsisten menggunakan Shadcn UI

---

## 9. Struktur Database

### Tabel-Tabel Utama

```
users               → Kredensial login (email, password_hash, role)
│
├── patients        → Data lengkap pasien (one-to-one dengan users)
├── doctors         → Data dokter (one-to-one dengan users)
│   └── specializations → Spesialisasi dokter
│
├── appointments    → Janji temu (pasien + dokter + layanan)
│   └── medical_records → Rekam medis (one-to-one dengan appointment)
│
├── services        → Master layanan (Scaling, Tambal, dll)
│   └── service_categories → Kategori layanan
│
├── products        → Stok obat & alat medis
│   ├── product_categories → Kategori produk
│   └── stock_movements    → Riwayat pergerakan stok
│
└── invoices        → Tagihan pasien
    ├── invoice_items → Detail item tagihan
    └── payments      → Riwayat pembayaran
```

### Enum Penting
| Enum | Nilai |
|------|-------|
| `UserRole` | `admin`, `doctor`, `patient`, `cashier` |
| `AppointmentStatus` | `scheduled`, `confirmed`, `checked_in`, `in_progress`, `completed`, `cancelled`, `no_show` |
| `InvoiceStatus` | `draft`, `issued`, `paid`, `overdue`, `cancelled` |
| `PaymentMethod` | `cash`, `debit_card`, `credit_card`, `transfer`, `insurance`, `qris` |
| `PaymentStatus` | `pending`, `partial`, `paid`, `refunded`, `cancelled` |

---

## 10. Struktur Folder Proyek

```
Manajemen-Operasional-Klinik-Gigi/
│
├── backend/                    # FastAPI Backend (Python)
│   ├── main.py                 # Entry point + CORS config
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── dependencies.py         # Auth middleware (JWT, role check)
│   ├── database.py             # Koneksi database async
│   ├── seed.py                 # Data awal (seed database)
│   └── routers/
│       ├── auth.py             # Login, Register
│       ├── patients.py         # CRUD Pasien
│       ├── doctors.py          # CRUD Dokter
│       ├── services.py         # Master Layanan
│       ├── appointments.py     # CRUD Janji Temu
│       ├── medical_records.py  # CRUD Rekam Medis
│       ├── inventory.py        # Produk + Stok
│       ├── billing.py          # Invoice + Pembayaran
│       └── users.py            # Manajemen User (Admin only)
│
├── src/                        # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/          # Halaman Login
│   │   │   └── register/       # Halaman Registrasi
│   │   └── (dashboard)/        # Protected Pages
│   │       ├── dashboard/      # Dasbor Utama
│   │       ├── patients/       # Manajemen Pasien
│   │       ├── appointments/   # Jadwal & Janji Temu
│   │       ├── medical-records/# Rekam Medis
│   │       ├── inventory/      # Inventaris
│   │       ├── billing/        # Kasir & Billing
│   │       │   └── [id]/       # Detail Invoice
│   │       ├── reports/        # Laporan
│   │       ├── users/          # Manajemen Pengguna
│   │       ├── settings/       # Master Data
│   │       ├── profile/        # Profil Akun
│   │       ├── pengaturan/     # Preferensi
│   │       └── help/           # Bantuan
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx # Navigasi sidebar + role filter
│   │   │   └── app-topbar.tsx  # Topbar + user info + dark mode
│   │   ├── features/
│   │   │   ├── appointments/   # Komponen form janji temu
│   │   │   └── patients/       # Komponen manajemen pasien
│   │   └── ui/                 # Shadcn UI components
│   │
│   ├── contexts/
│   │   └── role-context.tsx    # Global state untuk role user
│   │
│   ├── lib/
│   │   └── supabase.ts         # Supabase client config
│   │
│   └── types/                  # TypeScript type definitions
│
├── database/                   # SQL migration files
├── package.json                # Node.js dependencies
└── README.md                   # Dokumentasi proyek
```

---

## 11. Alur Kerja (User Flow) Tipikal

### Alur Admin — Menambah Dokter & Layanan Baru
```
Login → /settings → Tambah Dokter → Tambah Layanan → Selesai
```

### Alur Kasir — Mendaftarkan Pasien & Buat Janji
```
Login → /patients → Daftarkan Pasien Baru
      → "Buat Janji Baru" (sidebar) → Pilih Pasien + Dokter + Layanan
      → Konfirmasi → Janji Terbuat (/appointments)
```

### Alur Dokter — Menangani Pasien
```
Login → /appointments → Lihat Jadwal Hari Ini
      → Update status "Checked In" → "In Progress"
      → /medical-records → Buat Rekam Medis (SOAP)
      → Update status "Completed"
```

### Alur Kasir — Billing Pasca Tindakan
```
Login → /billing → Buat Invoice
      → Pilih Pasien + Appointment selesai
      → Tambah item (layanan + obat)
      → Terapkan diskon/pajak
      → Proses Pembayaran → Cetak Struk
```

---

## 12. API Endpoint Backend

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/auth/login` | Login & dapatkan JWT token |
| `POST` | `/auth/register` | Daftarkan akun baru |

### Pasien
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/patients` | Daftar semua pasien |
| `POST` | `/patients` | Tambah pasien baru |
| `PUT` | `/patients/{id}` | Update data pasien |

### Janji Temu
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/appointments` | Daftar semua janji |
| `POST` | `/appointments` | Buat janji baru |
| `PUT` | `/appointments/{id}` | Update/ubah status |
| `DELETE` | `/appointments/{id}` | Batalkan janji |

### Rekam Medis
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/medical-records` | Semua rekam medis |
| `POST` | `/medical-records` | Buat rekam medis |
| `PUT` | `/medical-records/{id}` | Update rekam medis |

### Billing
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/invoices` | Daftar invoice |
| `POST` | `/invoices` | Buat invoice |
| `PUT` | `/invoices/{id}` | Update status invoice |
| `GET` | `/payments` | Daftar pembayaran |
| `POST` | `/payments` | Proses pembayaran |

### Inventaris
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/products` | Daftar produk |
| `POST` | `/products` | Tambah produk |
| `PUT` | `/products/{id}` | Update produk |
| `GET` | `/stock-movements` | Riwayat stok |
| `POST` | `/stock-movements` | Catat pergerakan stok |

### Pengguna (Admin Only)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/users` | Daftar semua user |
| `GET` | `/users/{id}` | Detail user |
| `DELETE` | `/users/{id}` | Nonaktifkan user |

---

*Dokumen ini dibuat untuk keperluan presentasi tugas matakuliah Pemrograman Web Lanjutan — Kelompok 12.*
