from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database

app = FastAPI(title="HSEvents API")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Функция для подключения к БД при каждом запросе
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Схема данных, которые мы ждем от пользователя
class UserCreate(BaseModel):
    email: str

@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Валидация почты лицея
    if not user.email.endswith("@edu.hse.ru"):
        raise HTTPException(status_code=400, detail="Доступ только для почты @edu.hse.ru")
    
    # Проверка, нет ли уже такого пользователя
    db_user = db.query(database.User).filter(database.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь уже зарегистрирован")
        
    # Запись в базу данных
    new_user = database.User(email=user.email)
    db.add(new_user)
    db.commit()
    return {"message": "Успешная регистрация", "user_email": new_user.email}

@app.get("/events")
def get_events(db: Session = Depends(get_db)):
    return db.query(database.Event).all()
class EventCreate(BaseModel):
    title: str
    capacity: int

@app.post("/events", summary="Создать мероприятие", tags=["Мероприятия"])
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    new_event = database.Event(title=event.title, capacity=event.capacity)
    db.add(new_event)
    db.commit()
    return {"message": "Мероприятие создано", "title": new_event.title}