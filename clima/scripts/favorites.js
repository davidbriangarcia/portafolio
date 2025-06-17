function initFavorites() {
    loadFavorites();
    document.getElementById('add-favorite').addEventListener('click', addCurrentToFavorites);
}

function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<li class="text-gray-400 text-sm">No hay ciudades favoritas</li>';
        return;
    }
    
    favorites.forEach(fav => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-2 hover:bg-gray-700 rounded-lg cursor-pointer';
        li.innerHTML = `
            <span>${fav.name}</span>
            <button class="remove-favorite p-1 rounded-full hover:bg-gray-600" data-id="${fav.id}">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        li.addEventListener('click', () => {
            updateWeatherData(fav.lat, fav.lng);
            updateMapView(fav.lat, fav.lng);
        });
        
        const removeBtn = li.querySelector('.remove-favorite');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(fav.id);
        });
        
        favoritesList.appendChild(li);
    });
}

function addCurrentToFavorites() {
    if (!currentLocation || !currentLocation.name) {
        alert('Selecciona una ubicación primero');
        return;
    }
    
    const favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
    const existing = favorites.find(f => f.id === `${currentLocation.lat},${currentLocation.lng}`);
    
    if (existing) {
        alert('Esta ciudad ya está en tus favoritos');
        return;
    }
    
    const newFavorite = {
        id: `${currentLocation.lat},${currentLocation.lng}`,
        name: currentLocation.name,
        lat: currentLocation.lat,
        lng: currentLocation.lng
    };
    
    favorites.push(newFavorite);
    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
    loadFavorites();
  
    const btn = document.getElementById('add-favorite');
    btn.innerHTML = '<svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path></svg>';
    
    setTimeout(() => {
        btn.innerHTML = '<svg class="w-6 h-6 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>';
    }, 2000);
}

function removeFavorite(id) {
    let favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
    favorites = favorites.filter(f => f.id !== id);
    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
    loadFavorites();
}
