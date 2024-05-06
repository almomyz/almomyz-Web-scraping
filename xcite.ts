import puppeteer from 'puppeteer';
import * as fs from 'fs';
const nextBtnSelector = '.secondaryOnLight';
const pageURL = 'https://www.xcite.com/apple-macbook/c';
let results = [];
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
   

    let allLinks = [];
    await page.waitForSelector(nextBtnSelector)
    // Loop to get quotes until there are no more next buttons
    while (true) {
    
        const hasNextButton = await page.$(nextBtnSelector);
        if (!hasNextButton) {
            console.log('No more next buttons');
            break;
        }

        // Click next button after the page has loaded
        await Promise.all([
            page.waitForNavigation({ waitUntil: "domcontentloaded" }),
            page.click(nextBtnSelector)
        ]);
    }

    try {
        await page.waitForSelector('.mb-28');
        allLinks = await page.$$eval('.mb-28 div > a', elements => {
            return elements.map(element => element.getAttribute('href'));
        });

        console.log('links:', allLinks);
        
        // for (const link of allLinks) {
        //     const info = await extractInfoFromPage(page, link);
        //     results.push(info);
        // }
        const info = await extractInfoFromPage(page, "https://www.xcite.com/apple-macbook-pro-core-i9-9th-gen-16gb-ram-1tb-ssd-16-laptop-space-grey/p");
            results.push(info);
        
        
    } catch (error) {
        console.log('Error:', error);
    }
    
    

    

    await saveToJson(results, 'WebScrapingXcite_6-5-2024.json');

    // Close the browser
    
    
    return results;

};


async function extractInfoFromPage(page, link) {
    // Define the transformTextToObject function within the page.evaluate() call


    await page.goto(link, { waitUntil: 'networkidle2' });

    // Extract name, price, image, and brand in a single page.evaluate() call
    const [ productName, priceAfterDiscount, orginalPrice, photo, available, description] = await page.evaluate((link) => {
       
        const con= document.querySelector(" div.flex-1 div > h3.mb-5")
        const productName = document.querySelector('h1');
        const priceAfterDiscount = document.querySelector('.line-through');
        const orginalPrice = con.childElementCount ?con.querySelector(" div span:nth-child(2)"):con; 
        const photo = document.querySelector('.relative.w-full.col-span-12.min-h-fit.sm\\:min-h-\\[500px\\] img:nth-child(2)');
        const available = document.querySelector('div.flex.items-center > div .typography-small');
        const descriptionSelector = document.querySelectorAll('.ProductOverview_list__8gYrU  ul');
        const description = Array.from(descriptionSelector).map(element => {
            const lines = element.textContent.replace("/n", " ");
            
            return lines;
          }); 
           
        return [
            productName? productName.textContent : null,
            priceAfterDiscount? priceAfterDiscount.textContent : null,
            orginalPrice? orginalPrice.textContent.trim() : priceAfterDiscount.textContent.trim(),
            photo? photo.getAttribute('src') : null,
            available? available.textContent : null,
            description,
            link,
        ];
    });

    // Create an object with the extracted information and return it
    return {productName, priceAfterDiscount, orginalPrice, photo, available, description, link};
}

function saveToJson(data, filePath) {
    const jsonData = JSON.stringify(data, null, 4);
    fs.writeFileSync(filePath, jsonData, "utf8");
    console.log("all items have been successfully saved in", filePath, "file");
}
