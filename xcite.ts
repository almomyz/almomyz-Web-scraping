import puppeteer from 'puppeteer';
// Flag for remaining pages
let isRemainPage = true;
const nextBtnSelector = '.pager > .next > a';

export async function getQuotes() {

    let results = [];
    let isRemainPage = true;
    let links=[];
    const nextBtnSelector = '.product-list-toolbar-footer .action.next';
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.xcite.com/windows-laptops/c');
    const nextBtn = await page.waitForSelector(".mfp-close");
    if (nextBtn) {
        await nextBtn.click();
        console.log("complete loop now exit");
    } else {
        console.log("not fond next btn");
        isRemainPage = false;
    }

   

    

    // Loop to get quotes until there are no more next buttons
    while (isRemainPage) {
        // Get page data
        const link = await page.$$eval('.product-item-info', elements => {
            return elements.map(element => element.querySelector('a').href);
        });

        // save the result in array
        links = links.concat(link);

        // Check if there is a next button
        const nextBtn = await page.$(nextBtnSelector);
        isRemainPage = !!nextBtn;
        console.log("next btn: ", nextBtn, " is remain: ", isRemainPage);

        if (!isRemainPage) { break }

        // Click next button
        await page.waitForSelector(nextBtnSelector);
        await page.click(nextBtnSelector);
    }

    console.log("complete loop now exit");
    console.log(links);
    console.log("the length is: ", links.length);


     async function extractInfoFromPage(link) {
    
        await page.goto(link, { waitUntil: 'networkidle2' });
    
        // Extract name, price, image, and brand in a single page.evaluate() call
        const [name, price, image, brand, estimated, stockAvailable, attribute] = await page.evaluate(() => {
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
                return strongElement? strongElement.textContent : spanElement? spanElement.textContent : null;
            });
    
            return [
                nameElement? nameElement.textContent : null,
                priceElement? priceElement.textContent : null,
                imageElement? imageElement.getAttribute('src') : null,
                brandElement? brandElement.textContent : null,
                estimated? estimated.textContent : null,
                stockAvailable? stockAvailable.textContent : null,
                attribute
            ];
        });
    
        // Create an object with the extracted information and return it
        return { name, link, price, image, brand, estimated, stockAvailable, attribute }; 
    }

    for (const link of links) {
        const info = await extractInfoFromPage(link);
        results.push(info);
    }
   return results;   
};



// Loop through each link and navigate to it





