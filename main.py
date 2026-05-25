from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI(title="PesanDulu - API Kuliner UMKM")

# --- KUNCI KEAMANAN (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- SKEMA DATA ---
class MenuBaru(BaseModel):
    nama_toko: str
    nama_makanan: str
    harga: int


class PesananBaru(BaseModel):
    menu_id: int
    nama_pembeli: str
    catatan: str = ""


# --- DATABASE UTILITY ---
def inisialisasi_database_otomatis():
    koneksi = sqlite3.connect("pesandulu.db")
    kursor = koneksi.cursor()

    # 1. Tabel Menu
    kursor.execute("""
        CREATE TABLE IF NOT EXISTS menu_kuliner (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_toko TEXT NOT NULL,
            nama_makanan TEXT NOT NULL,
            harga INTEGER NOT NULL,
            tersedia BOOLEAN DEFAULT 1
        )
    """)

    # 2. Tabel Pesanan
    kursor.execute("""
        CREATE TABLE IF NOT EXISTS pesanan_kuliner (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_pembeli TEXT NOT NULL,
            menu_id INTEGER NOT NULL,
            waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(menu_id) REFERENCES menu_kuliner(id)
        )
    """)

    # Isi data contoh menu jika kosong
    kursor.execute("SELECT COUNT(*) FROM menu_kuliner")
    if kursor.fetchone()[0] == 0:
        menu_contoh = [
            ("Warung Bu Retno", "Ayam Bakar Madu", 25000),
            ("Nasi Goreng Mas Joko", "Nasi Goreng Gila", 18000),
            ("Pecel Lele Cak Usman", "Paket Pecel Lele + Nasi", 20000),
        ]
        kursor.executemany(
            "INSERT INTO menu_kuliner (nama_toko, nama_makanan, harga) VALUES (?, ?, ?)",
            menu_contoh,
        )
        koneksi.commit()

    koneksi.close()


# Jalankan pembuatan database
inisialisasi_database_otomatis()


# --- ROUTES / ENDPOINTS ---


# Posisi spasi sudah diluruskan ke kiri dan string HTML sudah ditutup sempurna
@app.get("/", response_class=HTMLResponse)
def home():
    return """
    <html>
        <head><title>PesanDulu Backend</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: #ea580c;">🚀 Backend PesanDulu Aktif!</h1>
            <p>Status: Sukses | Jalur API siap digunakan.</p>
        </body>
    </html>
    """


# 1. Ambil Semua Menu
@app.get("/api/menu")
def ambil_menu():
    koneksi = sqlite3.connect("pesandulu.db")
    koneksi.row_factory = sqlite3.Row
    kursor = koneksi.cursor()
    kursor.execute("SELECT * FROM menu_kuliner")
    semua_baris = kursor.fetchall()
    koneksi.close()

    daftar_menu = [
        {
            "id": b["id"],
            "nama_toko": b["nama_toko"],
            "nama_makanan": b["nama_makanan"],
            "harga": b["harga"],
            "tersedia": bool(b["tersedia"]),
        }
        for b in semua_baris
    ]
    return {"menu": daftar_menu}


# 2. Tambah Menu Baru
@app.post("/api/menu")
def tambah_menu(menu: MenuBaru):
    koneksi = sqlite3.connect("pesandulu.db")
    kursor = koneksi.cursor()
    kursor.execute(
        "INSERT INTO menu_kuliner (nama_toko, nama_makanan, harga) VALUES (?, ?, ?)",
        (menu.nama_toko, menu.nama_makanan, menu.harga),
    )
    koneksi.commit()
    koneksi.close()
    return {"status": "Sukses", "pesan": "Menu berhasil ditambahkan"}


# 3. Ambil Semua Pesanan (Dapur Monitor)
@app.post("/api/pesanan")
def buat_pesanan(data: PesananBaru):
    try:
        # Cari data menu untuk mengambil nama makanan, nama toko, dan harga
        menu_terpilih = next(
            (m for m in database_simulasi["menu"] if m["id"] == data.menu_id), None
        )
        if not menu_terpilih:
            raise HTTPException(status_code=404, detail="Menu tidak ditemukan")

        id_baru = len(database_simulasi["pesanan"]) + 1
        pesanan_baru = {
            "id": id_baru,
            "menu_id": data.menu_id,
            "nama_pembeli": data.nama_pembeli,
            "nama_makanan": menu_terpilih["nama_makanan"],
            "nama_toko": menu_terpilih["nama_toko"],
            "harga": menu_terpilih["harga"],
            "catatan": data.catatan,  # <-- Simpan catatan rasa ke database
            "status": "Diproses",
        }
        database_simulasi["pesanan"].append(pesanan_baru)
        return {"status": "sukses", "pesanan": pesanan_baru}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Gagal memproses pesanan: {str(e)}"
        ) from e


# 4. Tambah Pesanan Baru
@app.post("/api/pesanan")
def tambah_pesanan(pesanan: PesananBaru):
    koneksi = sqlite3.connect("pesandulu.db")
    kursor = koneksi.cursor()
    kursor.execute(
        "INSERT INTO pesanan_kuliner (menu_id, nama_pembeli) VALUES (?, ?)",
        (pesanan.menu_id, pesanan.nama_pembeli),
    )
    koneksi.commit()
    koneksi.close()
    return {"status": "Sukses", "pesan": "Pesanan berhasil masuk dapur"}


# 5. Hapus/Selesaikan Pesanan
@app.delete("/api/pesanan/{order_id}")
def selesaikan_pesanan(order_id: int):
    koneksi = sqlite3.connect("pesandulu.db")
    kursor = koneksi.cursor()
    kursor.execute("DELETE FROM pesanan_kuliner WHERE id = ?", (order_id,))
    koneksi.commit()
    koneksi.close()
    return {"status": "Sukses", "pesan": "Pesanan selesai diproses"}


# --- PENGUNCI SERVER HUGGING FACE (Tambahkan di paling bawah file main.py) ---
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=7860, reload=False)
