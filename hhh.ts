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

// Loop through each link and navigate to it
for (const link of links) {
    const info = await extractInfoFromPage(link);
    results.push(info);
}