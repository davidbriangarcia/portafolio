const TOMORROW_API_KEY = '8cxmNB0Nk35gYc08rekMQl2ndrNaO3DA';
const METEO_API_KEY = '2z7jrb6tx3ybpxhx9zvh8amoh1tnw3qpk53x6dgm';
const OPENCAGE_API_KEY = 'f07e4476908f46bb92566ff34d97d4cb';
const WEATHERBIT_API_KEY = '5a0f5e3a16b049eda6517d5af02dca5b';

let currentLocation = {};
let hourlyChart;
let historicalChart;

function initWeather() {
    const citySearch = document.getElementById('city-search');
    citySearch.addEventListener('input', debounce(handleCitySearch, 300));
    
    initCharts();
}

function initCharts() {
    const hourlyCtx = document.getElementById('hourly-chart').getContext('2d');
    hourlyChart = new Chart(hourlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperatura (°C)',
                data: [],
                borderColor: 'rgb(96, 165, 250)',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
    
    const historicalCtx = document.getElementById('historical-chart').getContext('2d');
    historicalChart = new Chart(historicalCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperatura promedio',
                data: [],
                backgroundColor: 'rgba(96, 165, 250, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

async function handleCitySearch(e) {
    const query = e.target.value.trim();
    if (query.length < 3) return;
    
    try {
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=5`);
        const data = await response.json();
        
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';
        
        if (data.results && data.results.length > 0) {
            data.results.forEach(result => {
                const { formatted, geometry } = result;
                const item = document.createElement('div');
                item.className = 'p-3 hover:bg-gray-700 cursor-pointer';
                item.textContent = formatted;
                item.addEventListener('click', () => {
                    updateWeatherData(geometry.lat, geometry.lng);
                    updateMapView(geometry.lat, geometry.lng);
                    document.getElementById('city-search').value = formatted;
                    resultsContainer.classList.add('hidden');
                    currentLocation = { lat: geometry.lat, lng: geometry.lng, name: formatted };
                });
                resultsContainer.appendChild(item);
            });
            resultsContainer.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error en la búsqueda:', error);
    }
}

async function updateTravelInfo(lat, lng) {
    let place = currentLocation.name || '';
    if (!place) return;

    const infoContainer = document.getElementById('travel-info');
    infoContainer.innerHTML = '<div class="text-gray-400">Buscando información turística...</div>';

    try {
        const searchRes = await fetch(`https://es.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(place)}&limit=1`);
        const searchData = await searchRes.json();

        if (searchData.pages && searchData.pages.length > 0) {
            const page = searchData.pages[0];
            const summaryRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`);
            const summary = await summaryRes.json();

            infoContainer.innerHTML = `
                <div class="flex items-center space-x-4">
                    ${summary.thumbnail ? `<img src="${summary.thumbnail.source}" alt="${summary.title}" class="w-16 h-16 rounded">` : ''}
                    <div>
                        <div class="font-bold">${summary.title}</div>
                        <div class="text-sm text-gray-300">${summary.extract}</div>
                        <a href="https://es.wikipedia.org/wiki/${encodeURIComponent(summary.title)}" target="_blank" class="text-blue-400 underline text-xs">Ver en Wikipedia</a>
                    </div>
                </div>
            `;
        } else {
            infoContainer.innerHTML = '<div class="text-gray-400">No se encontró información turística.</div>';
        }
    } catch (error) {
        infoContainer.innerHTML = '<div class="text-red-400">Error al obtener información turística.</div>';
    }
}

async function updateWeatherData(lat, lng) {
    try {
        document.getElementById('current-weather').innerHTML = `
            <div class="text-4xl">--°</div>
            <div class="ml-2">
                <div class="text-sm text-gray-400">Cargando...</div>
            </div>
        `;
        
        const weatherResponse = await fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lng}&apikey=${TOMORROW_API_KEY}`);
        const weatherData = await weatherResponse.json();
        
        updateCurrentWeatherUI(weatherData);
        updateHourlyForecast(weatherData);
        updateDailyForecast(weatherData);
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 11);

        const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
        const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`;

        updateTravelInfo(lat, lng);

        const historicalResponse = await fetch(
            `https://api.weatherbit.io/v2.0/history/daily?lat=${lat}&lon=${lng}&start_date=${start}&end_date=${end}&key=${WEATHERBIT_API_KEY}`
        );
        const historicalData = await historicalResponse.json();
        updateHistoricalData(historicalData);
        
    } catch (error) {
        console.error('Error al obtener datos del clima:', error);
    }
}

function updateCurrentWeatherUI(data) {
    const current = data.timelines.minutely[0].values;
    document.getElementById('current-weather').innerHTML = `
        <div class="text-4xl">${Math.round(current.temperature)}°</div>
        <div class="ml-2">
            <div class="text-sm capitalize">${getWeatherDescription(current.weatherCode)}</div>
            <div class="text-xs text-gray-400">${currentLocation.name || 'Ubicación actual'}</div>
        </div>
    `;
    
    document.getElementById('feels-like').textContent = `${Math.round(current.temperatureApparent)}°`;
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    document.getElementById('wind').textContent = `${Math.round(current.windSpeed)} km/h`;
    document.getElementById('pressure').textContent = `${current.pressureSurfaceLevel} hPa`;
    document.getElementById('visibility').textContent = `${(current.visibility)} km`;
    document.getElementById('uv-index').textContent = current.uvIndex;
}

function getWeatherDescription(code) {
    const descriptions = {
        0: "Despejado ☀️",
        1000: "Despejado ☀️",
        10000: "Despejado ☀️",
        10001: "Despejado ☀️",
        1001: "Nublado ☁️",
        10010: "Nublado ☁️",
        10011: "Nublado ☁️",
        1100: "Mayormente despejado 🌤️",
        11000: "Mayormente despejado 🌤️",
        11001: "Mayormente despejado 🌤️",
        1101: "Parcialmente nublado ⛅",
        11010: "Parcialmente nublado ⛅",
        11011: "Parcialmente nublado ⛅",
        1102: "Muy nublado 🌥️",
        11020: "Muy nublado 🌥️",
        11021: "Muy nublado 🌥️",
        2000: "Niebla 🌫️",
        20000: "Niebla 🌫️",
        20001: "Niebla 🌫️",
        2100: "Niebla ligera 🌁",
        21000: "Niebla ligera 🌁",
        21001: "Niebla ligera 🌁",
        4000: "Llovizna 🌦️",
        40000: "Llovizna 🌦️",
        40001: "Llovizna 🌦️",
        4001: "Lluvia 🌧️",
        40010: "Lluvia 🌧️",
        40011: "Lluvia 🌧️",
        4200: "Lluvia ligera 🌦️",
        42000: "Lluvia ligera 🌦️",
        42001: "Lluvia ligera 🌦️",
        4201: "Lluvia fuerte 🌧️",
        42010: "Lluvia fuerte 🌧️",
        42011: "Lluvia fuerte 🌧️",
        5000: "Nieve ❄️",
        50010: "Nieve ❄️",
        50011: "Nieve ❄️",
        5001: "Nieve ligera 🌨️",
        50010: "Nieve ligera 🌨️",
        50011: "Nieve ligera 🌨️",
        51000: "Nieve ligera 🌨️",
        51001: "Nieve ligera 🌨️",
        5100: "Nieve ligera 🌨️",
        5101: "Nieve fuerte ❄️",
        51010: "Nieve fuerte ❄️",
        51011: "Nieve fuerte ❄️",
        6000: "Aguanieve ligera 🌧️",
        60000: "Aguanieve ligera 🌧️",
        60001: "Aguanieve ligera 🌧️",
        6001: "Aguanieve 🌧️",
        60010: "Aguanieve 🌧️",
        60011: "Aguanieve 🌧️",
        6200: "Aguanieve ligera 🌧️",
        62000: "Aguanieve ligera 🌧️",
        62001: "Aguanieve ligera 🌧️",
        6201: "Aguanieve fuerte 🌧️",
        62010: "Aguanieve fuerte 🌧️",
        62011: "Aguanieve fuerte 🌧️",
        7000: "Granizo 🌩️",
        70000: "Granizo 🌩️",
        70001: "Granizo 🌩️",
        7101: "Granizo fuerte 🌩️",
        71010: "Granizo fuerte 🌩️",
        71011: "Granizo fuerte 🌩️",
        7102: "Granizo ligero 🌩️",
        71020: "Granizo ligero 🌩️",
        71021: "Granizo ligero 🌩️",
        8000: "Tormenta 🌩️",
        80000: "Tormenta 🌩️",
        80001: "Tormenta 🌩️",
    };
    return descriptions[code];
}

function updateHourlyForecast(data) {
    if (!data.timelines || !data.timelines.hourly) return;
    const hourly = data.timelines.hourly.slice(0, 12);

    const labels = hourly.map(h => {
        const date = new Date(h.time);
        return `${date.getHours()}:00`;
    });
    const temps = hourly.map(h => h.values.temperature);

    hourlyChart.data.labels = labels;
    hourlyChart.data.datasets[0].data = temps;
    hourlyChart.update();
}

function updateDailyForecast(data) {
    if (!data.timelines || !data.timelines.daily) return;
    const daily = data.timelines.daily.slice(0, 5);

    const forecastContainer = document.getElementById('forecast-days');
    forecastContainer.innerHTML = '';

    daily.forEach(day => {
        console.log('Día completo:', day.values);
        const date = new Date(day.time);
        const tempMax = Math.round(day.values.temperatureMax);
        const tempMin = Math.round(day.values.temperatureMin);
        const icon = getWeatherDescription(day.values.weatherCodeMax);

        const dayDiv = document.createElement('div');
        dayDiv.className = 'bg-gray-700 rounded-lg p-3 flex flex-col items-center';
        dayDiv.innerHTML = `
            <div class="text-xs text-gray-400 mb-1">${date.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
            <div class="text-lg font-bold">${tempMax}°</div>
            <div class="text-sm text-gray-400">${tempMin}°</div>
            <div class="text-sm capitalize">${icon}</div>
        `;
        forecastContainer.appendChild(dayDiv);
    });
}

function updateHistoricalData(data) {
    if (!data || !data.data || data.data.length === 0) {
        const historicalContainer = document.getElementById('historical-chart');
        if (historicalContainer) {
            historicalContainer.innerHTML = '<div class="text-gray-400 text-center">No hay datos históricos disponibles para esta ubicación.</div>';
        }
        return;
    }

    const monthly = {};
    data.data.forEach(day => {
        const date = new Date(day.datetime);
        const month = date.toLocaleString('es-ES', { month: 'short' });
        if (!monthly[month]) monthly[month] = [];
        monthly[month].push(day.temp);
    });

    const months = Object.keys(monthly);
    const temps = months.map(month => {
        const arr = monthly[month];
        return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
    });

    historicalChart.data.labels = months;
    historicalChart.data.datasets[0].data = temps;
    historicalChart.update();
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

window.updateWeatherData = updateWeatherData;
