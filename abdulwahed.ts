import puppeteer from 'puppeteer';
// Flag for remaining pages
let isRemainPage = true;
const nextBtnSelector = '.pager > .next > a';

export async function getQuotes() {

    const results = [];
    let isRemainPage = true;
    const links=[];
    const nextBtnSelector = '.product-list-toolbar-footer .action.next';
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.abdulwahed.com/ar/computers-mobiles/computing.html');
    const nextBtn = await page.waitForSelector(".mfp-close");
    if (nextBtn) {
        await nextBtn.click();
        console.log("complete loop now exit");
    } else {
        console.log("not fond next btn");
        isRemainPage = false;
    }

   

    let allQuotes = [];

    // Loop to get quotes until there are no more next buttons
    while (isRemainPage) {
        // Get page data
        const link = await page.$$eval('.product-item-info', elements => {
            return elements.map(element => element.querySelector('a').href);
        });

        // save the result in array
        allQuotes = allQuotes.concat(link);

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
    console.log(allQuotes);
    console.log("the length is: ", allQuotes.length);

    // Close the browser
    await browser.close();
};



