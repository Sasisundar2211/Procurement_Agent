document.getElementById('run-detection').addEventListener('click', () => {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.textContent = '';
    const startMsg = document.createElement('p');
    startMsg.textContent = 'Detection task started...';
    resultsContainer.appendChild(startMsg);

    fetch('/api/run-detection', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            const taskId = data.task_id;
            resultsContainer.textContent = '';
            const progressMsg = document.createElement('p');
            progressMsg.textContent = `Task ${taskId} is in progress. Polling for results...`;
            resultsContainer.appendChild(progressMsg);
            
            const interval = setInterval(() => {
                fetch(`/api/run-detection/${taskId}`)
                    .then(response => response.json())
                    .then(task => {
                        if (task.status === 'completed') {
                            clearInterval(interval);
                            const results = task.result;
                            if (!results || results.length === 0) {
                                resultsContainer.textContent = '';
                                const noResultsMsg = document.createElement('p');
                                noResultsMsg.textContent = 'No price drifts detected.';
                                resultsContainer.appendChild(noResultsMsg);
                                return;
                            }
                            
                            const table = document.createElement('table');
                            table.id = 'results';

                            const thead = document.createElement('thead');
                            const trHead = document.createElement('tr');
                            Object.keys(results[0]).forEach(key => {
                                const th = document.createElement('th');
                                th.textContent = key;
                                trHead.appendChild(th);
                            });
                            thead.appendChild(trHead);
                            table.appendChild(thead);

                            const tbody = document.createElement('tbody');
                            results.forEach(row => {
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
                        } else if (task.status === 'failed') {
                            clearInterval(interval);
                            resultsContainer.textContent = '';
                            const errorMsg = document.createElement('p');
                            errorMsg.textContent = `Error: ${task.error}`;
                            resultsContainer.appendChild(errorMsg);
                        }
                    });
            }, 2000);
        })
        .catch(error => {
            resultsContainer.textContent = '';
            const fetchErrorMsg = document.createElement('p');
            fetchErrorMsg.textContent = `Error: ${error}`;
            resultsContainer.appendChild(fetchErrorMsg);
        });
});