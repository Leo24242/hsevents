from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

# Создаем файл базы данных hsevents.db в текущей папке
SQLALCHEMY_DATABASE_URL = "sqlite:///./hsevents.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Таблица пользователей
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="student")

# Таблица мероприятий
class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    capacity = Column(Integer)

# Команда для создания таблиц при запуске
Base.metadata.create_all(bind=engine)