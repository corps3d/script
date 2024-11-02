const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
app.use(express.json());

// Load data from CSV file
async function loadDataFromCsv(filePath) {
    return new Promise((resolve, reject) => {
        const data = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => data.push(row))
            .on('end', () => resolve(data))
            .on('error', (error) => reject(error));
    });
}

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
