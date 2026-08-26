document.getElementById('run-detection').addEventListener('click', () => {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.textContent = '';
    const loadingP = document.createElement('p');
    loadingP.textContent = 'Detection task started...';
    resultsContainer.appendChild(loadingP);

    fetch('/api/run-detection', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            const taskId = data.task_id;
            resultsContainer.textContent = '';
            const inProgressP = document.createElement('p');
            inProgressP.textContent = `Task ${taskId} is in progress. Polling for results...`;
            resultsContainer.appendChild(inProgressP);
            
            const interval = setInterval(() => {
                fetch(`/api/run-detection/${taskId}`)
                    .then(response => response.json())
                    .then(task => {
                        if (task.status === 'completed') {
                            clearInterval(interval);
                            resultsContainer.textContent = '';
                            const results = task.result;
                            if (!Array.isArray(results) || results.length === 0) {
                                const noDriftsP = document.createElement('p');
                                noDriftsP.textContent = 'No price drifts detected.';
                                resultsContainer.appendChild(noDriftsP);
                                return;
                            }
                            
                            const table = document.createElement('table');
                            table.id = 'results';

                            const thead = document.createElement('thead');
                            const headerRow = document.createElement('tr');
                            Object.keys(results[0]).forEach(key => {
                                const th = document.createElement('th');
                                th.textContent = key;
                                headerRow.appendChild(th);
                            });
                            thead.appendChild(headerRow);
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
                            
                            resultsContainer.appendChild(table);
                        } else if (task.status === 'failed') {
                            clearInterval(interval);
                            resultsContainer.textContent = '';
                            const errorP = document.createElement('p');
                            errorP.textContent = `Error: ${task.error}`;
                            resultsContainer.appendChild(errorP);
                        }
                    });
            }, 2000);
        })
        .catch(error => {
            resultsContainer.textContent = '';
            const errorP = document.createElement('p');
            errorP.textContent = `Error: ${error}`;
            resultsContainer.appendChild(errorP);
        });
});