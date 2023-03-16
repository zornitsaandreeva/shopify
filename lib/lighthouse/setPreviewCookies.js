module.exports = async (browser, context) => {
  const url = new URL(context.url);

  url.queryString = null;

  const loginUrl = new URL(context.url);
  loginUrl.pathname = 'password';

  // launch browser for LHCI
  console.error('Getting a new page...');
  const page = await browser.newPage();
  console.error('Getting password cookie...');
  await page.goto(loginUrl);
  await page.waitForSelector('form[action*=password] input[type="password"]');
  await page.$eval('form[action*=password] input[type="password"]', (input) => (input.value = 'password'));
  await Promise.all([page.waitForNavigation(), page.$eval('form[action*=password]', (form) => form.submit())]);

  console.error(`Viewing ${url}...`);
  await page.goto(url);

  // close session for next run
  await page.close();
};
