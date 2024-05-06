import puppeteer from 'puppeteer';

const nextBtnSelector = '.secondaryOnLight';
const pageURL = 'https://www.xcite.com/windows-laptops/c';
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
        for (const link of allLinks) {
            const info = await extractInfoFromPage(page, link);
            results.push(info);
        }
        
    } catch (error) {
        console.log('Error:', error);
    }
    
    

    

    

    // Close the browser
    

    return results;

};


async function extractInfoFromPage(page, link) {

    await page.goto(link, { waitUntil: 'networkidle2' });

    // Extract name, price, image, and brand in a single page.evaluate() call
    const [ productName, priceAfterDiscount,orginalPrice, photo, available, description] = await page.evaluate((link) => {
        const productName = document.querySelector('h1');
        const priceAfterDiscount = document.querySelector('.line-through');
        const orginalPrice = document.querySelector('.text-functional-red-800'); 
        const photo = document.querySelector('.relative.w-full.col-span-12.min-h-fit.sm\\:min-h-\\[500px\\] img:nth-child(2)');
        const available = document.querySelector('.typography-small.text-functional-red-800');
        const descrpiptionSelector = document.querySelectorAll('ProductOverview_list__8gYrU ui');
        const description = Array.from(descrpiptionSelector).map(element => {
            const strongElement = element.querySelector('li');
            
            // Check if the strong element exists, otherwise use the span element
            return strongElement.textContent;
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
