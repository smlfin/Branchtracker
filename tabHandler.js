// tabHandler.js
// This function handles showing/hiding report sections and updating tab button styles.
// It is in the global scope to be accessible from HTML onclick attributes.
function showTab(sectionId) {
    // Get all report sections
    const sections = document.querySelectorAll('.report-section');
    sections.forEach(section => {
        section.style.display = 'none'; // Hide all sections
    });

    // Show the selected section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block'; // Or 'flex', depending on your layout
    }

    // Update active tab button styling
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active'); // Remove 'active' class from all buttons
    });

    // Add 'active' class to the clicked button
    const activeButton = document.getElementById(sectionId + 'TabBtn');
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Optional: You might want to set an initial active tab on page load.
// If your script.js already does this, you can leave it there.
// If not, you could add:
// document.addEventListener('DOMContentLoaded', () => {
//     showTab('allBranchSnapshotSection'); // Set your default starting tab ID here
// });