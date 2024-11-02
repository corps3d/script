const axios = require('axios');
const parse = require('csv-parse/lib/sync'); // Import synchronous CSV parser

async function loadDataFromCsv() {
    try {
        const response = await axios.get('https://https://script-dag320xn7-c0rpseds-projects.vercel.app/services%20data.csv'); // Use URL-encoded spaces

        // Parse CSV data from response
        const records = parse(response.data, {
            columns: true, // Use first row as header
            skip_empty_lines: true,
        });

        console.log("Loaded data:", records); // For debugging, check parsed data
        return records;
    } catch (error) {
        console.error('Error loading CSV data:', error);
        return [];
    }
}

// Usage example
loadDataFromCsv().then(data => {
    console.log("Parsed CSV Data:", data);
});

// Load the data
let data = [];
loadDataFromCsv('services data.csv').then((loadedData) => {
    data = loadedData;
}).catch((error) => {
    console.error('Error loading CSV data:', error);
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
    const serviceName = req.body.service_name;

    if (!serviceName) {
        return res.status(400).json({
            error: "Please provide service_name in the request body"
        });
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

    const clinicsWithService = data
        .filter(row => row[serviceName] === "Yes")
        .map(row => row[sheetHeaders[0]]);

    const clinicNamesString = clinicsWithService.join(', ');

    return res.json({
        clinics: clinicNamesString
    });
});

// Health endpoint
app.get('/health', (req, res) => {
    res.json({
        message: "This endpoint requires a POST request with service_name",
        status: "alive"
    });
});

// Export the app as a serverless function
module.exports = app;
