import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const initDb = async () => {
  try {
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
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
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
    console.error('Error saving to prices table:', error);
  }
};

export const savePricesToDb = async (
  id: number,
  results: { price: number | null; shopName: string | null; position: number }[]
) => {
  for (const { position, price, shopName } of results) {
    await savePriceToDb({
      legoId: id,
      position,
      price,
      shopName,
    });
  }
};
