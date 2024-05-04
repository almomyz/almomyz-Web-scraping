// main.js
import { getQuotes } from './abdulwahed'; // Adjust the path according to your file structure

async function main() {
    try {
        await getQuotes();
        console.log('Quotes fetched successfully.');
    } catch (error) {
        console.error('Failed to fetch quotes:', error);
    }
}

main();
