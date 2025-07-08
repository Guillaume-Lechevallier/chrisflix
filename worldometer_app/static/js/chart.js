const select = document.getElementById('country-select');
const compareBtn = document.getElementById('compare-btn');
const tables = document.getElementById('tables');
let chart;

compareBtn.addEventListener('click', async () => {
    const countries = Array.from(select.selectedOptions).map(o => o.value);
    const datasets = [];
    tables.innerHTML = '';
    for (const slug of countries) {
        const resp = await fetch(`/api/country/${slug}`).then(r => r.json());
        if (resp.error) continue;
        const data = resp.data;
        datasets.push({label: slug, data: [Number(data.population || 0)]});
        const table = document.createElement('table');
        table.innerHTML = `
            <caption>${slug}</caption>
            <tr><th>Population</th><td>${data.population || 'n/a'}</td></tr>
            <tr><th>Births today</th><td>${data.births_today || 'n/a'}</td></tr>
            <tr><th>Deaths today</th><td>${data.deaths_today || 'n/a'}</td></tr>
            <tr><th>Net growth</th><td>${data.net_growth || 'n/a'}</td></tr>`;
        tables.appendChild(table);
    }
    const ctx = document.getElementById('chart');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Population'],
            datasets: datasets
        }
    });
});
