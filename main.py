from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database

# Создаем таблицы базы данных
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="HSEvents API")

# Настройка CORS для связи фронтенда и бэкенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic схемы
class UserCreate(BaseModel):
    email: str

class EventCreate(BaseModel):
    title: str
    capacity: int
    date: str
    building: str

class EnrollRequest(BaseModel):
    email: str
    event_id: int

# Маршруты (Endpoints)
@app.post("/register", summary="Регистрация и вход", tags=["Пользователи"])
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if not user.email.endswith("@edu.hse.ru"):
        raise HTTPException(status_code=400, detail="Доступ только для почты @edu.hse.ru")
        
    existing_user = db.query(database.User).filter(database.User.email == user.email).first()
    if existing_user:
        return {"message": "С возвращением!"}
        
    new_user = database.User(email=user.email)
    db.add(new_user)
    db.commit()
    return {"message": "Успешная регистрация!"}

@app.get("/events", summary="Получить все мероприятия", tags=["Мероприятия"])
def get_events(db: Session = Depends(get_db)):
    return db.query(database.Event).all()

@app.post("/events", summary="Создать мероприятие", tags=["Мероприятия"])
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    new_event = database.Event(title=event.title, capacity=event.capacity, date=event.date, building=event.building)
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@app.post("/enroll", summary="Записаться на мероприятие", tags=["Мероприятия"])
def enroll_in_event(req: EnrollRequest, db: Session = Depends(get_db)):
    user = db.query(database.User).filter(database.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Сначала авторизуйтесь (кнопка 'Войти')")
    
    event = db.query(database.Event).filter(database.Event.id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")
    if event.capacity <= 0:
        raise HTTPException(status_code=400, detail="Свободных мест больше нет")
        
    existing = db.query(database.Enrollment).filter(
        database.Enrollment.user_email == req.email,
        database.Enrollment.event_id == req.event_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Вы уже записаны на это мероприятие")

    new_enrollment = database.Enrollment(user_email=req.email, event_id=req.event_id)
    event.capacity -= 1
    db.add(new_enrollment)
    db.commit()
    
    return {"message": "Вы успешно записаны!"}


class CancelRequest(BaseModel):
    email: str
    event_id: int

@app.get("/my_events", summary="Получить мои записи", tags=["Мероприятия"])
def get_my_events(email: str, db: Session = Depends(get_db)):
    # Ищем все записи пользователя
    enrollments = db.query(database.Enrollment).filter(database.Enrollment.user_email == email).all()
    event_ids = [e.event_id for e in enrollments]
    # Достаем сами мероприятия по ID
    events = db.query(database.Event).filter(database.Event.id.in_(event_ids)).all()
    return events

@app.post("/cancel", summary="Отменить запись", tags=["Мероприятия"])
def cancel_enrollment(req: CancelRequest, db: Session = Depends(get_db)):
    enrollment = db.query(database.Enrollment).filter(
        database.Enrollment.user_email == req.email,
        database.Enrollment.event_id == req.event_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Запись не найдена")
        
    # Возвращаем место обратно
    event = db.query(database.Event).filter(database.Event.id == req.event_id).first()
    if event:
        event.capacity += 1
        
    db.delete(enrollment)
    db.commit()
    return {"message": "Запись успешно отменена"}