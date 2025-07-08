// nonParticipantsReport.js (Updated)

document.addEventListener('DOMContentLoaded', () => {
    // URL for the MasterEmployees CSV (from your Google Sheet published to web)
    const masterEmployeesCSVUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTO7LujC4VSa2wGkJ2YEYSN7UeXR221ny3THaVegYfNfRm2JQGg7QR9Bxxh9SadXtK8Pi6-psl2tGsb/pub?gid=2120288173&single=true&output=csv';

    // Get references to the new HTML elements
    const downloadNonParticipantsReportBtn = document.getElementById('downloadNonParticipantsReportBtn');
    const nonParticipantsDisplay = document.getElementById('nonParticipantsDisplay');
    const nonParticipantsTableBody = document.querySelector('#nonParticipantsTable tbody');
    const nonParticipantsMessage = document.getElementById('nonParticipantsMessage');
    const nonParticipantReportTabBtn = document.getElementById('nonParticipantReportTabBtn');

    // Helper function to fetch CSV data from a URL
    async function fetchCSV(url) {
        console.log('Attempting to fetch CSV from:', url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} from ${url}`);
            }
            const text = await response.text();
            console.log('CSV fetched successfully. Data length:', text.length);
            return text;
        } catch (error) {
            console.error('Error fetching CSV:', error);
            nonParticipantsMessage.textContent = `Failed to load data: ${error.message}. Please check console for details.`;
            nonParticipantsMessage.style.display = 'block';
            return null; // Return null on error
        }
    }

    // CSV parsing function (handles commas within quoted strings)
    function parseCSV(csv) {
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];

        const headers = parseCSVLine(lines[0]); // Headers can also contain commas in quotes
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0 || values.every(v => v === '')) continue; // Skip entirely empty rows

            if (values.length !== headers.length) {
                console.warn(`Skipping malformed row ${i + 1}: Expected ${headers.length} columns, got ${values.length}. Line: "${lines[i]}"`);
                continue;
            }
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index];
            });
            data.push(entry);
        }
        return data;
    }

    // Helper to parse a single CSV line safely
    function parseCSVLine(line) {
        const result = [];
        let inQuote = false;
        let currentField = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField.trim());
        return result;
    }

    let masterEmployeesData = []; // To store all employees from Master Employee List
    let allCanvassingDataFromScript = []; // From script.js's global data or fetched here

    // This function needs access to all canvassing data to determine participants
    // Assuming `window.allCanvassingData` is populated by `script.js`
    function getParticipantEmployeeCodes(canvassingData) {
        // Filter out entries with no employee code or activity type
        const relevantEntries = canvassingData.filter(entry =>
            entry['Employee Code'] && entry['Activity Type']
        );
        // Get unique employee codes from the relevant entries
        const participantCodes = new Set(
            relevantEntries.map(entry => entry['Employee Code'])
        );
        return Array.from(participantCodes);
    }

    async function fetchMasterEmployees() {
        nonParticipantsMessage.textContent = 'Loading master employee data...';
        nonParticipantsMessage.style.display = 'block';
        const csvText = await fetchCSV(masterEmployeesCSVUrl);
        if (csvText) {
            masterEmployeesData = parseCSV(csvText);
            console.log('Master Employees Data:', masterEmployeesData);
            nonParticipantsMessage.textContent = 'Master employee data loaded.';
            setTimeout(() => nonParticipantsMessage.style.display = 'none', 3000);
        } else {
            masterEmployeesData = [];
            nonParticipantsMessage.textContent = 'Failed to load master employee data.';
            nonParticipantsMessage.style.display = 'block';
        }
    }


    function generateAndDisplayNonParticipantsReport() {
        nonParticipantsTableBody.innerHTML = ''; // Clear previous entries
        nonParticipantsMessage.style.display = 'none'; // Hide any previous messages

        // Ensure allCanvassingData is available from the main script.js
        if (window.allCanvassingData && window.allCanvassingData.length > 0) {
            allCanvassingDataFromScript = window.allCanvassingData;
        } else {
            nonParticipantsMessage.textContent = 'No canvassing activity data available. Cannot generate report.';
            nonParticipantsMessage.style.display = 'block';
            return;
        }

        if (masterEmployeesData.length === 0) {
            nonParticipantsMessage.textContent = 'Master Employee data not loaded. Cannot generate report.';
            nonParticipantsMessage.style.display = 'block';
            return;
        }

        const participantCodes = getParticipantEmployeeCodes(allCanvassingDataFromScript);
        console.log('Participant Codes:', participantCodes);

        const nonParticipants = masterEmployeesData.filter(emp =>
            emp['Employee Code'] && !participantCodes.includes(emp['Employee Code'])
        );
        
        console.log('Non-Participants:', nonParticipants);

        if (nonParticipants.length === 0) {
            nonParticipantsMessage.textContent = 'All employees have participated in activities based on current data!';
            nonParticipantsMessage.style.display = 'block';
            return;
        }

        displayNonParticipants(nonParticipants);
    }

    function displayNonParticipants(nonParticipants) {
        nonParticipantsTableBody.innerHTML = ''; // Clear existing rows
        let slNo = 1;
        nonParticipants.forEach(employee => {
            const row = nonParticipantsTableBody.insertRow();
            row.insertCell().textContent = slNo++;
            row.insertCell().textContent = employee['Employee Code'] || 'N/A';
            row.insertCell().textContent = employee['Employee Name'] || 'N/A';
            row.insertCell().textContent = employee['Division'] || 'N/A'; // Assuming 'Division' is a header in master data
            row.insertCell().textContent = employee['Designation'] || 'N/A';
            row.insertCell().textContent = 'No'; // Visit Participation is always 'No' for non-participants
        });
    }

    // Function to download non-participants report as CSV
    if (downloadNonParticipantsReportBtn) {
        downloadNonParticipantsReportBtn.onclick = function() {
            // Get data from the currently displayed table
            const rows = nonParticipantsTableBody.querySelectorAll('tr');
            if (rows.length === 0) {
                alert("No data to download.");
                return;
            }

            const csvHeaders = [
                'SL.No.', 'Employee Code', 'Employee Name', 'Division', 'Designation', 'Visit Participation'
            ];
            const csvRows = [];

            rows.forEach(row => {
                const rowData = [];
                row.querySelectorAll('td').forEach(cell => {
                    rowData.push(cell.textContent);
                });
                csvRows.push(rowData.map(value => {
                    // Escape double quotes by doubling them and enclose in quotes
                    const stringValue = String(value || '').replace(/"/g, '""');
                    return `"${stringValue}"`;
                }).join(','));
            });

            const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

            // Create a Blob and trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) { // Feature detection for download attribute
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'non_participating_employees.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("Your browser does not support automatic file downloads. Please copy the data from the table above.");
            }
        };
    }

    // Event listener for when the Non-Participant Report tab is clicked
    if (nonParticipantReportTabBtn) {
        nonParticipantReportTabBtn.addEventListener('click', () => {
            generateAndDisplayNonParticipantsReport();
        });
    }

    // Initialize master employee data fetch when script loads, or upon specific trigger
    fetchMasterEmployees(); // Fetch master employee data initially
});
