# 🌐 GitBook Scraper

Welcome to the **GitBook Scraper** project! This tool is designed to scrape content from GitBook sites and save it in Markdown format. 📄✨

## 🚀 Technologies Used

- **Puppeteer**: For headless browser automation.
- **fs-extra**: For file system operations.
- **path**: For handling and transforming file paths.

## 🛠️ Installation

First, clone the repository to your local machine. Then, navigate to the project directory and install the necessary dependencies:

```sh
npm install
```

## 📈 Usage

To run the scraper, execute the following command:

```sh
node scraper.js
```

This will start the scraper, which will navigate to the specified GitBook site, extract the content, and save it to a `result.md` file in the project directory.

## 📁 Project Structure

- **scraper.js**: The main file that runs the web scraper.

## 📜 scraper.js Overview

- **BASE_URL**: The URL of the GitBook site to be scraped.
- **OUTPUT_FILE**: The path to the file where the scraped content will be saved.

### Workflow

1. **Browser Initialization**: Launch a headless browser using Puppeteer.
2. **Navigate to URL**: Go to the specified URL and wait until the page is fully loaded.
3. **Expand Menus**: Click on any expandable menu items to ensure all content is visible.
4. **Collect Links**: Gather all the links to the pages within the GitBook site.
5. **Scrape Content**: Visit each page, extract the relevant content, and format it in Markdown.
6. **Save to File**: Write the collected content to the specified output file.
7. **Close Browser**: Shut down the browser once the scraping is complete.

### Sample Code Snippets

**Browser Initialization:**
```javascript
const browser = await puppeteer.launch({ 
  headless: "new", 
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

**Navigating to URL:**
```javascript
await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 60000 });
```

**Collecting Links:**
```javascript
const links = await page.evaluate(() => {
  const anchors = Array.from(document.querySelectorAll('a'));
  return anchors.map(anchor => anchor.href);
});
```

**Scraping Content:**
```javascript
const content = await page.evaluate(() => {
  return document.querySelector('.page-inner').innerText;
});
```

**Saving to File:**
```javascript
await fs.writeFile(OUTPUT_FILE, markdownContent);
```

## 🛡️ Error Handling

If an error occurs during scraping, it will be logged to the console, and the scraper will continue processing the remaining pages.

```javascript
catch (error) {
  console.error('Unexpected error:', error);
}
```

## 📬 Contact

If you have any questions or suggestions, feel free to reach out to [fastuptime](https://github.com/fastuptime).
