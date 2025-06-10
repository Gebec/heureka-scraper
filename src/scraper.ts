import { chromium } from 'playwright';
import fs from 'fs';
import { savePriceToDb, initDb } from './db.js';
import { loadList } from './loadList.js';

(async () => {
  await initDb();
  const list = await loadList();

  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  });

  const cookies = await context.cookies();
  fs.writeFileSync('cookies.json', JSON.stringify(cookies));

  const page = await browser.newPage();

  for (const lego of list) {
    const cookies = JSON.parse(fs.readFileSync('cookies.json').toString());
    await context.addCookies(cookies);

    console.log(`Scraping: ${lego.url}`);
    await page.goto(lego.url, { waitUntil: 'domcontentloaded' });

    const containers = await page.$$('[data-testid="Offer List Container"]');
    if (containers.length === 0) {
      console.warn(`No 'Offer List Container' found for url: ${lego.url}`);
      continue;
    }

    const targetContainer = containers.length > 1 ? containers.at(1) : containers.at(0);
    if (!targetContainer) {
      console.warn(`No valid container found for url: ${lego.url}`);
      continue;
    }

    const results = await targetContainer.$$eval('div.c-offer__inner', (nodes) => {
      const getPrice = (item: HTMLElement): number | null => {
        const priceElement = item.querySelector('span.c-offer__price');
        const text = priceElement?.textContent;
        if (!text) return null;

        const price = parseInt(text.replace(/[^\d]/g, ''));
        return isNaN(price) ? null : price;
      };

      const getShopName = (item: HTMLElement): string | null => {
        const priceElement = item.querySelector('img.c-offer__shop-logo');
        const alt = priceElement?.getAttribute('alt');
        if (!alt) return null;

        return alt.replace(/logo\s*/i, '').trim();
      };

      return (nodes as HTMLElement[]).slice(0, 5).map((item, index) => {
        const price = getPrice(item);
        const shopName = getShopName(item);
        const position = index + 1;

        return { price, shopName, position };
      });
    });

    results.forEach(({ position, price, shopName }) => {
      savePriceToDb({
        legoId: lego.id,
        position,
        price,
        shopName,
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  await browser.close();
})();
