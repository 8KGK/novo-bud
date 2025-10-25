// Конфігурація додатку
const CONFIG = {
    // API для збереження даних (можна використовувати jsonbin.io, firebase, або свій сервер)
    API_URL: 'https://api.jsonbin.io/v3/b/68fd03d2ae596e708f2c0319', // Замініть на свій BIN ID
    API_KEY: '$2a$10$tVA52HUqKnWjRb5el9Kq8uw1BpKjCEUTi0THC5CiFzjBpe4CtLFKW', // Замініть на свій API ключ
    
    // Альтернативний варіант - GitHub API (для збереження у вашому репозиторії)
    GITHUB_API: {
        owner: 'YOUR_USERNAME',
        repo: 'YOUR_REPO',
        path: 'data/complexes.json',
        token: 'ghp_YOUR_TOKEN'
    },
    
    // Використовувати GitHub замість JSONBin
    USE_GITHUB: false,
    
    // Початкові дані
    DEFAULT_COMPLEXES: [
        {
            name: "ЖК Злагода",
            coordinates: [
                [50.4397, 30.6189],
                [50.4405, 30.6209],
                [50.4391, 30.6218],
                [50.4383, 30.6198]
            ],
            price: "від 45 000 грн/м²",
            status: "building",
            description: "Сучасний житловий комплекс біля метро",
            floors: "25 поверхів",
            developer: "Будівельна компанія"
        },
        {
            name: "ЖК Зарічний",
            coordinates: [
                [50.462, 30.638],
                [50.463, 30.642],
                [50.460, 30.643],
                [50.459, 30.639]
            ],
            price: "від 6.98 млн грн",
            status: "building",
            description: "Сучасний житловий комплекс на березі",
            floors: "25 поверхів",
            developer: "Будівельна компанія ABC"
        },
        {
            name: "ЖК Ріверсайд",
            coordinates: [
                [50.455, 30.625],
                [50.456, 30.628],
                [50.454, 30.629],
                [50.453, 30.626]
            ],
            price: "від 5.2 млн грн",
            status: "ready",
            description: "Готовий до заселення",
            floors: "16 поверхів",
            developer: "Будівельна компанія XYZ"
        }
    ],
    
    // Кольори статусів
    STATUS_COLORS: {
        ready: 'rgba(52, 152, 219, 0.6)',
        building: 'rgba(241, 196, 15, 0.6)',
        planned: 'rgba(46, 204, 113, 0.6)',
        stopped: 'rgba(231, 76, 60, 0.6)'
    },
    
    STATUS_BORDERS: {
        ready: '#3498db',
        building: '#f39c12',
        planned: '#2ecc71',
        stopped: '#e74c3c'
    },
    
    // Налаштування карти
    MAP_CENTER: [50.4501, 30.5234], // Київ
    MAP_ZOOM: 13,
    
    // LocalStorage ключі
    STORAGE_KEY: 'novobud_complexes',
    LAST_SYNC_KEY: 'novobud_last_sync'
};