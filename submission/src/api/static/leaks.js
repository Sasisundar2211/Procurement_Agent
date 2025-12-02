document.getElementById('run-leaks').addEventListener('click', () => {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '<p>Fetching leaks...</p>';

    fetch('/api/leaks')
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                resultsContainer.innerHTML = '<p>No leaks detected.</p>';
                return;
            }

            let table = '<table id="results">';
            // Create headers from the keys of the first object
            table += '<thead><tr>';
            Object.keys(data[0]).forEach(key => {
                table += `<th>${key}</th>`;
            });
            table += '</tr></thead>';
            
            // Create rows
            table += '<tbody>';
            data.forEach(row => {
                table += '<tr>';
                Object.values(row).forEach(value => {
                    table += `<td>${value}</td>`;
                });
                table += '</tr>';
            });
            table += '</tbody></table>';
            
            resultsContainer.innerHTML = table;
        })
        .catch(error => {
            resultsContainer.innerHTML = `<p>Error: ${error}</p>`;
        });
});