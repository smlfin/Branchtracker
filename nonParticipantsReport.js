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
            nonParticipantsMessage.textContent = `Error loading data: ${error.message}. Please check your internet connection or the CSV link.`;
            nonParticipantsMessage.style.display = 'block';
            return null; // Return null on error
        }
    }

    // NEW & REWORKED Helper function to parse CSV text into an array of objects
    // This version hardcodes the mapping based on the observed column positions in your CSV
    // to ensure correct data assignment regardless of the CSV's actual header names.
    function parseCSV(csvText) {
        if (!csvText) return [];
        console.log('Attempting to parse CSV text with explicit column mapping...');
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== ''); // Split by newline, remove empty lines
        if (lines.length === 0) {
            console.warn("CSV text is empty or contains no valid lines.");
            return [];
        }

        // We will skip the actual header line from the CSV and instead
        // use fixed expected headers for the output object for consistency.
        // The first line (headers) will still be parsed to get the total number of columns
        // and confirm the regex works, but its *names* won't be used directly for keys.
        const rawHeadersLine = lines[0]; // Still read the first line
        const parsedRawHeaders = rawHeadersLine.match(/(?:\"([^\"]*)\"|([^,]*))/g);
        const actualColumnCount = parsedRawHeaders ? parsedRawHeaders.length : 0;
        console.log(`Detected ${actualColumnCount} columns in CSV.`);

        const data = [];

        for (let i = 1; i < lines.length; i++) { // Start from the second line (index 1) for data
            const currentLine = lines[i];
            const valuesMatch = currentLine.match(/(?:\"([^\"]*)\"|([^,]*))/g);

            if (!valuesMatch) {
                // If a line is empty or cannot be matched by regex, skip it
                console.warn(`Skipping empty or unmatchable row (regex returned null): "${currentLine}"`);
                continue;
            }

            const cleanedValues = valuesMatch.map(val => {
                // Remove surrounding quotes and trim whitespace for each value
                if (val && val.startsWith('"') && val.endsWith('"')) {
                    return val.slice(1, -1).trim();
                }
                return val ? val.trim() : '';
            });

            // Log the raw and cleaned values for debugging purposes
            console.log(`Processing row ${i} (raw): "${currentLine}"`);
            console.log(`  Cleaned values (by position):`, cleanedValues, `Length: ${cleanedValues.length}`);

            const row = {};
            // --- IMPORTANT: Hardcoded mapping based on your provided console logs ---
            // If your CSV column order or content changes, these indices will need adjustment.

            // Based on logs: cleanedValues[6] contains the Employee Code
            row['Employee Code'] = cleanedValues[0] || '';
row['Employee Name'] = cleanedValues[1] || '';
row['Division']      = cleanedValues[2] || '';
row['Designation']   = cleanedValues[3] || '';


            // If you have more columns or the 'Designation' is actually at another index, adjust here.
            // Example for other potential columns, if they existed and were needed:
            // row['Other Column'] = cleanedValues[4] || ''; // If there's data at index 4

            // Check if the constructed row has at least an Employee Code or Employee Name before pushing
            if (row['Employee Code'] || row['Employee Name']) {
                data.push(row);
                console.log('  Constructed Employee Object:', row); // Log the final object for verification
            } else {
                console.warn(`Skipping row ${i} due to insufficient meaningful data (no Employee Code or Name): "${currentLine}"`);
            }
        }
        console.log('CSV parsing complete. Number of rows:', data.length);
        return data;
    }

    // Function to fetch and process Master Employees CSV
    let masterEmployeesData = []; // Store master employee data globally for this script

    async function fetchMasterEmployees() {
        console.log('Fetching Master Employees data...');
        nonParticipantsMessage.style.display = 'none'; // Hide previous messages
        try {
            const csvText = await fetchCSV(masterEmployeesCSVUrl);
            if (csvText) {
                masterEmployeesData = parseCSV(csvText);
                console.log('Master Employees data loaded and parsed. Total employees:', masterEmployeesData.length);
            } else {
                masterEmployeesData = []; // Reset on fetch error
                console.warn('Could not fetch Master Employees CSV.');
            }
        } catch (error) {
            console.error('Error in fetchMasterEmployees:', error);
            masterEmployeesData = []; // Reset on error
            nonParticipantsMessage.textContent = `Failed to load Master Employees: ${error.message}`;
            nonParticipantsMessage.style.display = 'block';
        }
    }

    // Function to get unique participant employee codes from the main script's data, filtered by month
    function getParticipantEmployeeCodes() {
        console.log('Getting participant employee codes...');
        if (!window.allCanvassingData || !Array.isArray(window.allCanvassingData)) {
            console.warn("Participant data (window.allCanvassingData) not found or not in expected format from main script.");
            nonParticipantsMessage.textContent = "Error: Participant data not available from main script. Please ensure the main script loads and exposes the participant data correctly (see console for details).";
            nonParticipantsMessage.style.display = 'block';
            return new Set();
        }

        const participantCodes = new Set();
        const employeeCodeHeader = 'Employee Code';
        const dateHeader = 'Date'; // This is the header for the date column in your allCanvassingData (e.g., "Date")

        // Get the currently selected month value from the main month dropdown using its ID
        const mainMonthDropdown = document.getElementById('monthSelect'); // Correctly identified ID
        console.log('Main month dropdown element:', mainMonthDropdown);

        let selectedMonthValue = ''; // This will store the "MM-YYYY" value from the dropdown
        if (mainMonthDropdown && mainMonthDropdown.value) {
            selectedMonthValue = mainMonthDropdown.value;
        } else {
            console.warn("Main month dropdown element or its value not found. Defaulting to 'All' month comparison.");
            selectedMonthValue = 'All'; // Treat as 'All' if no specific month is selected
        }
        console.log('Selected month value from dropdown:', selectedMonthValue);

        let filteredParticipantsData = window.allCanvassingData;

        // Filter data by month if a specific month is selected (not 'All' or empty/placeholder)
        if (selectedMonthValue && selectedMonthValue !== 'All' && selectedMonthValue !== '-- Select Month --' && selectedMonthValue !== '') {
            console.log('Filtering participants data by month:', selectedMonthValue);
            filteredParticipantsData = window.allCanvassingData.filter(entry => {
                if (entry[dateHeader]) {
                    const fullDateStr = String(entry[dateHeader]).trim(); // e.g., "08/07/2025"
                    const parts = fullDateStr.split('/');
                    if (parts.length === 3) {
                        // Reformat DD/MM/YYYY to MM-YYYY for comparison
                        const monthFromData = parts[1];
                        const yearFromData = parts[2];
                        const monthYearFromData = `${monthFromData}-${yearFromData}`;

                        return monthYearFromData === selectedMonthValue;
                    }
                }
                return false;
            });
            console.log('Filtered participants data length:', filteredParticipantsData.length);
        } else {
            console.log('Not filtering by month (selected "All" or no month). Using all participant data.');
        }

        filteredParticipantsData.forEach(entry => {
            if (entry[employeeCodeHeader]) {
                const normalizedCode = String(entry[employeeCodeHeader]).trim().toLowerCase();
                participantCodes.add(normalizedCode);
            }
        });
        console.log('Total unique participant codes:', participantCodes.size);
        return participantCodes;
    }

    // Function to generate and display the non-participants report
    async function generateAndDisplayNonParticipantsReport() {
        console.log('Generating and displaying non-participants report...');
        nonParticipantsMessage.style.display = 'none'; // Hide previous messages
        nonParticipantsDisplay.style.display = 'none'; // Hide table while generating

        await fetchMasterEmployees(); // Ensure master employee data is loaded

        if (masterEmployeesData.length === 0) {
            nonParticipantsMessage.textContent = "Master Employee data is not available. Cannot generate non-participants report.";
            nonParticipantsMessage.style.display = 'block';
            console.warn('Master Employees data is empty, cannot proceed.');
            return;
        }

        const allMasterEmployeeCodes = new Set(masterEmployeesData.map(emp => String(emp['Employee Code']).trim().toLowerCase()));
        const participantCodes = getParticipantEmployeeCodes(); // Get participant codes based on selected month

        const nonParticipants = masterEmployeesData.filter(masterEmp => {
            const employeeCode = String(masterEmp['Employee Code']).trim().toLowerCase();
            return !participantCodes.has(employeeCode);
        });
        console.log('Number of non-participants found:', nonParticipants.length);

        displayNonParticipants(nonParticipants);

        if (nonParticipants.length === 0) {
            nonParticipantsMessage.textContent = "All master employees have participated for the selected period!";
            nonParticipantsMessage.style.display = 'block';
            nonParticipantsDisplay.style.display = 'none';
        } else {
            nonParticipantsDisplay.style.display = 'block';
        }
        console.log('Finished generating and displaying report.');
    }

    // Function to display non-participants in the table
    function displayNonParticipants(nonParticipants) {
        nonParticipantsTableBody.innerHTML = ''; // Clear previous entries
        if (nonParticipants.length === 0) {
            return;
        }

        nonParticipants.forEach((employee, index) => {
            const row = nonParticipantsTableBody.insertRow();
            row.insertCell(0).textContent = index + 1; // SL.No.
            // These lines should now correctly map because parseCSV is fixing the object keys
            row.insertCell(1).textContent = employee['Employee Code'] || '';
            row.insertCell(2).textContent = employee['Employee Name'] || '';
            row.insertCell(3).textContent = employee['Division'] || '';
            row.insertCell(4).textContent = employee['Designation'] || '';
        });
    }

    // Handle CSV download
    if (downloadNonParticipantsReportBtn) {
        downloadNonParticipantsReportBtn.onclick = function() {
            if (nonParticipantsTableBody.rows.length === 0) {
                alert("No non-participating employees to download.");
                return;
            }

            const nonParticipantsData = [];
            // Get data from the displayed table
            for (let i = 0; i < nonParticipantsTableBody.rows.length; i++) {
                const row = nonParticipantsTableBody.rows[i];
                nonParticipantsData.push({
                    'SL.No.': row.cells[0].textContent,
                    'Employee Code': row.cells[1].textContent,
                    'Employee Name': row.cells[2].textContent,
                    'Division': row.cells[3].textContent,
                    'Designation': row.cells[4].textContent
                });
            }

            const csvHeaders = ['SL.No.', 'Employee Code', 'Employee Name', 'Division', 'Designation'];
            const csvRows = nonParticipantsData.map(row => csvHeaders.map(header => {
                const value = row[header];
                // Handle commas and quotes in CSV fields
                const stringValue = String(value || '').replace(/"/g, '""');
                return `"${stringValue}"`;
            }).join(','));

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
