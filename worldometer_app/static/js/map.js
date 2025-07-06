const geojsonText = document.getElementById('geojson-data').textContent;
const geojson = JSON.parse(geojsonText);

const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.name) {
        layer.on('click', () => {
            const slug = feature.properties.name.toLowerCase().replace(/ /g, '-');
            fetch(`/api/country/${slug}`)
                .then(r => r.json())
                .then(showData);
        });
    }
}

L.geoJSON(geojson, { onEachFeature }).addTo(map);

function showData(resp) {
    const container = document.getElementById('country-data');
    if (resp.error) {
        container.textContent = resp.error;
        return;
    }
    const data = resp.data;
    container.innerHTML = `
        <h2>${resp.country}</h2>
        <ul>
            <li>Population: ${data.population || 'n/a'}</li>
            <li>Births today: ${data.births_today || 'n/a'}</li>
            <li>Births this year: ${data.births_this_year || 'n/a'}</li>
            <li>Deaths today: ${data.deaths_today || 'n/a'}</li>
            <li>Deaths this year: ${data.deaths_this_year || 'n/a'}</li>
            <li>Net growth: ${data.net_growth || 'n/a'}</li>
        </ul>`;
}

document.getElementById('toggle-theme').addEventListener('click', () => {
    document.body.classList.toggle('dark');
});
