from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

#Base para Usuário(Dados Comuns)
class UserBase(BaseModel):
    nome: str
    cpf: int
    email: str
    cidade: str
    estado: str
    tipo: str # cliente ou barbeiro
    skills_cabelo: bool = False
    skills_barba: bool = False

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

#Esquema para os Slots de Agendamento
class ServiceSlotBase(BaseModel):
    data_hora: datetime #Pydantic valida o formato ISO 8601 automaticamente
    valor: float
    tipo_servico: str
    status: bool = True

class ServiceSlotCreate(ServiceSlotBase):
    barbeiro_id: int

class ServiceSlotResponse(ServiceSlotBase):
    id: int
    barbeiro_id: int
    cliente_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)