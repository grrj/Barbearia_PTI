import React, { useState } from 'react'
import axios from 'axios';

function App() {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cidade: '',
    estado: '',
    tipo: 'cliente', // Valor Padrão
  })

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        //CPF precisa ser enviado como int
        //Por isso o uso de Number()
        const payload = { ...formData, cpf: Number(formData.cpf)}

        const response = await axios.post('http://localhost:8000/users', payload)
        alert(`Usuario ${response.data.nome} creado com sucesso! ID: ${response.data.id}`)
    } catch (error) {
        console.error(error)
        alert("Erro ao cadastrar:" + (error.response?.data?.detail || "Erro no servidor"))
    }
  }

    return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Cadastro Barbearia PTI</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        <input placeholder="Nome" onChange={e => setFormData({...formData, nome: e.target.value})} required />
        <input placeholder="CPF (apenas números)" onChange={e => setFormData({...formData, cpf: e.target.value})} required />
        <input placeholder="Cidade" onChange={e => setFormData({...formData, cidade: e.target.value})} required />
        <input placeholder="Estado (Ex: SP)" onChange={e => setFormData({...formData, estado: e.target.value})} required />
        
        <select onChange={e => setFormData({...formData, tipo: e.target.value})}>
          <option value="cliente">Cliente</option>
          <option value="barbeiro">Barbeiro</option>
        </select>

        <button type="submit" style={{ cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', padding: '10px' }}>
          Cadastrar
        </button>
      </form>
    </div>
  )
}

export default App