const axios = require('axios');
const parse = require('csv-parse/lib/sync');

// Function to load and parse CSV data from a public URL
async function loadDataFromCsv() {
    try {
        const response = await axios.get('https://script-dag320xn7-c0rpseds-projects.vercel.app/services%20data.csv');
        
        // Parse CSV data from response
        const records = parse(response.data, {
            columns: true,
            skip_empty_lines: true,
        });

        console.log("Loaded data:", records); // Debugging: check parsed data
        return records;
    } catch (error) {
        console.error('Error loading CSV data:', error);
        return [];
    }
}

// Main handler for the webhook function
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Only POST requests are allowed" });
    }

    const serviceName = req.body.service_name;
    if (!serviceName) {
        return res.status(400).json({
            error: "Please provide service_name in the request body"
        });
    }

    let data = await loadDataFromCsv();  // Load data at request time

    if (data.length === 0) {
        return res.status(500).json({ error: "Failed to load data from CSV" });
    }

    const sheetHeaders = Object.keys(data[0]);
    const serviceIndex = sheetHeaders.indexOf(serviceName);

    if (serviceIndex === -1) {
        return res.status(404).json({
            error: "Service name not found in headers.",
            service_name_received: serviceName,
            available_services: sheetHeaders
        });
    }

    // Filter clinics that offer the service
    const clinicsWithService = data
        .filter(row => row[serviceName] === "Yes")
        .map(row => row[sheetHeaders[0]]);

    const clinicNamesString = clinicsWithService.join(', ');

    return res.json({
        clinics: clinicNamesString
    });
};
