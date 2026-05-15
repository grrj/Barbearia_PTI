from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship, declarative_base
from database import Base

Base  =  declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True,index=True)
    nome =  Column(String)
    cpf = Column(Integer, unique=True)
    cidade =  Column(String)
    estado =  Column(String)
    tipo =  Column(String) # cliente ou barbeiro
    skills_cabelo = Column(Boolean, default=False)
    skills_barba = Column(Boolean, default=False)

class ServiceSlot(Base):
    __tablename__ = 'service_slots'
    
    id =  Column(Integer, primary_key = True, index = True)
    barbeiro_id =  Column(Integer, ForeignKey("users.id"))
    cliente_id = Column(Integer, ForeignKey("users.id"), nullable=True) #Flexível
    data_hora = Column(DateTime)
    valor = Column(Float)
    tipo_servico = Column(String) # cabelo ou barba
    status =  Column(Boolean, default=True) # True = Disponível

    barbeiro = relationship("User", foreign_keys=[barbeiro_id])
    cliente = relationship("User", foreign_keys=[cliente_id])
