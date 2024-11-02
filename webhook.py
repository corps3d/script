from flask import Flask, request, jsonify
import csv

app = Flask(__name__)

# Load data from CSV file
def load_data_from_csv(file_path):
    with open(file_path, mode='r') as csvfile:
        reader = csv.reader(csvfile)
        data = [row for row in reader]
    return data

# Load the data when the server starts
data = load_data_from_csv('services data.csv')

@app.route('/webhook', methods=['POST'])
def webhook():
    # Log the entire event object for debugging
    print("Full request object:", request.json)

    # Extract service name from post data
    service_name = request.json.get("service_name")
    print("Extracted service name:", service_name)

    # Validate the service name
    if not service_name:
        return jsonify({
            "error": "Please provide service_name in the request body"
        }), 400

    # Extract header and data rows
    sheet_headers = data[0]
    try:
        service_index = sheet_headers.index(service_name)
    except ValueError:
        return jsonify({
            "error": "Service name not found in headers.",
            "service_name_received": service_name,
            "available_services": sheet_headers
        }), 404

    # Filter clinics that offer the service
    clinics_with_service = [
        row[0] for row in data[1:] if row[service_index] == "Yes"
    ]

    # Join clinic names into a single string
    clinic_names_string = ', '.join(clinics_with_service)

    # Return the filtered list of clinics
    return jsonify({
        "clinics": clinic_names_string
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "message": "This endpoint requires a POST request with service_name",
        "status": "alive"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
