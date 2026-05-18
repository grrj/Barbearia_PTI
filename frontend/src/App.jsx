import React, { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  // Estados dos Formulários atualizados com todos os campos necessários
  const [formData, setFormData] = useState({ 
    nome: '', 
    cpf: '', 
    email: '', 
    cidade: '', 
    estado: '', 
    tipo: 'cliente', 
    skills_cabelo: false, 
    skills_barba: false 
  })
  
  const [slotData, setSlotData] = useState({ 
    barbeiro_id: '', 
    tipo_servico: 'Corte de Cabelo Degradê', 
    data_hora: '', 
    valor: 45.0,
    status: true // Adicionado para bater exatamente com o ServiceSlotBase
  })
  
  // Filtros
  const [filtroCidade, setFiltroCidade] = useState('')
  const [filtroServico, setFiltroServico] = useState('')
  const [agendamentos, setAgendamentos] = useState([])

  const buscarAgendamentos = async () => {
    try {
      const params = {}
      if (filtroCidade) params.cidade = filtroCidade
      if (filtroServico) params.tipo_servico = filtroServico

      const response = await axios.get('http://localhost:8000/agendamentos/', { params })
      setAgendamentos(response.data)
    } catch (error) {
      console.error("Erro ao buscar agendamentos", error)
    }
  }

  useEffect(() => {
    buscarAgendamentos()
  }, [filtroCidade, filtroServico])

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { 
        ...formData, 
        cpf: Number(formData.cpf)
      }
      const res = await axios.post('http://localhost:8000/users/', payload)
      alert(`Usuário cadastrado com sucesso! Guarde o seu ID: ${res.data.id}`)
    } catch (error) {
      console.error(error)
      // Captura o erro detalhado do FastAPI/Pydantic
      const msgErro = error.response?.data?.detail;
      alert("Erro ao cadastrar usuário: " + (typeof msgErro === 'object' ? JSON.stringify(msgErro) : msgErro || "Erro de conexão"));
    }
  }

  const handleSlotSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        barbeiro_id: Number(slotData.barbeiro_id),
        valor: Number(slotData.valor),
        tipo_servico: slotData.tipo_servico,
        status: true,
        // Converte para ISO 8601 exigido pelo datetime do Pydantic
        data_hora: new Date(slotData.data_hora).toISOString()
      }
      await axios.post('http://localhost:8000/agendamentos/', payload)
      alert("Horário de agendamento criado no banco de dados!")
      buscarAgendamentos()
    } catch (error) {
      console.error(error)
      const msgErro = error.response?.data?.detail;
      // Se for um erro de validação do Pydantic (array de erros), isola a mensagem
      const formatado = Array.isArray(msgErro) ? msgErro.map(e => `${e.loc}: ${e.msg}`).join(', ') : msgErro;
      alert("Erro ao criar horário: " + (typeof formatado === 'object' ? JSON.stringify(formatado) : formatado || "Verifique se o ID do Barbeiro existe"));
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      
      {/* FILTROS */}
      <div style={{ background: '#007bff', padding: '20px', borderRadius: '8px', marginBottom: '30px', color: 'white' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🔍 Mecanismo de Filtros (Consulta Real)</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input 
            placeholder="Filtrar por Cidade..." 
            value={filtroCidade}
            onChange={e => setFiltroCidade(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: 'none', flex: 1 }}
          />
          <select 
            value={filtroServico} 
            onChange={e => setFiltroServico(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: 'none', flex: 1 }}
          >
            <option value="">Todos os Serviços</option>
            <option value="Corte de Cabelo Degradê">Corte de Cabelo Degradê</option>
            <option value="Barba Terapia">Barba Terapia</option>
            <option value="Combo Cabelo + Barba">Combo Cabelo + Barba</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
        
        {/* CADASTROS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '320px' }}>
          
          {/* USER FORM */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ marginTop: 0 }}>👤 Cadastro (Com E-mail)</h4>
            <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="Nome" onChange={e => setFormData({...formData, nome: e.target.value})} required style={{ padding: '8px' }} />
              <input placeholder="CPF (apenas números)" onChange={e => setFormData({...formData, cpf: e.target.value})} required style={{ padding: '8px' }} />
              <input placeholder="E-mail" type="email" onChange={e => setFormData({...formData, email: e.target.value})} required style={{ padding: '8px' }} />
              <input placeholder="Cidade" onChange={e => setFormData({...formData, cidade: e.target.value})} required style={{ padding: '8px' }} />
              <input placeholder="Estado (Ex: SP)" maxLength="2" onChange={e => setFormData({...formData, estado: e.target.value})} required style={{ padding: '8px' }} />
              <select onChange={e => setFormData({...formData, tipo: e.target.value})} style={{ padding: '8px' }}>
                <option value="cliente">Cliente</option>
                <option value="barbeiro">Barbeiro</option>
              </select>
              <button type="submit" style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }}>Salvar Usuário</button>
            </form>
          </div>

          {/* AGENDA SLOT FORM */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ marginTop: 0 }}>📅 Publicar Horário</h4>
            <form onSubmit={handleSlotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="ID do Barbeiro Cadastrado" onChange={e => setSlotData({...slotData, barbeiro_id: e.target.value})} required style={{ padding: '8px' }} />
              <input type="datetime-local" onChange={e => setSlotData({...slotData, data_hora: e.target.value})} required style={{ padding: '8px' }} />
              <select onChange={e => setSlotData({...slotData, tipo_servico: e.target.value})} style={{ padding: '8px' }}>
                <option value="Corte de Cabelo Degradê">Corte de Cabelo Degradê (R$ 45,00)</option>
                <option value="Barba Terapia">Barba Terapia (R$ 35,00)</option>
                <option value="Combo Cabelo + Barba">Combo Cabelo + Barba (R$ 75,00)</option>
              </select>
              <button type="submit" style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }}>Criar Card de Horário</button>
            </form>
          </div>

        </div>

        {/* CONSULTA CARDS */}
        <div style={{ flex: '1', maxWidth: '650px' }}>
          <h3>🗓️ Cards Disponíveis no Banco</h3>
          
          {agendamentos.length === 0 ? (
            <p style={{ color: '#777', fontStyle: 'italic' }}>Nenhum horário correspondente encontrado no SQLite.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {agendamentos.map((card) => (
                <div key={card.id} style={{ background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #28a745', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{card.tipo_servico}</h4>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Profissional:</strong> {card.profissional}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Cidade:</strong> {card.cidade}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Data:</strong> {card.data_hora ? new Date(card.data_hora).toLocaleString('pt-BR') : "Data inválida"}</p>
                  <div style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '16px' }}>
                    R$ {card.valor ? Number(card.valor).toFixed(2) : "0.00"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default App