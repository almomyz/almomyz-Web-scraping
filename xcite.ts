import puppeteer from 'puppeteer';
import * as fs from 'fs';
const nextBtnSelector = '.secondaryOnLight';
const pageURL = 'https://www.xcite.com/mobile-phones/c';
let results = [];
// Function to fetch quotes
export async function getQuotes() {

    // Start the browser and the page
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = await browser.newPage();

    // Exclude image requests
    await page.setRequestInterception(true);
    const allowedResourceTypes = ['image', "font"];
    page.on('request', request => {
        if (allowedResourceTypes.includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(pageURL, { waitUntil: "domcontentloaded" });

    // Close the popup if it appears
   

    let allurls = [];
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
        allurls = await page.$$eval('.mb-28 div > a', elements => {
            return elements.map(element => element.getAttribute('href'));
        });

        console.log('urls:', allurls);
        console.log('urls:', allurls.length);
        
        for (const url of allurls) {
            const info = await extractInfoFromPage(page, url);
            results.push(info);
        }
       
        
        
    } catch (error) {
        console.log('Error:', error);
    }
    
    

    

    await saveToJson(results, 'WebScrapingXcite_6-5-2024.json');

    // Close the browser
    
    
    return results;

};


async function extractInfoFromPage(page, url) {
    // Define the transformTextToObject function within the page.evaluate() call


    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract name, price, image, and brand in a single page.evaluate() call
    const [ productName,URL,photo,price,wasPrice,description, available ] = await page.evaluate((url) => {
    
        const con= document.querySelector(" div.flex-1 div > h3.mb-5")
        const photo = document.querySelector('.relative.w-full.col-span-12.min-h-fit.sm\\:min-h-\\[500px\\] img:nth-child(2)');
        const productName = document.querySelector('h1');
        const wasPrice = document.querySelector('.line-through');
        const price = con.childElementCount ?con.querySelector(" div span:nth-child(2)"):con; 
        const descriptionSelector = document.querySelectorAll('.ProductOverview_list__8gYrU  ul li');
        const description = Array.from(descriptionSelector).map(element => {
          
            
            return element.textContent;
          }); 
        const available = document.querySelector('div.flex.items-center > div .typography-small');
           
        return [
            productName? productName.textContent : null,
            url? url : null,
            photo? photo.getAttribute('src') : null,
            price? price.textContent.trim() : wasPrice.textContent.trim(),
            wasPrice? wasPrice.textContent : null,
            description,            
            available.textContent==="In Stock"? true : false,
            
        ];
    });

    // Create an object with the extracted information and return it
    return {productName, url,photo, price, wasPrice, description, available};
}

function saveToJson(data, filePath) {
    const jsonData = JSON.stringify(data, null, 4);
    fs.writeFileSync(filePath, jsonData, "utf8");
    console.log("all items have been successfully saved in", filePath, "file");
}
