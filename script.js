document.addEventListener('DOMContentLoaded', function() {
    const myForm = document.getElementById('myForm');
    const submitButton = document.getElementById('submitButton');
    const statusMessage = document.getElementById('statusMessage');
    const errorMessage = document.getElementById('errorMessage');

    // --- IMPORTANT: Removed ALL previous data loading logic here ---
    // There are NO 'google.script.run' calls here on page load
    // that attempt to fetch data from the sheet for pre-population.
    // The "Failed to load previous data" message originated from such a call, which is now removed.

    // Ensure all form inputs are enabled and visible on page load.
    // This explicitly undoes any potential 'disabled' state or 'display:none' from previous logic.
    const formInputs = myForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.disabled = false; // Enable the field
        // If the field's parent div might have been hidden, make it visible.
        // It's generally better to manage this in index.html, but this provides a fallback.
        if (input.parentElement && input.parentElement.style.display === 'none') {
            input.parentElement.style.display = ''; // Resets to default (e.g., 'block' or 'flex')
        }
    });

    // Helper function to reset the form fields and hide messages after submission
    // This is called by the buttons in formSuccessMessage and formErrorMessage
    window.resetFormFieldsAndMessages = function() { // Made global to be accessible from HTML onclick
        myForm.reset(); // Reset all form fields to their default empty state
        // If you have a specific field like userRoleSelect, you can reset it here:
        // const userRoleSelect = document.getElementById('userRole'); // Make sure this ID matches your HTML
        // if (userRoleSelect) userRoleSelect.value = '';

        statusMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        // No call to initializeFormFields() here, as we have removed that feature entirely.
    };

    myForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default browser form submission

        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        submitButton.disabled = true;
        statusMessage.style.display = 'none'; // Hide any previous status messages
        errorMessage.style.display = 'none'; // Hide any previous error messages

        const formData = new FormData(this);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        google.script.run
            .withSuccessHandler(function(response) {
                submitButton.innerHTML = 'Submit';
                submitButton.disabled = false;
                if (response.success) {
                    resetFormFieldsAndMessages(); // Use the simplified reset function
                    statusMessage.textContent = response.message;
                    statusMessage.style.display = 'block';
                    setTimeout(() => {
                        statusMessage.style.display = 'none';
                    }, 5000); // Hide success message after 5 seconds
                } else {
                    errorMessage.textContent = response.message;
                    errorMessage.style.display = 'block';
                    setTimeout(() => {
                        errorMessage.style.display = 'none';
                    }, 5000); // Hide error message after 5 seconds
                }
            })
            .withFailureHandler(function(error) {
                submitButton.innerHTML = 'Submit';
                submitButton.disabled = false;
                errorMessage.textContent = 'An unexpected error occurred: ' + error.message;
                errorMessage.style.display = 'block';
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 5000); // Hide error message after 5 seconds
            })
            .processForm(data); // Call the Apps Script function (in Code.gs)
    });
});