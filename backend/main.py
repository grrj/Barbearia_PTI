from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from typing import Optional

# IMPORTAÇÃO DOS SEUS SCHEMAS REAIS (Sem duplicar no código!)
from schemas import UserCreate, ServiceSlotCreate

# Configuração do Banco de Dados
DATABASE_URL = "sqlite:///./barbearia.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS DO BANCO DE DADOS (SQLAlchemy) ---
class UserTable(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cpf = Column(Integer, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    cidade = Column(String, nullable=False)
    estado = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # 'cliente' ou 'barbeiro'
    skills_cabelo = Column(Boolean, default=False)
    skills_barba = Column(Boolean, default=False)

class ServiceSlotTable(Base):
    __tablename__ = "service_slots"
    id = Column(Integer, primary_key=True, index=True)
    data_hora = Column(DateTime, nullable=False)
    valor = Column(Float, nullable=False)
    tipo_servico = Column(String, nullable=False)
    status = Column(Boolean, default=True)  # True = Disponível, False = Agendado
    barbeiro_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    cidade = Column(String, nullable=False)

Base.metadata.create_all(bind=engine)

# Dependência do Banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ROTAS API ---

@app.post("/users/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(UserTable).filter(UserTable.cpf == user.cpf).first():
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
    if db.query(UserTable).filter(UserTable.email == user.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
        
    # O Pydantic v2 usa .model_dump() no lugar de .dict()
    new_user = UserTable(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/agendamentos/")
def create_slot(slot: ServiceSlotCreate, db: Session = Depends(get_db)):
    barbeiro = db.query(UserTable).filter(UserTable.id == slot.barbeiro_id, UserTable.tipo == "barbeiro").first()
    if not barbeiro:
        raise HTTPException(status_code=404, detail="ID do barbeiro não encontrado")
        
    # Como o seu ServiceSlotCreate não tem o campo 'cidade', buscamos a cidade direto do cadastro do barbeiro
    new_slot = ServiceSlotTable(
        data_hora=slot.data_hora,
        valor=slot.valor,
        tipo_servico=slot.tipo_servico,
        status=slot.status,
        barbeiro_id=slot.barbeiro_id,
        cidade=barbeiro.cidade  # Pega a cidade dinamicamente do barbeiro dono do horário
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot

@app.get("/agendamentos/")
def get_slots(cidade: Optional[str] = None, tipo_servico: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ServiceSlotTable, UserTable.nome.label("barbeiro_nome")).join(UserTable, ServiceSlotTable.barbeiro_id == UserTable.id)
    
    if cidade:
        query = query.filter(ServiceSlotTable.cidade.contains(cidade))
    if tipo_servico:
        query = query.filter(ServiceSlotTable.tipo_servico == tipo_servico)
        
    results = query.all()
    
    lista_formatada = []
    for slot, barbeiro_nome in results:
        lista_formatada.append({
            "id": slot.id,
            "data_hora": slot.data_hora.isoformat(),
            "valor": slot.valor,
            "tipo_servico": slot.tipo_servico,
            "status": "Disponível" if slot.status else "Agendado",
            "profissional": barbeiro_nome,
            "cidade": slot.cidade
        })
    return lista_formatada