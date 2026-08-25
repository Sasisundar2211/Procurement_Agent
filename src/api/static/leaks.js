document.getElementById('run-leaks').addEventListener('click', () => {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.textContent = '';
    const loadingMsg = document.createElement('p');
    loadingMsg.textContent = 'Fetching leaks...';
    resultsContainer.appendChild(loadingMsg);

    fetch('/api/leaks')
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                resultsContainer.textContent = '';
                const noLeaksMsg = document.createElement('p');
                noLeaksMsg.textContent = 'No leaks detected.';
                resultsContainer.appendChild(noLeaksMsg);
                return;
            }

            const table = document.createElement('table');
            table.id = 'results';

            const thead = document.createElement('thead');
            const trHead = document.createElement('tr');
            Object.keys(data[0]).forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                trHead.appendChild(th);
            });
            thead.appendChild(trHead);
            table.appendChild(thead);

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

            resultsContainer.textContent = '';
            resultsContainer.appendChild(table);
        })
        .catch(error => {
            resultsContainer.textContent = '';
            const fetchErrorMsg = document.createElement('p');
            fetchErrorMsg.textContent = `Error: ${error}`;
            resultsContainer.appendChild(fetchErrorMsg);
        });
});