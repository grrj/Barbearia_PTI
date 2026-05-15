from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

#SQLite cria arquivo barbearia.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./barbearia.db"

# Conexão com o banco de dados
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

#Instancia de classe SessionLocal será uma sessão de banco de dados

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

#Função para obter o banco de dados por FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

