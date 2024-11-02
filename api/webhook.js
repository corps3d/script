const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

async function loadDataFromCsv() {
    try {
        const filePath = path.join("./api", 'services data.csv');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Parse CSV data
        const records = parse(fileContent, {
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

    // Ensure body is parsed as JSON
    let requestBody;
    try {
        requestBody = JSON.parse(req.body.trim());
    } catch (error) {
        console.error('Error parsing JSON:', error); // Log the error
        return res.status(400).json({ error: "Invalid JSON format" });
    }

    const serviceName = requestBody.service_name;
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
