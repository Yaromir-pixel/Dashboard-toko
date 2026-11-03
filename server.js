require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/product', require('./routes/product')(db));
app.use('/api/transaction', require('./routes/transaction')(db));
app.use('/api/excel', require('./routes/excel')(db));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend Inventaris Aktif!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] System Inventaris Berjalan di http://localhost:${PORT}`);
});
