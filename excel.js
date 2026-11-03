const router = require('express').Router();
const ExcelJS = require('exceljs');

module.exports = (db) => {
  router.get('/export', async (req, res) => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'System Inventaris';

      // ================= SHEET 1 =================
      const sheetStock = workbook.addWorksheet('Stok & Nilai Aset');
      sheetStock.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Kode Barang', key: 'code', width: 15 },
        { header: 'Nama Barang', key: 'name', width: 28 },
        { header: 'Kategori', key: 'category', width: 15 },
        { header: 'Harga Beli (Rp)', key: 'buy_price', width: 18 },
        { header: 'Harga Jual (Rp)', key: 'sell_price', width: 18 },
        { header: 'Stok', key: 'stock', width: 10 },
        { header: 'Total Nilai Beli (Rp)', key: 'total_val', width: 22 }
      ];
      sheetStock.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      sheetStock.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };

      const products = await new Promise((resolve) => db.all(`SELECT * FROM products ORDER BY name ASC`, [], (e, r) => resolve(r)));
      let totalAset = 0;
      products.forEach((p, index) => {
        const val = p.stock * p.buy_price;
        totalAset += val;
        const row = sheetStock.addRow({
          no: index + 1, code: p.code, name: p.name, category: p.category,
          buy_price: p.buy_price, sell_price: p.sell_price, stock: p.stock, total_val: val
        });
        row.getCell('buy_price').numFmt = '"Rp "#,##0';
        row.getCell('sell_price').numFmt = '"Rp "#,##0';
        row.getCell('total_val').numFmt = '"Rp "#,##0';
      });
      const sumRow = sheetStock.addRow({ name: 'TOTAL NILAI ASET GUDANG', total_val: totalAset });
      sumRow.font = { bold: true };
      sumRow.getCell('total_val').numFmt = '"Rp "#,##0';

      // ================= SHEET 2 =================
      const sheetTx = workbook.addWorksheet('Riwayat Masuk & Keluar');
      sheetTx.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Tanggal & Waktu', key: 'created_at', width: 20 },
        { header: 'Tipe Transaksi', key: 'type', width: 16 },
        { header: 'Kode Barang', key: 'code', width: 15 },
        { header: 'Nama Barang', key: 'name', width: 25 },
        { header: 'QTY', key: 'qty', width: 10 },
        { header: 'Harga Satuan (Rp)', key: 'unit_price', width: 18 },
        { header: 'Total (Rp)', key: 'total_price', width: 20 },
        { header: 'Nama Pembeli', key: 'recipient', width: 22 },
        { header: 'Kode Resi', key: 'resi', width: 20 },
        { header: 'Alamat Pengiriman', key: 'alamat', width: 35 }
      ];
      sheetTx.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      sheetTx.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F766E' } };

      const txs = await new Promise((resolve) => db.all(`SELECT t.*, p.code, p.name FROM transactions t JOIN products p ON t.product_id = p.id ORDER BY t.created_at DESC`, [], (e, r) => resolve(r)));
      
      txs.forEach((t) => {
        const row = sheetTx.addRow({
          id: t.id, created_at: t.created_at, type: t.type === 'IN' ? 'MASUK (+)' : 'KELUAR (-)',
          code: t.code, name: t.name, qty: t.qty, unit_price: t.unit_price, total_price: t.total_price,
          recipient: t.type === 'OUT' ? (t.recipient || '-') : '-',
          resi: t.type === 'OUT' ? (t.resi || '-') : '-',
          alamat: t.type === 'OUT' ? (t.alamat || '-') : '-'
        });
        row.getCell('type').font = { color: { argb: t.type === 'IN' ? '15803D' : 'B91C1C' }, bold: true };
        row.getCell('unit_price').numFmt = '"Rp "#,##0';
        row.getCell('total_price').numFmt = '"Rp "#,##0';
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Laporan_Inventaris_${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
