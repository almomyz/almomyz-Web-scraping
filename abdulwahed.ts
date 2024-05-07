import puppeteer from 'puppeteer';
import { insertProducts } from "./utils/mongooseUtils";
import * as fs from 'fs';
const nextBtnSelector = '.product-list-toolbar-footer .action.next';
const pageURL = 'https://www.abdulwahed.com/ar/computers-mobiles/smart-phones/all-smart-phones.html';

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

    let allurls = [];

    // Loop to get quotes until there are no more next buttons
    while (true) {

        // Get page url data
        const pageurls = await page.$$eval('.product-item-info > a', elements =>
            elements.map(element => element.href)
        );

        // Save the urls
        allurls.push(...pageurls);

        console.log('all urls number:', allurls.length);

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

    for (const url of allurls) {
        const info = await extractInfoFromPage(page, url);
        results.push(info);
    }
    await saveToJson(results, 'WebScrapingAbdulwahed_6-5-2024.json');
    await insertProducts(results);
   
    // Close the browser
    // await browser.close();

    return results;

};
function saveToJson(data, filePath) {
    const jsonData = JSON.stringify(data, null, 4);
    fs.writeFileSync(filePath, jsonData, "utf8");
    console.log("all items have been successfully saved in", filePath, "file");
}

async function extractInfoFromPage(page, url) {

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract name, price, image, and brand in a single page.evaluate() call
    const [ productName,con,photo,price, wasPrice, description,available ] = await page.evaluate((url) => {
        function extractAndFormatNumbers(text) {
            // Regular expression to match all non-numeric characters
            const regex = /[^0-9]+/g;
            // Use replace() to remove all non-numeric characters
            let result = text.replace(regex, '');
            // Remove commas
            result = result.replace(/,./g, '');
            // Return the result
            return result;
        }
     
        const productName = document.querySelector('.product-info-main div h2');
        const wasPrice =document.querySelector('.price-wrapper[data-price-type="finalPrice"]');
        const price = document.querySelector('.price-wrapper[data-price-type="oldPrice"]'); 
        const photo = document.querySelector('.gallery-placeholder__image');
        
        const descriptionSelector = document.querySelectorAll('#product-attribute-specs-table > tbody > tr > td > table > tbody > tr');
        
        // Map over each row to extract the key and value
        const description = Array.from(descriptionSelector).map(element => {
            // Check if the element has a single td or multiple tds
            const tds = element.querySelectorAll('td');
            if (tds.length === 1) {
                // If there's only one td, use its text content as both key and value
                const key = tds[0].textContent.trim();
                const value = key; // Since there's only one cell, the value is the same as the key
                return `${key} : ${value}`; // Format the string as "Key : Value"
            } else {
                // If there are multiple tds, use the first td for the key and the second td for the value
                const key = tds[0].textContent.trim();
                const value = tds[1].textContent.trim();
                return `${key} : ${value}`; // Format the string as "Key : Value"
            }
        });
        
        console.log(description);
        const available = document.querySelector('div.product-info-price > div > div > h3 > span');// Select all rows within the tbody of the table with id 'product-attribute-specs-table
        return [
            
            productName ? productName.textContent.trim() : null,
            url,
            photo ? photo.getAttribute('src') : null,
            price ? extractAndFormatNumbers(price.textContent.trim()) :     extractAndFormatNumbers(wasPrice.textContent.trim()),
            wasPrice ? extractAndFormatNumbers(wasPrice.textContent.trim()): 0,
            description,
            available.textContent.trim() === "متوفر" ? true : false,
            
        ];
    });

    // Create an object with the extracted information and return it
    return {productName,url,photo, price,wasPrice,description,available};
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