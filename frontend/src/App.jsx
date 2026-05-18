import React, { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  // Estado para o formulário de cadastro
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cidade: '',
    estado: '',
    tipo: 'cliente',
    skills_cabelo: false,
    skills_barba: false
  })

  // Estado para armazenar os cards de agendamento que vêm do banco
  const [agendamentos, setAgendamentos] = useState([])

  // Função para buscar os agendamentos do backend
  const buscarAgendamentos = async () => {
    try {
      // Nota: Certifique-se de ter essa rota correspondente no seu FastAPI (ex: @app.get("/agendamentos/"))
      // Se ainda não tiver criado, criaremos a seguir. Para testes, criamos um fallback estático abaixo se falhar.
      const response = await axios.get('http://localhost:8000/agendamentos/')
      setAgendamentos(response.data)
    } catch (error) {
      console.log("Rota de agendamentos do backend não encontrada. Usando dados simulados para o PTI.")
      // Simulando cards de agendamento caso a rota de listagem ainda não esteja pronta no Python
      setAgendamentos([
        { id: 1, profissional: "Carlos Silva", servico: "Corte de Cabelo Degradê", data: "18/05/2026 - 14:00", preco: 45.00, duracao: "30 min", status: "Disponível" },
        { id: 2, profissional: "Carlos Silva", servico: "Barba Terapia", data: "18/05/2026 - 15:00", preco: 35.00, duracao: "25 min", status: "Disponível" },
        { id: 3, profissional: "Mateus Lima", servico: "Combo Cabelo + Barba", data: "19/05/2026 - 10:00", preco: 75.00, duracao: "60 min", status: "Agendado" }
      ])
    }
  }

  // Executa a busca assim que a página carrega
  useEffect(() => {
    buscarAgendamentos()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const payload = { 
          ...formData, 
          cpf: Number(formData.cpf),
          skills_cabelo: formData.tipo === 'barbeiro' ? formData.skills_cabelo : false,
          skills_barba: formData.tipo === 'barbeiro' ? formData.skills_barba : false
        }

        const response = await axios.post('http://localhost:8000/users/', payload)
        alert(`Usuário ${response.data.nome} criado com sucesso! ID: ${response.data.id}`)
        buscarAgendamentos() // Atualiza a tela se necessário
    } catch (error) {
        console.error(error)
        alert("Erro ao cadastrar: " + (error.response?.data?.detail || "Erro no servidor/conexão"))
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#333' }}>Sistema de Barbearia - Portal PTI</h1>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
        
        {/* COLUNA DO FORMULÁRIO */}
        <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '320px', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, color: '#007bff' }}>Novo Cadastro</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input placeholder="Nome" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setFormData({...formData, nome: e.target.value})} required />
            <input placeholder="CPF (apenas números)" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setFormData({...formData, cpf: e.target.value})} required />
            <input placeholder="Cidade" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setFormData({...formData, cidade: e.target.value})} required />
            <input placeholder="Estado (Ex: SP)" maxLength="2" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setFormData({...formData, estado: e.target.value})} required />
            
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Tipo de conta:</label>
            <select style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setFormData({...formData, tipo: e.target.value})}>
              <option value="cliente">Cliente</option>
              <option value="barbeiro">Barbeiro</option>
            </select>

            {formData.tipo === 'barbeiro' && (
              <div style={{ border: '1px dashed #007bff', padding: '10px', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Especialidades:</p>
                <label style={{ marginRight: '10px', fontSize: '13px' }}>
                  <input type="checkbox" onChange={e => setFormData({...formData, skills_cabelo: e.target.checked})} /> Cabelo
                </label>
                <label style={{ fontSize: '13px' }}>
                  <input type="checkbox" onChange={e => setFormData({...formData, skills_barba: e.target.checked})} /> Barba
                </label>
              </div>
            )}

            <button type="submit" style={{ cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', marginTop: '10px' }}>
              Cadastrar Usuário
            </button>
          </form>
        </div>

        {/* COLUNA DOS CARDS DE AGENDAMENTO */}
        <div style={{ flex: '1', maxWidth: '600px' }}>
          <h3 style={{ color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Horários & Agendamentos Disponíveis</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            {agendamentos.map((card) => (
              <div key={card.id} style={{ 
                background: '#fff', 
                padding: '20px', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
                borderLeft: card.status === 'Disponível' ? '5px solid #28a745' : '5px solid #dc3545'
              }}>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  float: 'right',
                  backgroundColor: card.status === 'Disponível' ? '#e2f5ea' : '#fce8e6',
                  color: card.status === 'Disponível' ? '#28a745' : '#dc3545'
                }}>
                  {card.status}
                </span>
                
                <h4 style={{ margin: '0 0 10px 0', color: '#222' }}>{card.servico}</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}><strong>Barbeiro:</strong> {card.profissional}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}><strong>Data/Hora:</strong> {card.data}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}><strong>Duração:</strong> {card.duracao}</p>
                
                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>R$ {card.preco.toFixed(2)}</span>
                  {card.status === 'Disponível' && (
                    <button style={{ marginLeft: 'auto', background: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }} onClick={() => alert(`Solicitando agendamento para o serviço: ${card.servico}`)}>
                      Reservar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default App