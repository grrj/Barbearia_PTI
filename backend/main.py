from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas
from database import SessionLocal, engine,get_db

app = FastAPI(title="Barbearia API")

#Configuração de CORS: Essecial para que o React possa se comunicar com o FastAPI 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], #Porta Padrão do Vite/React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Rota de Cad. Único de Usuário
@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    #Verificar se o CPF já existe
    db_user =  db.query(models.User).filter(models.User.cpf == user.cpf).first()
    if db_user:
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    #Transforma Pydantic em modelo SQLAlchemy
    new_user = models.User(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/sevice_slots/", response_model=schemas.ServiceSlotResponse)
def create_service_slot(slot: schemas.ServiceSlotCreate, db: Session = Depends(get_db)):
    #Verificar se o barbeiro existe e é do tipo correto
    barbeiro = db.query(models.User).filter(models.User.id == slot.barbeiro_id).first() 
    if not barbeiro or barbeiro.tipo != "barbeiro":
        raise HTTPException(status_code=400, detail="Barbeiro não encontrado ou usuario não é barbeiro  ")
    
    #Cria o slot de serviço
    new_slot = models.ServiceSlot(**slot.model_dump())
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot

#Rota Verficação Servidor Online
@app.get("/")
def read_root():
    return {"message": "Servidor Online"}
