function search() {
    // Get the search term entered by the user
    var searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();

    // Fetch data from Google Sheet
    fetch('https://docs.google.com/spreadsheets/d/e/1h8rbA6HuBLn2jmifp3Nh4ashudxIVKs_Bfl5X4XRJ2M/pub?output=csv')
        .then(response => response.text())
        .then(data => {
            // Parse CSV data into an array of objects
            var rows = Papa.parse(data, { header: true }).data;

            // Filter rows based on search term
            var filteredRows = rows.filter(row => {
                // Check if any cell in the row contains the search term
                return Object.values(row).some(value => value.toLowerCase().includes(searchTerm));
            });

            // Display filtered rows on the page
            displayResults(filteredRows);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function displayResults(rows) {
    var resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    if (rows.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
    } else {
        var table = '<table><thead><tr>';
        // Create table header
        Object.keys(rows[0]).forEach(key => {
            table += '<th>' + key + '</th>';
        });
        table += '</tr></thead><tbody>';

        // Create table rows
        rows.forEach(row => {
            table += '<tr>';
            Object.values(row).forEach(value => {
                table += '<td>' + value + '</td>';
            });
            table += '</tr>';
        });

        table += '</tbody></table>';
        resultsContainer.innerHTML = table;
    }
}
