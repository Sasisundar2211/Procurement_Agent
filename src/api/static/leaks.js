document.getElementById('run-leaks').addEventListener('click', () => {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.textContent = '';
    const loadingP = document.createElement('p');
    loadingP.textContent = 'Fetching leaks...';
    resultsContainer.appendChild(loadingP);

    fetch('/api/leaks')
        .then(response => response.json())
        .then(data => {
            resultsContainer.textContent = '';
            if (!Array.isArray(data) || data.length === 0) {
                const noLeaksP = document.createElement('p');
                noLeaksP.textContent = 'No leaks detected.';
                resultsContainer.appendChild(noLeaksP);
                return;
            }

            const table = document.createElement('table');
            table.id = 'results';

            // Create headers from the keys of the first object
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            Object.keys(data[0]).forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Create rows
            const tbody = document.createElement('tbody');
            data.forEach(row => {
                const tr = document.createElement('tr');
                Object.values(row).forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value !== null && value !== undefined ? String(value) : '';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            resultsContainer.appendChild(table);
        })
        .catch(error => {
            resultsContainer.textContent = '';
            const errorP = document.createElement('p');
            errorP.textContent = `Error: ${error}`;
            resultsContainer.appendChild(errorP);
        });
});