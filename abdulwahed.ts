import puppeteer from 'puppeteer';
import * as fs from 'fs';
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

    saveToJson(results, 'abdulwahed.json');

    // Close the browser
    // await browser.close();

    return results;

};
function saveToJson(data, filePath) {
    const jsonData = JSON.stringify(data, null, 4);
    fs.writeFileSync(filePath, jsonData, "utf8");
    console.log("all items have been successfully saved in", filePath, "file");
}

async function extractInfoFromPage(page, link) {

    await page.goto(link, { waitUntil: 'networkidle2' });

    // Extract name, price, image, and brand in a single page.evaluate() call
    const [ productName, priceAfterDiscount,orginalPrice, photo, available, description] = await page.evaluate((link) => {
        const productName = document.querySelector('.product-info-main div h2');
        const priceAfterDiscount = document.querySelector('#old-price-16071 .price');
        const orginalPrice = document.querySelector('#product-price-16071 .price'); 
        const photo = document.querySelector('.gallery-placeholder__image');
        const available = document.querySelector('.available h3 span');
        const descrpiptionSelector = document.querySelectorAll('tbody');
        const description = Array.from(descrpiptionSelector).map(element => {
            const strongElement = element.querySelector('tr td');
            const spanElement = element.querySelector('tr td:nth-child(2)');
            // Check if the strong element exists, otherwise use the span element
            return strongElement.textContent + spanElement.textContent;
        });

        return [
            
            productName ? productName.textContent : null,
            priceAfterDiscount ? priceAfterDiscount.textContent : null,
            orginalPrice ? orginalPrice.textContent : null,
            photo ? photo.getAttribute('src') : null,
            available ? available.textContent : null,
            description,
            link,
            
        ];
    });

    // Create an object with the extracted information and return it
    return {productName,priceAfterDiscount, orginalPrice,photo,available,description,link};
}



