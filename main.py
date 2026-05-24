from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI(title="PesanDulu - API Kuliner UMKM")

# Izinkan Frontend Next.js (Port 3000) mengakses Backend ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SKEMA DATA / TYPES ---
class MenuBaru(BaseModel):
    nama_toko: str
    nama_makanan: str
    harga: int

class PesananBaru(BaseModel):
    nama_pembeli: str
    menu_id: int


# --- DATABASE UTILITY ---
def inisialisasi_database_otomatis():
    koneksi = sqlite3.connect("pesandulu.db")
    kcursor = koneksi.cursor()
    
    # 1. Tabel Menu Kuliner
    kcursor.execute('''
        CREATE TABLE IF NOT EXISTS menu_kuliner (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_toko TEXT NOT NULL,
            nama_makanan TEXT NOT NULL,
            harga INTEGER NOT NULL,
            tersedia BOOLEAN DEFAULT 1
        )
    ''')
    
    # 2. TABEL BARU: Mencatat Pesanan Masuk
    kcursor.execute('''
        CREATE TABLE IF NOT EXISTS pesanan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_pembeli TEXT NOT NULL,
            menu_id INTEGER NOT NULL,
            waktu_pesan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(menu_id) REFERENCES menu_kuliner(id)
        )
    ''')
    
    # Isi data menu contoh jika kosong
    kcursor.execute("SELECT COUNT(*) FROM menu_kuliner")
    if kcursor.fetchone()[0] == 0:
        menu_contoh = [
            ('Warung Bu Retno', 'Ayam Bakar Madu', 25000),
            ('Nasi Goreng Gila Mas Joko', 'Nasi Goreng Gila', 18000),
            ('Pecel Lele Cak Usman', 'Paket Pecel Lele + Nasi', 20000)
        ]
        kcursor.executemany('INSERT INTO menu_kuliner (nama_toko, nama_makanan, harga) VALUES (?, ?, ?)', menu_contoh)
        koneksi.commit()
    koneksi.close()

inisialisasi_database_otomatis()


# --- ENDPOINTS MENU ---

@app.get("/api/menu")
def ambil_menu():
    koneksi = sqlite3.connect("pesandulu.db")
    koneksi.row_factory = sqlite3.Row
    kcursor = koneksi.cursor()
    kcursor.execute("SELECT * FROM menu_kuliner")
    semua_baris = kcursor.fetchall()
    koneksi.close()
    
    return {"menu": [dict(baris) for baris in semua_baris]}

@app.post("/api/menu")
def tambah_menu(menu: MenuBaru):
    koneksi = sqlite3.connect("pesandulu.db")
    kcursor = koneksi.cursor()
    kcursor.execute('INSERT INTO menu_kuliner (nama_toko, nama_makanan, harga) VALUES (?, ?, ?)', (menu.nama_toko, menu.nama_makanan, menu.harga))
    koneksi.commit()
    koneksi.close()
    return {"status": "Sukses", "pesan": "Menu berhasil ditambahkan"}


# --- ENDPOINTS BARU: PROSES PESANAN (ORDER) ---

# 1. API POST: Disundul ketika pembeli klik tombol "Pesan Dulu"
@app.post("/api/pesan")
def buat_pesanan(order: PesananBaru):
    try:
        koneksi = sqlite3.connect("pesandulu.db")
        kcursor = koneksi.cursor()
        kcursor.execute('INSERT INTO pesanan (nama_pembeli, menu_id) VALUES (?, ?)', (order.nama_pembeli, order.menu_id))
        koneksi.commit()
        koneksi.close()
        return {"status": "Sukses", "pesan": "Pesanan Anda berhasil dicatat di dapur!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. API GET: Digunakan oleh Pemilik UMKM untuk melihat pesanan yang masuk
@app.get("/api/pesan")
def ambil_semua_pesanan():
    koneksi = sqlite3.connect("pesandulu.db")
    koneksi.row_factory = sqlite3.Row
    kcursor = koneksi.cursor()
    
    # Query SQL gabungan (JOIN) untuk mengambil data pembeli sekaligus nama makanan & warungnya
    query = '''
        SELECT pesanan.id, pesanan.nama_pembeli, menu_kuliner.nama_makanan, menu_kuliner.nama_toko, menu_kuliner.harga 
        FROM pesanan
        JOIN menu_kuliner ON pesanan.menu_id = menu_kuliner.id
        ORDER BY pesanan.id DESC
    '''
    kcursor.execute(query)
    semua_pesanan = kcursor.fetchall()
    koneksi.close()
    
    return {"pesanan": [dict(baris) for baris in semua_pesanan]}
# 3. API DELETE: Digunakan warung untuk menghapus pesanan yang sudah selesai/diambil
@app.delete("/api/pesan/{pesanan_id}")
def hapus_pesanan(pesanan_id: int):
    try:
        koneksi = sqlite3.connect("pesandulu.db")
        kcursor = koneksi.cursor()
        kcursor.execute("DELETE FROM pesanan WHERE id = ?", (pesanan_id,))
        koneksi.commit()
        koneksi.close()
        return {"status": "Sukses", "pesan": f"Pesanan #{pesanan_id} telah diselesaikan!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
