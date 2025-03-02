const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');

const BULLETIN_URL = 'https://bulletin.du.edu/undergraduate/majorsminorscoursedescriptions/traditionalbachelorsprogrammajorandminors/computerscience/#coursedescriptionstext';
const OUTPUT_FILE = 'results/bulletin.json';

async function scrapeBulletin() {
    try {
        console.log('Fetching DU Bulletin page...');
        const { data } = await axios.get(BULLETIN_URL);
        const $ = cheerio.load(data);

        let courses = [];

        $('.courseblock').each((_, element) => {
            const courseCode = $(element).find('.courseblocktitle strong').text().trim();
            const courseTitle = $(element).find('.courseblocktitle').text().replace(courseCode, '').trim();
            const courseDescription = $(element).find('.courseblockdesc').text().trim();

            // Ensure the course is a 3000+ level COMP course and does NOT mention "Prerequisites"
            if (/COMP\s?\d{4}/.test(courseCode) && 
                parseInt(courseCode.match(/\d{4}/)[0], 10) >= 3000 && 
                !courseDescription.toLowerCase().includes("prerequisites") && !courseDescription.toLowerCase().includes("prerequisite")) {
                
                courses.push({ course: courseCode, title: courseTitle, description: courseDescription });
            }
        });

        // Save results as JSON
        await fs.outputJson(OUTPUT_FILE, { courses }, { spaces: 2 });
        console.log(`Scraped ${courses.length} eligible courses and saved to ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('Error scraping the DU Bulletin:', error.message);
    }
}

// Run the scraper
scrapeBulletin()