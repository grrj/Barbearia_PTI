from fastapi import FastAPI, Depends, HTTPException, Body, APIRouter
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from typing import Optional


router = APIRouter()

# IMPORTAÇÃO DOS SEUS SCHEMAS REAIS
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

# ========================================================
# --- MODELOS DO BANCO DE DADOS (SQLAlchemy) CORRIGIDO ---
# ========================================================

class UserTable(Base):
    __tablename__ = "users"
    # Esta linha agora protege a única declaração contra o reload do Uvicorn:
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cpf = Column(String, unique=True, nullable=False) # Mantido String para bater com os schemas
    email = Column(String, unique=True, nullable=False)
    cidade = Column(String, nullable=False)
    estado = Column(String, nullable=False)
    tipo = Column(String, nullable=False)              # 'cliente' ou 'barbeiro'
    skills_cabelo = Column(Boolean, default=False)
    skills_barba = Column(Boolean, default=False)

# A SEGUNDA DECLARAÇÃO DUPLICADA DA USERTABLE QUE ESTAVA AQUI FOI REMOVIDA!

class ServiceSlotTable(Base):
    __tablename__ = "service_slots"
    __table_args__ = {'extend_existing': True} # Adicionado aqui também por segurança para evitar futuros erros nesta tabela
    
    id = Column(Integer, primary_key=True, index=True)
    data_hora = Column(DateTime, nullable=False)
    valor = Column(Float, nullable=False)
    tipo_servico = Column(String, nullable=False)
    status = Column(String, default="Disponível")  
    barbeiro_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    cidade = Column(String, nullable=False)

class AtualizarStatusRequest(BaseModel):
    cliente_id: Optional[int] = None
    status: str

class LogicRequest(BaseModel):
    email: str

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
        
    data_local = slot.data_hora.replace(tzinfo=None)

    new_slot = ServiceSlotTable(
        data_hora=data_local,
        valor=slot.valor,
        tipo_servico=slot.tipo_servico,
        status="Disponível",  
        barbeiro_id=slot.barbeiro_id,
        cidade=barbeiro.cidade  
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot

@app.get("/agendamentos/")
def get_slots(cidade: Optional[str] = None, tipo_servico: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ServiceSlotTable, UserTable.nome.label("barbeiro_nome"))\
        .join(UserTable, ServiceSlotTable.barbeiro_id == UserTable.id)\
        .filter(ServiceSlotTable.status == "Disponível")
    
    if cidade:
        query = query.filter(ServiceSlotTable.cidade.contains(cidade))
    if tipo_servico:
        query = query.filter(ServiceSlotTable.tipo_servico == tipo_servico)
        
    results = query.all()
    
    lista_formatada = []
    for slot, barbeiro_nome in results:
        data_iso = slot.data_hora.strftime("%Y-%m-%dT%H:%M")
        lista_formatada.append({
            "id": slot.id,
            "data_hora": data_iso,
            "valor": slot.valor,
            "tipo_servico": slot.tipo_servico,
            "status": slot.status,
            "profissional": barbeiro_nome,
            "cidade": slot.cidade
        })
    return lista_formatada

@app.post("/auth/login")
def login(data: LogicRequest, db: Session = Depends(get_db)):
    usuario = db.query(UserTable).filter(UserTable.email == data.email).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="E-mail não encontrado. Cadastre-se primeiro!")
    
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "tipo": usuario.tipo,  
        "cidade": usuario.cidade
    }

@app.post("/agendamentos/{slot_id}/reservar")
def reservar_slot(slot_id: int, cliente_id: int = Body(..., embed=True), db: Session = Depends(get_db)):
    slot = db.query(ServiceSlotTable).filter(ServiceSlotTable.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Horário não encontrado")
    if slot.status != "Disponível":
        raise HTTPException(status_code=400, detail="Este horário não está mais disponível para reserva")
        
    cliente = db.query(UserTable).filter(UserTable.id == cliente_id, UserTable.tipo == "cliente").first()
    if not cliente:
        raise HTTPException(status_code=404, detail="ID de cliente inválido")
        
    slot.status = "Agendado"  
    slot.cliente_id = cliente_id
    
    db.commit()
    db.refresh(slot)
    return {"message": "Horário reservado com sucesso!", "slot_id": slot.id}

@app.put("/agendamentos/{slot_id}/cancelar-cliente")
def cancelar_pelo_cliente(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(ServiceSlotTable).filter(ServiceSlotTable.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    if slot.status != "Agendado":
        raise HTTPException(status_code=400, detail="Apenas agendamentos ativos podem ser cancelados")
        
    slot.status = "Cancelado pelo Cliente"
    db.commit()
    return {"message": "Agendamento cancelado pelo cliente com sucesso e mantido no histórico"}

@app.put("/agendamentos/{slot_id}/concluir")
def concluir_atendimento(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(ServiceSlotTable).filter(ServiceSlotTable.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
    if slot.status != "Agendado":
        raise HTTPException(status_code=400, detail="Só é possível concluir atendimentos que estavam marcados como 'Agendado'")
        
    slot.status = "Concluído"
    db.commit()
    return {"message": "Atendimento marcado como concluído com sucesso!"}

@app.put("/agendamentos/{slot_id}/cancelar-barbeiro")
def cancelar_pelo_barbeiro(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(ServiceSlotTable).filter(ServiceSlotTable.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
        
    slot.status = "Cancelado pelo Barbeiro"
    db.commit()
    return {"message": "Atendimento cancelado pelo barbeiro com sucesso"}

@app.get("/agendamentos/cliente/{cliente_id}")
def get_historico_cliente(cliente_id: int, db: Session = Depends(get_db)):
    results = db.query(ServiceSlotTable, UserTable.nome.label("barbeiro_nome"))\
                .join(UserTable, ServiceSlotTable.barbeiro_id == UserTable.id)\
                .filter(ServiceSlotTable.cliente_id == cliente_id).all()
    
    historico = []
    for slot, barbeiro_nome in results:
        data_iso = slot.data_hora.strftime("%d/%m/%Y às %H:%M")
        
        historico.append({
            "id": slot.id,
            "data_hora": data_iso,
            "valor": slot.valor,
            "tipo_servico": slot.tipo_servico,
            "status": slot.status,  
            "profissional": barbeiro_nome
        })
    return historico

@app.get("/agendamentos/barbeiro/{barbeiro_id}")
def get_agenda_barbeiro(barbeiro_id: int, db: Session = Depends(get_db)):
    results = db.query(ServiceSlotTable).filter(ServiceSlotTable.barbeiro_id == barbeiro_id).all()
    
    agenda = []
    for slot in results:
        data_iso = slot.data_hora.strftime("%d/%m/%Y às %H:%M")
        nome_cliente = "Nenhum"
        
        if slot.cliente_id:
            cliente = db.query(UserTable).filter(UserTable.id == slot.cliente_id).first()
            nome_cliente = cliente.nome if cliente else "Cliente Removido"
            
        agenda.append({
            "id": slot.id,
            "data_hora": data_iso,
            "valor": slot.valor,
            "tipo_servico": slot.tipo_servico,
            "status": slot.status, 
            "cliente": nome_cliente
        })
    return agenda

@app.put("/agendamentos/{agendamento_id}/status")
def atualizar_status_agendamento(agendamento_id: int, request: AtualizarStatusRequest, db: Session = Depends(get_db)):
    agendamento = db.query(ServiceSlotTable).filter(ServiceSlotTable.id == agendamento_id).first()
    
    if not agendamento:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
    
    # Se a intenção for reservar (Cliente agendando um horário disponível)
    if request.status == "Agendado":
        if agendamento.status != "Disponível":
            raise HTTPException(status_code=400, detail="Este horário já não está mais disponível.")
        if not request.cliente_id:
            raise HTTPException(status_code=400, detail="cliente_id é obrigatório para realizar um agendamento.")
        
        agendamento.cliente_id = request.cliente_id
        agendamento.status = "Agendado"

    # Se for alteração por parte do Barbeiro (Concluir ou Cancelar) ou cancelamento do cliente
    elif request.status in ["Concluído", "Cancelado", "Disponível"]:
        agendamento.status = request.status
        # Se voltar a ficar Disponível, removemos o vínculo do cliente
        if request.status == "Disponível":
            agendamento.cliente_id = None
            
    else:
        raise HTTPException(status_code=400, detail="Status inválido.")

    db.commit()
    db.refresh(agendamento)
    return {"message": f"Agendamento atualizado para {agendamento.status} com sucesso!", "agendamento": agendamento}