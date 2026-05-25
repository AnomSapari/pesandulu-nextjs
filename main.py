from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Backend Kuliner SaaS")

# Mengizinkan Frontend mengakses API tanpa terblokir CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. DEKLARASI DATABASE SIMULASI (Wajib di Atas Fungsi) ---
database_simulasi = {
    "menu": [
        {
            "id": 1,
            "nama_toko": "Warung Bu Retno",
            "nama_makanan": "Ayam Bakar Madu",
            "harga": 25000,
        },
        {
            "id": 2,
            "nama_toko": "Nasi Goreng Mas Joko",
            "nama_makanan": "Nasi Goreng Spesial",
            "harga": 18000,
        },
        {
            "id": 3,
            "nama_toko": "Pecel Lele Cak Usman",
            "nama_makanan": "Paket Pecel Lele Jumbo",
            "harga": 17000,
        },
    ],
    "pesanan": [],
}


# --- 2. VALIDASI DATA (Pydantic Schema) ---
class MenuBaru(BaseModel):
    nama_toko: str
    nama_makanan: str
    harga: int


class PesananBaru(BaseModel):
    menu_id: int
    nama_pembeli: str
    catatan: str = ""


# --- 3. JALUR DATA / API ROUTES ---


@app.get("/")
def cek_status_server():
    """Mengecek status aktif server"""
    return {"status": "aktif", "pesan": "🚀 Server Backend Kuliner SaaS Berjalan Baik!"}


@app.get("/api/menu")
def ambil_semua_menu():
    """Mengambil daftar semua menu"""
    return {"menu": database_simulasi["menu"]}


@app.post("/api/menu")
def tambah_menu_baru(data: MenuBaru):
    """Menambahkan menu baru"""
    try:
        id_baru = len(database_simulasi["menu"]) + 1
        menu_baru = {
            "id": id_baru,
            "nama_toko": data.nama_toko,
            "nama_makanan": data.nama_makanan,
            "harga": data.harga,
        }
        database_simulasi["menu"].append(menu_baru)
        return {"status": "sukses", "menu": menu_baru}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Gagal menyimpan menu: {str(e)}"
        ) from e


@app.get("/api/pesanan")
def ambil_semua_pesanan():
    """Mengambil semua antrean pesanan untuk monitor"""
    return {"pesanan": database_simulasi["pesanan"]}


@app.post("/api/pesanan")
def buat_pesanan(data: PesananBaru):
    """Memproses pesanan baru masuk"""
    try:
        # Mengambil data menu berdasarkan menu_id yang dikirim frontend
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
            "catatan": data.catatan,
            "status": "Diproses",
        }
        database_simulasi["pesanan"].append(pesanan_baru)
        return {"status": "sukses", "pesanan": pesanan_baru}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Gagal memproses pesanan: {str(e)}"
        ) from e


@app.delete("/api/pesanan/{order_id}")
def selesaikan_pesanan(order_id: int):
    """Menghapus pesanan dari monitor jika sudah selesai"""
    global database_simulasi
    try:
        pesanan_awal = len(database_simulasi["pesanan"])
        database_simulasi["pesanan"] = [
            p for p in database_simulasi["pesanan"] if p["id"] != order_id
        ]

        if len(database_simulasi["pesanan"]) == pesanan_awal:
            raise HTTPException(status_code=404, detail="ID pesanan tidak ditemukan")

        return {"status": "sukses", "pesan": f"Pesanan #{order_id} selesai"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, detail=f"Gagal menyelesaikan pesanan: {str(e)}"
        ) from e


# --- 4. CONFIG RUNNER HUGGING FACE SPACE ---
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=7860, reload=False)
