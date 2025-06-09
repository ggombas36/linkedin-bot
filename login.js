import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: false }); // fejlesztésnél látni akarjuk
  const page = await browser.newPage();

  console.log('Navigating to LinkedIn...');
  await page.goto('https://www.linkedin.com/login');

  console.log('Typing credentials...');
  await page.fill('input#username', process.env.LINKEDIN_EMAIL);
  await page.fill('input#password', process.env.LINKEDIN_PASSWORD);

  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ]);

  console.log('Login successful! Waiting 10 sec for inspection...');
  await page.waitForTimeout(10000); // várunk, hogy lásd mi történik

  await browser.close();
})();
