document.addEventListener('DOMContentLoaded', function() {
    const myForm = document.getElementById('myForm');
    const submitButton = myForm.querySelector('button[type="submit"]'); // Get button from form
    const successMessage = document.getElementById('formSuccessMessage');
    const errorMessage = document.getElementById('formErrorMessage');
    const performanceCategorySelect = document.getElementById('performanceCategory');
    const categorySections = document.querySelectorAll('.category-section'); // All sections to hide/show

    // Ensure all form inputs are enabled on page load.
    const formInputs = myForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.disabled = false; // Enable all fields by default
    });

    // Hide all category sections initially
    categorySections.forEach(section => {
        section.classList.add('hidden-category-section');
        // Disable all inputs within initially hidden sections
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

    // Helper function to reset the form fields and hide messages after submission
    window.resetFormFieldsAndMessages = function() {
        myForm.reset(); // Reset all form fields to their default empty state
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        // Re-hide all category sections and disable their inputs after reset
        categorySections.forEach(section => {
            section.classList.add('hidden-category-section');
            section.querySelectorAll('input, select, textarea').forEach(input => {
                input.disabled = true;
            });
        });
        performanceCategorySelect.value = ''; // Reset category dropdown
    };

    // Form submission handler
    myForm.addEventListener('submit', function(e) {
        e.preventDefault();

        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        submitButton.disabled = true;
        successMessage.style.display = 'none';
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

        // Also ensure core fields are always sent if they are visible
        const coreFields = ['Branch', 'Employee name', 'User Role', 'Performance Category'];
        coreFields.forEach(field => {
            if (formData.has(field)) {
                dataToSend[field] = formData.get(field);
            }
        });


        google.script.run
            .withSuccessHandler(function(response) {
                submitButton.innerHTML = 'Submit Performance Data'; // Reset button text
                submitButton.disabled = false;
                if (response.success) {
                    resetFormFieldsAndMessages();
                    successMessage.textContent = response.message;
                    successMessage.style.display = 'block';
                    setTimeout(() => { successMessage.style.display = 'none'; }, 5000);
                } else {
                    errorMessage.textContent = response.message;
                    errorMessage.style.display = 'block';
                    setTimeout(() => { errorMessage.style.display = 'none'; }, 5000);
                }
            })
            .withFailureHandler(function(error) {
                submitButton.innerHTML = 'Submit Performance Data'; // Reset button text
                submitButton.disabled = false;
                errorMessage.textContent = 'An unexpected error occurred: ' + error.message;
                errorMessage.style.display = 'block';
                setTimeout(() => { errorMessage.style.display = 'none'; }, 5000);
            })
            .processForm(dataToSend);
    });
});