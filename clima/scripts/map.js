let map;
let markers = [];
let currentLocationMarker;

function initMap() {
    map = L.map('map').setView([40.7128, -74.0060], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        updateWeatherData(lat, lng);
        updateCurrentLocationMarker(lat, lng);
    });
}

function updateCurrentLocationMarker(lat, lng) {
    if (currentLocationMarker) {
        map.removeLayer(currentLocationMarker);
    }
    
    currentLocationMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'location-marker',
            html: '<div class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></div><div class="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
    }).addTo(map);
    
    map.flyTo([lat, lng], 10, {
        duration: 1,
        easeLinearity: 0.25
    });
}

function updateMapView(lat, lng) {
    updateCurrentLocationMarker(lat, lng);
}

window.updateMapView = updateMapView;
