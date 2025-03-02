const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');
const OUTPUT_FILE = path.join(RESULTS_DIR, 'athletic_events.json');

// Ensure the results directory exists
async function ensureResultsDir() {
    try {
        await fs.mkdir(RESULTS_DIR, { recursive: true });
    } catch (err) {
        console.error("Error creating results directory:", err);
    }
}

// Function to fetch DU Athletics event data
async function fetchDUAthleticsEvents() {
    try {
        console.log("Fetching DU Athletics event data...");

        // API URL for the athletics calendar
        const apiUrl = 'https://denverpioneers.com/services/responsive-calendar.ashx?type=month&sport=0&location=all&date=3%2F1%2F2025+12%3A00%3A00+AM';

        // Fetch data from the API
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://denverpioneers.com/',
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            }
        });

        if (!response.data || response.data.length === 0) {
            console.error("❌ No event data found!");
            return;
        }

        // Flatten events across all days into one list
        const allEvents = [];
        for (const day of response.data) {
            if (day.events) {
                allEvents.push(...day.events);
            }
        }

        if (allEvents.length === 0) {
            console.error("❌ No events found in the calendar!");
            return;
        }

        // Sort events by date to determine the correct 10th event
        allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Find the most recent or currently happening event (10th event)
        const middleIndex = Math.min(9, allEvents.length - 1); // Ensure there's at least 10 events

        // Extract the required 20 events: 9 before + 1 middle + 10 after
        const startIndex = Math.max(0, middleIndex - 9);
        const endIndex = Math.min(allEvents.length, middleIndex + 11);
        const selectedEvents = allEvents.slice(startIndex, endIndex);

        // Format event details for output
        const events = selectedEvents.map(event => ({
            duTeam: event.sport?.title || "DU Pioneers",
            opponent: event.opponent?.title || "Unknown Opponent",
            date: event.date
        }));

        // Save results
        await fs.writeFile(OUTPUT_FILE, JSON.stringify({ events }, null, 2));
        console.log(`✅ Successfully saved 20 DU Athletics events to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error("❌ Error fetching DU Athletics events:", error.message);
    }
}

// Execute script
(async () => {
    await ensureResultsDir();
    await fetchDUAthleticsEvents();
})();
