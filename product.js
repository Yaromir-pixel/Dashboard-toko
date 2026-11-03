const router = require('express').Router();

module.exports = (db) => {
  router.get('/list', (req, res) => {
    db.all(`SELECT * FROM products ORDER BY name ASC`, [], (err, rows) => {
      if (err) return res.status(400).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    });
  });

  router.post('/add', (req, res) => {
    const { code, name, category, buy_price, sell_price, initial_stock } = req.body;
    const sql = `INSERT INTO products (code, name, category, buy_price, sell_price, stock) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [code, name, category || 'Lainnya', buy_price || 0, sell_price || 0, initial_stock || 0], function(err) {
      if (err) return res.status(400).json({ success: false, error: 'Kode barang sudah ada / error.' });
      
      const productId = this.lastID;
      if (initial_stock > 0) {
        db.run(`INSERT INTO transactions (product_id, type, qty, unit_price, total_price, notes) VALUES (?, 'IN', ?, ?, ?, 'Stok Awal')`,
          [productId, initial_stock, buy_price || 0, (buy_price || 0) * initial_stock]);
      }
      res.json({ success: true, message: 'Barang berhasil ditambahkan!' });
    });
  });

  // FITUR EDIT BARANG
  router.post('/edit', (req, res) => {
    const { id, code, name, category, buy_price, sell_price } = req.body;
    const sql = `UPDATE products SET code = ?, name = ?, category = ?, buy_price = ?, sell_price = ? WHERE id = ?`;
    db.run(sql, [code, name, category, buy_price, sell_price, id], function(err) {
      if (err) return res.status(400).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Data barang berhasil diperbarui!' });
    });
  });

  // FITUR HAPUS BARANG
  router.post('/delete', (req, res) => {
    const { id } = req.body;
    // Hapus riwayat transaksi lebih dulu agar database tidak error (Constraint Foreign Key)
    db.run(`DELETE FROM transactions WHERE product_id = ?`, [id], (err) => {
      if (err) return res.status(400).json({ success: false, error: err.message });
      // Setelah riwayat terhapus, hapus master barangnya
      db.run(`DELETE FROM products WHERE id = ?`, [id], function(err2) {
        if (err2) return res.status(400).json({ success: false, error: err2.message });
        res.json({ success: true, message: 'Barang beserta riwayatnya berhasil dihapus!' });
      });
    });
  });

  return router;
};
