import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const KEYWORDS = ['it recruiter', 'recruiter', 'talent', 'acquisition', 'human resources', 'hr'];
const MAX_CONNECTIONS = 10;
const DELAY_BETWEEN_ACTIONS = 5000;

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.linkedin.com/login');
  await page.fill('input#username', process.env.LINKEDIN_EMAIL || '');
  await page.fill('input#password', process.env.LINKEDIN_PASSWORD || '');
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ]);

  console.log('✅ Bejelentkezve. Navigálás a My Network oldalra...');
  await page.goto('https://www.linkedin.com/mynetwork/');
  await page.waitForTimeout(5000);

  let sentConnections = 0;

  while (sentConnections < MAX_CONNECTIONS) {
    const ps = await page.$$('p');

    for (const p of ps) {
      const pText = (await p.textContent())?.toLowerCase() || '';
      const matches = KEYWORDS.some(keyword => pText.includes(keyword));
      if (!matches) continue;

      const parent = await p.evaluateHandle((node) => {
        let el = node.parentElement;
        for (let i = 0; i < 5 && el; i++) {
          if (el.querySelector('button span span')) return el;
          el = el.parentElement;
        }
        return null;
      });

      if (!parent) continue;

      const buttons = await parent.$$('button');
      let clicked = false;

      for (const button of buttons) {
        const span = await button.$('span span');
        const spanText = (await span?.textContent())?.toLowerCase().trim();
        if (spanText === 'kapcsolódás' || spanText === 'connect') {
          await button.click();
          await page.waitForTimeout(1000);

          const paragraphs = await page.$$('p');
          for (const p of paragraphs) {
            const text = await p.textContent();
            if (text?.includes('Kérjük, próbálja meg újra a jövő héten')) {
              console.log('🛑 LinkedIn limit elérve: „Kérjük, próbálja meg újra a jövő héten.” A script leáll.');
              await browser.close();
              return;
            }
          }

          console.log(`✔️ Kapcsolódás elküldve: "${pText.slice(0, 60)}..."`);
          sentConnections++;
          clicked = true;
          await page.waitForTimeout(DELAY_BETWEEN_ACTIONS);
          break;
        }
      }

      if (sentConnections >= MAX_CONNECTIONS) break;
    }

    if (sentConnections < MAX_CONNECTIONS) {
      console.log('🔄 Görgetés további találatokhoz...');
      await page.evaluate(() => window.scrollBy(0, 2000));
      await page.waitForTimeout(3000);
    }
  }

  console.log(`🎯 Kapcsolódási kérelmek elküldve: ${sentConnections}`);
  await browser.close();
})();
