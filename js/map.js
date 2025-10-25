// Модуль для роботи з картою
const MapController = {
    map: null,
    polygonObjects: {},
    isDeleteMode: false,
    
    // Ініціалізація карти
    async init() {
        // Ініціалізація Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            window.tg = window.Telegram.WebApp;
            window.tg.expand();
            window.tg.ready();
            document.body.style.backgroundColor = window.tg.backgroundColor || '#ffffff';
        }
        
        // Створення карти
        this.map = L.map('map', {
            center: CONFIG.MAP_CENTER,
            zoom: CONFIG.MAP_ZOOM,
            tap: true,
            tapTolerance: 15,
            touchZoom: true,
            dragging: true,
            zoomControl: true
        });
        
        // Додаємо тайли
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Завантажуємо дані
        window.residentialComplexes = await Storage.loadData();
        
        // Відображаємо комплекси
        this.renderComplexes();
        
        // Обробник відкриття popup
        this.map.on('popupopen', (e) => {
            const px = this.map.project(e.popup._latlng);
            px.y -= e.popup._container.clientHeight / 2;
            this.map.panTo(this.map.unproject(px), {animate: true});
        });
    },
    
    // Відображення ЖК на карті
renderComplexes() {
    // Видаляємо старі полігони
    Object.values(this.polygonObjects).forEach(obj => {
        this.map.removeLayer(obj.polygon);
        if (obj.marker) this.map.removeLayer(obj.marker);
    });
    this.polygonObjects = {};
    
    // Малюємо нові
    window.residentialComplexes.forEach((complex, index) => {
        // Створюємо popup контент один раз для полігону
        const popupContent = `
            <div class="popup-content">
                <h3>${complex.name}</h3>
                <p><strong>Опис:</strong> ${complex.description}</p>
                <p><strong>Поверховість:</strong> ${complex.floors}</p>
                <p><strong>Забудовник:</strong> ${complex.developer}</p>
                <p class="price">${complex.price}</p>
            </div>
        `;
        
        const polygon = L.polygon(complex.coordinates, {
            color: CONFIG.STATUS_BORDERS[complex.status],
            fillColor: CONFIG.STATUS_COLORS[complex.status],
            fillOpacity: 0.5,
            weight: 3,
            className: this.isDeleteMode ? 'deletable-polygon' : ''
        }).addTo(this.map);
        
        // Створюємо табличку з назвою - завжди видима
        const center = polygon.getBounds().getCenter();
        const marker = L.marker(center, {
            icon: L.divIcon({
                className: 'custom-marker-label',
                html: `<div>${complex.name}</div>`,
                iconSize: [100, 20],
                iconAnchor: [50, 10]
            }),
            zIndexOffset: 1000,
            interactive: false
        }).addTo(this.map);
        
        if (!this.isDeleteMode) {
            polygon.bindPopup(popupContent, {
                maxWidth: 300,
                closeButton: true
            });
        } else {
            polygon.on('click', () => {
                if (confirm(`Видалити "${complex.name}"?`)) {
                    this.deleteComplex(index);
                }
            });
        }
        
        this.polygonObjects[index] = { polygon, marker };
    });
},
    
    // Видалення ЖК
    deleteComplex(index) {
        const deletedName = window.residentialComplexes[index].name;
        window.residentialComplexes.splice(index, 1);
        Storage.saveLocal(window.residentialComplexes);
        this.renderComplexes();
        Storage.showSyncStatus(`🗑️ ЖК "${deletedName}" видалено!`);
    },
    
    // Показати деталі
    showDetails(complexName) {
        const complex = window.residentialComplexes.find(c => c.name === complexName);
        
        if (window.tg) {
            window.tg.sendData(JSON.stringify({
                action: 'show_details',
                complex: complexName,
                data: complex
            }));
        } else {
            alert(`Деталі про: ${complexName}\n\n${complex.description}\n${complex.price}`);
        }
    }
};

// Ініціалізація при завантаженні сторінки
window.addEventListener('DOMContentLoaded', () => {
    MapController.init();
});

// Експортуємо для використання в інших модулях
window.MapController = MapController;