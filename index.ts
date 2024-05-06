import { getQuotes } from './xcite';

async function main() {
    try {
        const links = await getQuotes();
        console.log('Quotes fetched successfully.');
        console.log('Results:', links);
    } catch (error) {
        console.error('Failed to fetch quotes:', error);
    }
}

main();