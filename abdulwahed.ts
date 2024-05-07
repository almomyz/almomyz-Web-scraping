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

    //Close the popup if it appears
    const closePopup = await page.$(".mfp-close");
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

    saveToJson(results, 'WebScrapingAbdulwahed_6-5-2024.json');

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
        const priceAfterDiscount =document.querySelector('.price-wrapper[data-price-type="finalPrice"]');
        const orginalPrice = document.querySelector('.price-wrapper[data-price-type="oldPrice"]'); 
        const photo = document.querySelector('.gallery-placeholder__image');
        const available = document.querySelector('.available h3 span');
        const descrpiptionSelector = document.querySelectorAll('#product-attribute-specs-table > tbody > tr > td > table > tbody');
        
        const description = Array.from(descrpiptionSelector).map(element => {
            // const strongElement = element.querySelector(' tr:nth-child(1) > td:nth-child(1) > div').textContent.trim();
            // const spanElement = element.querySelector(' tr:nth-child(1) > td:nth-child(2)').textContent.trim();
            // Check if the strong element exists, otherwise use the span element
            return {key:"key" ,value: "key"};
        });

        return [
            
            productName ? productName.textContent.trim() : null,
            priceAfterDiscount ? priceAfterDiscount.textContent.trim() : null,
            orginalPrice ? orginalPrice.textContent.trim() : priceAfterDiscount.textContent.trim(),
            photo ? photo.getAttribute('src') : null,
            available ? available.textContent.trim() : null,
            description,
            link,
        ];
    });

    // Create an object with the extracted information and return it
    return {productName,priceAfterDiscount, orginalPrice,photo,available,description,link};
}








// Get all elements with the class "product-item-info"
// const productInfos = document.querySelectorAll('.product-item-info');

// // Loop through each product info element
// productInfos.forEach(function(productInfo) {
//     // Find the price element within this product info element
//     // 
//     const finalPrice = productInfo.querySelector('.price-wrapper[data-price-type="finalPrice"]').textContent.trim();

//      const oldPriceElment = productInfo.querySelector('.price-wrapper[data-price-type="oldPrice"]');

//     const oldPrice = oldPriceElment ? oldPriceElment.textContent.trim() : null;

    
//     // Output the price
//     console.log(finalPrice, oldPrice);
// });