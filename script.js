document.addEventListener('DOMContentLoaded', function() {
    // --- IMPORTANT: REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL ---
    // This URL should be the one you get after deploying your Code.gs as an API Executable
    const WEB_APP_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'; 
    // Example: https://script.google.com/macros/s/AKfycb.../exec

    const myForm = document.getElementById('myForm');
    const submitButton = myForm.querySelector('button[type="submit"]');
    const statusMessage = document.getElementById('formSuccessMessage'); // Corrected ID from index.html
    const errorMessage = document.getElementById('formErrorMessage');   // Corrected ID from index.html
    const branchSelect = document.getElementById('branch'); // Get the branch dropdown
    const performanceCategorySelect = document.getElementById('performanceCategory');
    const categorySections = document.querySelectorAll('.category-section');

    // Function to fetch branches from Apps Script API
    async function fetchBranches() {
        try {
            // Fetch branches using the API URL, not google.script.run
            const response = await fetch(WEB_APP_URL + '?action=getBranchesList'); // Pass action parameter for doGet
            const data = await response.json();

            if (data.error) {
                console.error("Error fetching branches:", data.error);
                branchSelect.innerHTML = '<option value="">Error loading branches</option>';
                return;
            }

            branchSelect.innerHTML = '<option value="">Select Branch</option>'; // Reset dropdown
            data.branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                branchSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Network error fetching branches:", error);
            branchSelect.innerHTML = '<option value="">Failed to load branches</option>';
        }
    }

    // Helper function to reset the form fields and hide messages after submission
    window.resetFormFieldsAndMessages = function() {
        myForm.reset();
        statusMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        categorySections.forEach(section => {
            section.classList.add('hidden-category-section');
            section.querySelectorAll('input, select, textarea').forEach(input => {
                input.disabled = true;
            });
        });
        performanceCategorySelect.value = ''; // Reset category dropdown
        fetchBranches(); // Re-fetch branches on reset to ensure latest list
    };

    // Initialize form fields and fetch branches on page load
    fetchBranches(); // Call the function to populate branches

    // Hide all category sections initially and disable their inputs
    categorySections.forEach(section => {
        section.classList.add('hidden-category-section');
        section.querySelectorAll('input, select, textarea').forEach(input => {
            input.disabled = true;
        });
    });

    // Event listener for the new Performance Category dropdown
    performanceCategorySelect.addEventListener('change', function() {
        const selectedCategory = this.value;

        // Hide all sections and disable their inputs
        categorySections.forEach(section => {
            section.classList.add('hidden-category-section');
            section.querySelectorAll('input, select, textarea').forEach(input => {
                input.disabled = true;
            });
        });

        // Show the selected section and enable its inputs
        if (selectedCategory) {
            const targetSectionId = selectedCategory.replace(/\s/g, '') + 'Section'; // e.g., "Outstanding" -> "outstandingSection"
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden-category-section');
                targetSection.querySelectorAll('input, select, textarea').forEach(input => {
                    input.disabled = false;
                });
            }
        }
    });

    // Form submission handler
    myForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        submitButton.disabled = true;
        statusMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        const formData = new FormData(this);
        const dataToSend = {};

        // Collect data ONLY from visible and enabled fields
        for (let [key, value] of formData.entries()) {
            const inputElement = myForm.elements[key];
            // Check if the element is part of a visible category section
            const isInCategorySection = inputElement.closest('.category-section');
            const isHiddenCategorySection = isInCategorySection && isInCategorySection.classList.contains('hidden-category-section');

            // Include if not part of a hidden category section AND not explicitly disabled
            if (!isHiddenCategorySection && !inputElement.disabled) {
                dataToSend[key] = value;
            }
        }
        // Add core fields always
        const coreFields = ['Branch', 'Employee name', 'User Role', 'Performance Category'];
        coreFields.forEach(field => {
            if (formData.has(field)) {
                dataToSend[field] = formData.get(field);
            }
        });
        dataToSend['Client Submit Timestamp'] = new Date().toISOString();


        try {
            // Use fetch for POST request to Apps Script Web App URL
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(dataToSend), // Send data as URL-encoded form data
                redirect: 'follow' // Follow redirects if any
            });

            if (response.ok) {
                const result = await response.json(); // Apps Script doPost returns JSON now

                if (result.success) {
                    resetFormFieldsAndMessages();
                    statusMessage.textContent = result.message;
                    statusMessage.style.display = 'block';
                    setTimeout(() => { statusMessage.style.display = 'none'; }, 5000);
                } else {
                    errorMessage.textContent = result.message;
                    errorMessage.style.display = 'block';
                    setTimeout(() => { errorMessage.style.display = 'none'; }, 5000);
                }
            } else {
                const errorText = await response.text();
                console.error("HTTP Error during submission:", response.status, response.statusText, errorText);
                errorMessage.textContent = `Server error: ${response.status} ${response.statusText}. Please try again.`;
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Network error submitting form:', error);
            errorMessage.textContent = `Network error: ${error.message}. Please check your connection.`;
            errorMessage.style.display = 'block';
        } finally {
            submitButton.innerHTML = 'Submit Performance Data';
            submitButton.disabled = false;
        }
    });
});