'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // State untuk Data Utama dari Backend
  const [pedagangList, setPedagangList] = useState([]);
  const [menuList, setMenuList] = useState([]);
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Form 1: Pendaftaran Toko/Gerobak Baru
  const [regNamaToko, setRegNamaToko] = useState('');
  const [regNoWa, setRegNoWa] = useState('');
  const [regLinkQris, setRegLinkQris] = useState('');

  // State Form 2: Penambahan Menu Makanan
  const [pilihTokoId, setPilihTokoId] = useState('');
  const [namaMakanan, setNamaMakanan] = useState('');
  const [harga, setHarga] = useState('');

  // URL API Lokal Laptop
  const BASE_URL = 'https://sapari77-pesandulu-backend.hf.space';

  // Fungsi untuk Memuat Semua Data dari Backend secara Sinkron
  const muatSemuaData = async () => {
    try {
      const resPedagang = await fetch(`${BASE_URL}/api/pedagang`);
      const dataPedagang = await resPedagang.json();
      setPedagangList(dataPedagang.pedagang || []);

      const resMenu = await fetch(`${BASE_URL}/api/menu`);
      const dataMenu = await resMenu.json();
      setMenuList(dataMenu.menu || []);

      const resOrder = await fetch(`${BASE_URL}/api/pesanan`);
      const dataOrder = await resOrder.json();
      setOrderList(dataOrder.pesanan || []);
    } catch (err) {
      console.error("Gagal memuat data dari server: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatSemuaData();
  }, []);

  // 🚀 FUNGSI BARU: Daftarkan Gerobak/Toko Baru ke Sistem
  const handleDaftarToko = async (e) => {
    e.preventDefault();
    if (!regNamaToko || !regNoWa) return alert('Nama Toko dan No WhatsApp wajib diisi!');

    try {
      const res = await fetch(`${BASE_URL}/api/pedagang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_toko: regNamaToko,
          nomor_wa: regNoWa,
          link_qris: regLinkQris,
        }),
      });

      if (res.ok) {
        alert(`🎉 Selamat! "${regNamaToko}" berhasil didaftarkan ke sistem PesanDulu!`);
        setRegNamaToko('');
        setRegNoWa('');
        setRegLinkQris('');
        muatSemuaData(); // Refresh data agar toko baru langsung muncul di pilihan menu
      }
    } catch (err) {
      alert("Gagal mendaftarkan toko: " + err.message);
    }
  };

  // Fungsi Tambah Menu Makanan (Sekarang terikat ke ID Toko)
  const handleTambahMenu = async (e) => {
    e.preventDefault();
    if (!pilihTokoId || !namaMakanan || !harga) return alert('Semua form menu wajib diisi!');
    
    try {
      const res = await fetch(`${BASE_URL}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          toko_id: parseInt(pilihTokoId), 
          nama_makanan: namaMakanan, 
          harga: parseInt(harga) 
        }),
      });
      if (res.ok) {
        setNamaMakanan(''); setHarga('');
        muatSemuaData();
      }
    } catch (err) { alert(err.message); }
  };

  const handleBeliPesanDulu = async (menuId, makanan, namaToko) => {
    const namaPembeli = prompt(`Anda ingin memesan "${makanan}" di "${namaToko}". Masukkan nama Anda:`);
    if (!namaPembeli) return;

    const catatanKustom = prompt(
      `📋 KUSTOMISASI PESANAN:\nMasukkan variasi (Contoh: Pedas Level 3). Kosongkan jika Original:`, ""
    );
    const catatanFinal = catatanKustom ? catatanKustom.trim() : "Original";

    try {
      const res = await fetch(`${BASE_URL}/api/pesanan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_pembeli: namaPembeli, menu_id: menuId, catatan: catatanFinal }),
      });
      
      if (res.ok) {
        alert(
          `🛒 PESANAN ANTRI DI KASIR!\n` +
          `----------------------------------------\n` +
          `Silakan lakukan pembayaran ke QRIS milik ${namaToko}, lalu tunjukkan bukti transfer agar pesanan Anda diteruskan ke dapur.`
        );
        muatSemuaData();
      }
    } catch (err) { alert(err.message); }
  };

  const handleKonfirmasiLunas = async (orderId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/pesanan/${orderId}/konfirmasi`, { method: 'PUT' });
      if (res.ok) {
        alert("💰 Pembayaran Terverifikasi! Pesanan masuk ke monitor dapur.");
        muatSemuaData();
      }
    } catch (err) { alert("Gagal konfirmasi: " + err.message); }
  };

  const handleSelesaikanPesanan = async (orderId) => {
    if (!confirm("Apakah makanan ini sudah disajikan?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/pesanan/${orderId}`, { method: 'DELETE' });
      if (res.ok) muatSemuaData();
    } catch (err) { alert("Gagal menyelesaikan pesanan: " + err.message); }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        <header className="text-center mb-12">
          <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">SaaS Multi-Tenant UMKM Modern</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-3 tracking-tight">Platform <span className="text-orange-600">PesanDulu</span></h1>
          <p className="text-slate-500 mt-2">Sistem otomasi pemesanan mandiri untuk gerobak kuliner dan warung makan Indonesia</p>
        </header>

        {loading ? (
          <div className="text-center py-20 bg-white border rounded-2xl shadow-sm text-slate-500 font-medium">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-4"></div>
            Menyambungkan Infrastruktur PesanDulu...
          </div>
        ) : (
          <>
            {/* AREA FORM: DAFTAR TOKO & TAMBAH MENU */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              
              {/* FORM A: PENDAFTARAN MITRA GEROBAK BARU */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-blue-500">
                <h2 className="text-xl font-bold mb-1 text-slate-900 flex items-center gap-2">
                  <span className="bg-blue-500 w-2.5 h-6 rounded-full inline-block"></span>
                  🏪 Pendaftaran Mitra Gerobak Baru
                </h2>
                <p className="text-xs text-slate-400 mb-4">Siapa pun bisa mendaftarkan lapak dagangannya secara instan dan mandiri</p>
                <form onSubmit={handleDaftarToko} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wide text-slate-600">Nama Toko / Nama Gerobak</label>
                    <input type="text" value={regNamaToko} onChange={(e) => setRegNamaToko(e.target.value)} placeholder="Contoh: Gerobak Siomay Kang Adi" className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wide text-slate-600">Nomor WhatsApp Kasir Toko</label>
                    <input type="text" value={regNoWa} onChange={(e) => setRegNoWa(e.target.value)} placeholder="Contoh: 08123456789" className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wide text-slate-600">Link Foto QRIS Toko (Opsional)</label>
                    <input type="text" value={regLinkQris} onChange={(e) => setRegLinkQris(e.target.value)} placeholder="Masukkan URL gambar QRIS" className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition duration-200">Daftarkan Toko Saya 🚀</button>
                </form>
              </div>

              {/* FORM B: MANAJEMEN MENU MAKANAN (UNTUK TOKO TERDAFTAR) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-orange-500">
                <h2 className="text-xl font-bold mb-1 text-slate-900 flex items-center gap-2">
                  <span className="bg-orange-500 w-2.5 h-6 rounded-full inline-block"></span>
                  🍔 Manajemen Menu Toko
                </h2>
                <p className="text-xs text-slate-400 mb-4">Pilih toko Anda terlebih dahulu, kemudian masukkan variasi menu makanan baru</p>
                <form onSubmit={handleTambahMenu} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wide text-slate-600">Pilih Toko Anda</label>
                    <select value={pilihTokoId} onChange={(e) => setPilihTokoId(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="">-- Klik untuk Memilih Toko --</option>
                      {pedagangList.map((toko) => (
                        <option key={toko.id} value={toko.id}>{toko.nama_toko} (WA: {toko.nomor_wa})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 uppercase tracking-wide text-slate-600">Nama Makanan</label>
                      <input type="text" value={namaMakanan} onChange={(e) => setNamaMakanan(e.target.value)} placeholder="Contoh: Batagor Kuah" className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 uppercase tracking-wide text-slate-600">Harga Jual (Rp)</label>
                      <input type="number" value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="15000" className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-sm transition duration-200">Tambahkan Varian Menu</button>
                </form>
              </div>

            </div>

            {/* AREA UTAMA: ETALASE BERBASIS TOKO/GEROBAK (SISI PEMBELI) */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                <span className="bg-slate-900 w-2.5 h-6 rounded-full inline-block"></span>
                🏪 Daftar Lapak Kuliner (Sisi Pembeli)
              </h2>
              
              {pedagangList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-white border rounded-2xl border-dashed">
                  Belum ada pedagang yang terdaftar di sistem.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {pedagangList.map((toko) => {
                    // FILTER: Ambil hanya menu yang memiliki toko_id yang sama dengan toko ini
                    const menuTokoIni = menuList.filter((m) => m.toko_id === toko.id);

                    return (
                      <div key={toko.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300">
                        {/* Header Toko */}
                        <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-extrabold text-slate-900">{toko.nama_toko}</h3>
                            <p className="text-xs text-emerald-600 font-medium mt-1">🟢 Hubungi Kasir: +{toko.nomor_wa}</p>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold uppercase">
                            {menuTokoIni.length} Menu
                          </span>
                        </div>

                        {/* Daftar Menu di Dalam Toko Ini */}
                        <div className="space-y-3">
                          {menuTokoIni.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">Pedagang belum mengunggah menu makanan...</p>
                          ) : (
                            menuTokoIni.map((menu) => (
                              <div key={menu.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-orange-50/50 transition">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-800">{menu.nama_makanan}</h4>
                                  <p className="text-sm font-extrabold text-orange-600 mt-0.5">
                                    Rp {menu.harga?.toLocaleString('id-ID') || 0}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleBeliPesanDulu(menu.id, menu.nama_makanan, toko.nama_toko)} 
                                  className="bg-slate-900 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition duration-200"
                                >
                                  Pesan Dulu
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PANTAUAN OPERASIONAL: KASIR & DAPUR */}
            <div className="grid grid-cols-1 gap-8">
              
              {/* MONITOR KASIR */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                <h2 className="text-xl font-bold mb-1 text-slate-900">💰 Monitor Kasir Pedagang (Verifikasi Pembayaran)</h2>
                <p className="text-slate-400 text-xs mb-4">Kasir masing-masing gerobak memantau uang masuk dari pembeli di sini.</p>
                {orderList.filter((o) => o.status === "Belum Bayar").length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed text-sm">Semua tagihan lunas.</div>
                ) : (
                  <div className="overflow-x-auto text-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-amber-50 text-slate-700 font-bold">
                          <th className="p-3 rounded-l-xl">Toko / Merchant</th>
                          <th className="p-3">Pembeli</th>
                          <th className="p-3">Pesanan & Catatan</th>
                          <th className="p-3">Total Tagihan</th>
                          <th className="p-3 rounded-r-xl text-center">Tindakan Kasir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderList.filter((o) => o.status === "Belum Bayar").map((order) => (
                          <tr key={order.id} className="hover:bg-amber-50/20">
                            <td className="p-3"><span className="font-bold text-blue-600">{order.nama_toko}</span></td>
                            <td className="p-3 font-medium text-slate-900">{order.nama_pembeli}</td>
                            <td className="p-3">
                              <span className="font-semibold">{order.nama_makanan}</span>
                              <div className="text-xs text-orange-600 italic">💬 {order.catatan}</div>
                            </td>
                            <td className="p-3 font-bold">Rp {order.harga?.toLocaleString('id-ID') || 0}</td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleKonfirmasiLunas(order.id)} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">Konfirmasi Lunas 💵</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* MONITOR DAPUR */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                <h2 className="text-xl font-bold mb-1 text-slate-900">🖥️ Monitor Antrean Dapur Toko</h2>
                <p className="text-slate-400 text-xs mb-4">Hanya menampilkan pesanan lunas untuk dimasak oleh masing-masing koki gerobak.</p>
                {orderList.filter((o) => o.status !== "Belum Bayar").length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed text-sm">Dapur stand-by. Belum ada antrean masak.</div>
                ) : (
                  <div className="overflow-x-auto text-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-50 text-slate-700 font-bold">
                          <th className="p-3 rounded-l-xl">Nama Toko</th>
                          <th className="p-3">Nama Pembeli</th>
                          <th className="p-3">Menu & Catatan Masak</th>
                          <th className="p-3 rounded-r-xl text-center">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderList.filter((o) => o.status !== "Belum Bayar").map((order) => (
                          <tr key={order.id} className="hover:bg-emerald-50/20">
                            <td className="p-3"><span className="font-bold text-slate-700">{order.nama_toko}</span></td>
                            <td className="p-3 font-medium text-slate-900">{order.nama_pembeli}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{order.nama_makanan}</div>
                              <div className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded w-fit mt-0.5">🔥 {order.catatan}</div>
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleSelesaikanPesanan(order.id)} className="bg-emerald-100 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg">✓ Selesai Saji</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </main>
  );
}