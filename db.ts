import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prices (
      id SERIAL PRIMARY KEY,
      legoId INTEGER NOT NULL,
      shopName TEXT NOT NULL,
      position INTEGER,
      price INTEGER,
      scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

interface PriceRecord {
  legoId: number;
  position: number;
  price: number | null;
  shopName: string | null;
}

export const savePriceToDb = async ({ legoId, position, price, shopName }: PriceRecord) => {
  try {
    await pool.query(`INSERT INTO prices (legoId, position, shopName, price) VALUES ($1, $2, $3, $4)`, [
      legoId,
      position,
      shopName,
      price,
    ]);
  } catch (error) {
    console.error('Error saving price to database:', error);
  }
};
