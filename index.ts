// main.js
import { getQuotes } from './abdulwahed'; // Adjust the path according to your file structure
import puppeteer from 'puppeteer';
async function main() {
    
    try {
   let links= await getQuotes();
        console.log('Quotes fetched successfully.');

        console.log('Results:', links);
    } catch (error) {
        console.error('Failed to fetch quotes:', error);
    }
}

main();
