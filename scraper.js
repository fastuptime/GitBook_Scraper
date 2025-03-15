const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const BASE_URL = 'https://example.com';
const OUTPUT_FILE = path.join(__dirname, 'result.md');

(async () => {
  try {
    console.log('Web scraping başlatılıyor...');

    const browser = await puppeteer.launch({ 
      headless: "new", 
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setViewport({width: 1200, height: 800});

    console.log(`${BASE_URL} adresine gidiliyor...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 60000 });

    await page.waitForTimeout(5000);

    let markdownContent = '';

    const title = await page.title();
    markdownContent += `# ${title}\n\n`;

    const visitedUrls = new Set();
    const urlsToVisit = [BASE_URL];

    console.log('Siteyi taramaya başlanıyor...');

    try {

      const expandButtons = await page.$$('.group-button[aria-expanded="false"]');
      console.log(`${expandButtons.length} menü grubu bulundu.`);

      for (const button of expandButtons) {
        await button.click();
        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.log('Menüyü genişletme hatası (önemli değil):', error.message);
    }

    console.log('Tüm sayfalar toplanıyor...');

    const collectLinks = async () => {
      return page.evaluate(() => {
        const links = [];

        const anchors = Array.from(document.querySelectorAll('a'));

        for (const anchor of anchors) {
          const href = anchor.href;
          if (href && href.startsWith('https://developer.esnekpos.com') && 
              !href.includes('#') && !href.includes('?')) {
            const title = anchor.innerText.trim();
            if (title && title.length > 0) {
              links.push({
                url: href,
                title: title
              });
            }
          }
        }
        return links;
      });
    };

    let allLinks = await collectLinks();
    console.log(`${allLinks.length} sayfa linki bulundu.`);

    for (const link of allLinks) {
      if (visitedUrls.has(link.url)) continue;

      visitedUrls.add(link.url);
      console.log(`"${link.title}" sayfası işleniyor... (${link.url})`);

      try {
        await page.goto(link.url, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.waitForTimeout(2000);

        const pageTitle = await page.title();
        markdownContent += `## ${pageTitle}\n\n`;
        markdownContent += `URL: ${link.url}\n\n`;

        const content = await page.evaluate(() => {

          const mainContent = document.querySelector('.page-inner') || 
                              document.querySelector('main') || 
                              document.querySelector('article') || 
                              document.querySelector('.markdown-section') ||
                              document.querySelector('.markdown-body') ||
                              document.querySelector('.theme-default-content');

          if (!mainContent) return 'İçerik bulunamadı';

          const getTextContent = (element) => {
            let text = '';

            const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
              const level = heading.tagName.charAt(1);
              text += `${'#'.repeat(parseInt(level))} ${heading.textContent.trim()}\n\n`;
            });

            const paragraphs = element.querySelectorAll('p');
            paragraphs.forEach(p => {
              text += `${p.textContent.trim()}\n\n`;
            });

            const lists = element.querySelectorAll('ul, ol');
            lists.forEach(list => {
              const isOrdered = list.tagName.toLowerCase() === 'ol';
              const items = list.querySelectorAll('li');

              items.forEach((item, index) => {
                if (isOrdered) {
                  text += `${index + 1}. ${item.textContent.trim()}\n`;
                } else {
                  text += `* ${item.textContent.trim()}\n`;
                }
              });

              text += '\n';
            });

            const tables = element.querySelectorAll('table');
            tables.forEach(table => {
              const rows = table.querySelectorAll('tr');

              const headerRow = rows[0];
              if (headerRow) {
                const headerCells = headerRow.querySelectorAll('th');
                let header = '| ';
                let separator = '| ';

                headerCells.forEach(cell => {
                  header += `${cell.textContent.trim()} | `;
                  separator += '--- | ';
                });

                text += `${header}\n${separator}\n`;

                for (let i = 1; i < rows.length; i++) {
                  const cells = rows[i].querySelectorAll('td');
                  let row = '| ';

                  cells.forEach(cell => {
                    row += `${cell.textContent.trim()} | `;
                  });

                  text += `${row}\n`;
                }

                text += '\n';
              }
            });

            const codeBlocks = element.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
              text += '```\n';
              text += `${block.textContent.trim()}\n`;
              text += '```\n\n';
            });

            if (text === '') {
              text = element.textContent
                .replace(/\s+/g, ' ')
                .trim();
            }

            return text;
          };

          return mainContent ? getTextContent(mainContent) : 'İçerik bulunamadı';
        });

        markdownContent += content + '\n\n---\n\n';
      } catch (error) {
        console.error(`Sayfa işlenirken hata oluştu (${link.url}): ${error.message}`);
        markdownContent += `### HATA: Sayfa işlenirken hata oluştu\n\n---\n\n`;
      }
    }

    console.log(`İçerik '${OUTPUT_FILE}' dosyasına kaydediliyor...`);
    await fs.writeFile(OUTPUT_FILE, markdownContent);

    console.log('İşlem tamamlandı!');
    await browser.close();

  } catch (error) {
    console.error('Beklenmeyen hata oluştu:', error);
  }
})();
