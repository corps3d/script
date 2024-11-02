const axios = require('axios');
const parse = require('csv-parse/lib/sync');

async function loadDataFromGoogleSheet() {
    const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/1dP6DbyXwnW4TVtW5qStC9iFqZkeyfuo_P4xPlxcHNBA/edit?usp=sharing'; // Update this with your link
    try {
        const response = await axios.get(googleSheetUrl);
        
        // Parse CSV data
        const records = parse(response.data, {
            columns: true,
            skip_empty_lines: true,
        });

        console.log("Loaded data from Google Sheets:", records); // Debugging: check parsed data
        return records;
    } catch (error) {
        console.error('Error loading data from Google Sheets:', error);
        return [];
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end(); // Handle preflight request
    }

    if (req.method === 'GET') {
        return res.status(200).send("Hello World");
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Only POST requests are allowed" });
    }

    const serviceName = JSON.parse(req.body.trim()).service_name;
    if (!serviceName) {
        return res.status(400).json({
            error: "Please provide service_name in the request body"
        });
    }

    let data = await loadDataFromGoogleSheet();  // Load data from Google Sheets

    if (data.length === 0) {
        return res.status(500).json({ error: "Failed to load data from Google Sheets" });
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
