import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./prices.db');

export const initDb = () => {
  return new Promise((resolve) => {
    db.run(
      `
      CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        legoId INTEGER NOT NULL,
        shopName TEXT NOT NULL,
        position INTEGER,
        price INTEGER,
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      resolve
    );
  });
};

interface PriceRecord {
  legoId: number;
  position: number;
  price: number | null;
  shopName: string | null;
}

export const savePriceToDb = ({ legoId, position, price, shopName }: PriceRecord) => {
  try {
    db.run(`INSERT INTO prices (legoId, position, shopName, price) VALUES (?, ?, ?, ?)`, [
      legoId,
      position,
      shopName,
      price,
    ]);
  } catch (error) {
    console.error('Error saving price to database:', error);
  }
};
