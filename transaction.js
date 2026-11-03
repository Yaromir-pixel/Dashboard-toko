const router = require('express').Router();

module.exports = (db) => {
  router.get('/list', (req, res) => {
    const sql = `SELECT t.*, p.code AS product_code, p.name AS product_name FROM transactions t JOIN products p ON t.product_id = p.id ORDER BY t.created_at DESC`;
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(400).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    });
  });

  router.post('/create', (req, res) => {
    const { product_id, type, qty, unit_price, recipient, resi, alamat } = req.body;
    const numQty = parseInt(qty);
    const numPrice = parseFloat(unit_price);
    const totalPrice = numQty * numPrice;

    if (!['IN', 'OUT'].includes(type)) return res.status(400).json({ success: false, error: 'Tipe transaksi tidak valid.' });

    db.get(`SELECT stock FROM products WHERE id = ?`, [product_id], (err, product) => {
      if (err || !product) return res.status(400).json({ success: false, error: 'Barang tidak ditemukan.' });
      
      if (type === 'OUT' && product.stock < numQty) {
        return res.status(400).json({ success: false, error: `Stok tidak cukup! Stok saat ini: ${product.stock}` });
      }

      const insertSql = `INSERT INTO transactions (product_id, type, qty, unit_price, total_price, recipient, resi, alamat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      db.run(insertSql, [product_id, type, numQty, numPrice, totalPrice, recipient, resi, alamat], function(err) {
        if (err) return res.status(400).json({ success: false, error: err.message });

        const stockModifier = type === 'IN' ? numQty : -numQty;
        db.run(`UPDATE products SET stock = stock + ? WHERE id = ?`, [stockModifier, product_id], (err) => {
          if (err) return res.status(400).json({ success: false, error: err.message });
          res.json({ success: true, message: `Transaksi berhasil disimpan!` });
        });
      });
    });
  });

  return router;
};
