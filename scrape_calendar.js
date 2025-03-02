const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const BASE_URL = 'https://www.du.edu/calendar?search=&start_date=2025-01-01&end_date=2026-01-01#events-listing-date-filter-anchor';
const RESULTS_DIR = path.join(__dirname, 'results');
const OUTPUT_FILE = path.join(RESULTS_DIR, 'calendar_events.json');

async function fetchEventDescription(eventUrl) {
    try {
        const { data } = await axios.get(eventUrl);
        const $ = cheerio.load(data);

        // Extract non-bolded paragraphs from .description div
        let description = $('.description p')
            .filter((_, p) => !$(p).find('strong').length) // Exclude bolded paragraphs
            .map((_, p) => $(p).text().trim()) // Extract and clean text
            .get()
            .join(' '); // Join multiple paragraphs into a single description

        return description || null;
    } catch (error) {
        console.error(`Error fetching description for ${eventUrl}:`, error.message);
        return null;
    }
}

async function fetchEvents() {
    try {
        console.log("Fetching DU calendar page...");
        const { data } = await axios.get(BASE_URL);
        const $ = cheerio.load(data);

        let events = [];

        // Extract event details
        let eventElements = $('.events-listing__item').toArray();
        for (const element of eventElements) {
            let title = $(element).find('h3').text().trim();
            let dateRaw = $(element).find('p:first-child').text().trim();
            let time = $(element).find('p:has(.icon-du-clock)').text().trim();
            let link = $(element).find('a').attr('href');

            if (link) {
                link = new URL(link, BASE_URL).href;
            }

            let date = dateRaw.replace("View Details", "").trim();
            let eventData = { title, date };
            if (time) eventData.time = time.replace('⏰', '').trim();

            // Fetch description only if there's a valid link
            if (link) {
                let description = await fetchEventDescription(link);
                if (description) eventData.description = description;
            }

            events.push(eventData);
        }

        // Ensure results directory exists
        fs.ensureDirSync(RESULTS_DIR);
        fs.writeJsonSync(OUTPUT_FILE, { events }, { spaces: 2 });

        console.log(`Scraped ${events.length} events and saved to ${OUTPUT_FILE}`);
    } catch (error) {
        console.error("Error fetching DU calendar events:", error.message);
    }
}

// Run the script
fetchEvents();
