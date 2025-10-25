// Модуль для роботи з даними та синхронізацією
const Storage = {
    // Завантажити дані
    async loadData() {
        try {
            // Спочатку пробуємо завантажити з сервера
            const serverData = await this.fetchFromServer();
            if (serverData && serverData.length > 0) {
                this.saveLocal(serverData);
                this.showSyncStatus('✅ Дані завантажено з сервера');
                return serverData;
            }
        } catch (error) {
            console.warn('Не вдалося завантажити з сервера:', error);
        }
        
        // Якщо не вдалося - завантажуємо локальні
        const localData = this.loadLocal();
        if (localData && localData.length > 0) {
            this.showSyncStatus('📱 Використовуються локальні дані');
            return localData;
        }
        
        // Якщо нічого немає - використовуємо дефолтні
        this.showSyncStatus('🆕 Використовуються початкові дані');
        return CONFIG.DEFAULT_COMPLEXES;
    },
    
    // Зберегти локально
    saveLocal(data) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
            localStorage.setItem(CONFIG.LAST_SYNC_KEY, new Date().toISOString());
            return true;
        } catch (error) {
            console.error('Помилка збереження локально:', error);
            return false;
        }
    },
    
    // Завантажити локальні дані
    loadLocal() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Помилка читання локальних даних:', error);
            return null;
        }
    },
    
    // Завантажити з сервера (JSONBin)
    async fetchFromServer() {
        if (CONFIG.USE_GITHUB) {
            return await this.fetchFromGitHub();
        }
        
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.API_KEY,
                    'X-Bin-Meta': 'false'
                }
            });
            
            if (!response.ok) throw new Error('Помилка завантаження');
            
            const data = await response.json();
            return data.record || data;
        } catch (error) {
            console.error('Помилка отримання з JSONBin:', error);
            throw error;
        }
    },
    
    // Завантажити з GitHub
    async fetchFromGitHub() {
        try {
            const url = `https://api.github.com/repos/${CONFIG.GITHUB_API.owner}/${CONFIG.GITHUB_API.repo}/contents/${CONFIG.GITHUB_API.path}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_API.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) throw new Error('Помилка завантаження з GitHub');
            
            const fileData = await response.json();
            const content = atob(fileData.content);
            return JSON.parse(content);
        } catch (error) {
            console.error('Помилка отримання з GitHub:', error);
            throw error;
        }
    },
    
    // Зберегти на сервер
    async saveToServer(data) {
        if (CONFIG.USE_GITHUB) {
            return await this.saveToGitHub(data);
        }
        
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.API_KEY
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Помилка збереження');
            
            return true;
        } catch (error) {
            console.error('Помилка збереження на JSONBin:', error);
            throw error;
        }
    },
    
    // Зберегти на GitHub
    async saveToGitHub(data) {
        try {
            const url = `https://api.github.com/repos/${CONFIG.GITHUB_API.owner}/${CONFIG.GITHUB_API.repo}/contents/${CONFIG.GITHUB_API.path}`;
            
            // Отримуємо SHA поточного файлу
            const currentFile = await fetch(url, {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_API.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            let sha = null;
            if (currentFile.ok) {
                const fileData = await currentFile.json();
                sha = fileData.sha;
            }
            
            // Оновлюємо файл
            const content = btoa(JSON.stringify(data, null, 2));
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_API.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update complexes data - ${new Date().toISOString()}`,
                    content: content,
                    sha: sha
                })
            });
            
            if (!response.ok) throw new Error('Помилка збереження на GitHub');
            
            return true;
        } catch (error) {
            console.error('Помилка збереження на GitHub:', error);
            throw error;
        }
    },
    
    // Синхронізувати дані
    async syncData() {
        const syncBtn = document.querySelector('.sync-btn');
        syncBtn.classList.add('syncing');
        syncBtn.textContent = '🔄 Синхронізація...';
        
        try {
            const localData = this.loadLocal();
            
            if (!localData || localData.length === 0) {
                this.showSyncStatus('⚠️ Немає даних для синхронізації', true);
                return;
            }
            
            await this.saveToServer(localData);
            this.showSyncStatus('✅ Дані синхронізовано успішно!');
            
        } catch (error) {
            console.error('Помилка синхронізації:', error);
            this.showSyncStatus('❌ Помилка синхронізації. Дані збережено локально.', true);
        } finally {
            syncBtn.classList.remove('syncing');
            syncBtn.textContent = '🔄 Синхронізація';
        }
    },
    
    // Експорт даних
    exportData() {
        const data = window.residentialComplexes || this.loadLocal() || CONFIG.DEFAULT_COMPLEXES;
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `novobud_complexes_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showSyncStatus('✅ Файл завантажено!');
    },
    
    // Імпорт даних
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedData)) {
                    alert('❌ Помилка: Файл повинен містити масив ЖК!');
                    return;
                }
                
                const isValid = importedData.every(complex => 
                    complex.name && 
                    complex.coordinates && 
                    Array.isArray(complex.coordinates) &&
                    complex.price &&
                    complex.status
                );
                
                if (!isValid) {
                    alert('❌ Помилка: Невірна структура даних!');
                    return;
                }
                
                const action = confirm(
                    `📥 Знайдено ${importedData.length} ЖК\n\n` +
                    `OK - Додати до існуючих\n` +
                    `Скасувати - Замінити всі дані`
                );
                
                if (action) {
                    window.residentialComplexes = window.residentialComplexes.concat(importedData);
                    this.showSyncStatus(`✅ Додано ${importedData.length} нових ЖК!`);
                } else {
                    window.residentialComplexes = importedData;
                    this.showSyncStatus(`✅ Імпортовано ${importedData.length} ЖК!`);
                }
                
                this.saveLocal(window.residentialComplexes);
                window.MapController.renderComplexes();
                
            } catch (error) {
                alert('❌ Помилка читання файлу:\n\n' + error.message);
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    },
    
    // Показати статус синхронізації
    showSyncStatus(message, isError = false) {
        const statusEl = document.getElementById('syncStatus');
        statusEl.textContent = message;
        statusEl.className = 'sync-status show';
        if (isError) statusEl.classList.add('error');
        
        setTimeout(() => {
            statusEl.classList.remove('show');
        }, 3000);
    }
};