const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
app.use(express.json());

// Load data from CSV file
function loadDataFromCsv(filePath) {
    return new Promise((resolve, reject) => {
        const data = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => data.push(row))
            .on('end', () => resolve(data))
            .on('error', (error) => reject(error));
    });
}

// Load the data when the server starts
let data = [];
loadDataFromCsv('services data.csv').then((loadedData) => {
    data = loadedData;
}).catch((error) => {
    console.error('Error loading CSV data:', error);
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
    console.log("Full request object:", req.body);

    // Extract service name from post data
    const serviceName = req.body.service_name;
    console.log("Extracted service name:", serviceName);

    // Validate the service name
    if (!serviceName) {
        return res.status(400).json({
            error: "Please provide service_name in the request body"
        });
    }

    // Extract headers and check if service exists
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

    // Join clinic names into a single string
    const clinicNamesString = clinicsWithService.join(', ');

    // Return the filtered list of clinics
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

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
