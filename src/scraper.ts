import { chromium } from 'playwright';
import fs from 'fs';
import { savePricesToDb, initDb } from './db.js';
import { loadList } from './loadList.js';
import type { Browser, ElementHandle, Page } from 'playwright';

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

const initPage = async (browser: Browser): Promise<Page> => {
  const context = await browser.newContext({ userAgent });

  const cookies = await context.cookies();
  fs.writeFileSync('cookies.json', JSON.stringify(cookies));
  const page = await browser.newPage();

  const storedCookies = JSON.parse(fs.readFileSync('cookies.json', 'utf-8'));
  await context.addCookies(storedCookies);

  return page;
};

const loadContainer = async (url: string, page: Page): Promise<ElementHandle<HTMLElement | SVGElement> | undefined> => {
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const containers = await page.$$('[data-testid="Offer List Container"]');
  const container = containers[1] || containers[0];

  return container;
};

const extractResults = async (container: ElementHandle<HTMLElement | SVGElement>) => {
  return container.$$eval('div.c-offer__inner', (nodes: HTMLElement[]) => {
    const getPrice = (item: HTMLElement): number | null => {
      const text = item.querySelector('span.c-offer__price')?.textContent || '';
      const price = parseInt(text.replace(/[^\d]/g, ''));
      return isNaN(price) ? null : price;
    };

    const getShopName = (item: HTMLElement): string | null => {
      const alt = item.querySelector('img.c-offer__shop-logo')?.getAttribute('alt') || '';
      return alt ? alt.replace(/logo\s*/i, '').trim() : null;
    };

    return nodes.slice(0, 5).map((item, index) => ({
      price: getPrice(item),
      shopName: getShopName(item),
      position: index + 1,
    }));
  });
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

(async () => {
  const [list, browser] = await Promise.all([loadList(), chromium.launch({ headless: false }), initDb()]);
  const rowsCount = list.length;

  const page = await initPage(browser);

  for (const [index, row] of list.entries()) {
    console.log(`${index + 1}/${rowsCount}: ${row.url}`);

    try {
      const container = await loadContainer(row.url, page);
      if (!container) {
        console.warn(`No valid container found for url: ${row.url}`);
        continue;
      }

      const results = await extractResults(container);
      await savePricesToDb(row.id, results);
    } catch (error) {
      console.error(`Error processing row ${index + 1}/${rowsCount}:`, error);
    } finally {
      await delay(2000);
    }
  }

  await browser.close();
})();
