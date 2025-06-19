import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get('/api/prices', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM prices');
    res.json(result.rows);
  } catch (error) {
    console.error('Chyba při dotazu na databázi:', error);
    res.status(500).json({ error: 'Chyba při získávání dat.' });
  }
});

app.listen(port, () => {
  console.log(`Server běží na http://localhost:${port}`);
});
