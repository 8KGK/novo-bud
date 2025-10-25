// Модуль для роботи з UI та режимами додавання/видалення
const UI = {
    isAddingMode: false,
    tempMarkers: [],
    tempCoordinates: [],
    tempPolygon: null,
    tempLines: [],
    
    // Початок додавання нового ЖК
    startAddingComplex() {
        // Вимикаємо режим видалення якщо він був активний
        if (MapController.isDeleteMode) {
            this.toggleDeleteMode();
        }
        
        this.isAddingMode = true;
        this.tempMarkers = [];
        this.tempCoordinates = [];
        this.tempPolygon = null;
        this.tempLines = [];
        
        document.getElementById('infoBanner').classList.add('active');
        document.getElementById('infoBanner').classList.remove('delete-mode');
        document.getElementById('infoBanner').innerHTML = '📍 Клікайте на карті, щоб позначити кути території ЖК<br><span class="point-counter" id="pointCounter">Точок: 0 (мінімум 3)</span>';
        document.getElementById('toolbar').style.display = 'none';
        document.getElementById('addingToolbar').style.display = 'flex';
        this.updatePointCounter();
        
        // Додаємо обробник кліків
        MapController.map.off('click');
        MapController.map.on('click', (e) => this.onMapClick(e));
    },
    
    // Обробка кліку на карті
    onMapClick(e) {
        if (!this.isAddingMode) return;
        
        // Додаємо маркер
        const marker = L.marker(e.latlng, {
            icon: L.divIcon({
                className: 'temp-marker',
                html: `<div style="background: #e74c3c; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(MapController.map);
        
        this.tempMarkers.push(marker);
        this.tempCoordinates.push([e.latlng.lat, e.latlng.lng]);
        
        // Оновлюємо лічильник
        this.updatePointCounter();
        
        // Малюємо лінію між точками
        if (this.tempCoordinates.length > 1) {
            const line = L.polyline([
                this.tempCoordinates[this.tempCoordinates.length - 2],
                this.tempCoordinates[this.tempCoordinates.length - 1]
            ], {
                color: '#e74c3c',
                weight: 2,
                dashArray: '5, 5',
                className: 'temp-line'
            }).addTo(MapController.map);
            this.tempLines.push(line);
        }
        
        // Оновлюємо тимчасовий полігон (від 3 точок)
        if (this.tempCoordinates.length >= 3) {
            if (this.tempPolygon) {
                MapController.map.removeLayer(this.tempPolygon);
            }
            
            this.tempPolygon = L.polygon(this.tempCoordinates, {
                color: '#e74c3c',
                fillColor: 'rgba(231, 76, 60, 0.3)',
                fillOpacity: 0.5,
                weight: 3,
                dashArray: '10, 5',
                className: 'temp-polygon'
            }).addTo(MapController.map);
            
            // Активуємо кнопку завершення
            document.getElementById('finishBtn').disabled = false;
            document.getElementById('finishBtn').textContent = `✅ Завершити (${this.tempCoordinates.length} точок)`;
        }
    },
    
    // Оновлення лічильника точок
    updatePointCounter() {
        const counter = document.getElementById('pointCounter');
        const count = this.tempCoordinates.length;
        counter.textContent = `Точок: ${count} (мінімум 3)`;
        
        if (count >= 3) {
            counter.style.color = '#27ae60';
        } else {
            counter.style.color = '#ffffff';
        }
    },
    
    // Відміна останньої точки
    undoLastPoint() {
        if (this.tempCoordinates.length === 0) return;
        
        // Видаляємо останній маркер
        const lastMarker = this.tempMarkers.pop();
        MapController.map.removeLayer(lastMarker);
        
        // Видаляємо координату
        this.tempCoordinates.pop();
        
        // Видаляємо останню лінію
        if (this.tempLines.length > 0) {
            const lastLine = this.tempLines.pop();
            MapController.map.removeLayer(lastLine);
        }
        
        // Оновлюємо полігон
        if (this.tempPolygon) {
            MapController.map.removeLayer(this.tempPolygon);
            this.tempPolygon = null;
        }
        
        if (this.tempCoordinates.length >= 3) {
            this.tempPolygon = L.polygon(this.tempCoordinates, {
                color: '#e74c3c',
                fillColor: 'rgba(231, 76, 60, 0.3)',
                fillOpacity: 0.5,
                weight: 3,
                dashArray: '10, 5'
            }).addTo(MapController.map);
        }
        
        // Оновлюємо лічильник
        this.updatePointCounter();
        
        // Оновлюємо кнопку
        if (this.tempCoordinates.length < 3) {
            document.getElementById('finishBtn').disabled = true;
            document.getElementById('finishBtn').textContent = '✅ Завершити (мін. 3 точки)';
        } else {
            document.getElementById('finishBtn').textContent = `✅ Завершити (${this.tempCoordinates.length} точок)`;
        }
    },
    
    // Завершення малювання
    finishDrawing() {
        if (this.tempCoordinates.length < 3) {
            alert('Потрібно мінімум 3 точки для створення території!');
            return;
        }
        
        document.getElementById('infoBanner').classList.remove('active');
        document.getElementById('coordinatesInfo').textContent = `✅ Територія позначена! (${this.tempCoordinates.length} точок)`;
        document.getElementById('addModal').classList.add('active');
        
        // Видаляємо обробник кліків
        MapController.map.off('click');
    },
    
    // Збереження нового ЖК
    saveComplex() {
        const newComplex = {
            name: document.getElementById('complexName').value,
            coordinates: this.tempCoordinates,
            price: document.getElementById('complexPrice').value,
            status: document.getElementById('complexStatus').value,
            description: document.getElementById('complexDescription').value,
            floors: document.getElementById('complexFloors').value,
            developer: document.getElementById('complexDeveloper').value
        };
        
        if (!newComplex.name) {
            alert('Введіть назву ЖК!');
            return;
        }
        
        window.residentialComplexes.push(newComplex);
        Storage.saveLocal(window.residentialComplexes);
        MapController.renderComplexes();
        this.cancelAdding();
        
        Storage.showSyncStatus(`✅ ЖК "${newComplex.name}" додано з ${this.tempCoordinates.length} точками!`);
    },
    
    // Скасування додавання
    cancelAdding() {
        this.isAddingMode = false;
        
        // Видаляємо всі тимчасові елементи
        this.tempMarkers.forEach(marker => MapController.map.removeLayer(marker));
        this.tempLines.forEach(line => MapController.map.removeLayer(line));
        if (this.tempPolygon) MapController.map.removeLayer(this.tempPolygon);
        
        this.tempMarkers = [];
        this.tempCoordinates = [];
        this.tempLines = [];
        this.tempPolygon = null;
        
        document.getElementById('infoBanner').classList.remove('active', 'delete-mode');
        document.getElementById('addModal').classList.remove('active');
        document.getElementById('coordinatesInfo').textContent = '';
        document.getElementById('toolbar').style.display = 'flex';
        document.getElementById('addingToolbar').style.display = 'none';
        document.getElementById('finishBtn').disabled = true;
        
        // Видаляємо обробник кліків
        MapController.map.off('click');
        
        // Очищаємо форму
        document.getElementById('complexName').value = '';
        document.getElementById('complexPrice').value = '';
        document.getElementById('complexDescription').value = '';
        document.getElementById('complexFloors').value = '';
        document.getElementById('complexDeveloper').value = '';
    },
    
    // Перемикання режиму видалення
    toggleDeleteMode() {
        MapController.isDeleteMode = !MapController.isDeleteMode;
        const btn = document.getElementById('deleteBtn');
        const banner = document.getElementById('infoBanner');
        
        // Видаляємо всі обробники кліків
        MapController.map.off('click');
        
        if (MapController.isDeleteMode) {
            btn.style.background = '#e74c3c';
            btn.textContent = '❌ Вимкнути видалення';
            banner.innerHTML = '🗑️ Клікніть на ЖК, щоб видалити його';
            banner.classList.add('active', 'delete-mode');
            MapController.map.getContainer().classList.add('delete-cursor');
        } else {
            btn.style.background = '#95a5a6';
            btn.textContent = '🗑️ Видалити ЖК';
            banner.classList.remove('active', 'delete-mode');
            MapController.map.getContainer().classList.remove('delete-cursor');
        }
        
        MapController.renderComplexes();
    }
};

// Експортуємо для використання в HTML
window.UI = UI;