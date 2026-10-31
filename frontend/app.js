const API_URL = "https://hsevents-api.onrender.com";
 
let globalEvents = []; 
let displayDate = new Date(); 
let currentFilter = "all"; 
 
async function loadEvents() {
    const eventsList = document.getElementById("events-list");
 
    try {
        const response = await fetch(`${API_URL}/events`);
        globalEvents = await response.json();
        
        renderEventsList();
        renderCalendar();
    } catch (error) {
        if (eventsList) {
            eventsList.innerHTML = "<p style='color: var(--lyceum-red);'>Ошибка соединения с сервером. Проверь, запущен ли uvicorn.</p>";
        }
    }
}
 
function renderEventsList() {
    const eventsList = document.getElementById("events-list");
    if (!eventsList) return;
    eventsList.innerHTML = ""; 
 
    let filteredEvents = globalEvents;
    if (currentFilter !== "all") {
        filteredEvents = globalEvents.filter(e => e.building === currentFilter);
    }
 
    if (filteredEvents.length === 0) {
        eventsList.innerHTML = "<p style='color: #8e8e93;'>В этом здании мероприятий пока нет.</p>";
        return;
    }
 
    // Проверяем, админ ли вошел
    const savedEmail = localStorage.getItem("userEmail");
    const isAdmin = savedEmail === "admin@edu.hse.ru";

    filteredEvents.forEach(event => {
        // Кнопка удаления рендерится только для админа
        let deleteBtnHtml = "";
        if (isAdmin) {
            deleteBtnHtml = `
                <button class="btn-danger" style="margin-top: 8px; background: #ff4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;" onclick="deleteEvent(${event.id})">
                    🗑️ Удалить мероприятие
                </button>
            `;
        }

        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
            <h3 class="event-title">${event.title}</h3>
            <div class="badges">
                <span class="badge">👥 ${event.capacity} мест</span>
                <span class="badge">📅 ${event.date}</span>
                <span class="badge">📍 ${event.building || "Не указано"}</span>
            </div>
            <button class="btn-primary" onclick="enrollInEvent(${event.id})">
                Записаться
            </button>
            ${deleteBtnHtml}
        `;
        eventsList.appendChild(card);
    });
}

// Функция удаления мероприятия (для админа)
async function deleteEvent(eventId) {
    if (!confirm("Вы уверены, что хотите удалить это мероприятие?")) return;

    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: "DELETE"
        });

        if (response.ok) {
            alert("Мероприятие удалено!");
            loadEvents();
            const savedEmail = localStorage.getItem("userEmail");
            if (savedEmail) {
                loadMyEvents(savedEmail);
            }
        } else {
            const data = await response.json();
            alert("Ошибка при удалении: " + (data.detail || "Неизвестная ошибка"));
        }
    } catch (error) {
        alert("Ошибка соединения с сервером при удалении.");
    }
}
 
// Обработчик кликов по кнопкам фильтра
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        currentFilter = e.target.getAttribute('data-building');
        renderEventsList();
    });
});
 
function renderCalendar() {
    const container = document.getElementById("calendar-container");
    const monthTitle = document.getElementById("calendar-month-title");
    if (!container || !monthTitle) return;
    
    const year = displayDate.getFullYear();
    const monthIndex = displayDate.getMonth();
    const month = String(monthIndex + 1).padStart(2, '0');
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
 
    let firstDay = new Date(year, monthIndex, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
 
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    monthTitle.innerText = `${monthNames[monthIndex]} ${year}`;
 
    const realToday = new Date();
    const todayString = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`;
 
    let html = `<div class="calendar-weekdays">
                    <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
                </div>`;
    html += '<div class="calendar-grid">';
 
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day day-empty"></div>`;
    }
 
    for (let i = 1; i <= daysInMonth; i++) {
        const dayString = `${year}-${month}-${String(i).padStart(2, '0')}`;
        const dayEvents = globalEvents.filter(e => e.date === dayString);
        
        let classes = "calendar-day";
        if (dayString === todayString) classes += " day-today"; 
        
        if (dayEvents.length > 0) {
            classes += " day-event";
            let tooltipHtml = '<div class="event-tooltip">';
            dayEvents.forEach(e => {
                tooltipHtml += `
                    <div class="tooltip-item">
                        <b>${e.title}</b><br>
                        <span style="color: var(--lyceum-yellow);">👥 Мест: ${e.capacity} | 📍 ${e.building || "Не указано"}</span>
                    </div>
                `;
            });
            tooltipHtml += '</div>';
 
            html += `<div class="${classes}">${i}${tooltipHtml}</div>`;
        } else {
            html += `<div class="${classes}">${i}</div>`;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}
 
document.getElementById("prevMonthBtn")?.addEventListener("click", () => {
    displayDate.setMonth(displayDate.getMonth() - 1);
    renderCalendar();
});
 
document.getElementById("nextMonthBtn")?.addEventListener("click", () => {
    displayDate.setMonth(displayDate.getMonth() + 1);
    renderCalendar();
});
 
// Авторизация с сохранением в localStorage
document.getElementById("loginBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = prompt("Введите вашу лицейскую почту (@edu.hse.ru):");
    if (!email) return;
 
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        });
        const data = await response.json();
        
        if (response.ok) {
            alert("Успешно! " + data.message);
            
            // Сохраняем почту в память браузера
            localStorage.setItem("userEmail", email);
            
            applyUserState(email);
            renderEventsList(); // Перерисовываем список, чтобы показать кнопку удаления если это админ
        } else {
            alert("Ошибка: " + data.detail);
        }
    } catch (error) {
        alert("Ошибка соединения с сервером.");
    }
});

// Функция применения состояния пользователя
function applyUserState(email) {
    const loginBtn = document.getElementById("loginBtn");
    const adminSection = document.getElementById("admin-section");
    
    if (loginBtn) loginBtn.innerText = email;
    loadMyEvents(email);

    if (adminSection) {
        if (email === "admin@edu.hse.ru") {
            adminSection.style.display = "block";
        } else {
            adminSection.style.display = "none";
        }
    }
}
 
async function enrollInEvent(eventId) {
    const savedEmail = localStorage.getItem("userEmail");
    
    if (!savedEmail) {
        alert("Пожалуйста, сначала авторизуйтесь через кнопку 'Войти' в шапке сайта.");
        return;
    }
 
    try {
        const response = await fetch(`${API_URL}/enroll`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: savedEmail, event_id: eventId })
        });
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            loadEvents(); 
            loadMyEvents(savedEmail);
        } else {
            alert("Ошибка: " + data.detail);
        }
    } catch (error) {
        alert("Ошибка соединения с сервером.");
    }
}
 
async function loadMyEvents(email) {
    const myEventsSection = document.getElementById("my-events-section");
    const myEventsList = document.getElementById("my-events-list");
    if (!myEventsSection || !myEventsList) return;
    
    myEventsSection.style.display = "block";
    myEventsList.innerHTML = "<p style='color: #8e8e93;'>Загрузка записей...</p>";
 
    try {
        const response = await fetch(`${API_URL}/my_events?email=${encodeURIComponent(email)}`);
        const events = await response.json();
 
        if (events.length === 0) {
            myEventsList.innerHTML = "<p style='color: #8e8e93;'>У вас пока нет предстоящих мероприятий.</p>";
            return;
        }
 
        myEventsList.innerHTML = "";
        events.forEach(event => {
            const card = document.createElement("div");
            card.className = "event-card";
            card.innerHTML = `
                <h3 class="event-title">${event.title}</h3>
                <div class="badges">
                    <span class="badge">📅 ${event.date}</span>
                    <span class="badge">📍 ${event.building || "Не указано"}</span>
                </div>
                <button class="btn-danger" onclick="cancelEvent(${event.id})">
                    Отменить запись
                </button>
            `;
            myEventsList.appendChild(card);
        });
    } catch (error) {
        myEventsList.innerHTML = "<p style='color: var(--lyceum-red);'>Ошибка соединения с сервером.</p>";
    }
}
 
async function cancelEvent(eventId) {
    const email = localStorage.getItem("userEmail");
    if (!email) return;
    if (!confirm("Вы уверены, что хотите отменить запись? Место будет возвращено.")) return;
 
    try {
        const response = await fetch(`${API_URL}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, event_id: eventId })
        });
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            loadEvents();
            loadMyEvents(email);
        } else {
            alert("Ошибка: " + data.detail);
        }
    } catch (error) {
        alert("Ошибка соединения с сервером.");
    }
}
 
async function submitNewEvent() {
    const title = document.getElementById("admin-title").value;
    const capacity = document.getElementById("admin-capacity").value;
    const date = document.getElementById("admin-date").value;
    const building = document.getElementById("admin-building").value;
 
    if (!title || !capacity || !date) {
        alert("Пожалуйста, заполните все поля");
        return;
    }
 
    try {
        const response = await fetch(`${API_URL}/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title,
                capacity: parseInt(capacity),
                date: date,
                building: building
            })
        });
        
        if (response.ok) {
            alert("Мероприятие успешно создано!");
            document.getElementById("admin-title").value = "";
            document.getElementById("admin-capacity").value = "";
            document.getElementById("admin-date").value = "";
            
            loadEvents(); 
        } else {
            const data = await response.json();
            alert("Ошибка: " + data.detail);
        }
    } catch (error) {
        alert("Ошибка соединения с сервером.");
    }
}

// При открытии сайта: восстанавливаем сессию, если уже входили ранее, и грузим события
window.addEventListener("DOMContentLoaded", () => {
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
        applyUserState(savedEmail);
    }
    loadEvents();
});