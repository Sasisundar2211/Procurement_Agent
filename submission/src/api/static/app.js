document.getElementById('run-detection').addEventListener('click', () => {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '<p>Detection task started...</p>';

    fetch('/api/run-detection', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            const taskId = data.task_id;
            resultsContainer.innerHTML = `<p>Task ${taskId} is in progress. Polling for results...</p>`;
            
            const interval = setInterval(() => {
                fetch(`/api/run-detection/${taskId}`)
                    .then(response => response.json())
                    .then(task => {
                        if (task.status === 'completed') {
                            clearInterval(interval);
                            const results = task.result;
                            if (results.length === 0) {
                                resultsContainer.innerHTML = '<p>No price drifts detected.</p>';
                                return;
                            }
                            
                            let table = '<table id="results">';
                            table += '<thead><tr>';
                            Object.keys(results[0]).forEach(key => {
                                table += `<th>${key}</th>`;
                            });
                            table += '</tr></thead>';
                            
                            table += '<tbody>';
                            results.forEach(row => {
                                table += '<tr>';
                                Object.values(row).forEach(value => {
                                    table += `<td>${value}</td>`;
                                });
                                table += '</tr>';
                            });
                            table += '</tbody></table>';
                            
                            resultsContainer.innerHTML = table;
                        } else if (task.status === 'failed') {
                            clearInterval(interval);
                            resultsContainer.innerHTML = `<p>Error: ${task.error}</p>`;
                        }
                    });
            }, 2000);
        })
        .catch(error => {
            resultsContainer.innerHTML = `<p>Error: ${error}</p>`;
        });
});