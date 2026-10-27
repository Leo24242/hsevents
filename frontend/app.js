const API_URL = "http://127.0.0.1:8000";

async function loadEvents() {
    const eventsList = document.getElementById("events-list");
    
    try {
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();
        
        eventsList.innerHTML = ""; // Убираем текст "Загрузка..."
        
        if (events.length === 0) {
            eventsList.innerHTML = "<p>Мероприятий пока нет.</p>";
            return;
        }

        events.forEach(event => {
            const card = document.createElement("div");
            // Добавляем стили прямо в JS для красоты карточки
            card.style = "border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px; background: white;";
            card.innerHTML = `
                <h3 style="color: #1a428a; margin-bottom: 10px;">${event.title}</h3>
                <p style="margin-bottom: 10px;">Вместимость: <b>${event.capacity} чел.</b></p>
                <button style="padding: 8px 15px; background: #1a428a; color: white; border: none; border-radius: 5px; cursor: pointer;" 
                        onclick="alert('Логика авторизации и записи будет на следующем шаге!')">
                    Записаться
                </button>
            `;
            eventsList.appendChild(card);
        });
    } catch (error) {
        eventsList.innerHTML = "<p style='color: red;'>Ошибка соединения с сервером. Проверь, запущен ли uvicorn.</p>";
    }
}

// Запуск функции при загрузке страницы
loadEvents();