import puppeteer from 'puppeteer';

const nextBtnSelector = '.product-list-toolbar-footer .action.next';
const pageURL = 'https://www.abdulwahed.com/ar/computers-mobiles.html';

// Function to fetch quotes
export async function getQuotes() {

    // Start the browser and the page
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();

    // Exclude image requests
    await page.setRequestInterception(true);
    const allowedResourceTypes = ['image', "font", "media"];
    page.on('request', request => {
        if (allowedResourceTypes.includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(pageURL, { waitUntil: "domcontentloaded" });

    // Close the popup if it appears
    const closePopup = await page.waitForSelector(".mfp-close");
    if (closePopup) { await closePopup.click() }

    let allLinks = [];

    // Loop to get quotes until there are no more next buttons
    while (true) {

        // Get page link data
        const pageLinks = await page.$$eval('.product-item-info > a', elements =>
            elements.map(element => element.href)
        );

        // Save the links
        allLinks.push(...pageLinks);

        console.log('all links number:', allLinks.length);

        // Check if there is a next button
        const hasNextButton = await page.$(nextBtnSelector);
        if (!hasNextButton) {
            break;
        }

        // Click next button after the page has loaded
        await Promise.all([
            page.waitForNavigation({ waitUntil: "domcontentloaded" }),
            page.click(nextBtnSelector)
        ]);
    }


    let results = [];

    for (const link of allLinks) {
        const info = await extractInfoFromPage(page, link);
        results.push(info);
    }

    // Close the browser
    await browser.close();

    return results;

};


async function extractInfoFromPage(page, link) {

    await page.goto(link, { waitUntil: 'networkidle2' });

    // Extract name, price, image, and brand in a single page.evaluate() call
    const [sku, name, price, image, brand, estimated, stockAvailable, attribute] = await page.evaluate(() => {
        const sku = document.querySelector('.pdp-sku-container span:nth-child(2)');
        const nameElement = document.querySelector('.product-info-main div h2');
        const priceElement = document.querySelector('.price');
        const imageElement = document.querySelector('.fotorama__img');
        const brandElement = document.querySelector('.brand-title span');
        const estimated = document.querySelector('.estimated-container p strong');
        const stockAvailable = document.querySelector('.available h3 span');
        const attributeElements = document.querySelectorAll('.description  div div div div');

        const attribute = Array.from(attributeElements).map(element => {
            const strongElement = element.querySelector('p strong span');
            const spanElement = element.querySelector('p span');
            // Check if the strong element exists, otherwise use the span element
            return strongElement ? strongElement.textContent : spanElement ? spanElement.textContent : null;
        });

        return [
            sku ? sku.textContent : null,
            nameElement ? nameElement.textContent : null,
            priceElement ? priceElement.textContent : null,
            imageElement ? imageElement.getAttribute('src') : null,
            brandElement ? brandElement.textContent : null,
            estimated ? estimated.textContent : null,
            stockAvailable ? stockAvailable.textContent : null,
            attribute,
        ];
    });

    // Create an object with the extracted information and return it
    return { sku, link, name, price, image, brand, estimated, stockAvailable, attribute };
}

