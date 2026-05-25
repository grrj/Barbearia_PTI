import React, { useState, useEffect } from 'react'
import axios from 'axios'

// URL base do seu backend FastAPI
const API_URL = "http://localhost:8000";

function App() {
  // Estado de Autenticação
  const [usuarioLogado, setUsuarioLogado] = useState(null) 
  const [emailLogin, setEmailLogin] = useState('')
  
  // Estado para alternar entre tela de Login (true) e Cadastro (false)
  const [isLoginView, setIsLoginView] = useState(true)

  // Estados dos Formulários
  const [formData, setFormData] = useState({ nome: '', cpf: '', email: '', cidade: '', estado: '', tipo: 'cliente', skills_cabelo: false, skills_barba: false })
  const [slotData, setSlotData] = useState({ barbeiro_id: '', tipo_servico: 'Corte de Cabelo Degradê', data_hora: '', valor: 45.0 })
  
  // Filtros e Listagens
  const [filtroCidade, setFiltroCidade] = useState('')
  const [filtroServico, setFiltroServico] = useState('')
  const [filtroData, setFiltroData] = useState('') // Estado para armazenar a data escolhida
  const [agendamentos, setAgendamentos] = useState([])

  // Estados para Histórico e Agenda
  const [historicoCliente, setHistoricoCliente] = useState([]);
  const [agendaBarbeiro, setAgendaBarbeiro] = useState([]);

  // --- ESTILOS INLINE COMPLETOS ---
  const styles = {
    loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f6f9', padding: '15px' },
    appContainer: { padding: '15px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' },
    badge: { fontSize: '11px', background: '#333', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', marginTop: '5px' },
    mainGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
    cardForm: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', boxSizing: 'border-box' },
    cardFiltros: { background: '#007bff', padding: '20px', borderRadius: '8px', color: '#fff' },
    filtrosGrid: { display: 'flex', flexDirection: 'row', gap: '10px', flexWrap: 'wrap' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', width: '100%', boxSizing: 'border-box', minWidth: '150px' },
    btnPrimary: { background: '#007bff', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
    btnSecondary: { background: '#28a745', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
    btnSair: { background: '#dc3545', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    cardsGrid: { display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' },
    cardSlot: { background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '5px', boxSizing: 'border-box' },
    statusBadge: { alignSelf: 'flex-start', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
    cardTexto: { margin: '2px 0', fontSize: '14px', color: '#555' },
    cardFooter: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' },
    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    preco: { fontSize: '16px', fontWeight: 'bold', color: '#333' },
    btnReservar: { background: '#28a745', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%', textAlign: 'center' },
    btnCancelar: { background: '#dc3545', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%', textAlign: 'center' },
    btnConcluir: { background: '#28a745', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%', textAlign: 'center' },
    btnReabrir: { background: '#17a2b8', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%', textAlign: 'center' },
    linkAlternar: { color: '#007bff', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' },
    acoesContainer: { display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }
  }

  // Modificar status de agendamento de forma genérica
  const alterarStatusAgendamento = async (agendamentoId, novoStatus, clienteId = null) => {
    try {
      const payload = {
        status: novoStatus,
        cliente_id: clienteId
      };
      
      const response = await axios.put(`${API_URL}/agendamentos/${agendamentoId}/status`, payload);
      alert(response.data.message);
      
      // Atualiza os estados locais imediatamente para reatividade na interface
      buscarAgendamentos();
      carregarDadosPainel();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert(error.response?.data?.detail || "Erro ao atualizar o agendamento.");
    }
  };

  // Carregar dados dinâmicos do painel logado
  const carregarDadosPainel = async () => {
    if (!usuarioLogado) return;
    try {
      if (usuarioLogado.tipo === 'cliente') {
        const res = await axios.get(`${API_URL}/agendamentos/cliente/${usuarioLogado.id}`);
        setHistoricoCliente(res.data);
      } else if (usuarioLogado.tipo === 'barbeiro') {
        const res = await axios.get(`${API_URL}/agendamentos/barbeiro/${usuarioLogado.id}`);
        setAgendaBarbeiro(res.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do painel:", error);
    }
  };

  // Buscar todos os agendamentos na API
  const buscarAgendamentos = async () => {
    try {
      const params = {}
      if (filtroCidade.trim() !== '') params.cidade = filtroCidade
      if (filtroServico.trim() !== '') params.tipo_servico = filtroServico

      const response = await axios.get(`${API_URL}/agendamentos/`, { params })
      setAgendamentos(response.data)
    } catch (error) {
      console.error("Erro ao buscar agendamentos", error)
    }
  }

  useEffect(() => {
    if (!usuarioLogado) return;

    if (usuarioLogado.tipo === 'cliente') {
      buscarAgendamentos();
    }
    carregarDadosPainel();
  }, [usuarioLogado, filtroCidade, filtroServico]);

  // Lógica de Login
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email: emailLogin })
      setUsuarioLogado(res.data)
      if (res.data.tipo === 'cliente') {
        setFiltroCidade(res.data.cidade || '')
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao fazer login.");
    }
  }

  // Lógica de Cadastro
  const handleUserSubmit = async (e) => {
    e.preventDefault()
    try {
      const cpfLimpo = String(formData.cpf).replace(/\D/g, '')
      if (!cpfLimpo) {
        alert("Por favor, insira um CPF válido contendo apenas números.")
        return
      }

      // CORREÇÃO: Enviando o CPF como String pura, exatamente como o banco e o schema esperam
      const payload = { ...formData, cpf: cpfLimpo }
      
      await axios.post(`${API_URL}/users/`, payload)
      alert(`Cadastrado com sucesso!`)
      
      setFormData({ nome: '', cpf: '', email: '', cidade: '', estado: '', tipo: 'cliente', skills_cabelo: false, skills_barba: false })
      setEmailLogin(formData.email) 
      setIsLoginView(true)          
    } catch (error) {
      console.error("Erro detalhado no console:", error.response?.data);

      // Tratamento para evitar que erros complexos virem [object Object]
      if (error.response && error.response.data) {
        const detail = error.response.data.detail;
        
        if (Array.isArray(detail)) {
          // Se for erro de validação do Pydantic, mapeia os campos amigavelmente
          const msgErro = detail.map(err => `${err.loc || 'campo'}: ${err.msg}`).join('\n');
          alert(`Erro de validação:\n${msgErro}`);
        } else if (typeof detail === 'string') {
          // Se for uma mensagem de texto simples enviada por você no backend
          alert("Erro no cadastro: " + detail);
        } else {
          // Fallback seguro convertendo o objeto em texto legível
          alert("Erro no cadastro: " + JSON.stringify(detail));
        }
      } else {
        alert("Erro no cadastro: Não foi possível conectar ao servidor.");
      }
    }
  }

  // Lógica de Criar Horário (Barbeiro)
  const handleSlotSubmit = async (e) => {
  e.preventDefault();
  
  // Proteção: Garante que o usuário está de fato logado antes de tentar ler o ID
  if (!usuarioLogado || !usuarioLogado.id) {
    alert("Erro: Usuário não identificado. Faça login novamente.");
    return;
  }

  try {
    const payload = {
      // 1. Força o ID do barbeiro a ser um número inteiro puro
      barbeiro_id: parseInt(usuarioLogado.id, 10), 
      
      // 2. Mantém a conversão do preço para número decimal/float
      valor: Number(slotData.valor), 
      
      // 3. ADICIONADO: Campo obrigatório de duração (ex: pega do formulário ou define 30 min como padrão)
      duracao: parseInt(slotData.duracao || 30, 10), 
      
      tipo_servico: slotData.tipo_servico,
      data_hora: slotData.data_hora 
      
      // NOTA: Se o seu backend exigir explicitamente o envio do status no schema de criação, 
      // descomente a linha abaixo. Caso contrário, deixe-a comentada:
      // status: "Disponível"
    };

    // Log útil para você conferir no console antes de disparar o clique
    console.log("Enviando o seguinte payload ao backend:", payload);

    await axios.post(`${API_URL}/agendamentos/`, payload);
    
    alert("Horário publicado com sucesso!");
    carregarDadosPainel(); // Atualiza a grade na tela
    
  } catch (error) {
    // ESSA LINHA É CRUCIAL: Ela vai cuspir o motivo exato no console (F12) se ainda houver erro
    console.error("Detalhes do erro de validação do FastAPI:", error.response?.data);
    
    const detalheDoErro = error.response?.data?.detail 
      ? JSON.stringify(error.response.data.detail) 
      : "Verifique os campos preenchidos.";

    alert(`Erro ao criar horário: ${detalheDoErro}`);
  }
};

  // Lógica de Reservar Horário Simplificada (Via Rota antiga ou Via alteração de status)
  const handleReservar = async (slotId) => {
    try {
      await axios.post(`${API_URL}/agendamentos/${slotId}/reservar`, {
        cliente_id: usuarioLogado.id
      })
      alert("Agendamento realizado com sucesso!")
      buscarAgendamentos()
      carregarDadosPainel()
    } catch (error) {
      // Fallback para rota de status caso sua API concentre tudo em PUT /status
      alterarStatusAgendamento(slotId, "Agendado", usuarioLogado.id);
    }
  }

  // --- TELA INICIAL: LOGIN / CADASTRO ---
  if (!usuarioLogado) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.cardForm}>
          <h2>💈 Barbearia Sistema PTI</h2>
          {isLoginView ? (
            <div>
              <p>Faça login para acessar o sistema</p>
              <form onSubmit={handleLogin} style={styles.form}>
                <input type="email" placeholder="Digite seu e-mail..." value={emailLogin || ''} onChange={e => setEmailLogin(e.target.value)} required style={styles.input} />
                <button type="submit" style={styles.btnPrimary}>Entrar no Sistema</button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                Não tem uma conta? <span onClick={() => setIsLoginView(false)} style={styles.linkAlternar}>Cadastre-se aqui</span>
              </p>
            </div>
          ) : (
            <div>
              <h3>📝 Crie sua Conta</h3>
              <form onSubmit={handleUserSubmit} style={styles.form}>
                <input placeholder="Nome Completo" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} required style={styles.input} />
                <input placeholder="CPF (apenas números)" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} required style={styles.input} />
                <input placeholder="E-mail" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} required style={styles.input} />
                <input placeholder="Cidade" value={formData.cidade || ''} onChange={e => setFormData({...formData, cidade: e.target.value})} required style={styles.input} />
                <input placeholder="Estado (Ex: SP)" maxLength="2" value={formData.estado || ''} onChange={e => setFormData({...formData, estado: e.target.value})} required style={styles.input} />
                <select value={formData.tipo || 'cliente'} onChange={e => setFormData({...formData, tipo: e.target.value})} style={styles.input}>
                  <option value="cliente">Quero ser Cliente (Agendar)</option>
                  <option value="barbeiro">Quero ser Profissional (Barbeiro)</option>
                </select>
                <button type="submit" style={styles.btnSecondary}>Finalizar Cadastro</button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                Já possui conta? <span onClick={() => setIsLoginView(true)} style={styles.linkAlternar}>Voltar para o Login</span>
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- TELA PRINCIPAL DO SISTEMA ---
  return (
    <div style={styles.appContainer}>
      
      {/* HEADER COLETIVO */}
      <header style={styles.header}>
        <div>
          <h2>Olá, {usuarioLogado.nome}! 👋</h2>
          <span style={styles.badge}>{usuarioLogado.tipo.toUpperCase()}</span>
        </div>
        <button onClick={() => setUsuarioLogado(null)} style={styles.btnSair}>Sair</button>
      </header>

      <main style={styles.mainGrid}>
        
        {/* ================= PANELS DO PROFISSIONAL (BARBEIRO) ================= */}
        {usuarioLogado.tipo === 'barbeiro' && (
          <>
            {/* FORMULÁRIO DE PUBLICAÇÃO DE HORÁRIO */}
            <div style={styles.cardForm}>
              <h3>📅 Publicar Novo Horário na sua Agenda</h3>
              <form onSubmit={handleSlotSubmit} style={styles.form}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Data e Hora:</label>
                <input type="datetime-local" onChange={e => setSlotData({...slotData, data_hora: e.target.value})} required style={styles.input} />
                
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Preço do Serviço (R$):</label>
                <input type="number" placeholder="Valor" value={slotData.valor} onChange={e => setSlotData({...slotData, valor: e.target.value})} required style={styles.input} />
                
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Serviço:</label>
                <select onChange={e => setSlotData({...slotData, tipo_servico: e.target.value})} style={styles.input}>
                  <option value="Corte de Cabelo Degradê">Corte de Cabelo Degradê</option>
                  <option value="Barba Terapia">Barba Terapia</option>
                  <option value="Combo Cabelo + Barba">Combo Cabelo + Barba</option>
                </select>
                <button type="submit" style={styles.btnPrimary}>Disponibilizar Horário</button>
              </form>
            </div>

            {/* PAINEL DE GERENCIAMENTO DA AGENDA DO BARBEIRO */}
            <div style={{ width: '100%', marginTop: '10px' }}>
              <h3>📆 Minha Agenda Completa (Controle de Status)</h3>
              {agendaBarbeiro.length === 0 ? (
                <p style={{ color: '#777', fontStyle: 'italic' }}>Você ainda não publicou nenhum horário no sistema.</p>
              ) : (
                <div style={styles.cardsGrid}>
                  {agendaBarbeiro.map((slot) => {
                    const isDisponivel = slot.status === 'Disponível' || slot.status === true;
                    const isAgendado = slot.status === 'Agendado' || slot.status === 'Reservado';
                    const isCancelado = slot.status === 'Cancelado';

                    return (
                      <div key={slot.id} style={{ 
                        ...styles.cardSlot, 
                        borderLeft: isDisponivel ? '5px solid #28a745' : isAgendado ? '5px solid #007bff' : '5px solid #dc3545',
                        backgroundColor: '#fff'
                      }}>
                        <span style={{ 
                          ...styles.statusBadge, 
                          backgroundColor: isDisponivel ? '#e2f5ea' : isAgendado ? '#e2ecf5' : '#fbebeb', 
                          color: isDisponivel ? '#28a745' : isAgendado ? '#007bff' : '#dc3545' 
                        }}>
                          {isDisponivel ? "Disponível" : slot.status}
                        </span>
                        
                        <h4 style={{ margin: '10px 0 5px 0', color: '#111' }}>{slot.tipo_servico}</h4>
                        <p style={styles.cardTexto}><strong>Horário:</strong> {slot.data_hora ? slot.data_hora.replace('T', ' ') : ''}</p>
                        <p style={{ ...styles.cardTexto, color: isDisponivel ? '#999' : '#333' }}>
                          <strong>Cliente:</strong> {isDisponivel ? 'Ninguém agendou ainda' : (slot.cliente_nome || slot.cliente || 'Reservado')}
                        </p>
                        
                        <div style={styles.cardFooter}>
                          <div style={styles.footerRow}>
                            <span style={styles.preco}>R$ {slot.valor ? Number(slot.valor).toFixed(2) : "0.00"}</span>
                          </div>
                          
                          {/* Botões Reativos de Ações do Barbeiro movidos para o Card Elegante */}
                          <div style={styles.acoesContainer}>
                            {isAgendado && (
                              <>
                                <button 
                                  style={styles.btnConcluir}
                                  onClick={() => alterarStatusAgendamento(slot.id, "Concluído")}
                                >
                                  ✅ Concluir Serviço
                                </button>
                                <button 
                                  style={styles.btnCancelar}
                                  onClick={() => alterarStatusAgendamento(slot.id, "Cancelado")}
                                >
                                  ❌ Cancelar/Falta
                                </button>
                              </>
                            )}
                            
                            {isCancelado && (
                              <button 
                                style={styles.btnReabrir}
                                onClick={() => alterarStatusAgendamento(slot.id, "Disponível", null)}
                              >
                                🔄 Reabrir e Disponibilizar Horário
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ==================== PANELS EXCLUSIVOS DO CLIENTE ==================== */}
        {usuarioLogado.tipo === 'cliente' && (
          <>
            {/* SEÇÃO FILTROS */}
            <div style={styles.cardFiltros}>
              <h3>🔍 Encontre seu Barbeiro</h3>
              <div style={styles.filtrosGrid}>
                <input placeholder="Buscar por Cidade..." value={filtroCidade} onChange={e => setFiltroCidade(e.target.value)} style={styles.input} />
                
                <select value={filtroServico} onChange={e => setFiltroServico(e.target.value)} style={styles.input}>
                  <option value="">Todos os Serviços</option>
                  <option value="Corte de Cabelo Degradê">Corte de Cabelo Degradê</option>
                  <option value="Barba Terapia">Barba Terapia</option>
                  <option value="Combo Cabelo + Barba">Combo Cabelo + Barba</option>
                </select>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <input 
                    type="date" 
                    value={filtroData} 
                    onChange={e => setFiltroData(e.target.value)} 
                    style={{ ...styles.input, color: '#333' }} 
                  />
                  {filtroData && (
                    <button 
                      onClick={() => setFiltroData('')} 
                      style={{ background: '#ffc107', border: 'none', color: '#333', fontSize: '11px', padding: '2px 5px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Limpar Data ❌
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* GRADE DE CATALOGAÇÃO UNIVERSAL DE HORÁRIOS */}
            <div style={{ width: '100%' }}>
              <h3>🗓️ Grade de Horários Disponíveis</h3>
              {agendamentos.length === 0 ? (
                <p style={{ color: '#777', fontStyle: 'italic' }}>Nenhum horário disponível no sistema.</p>
              ) : (
                <div style={styles.cardsGrid}>
                  {agendamentos
                    .filter((card) => {
                      const matchCidade = !filtroCidade || (card.cidade && card.cidade.toLowerCase().includes(filtroCidade.toLowerCase()));
                      const matchServico = !filtroServico || (card.tipo_servico && card.tipo_servico === filtroServico);
                      const matchData = !filtroData || (card.data_hora && card.data_hora.startsWith(filtroData));
                      
                      // Mostra na grade apenas os verdadeiramente disponíveis para reserva
                      const livre = card.status === "Disponível" || card.status === true;
                      return matchCidade && matchServico && matchData && livre;
                    })
                    .map((card) => {
                      return (
                        <div key={card.id} style={{ ...styles.cardSlot, borderLeft: '5px solid #28a745' }}>
                          <span style={{ ...styles.statusBadge, backgroundColor: '#e2f5ea', color: '#28a745' }}>
                            Disponível
                          </span>
                          <h4 style={{ margin: '10px 0 5px 0' }}>{card.tipo_servico}</h4>
                          <p style={styles.cardTexto}><strong>Barbeiro:</strong> {card.professional || card.barbeiro_nome || 'Profissional'}</p>
                          <p style={styles.cardTexto}><strong>Cidade:</strong> {card.cidade || 'Não informada'}</p>
                          <p style={styles.cardTexto}><strong>Horário:</strong> {card.data_hora ? card.data_hora.replace('T', ' ') : ''}</p>
                          
                          <div style={styles.cardFooter}>
                            <div style={styles.footerRow}>
                              <span style={styles.preco}>R$ {card.valor ? Number(card.valor).toFixed(2) : "0.00"}</span>
                            </div>
                            <button onClick={() => handleReservar(card.id)} style={styles.btnReservar}>Reservar Horário</button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* SEÇÃO: MINHAS RESERVAS (HISTÓRICO ATIVO DO CLIENTE) */}
            <div style={{ width: '100%', marginTop: '10px' }}>
              <h3>📋 Seu Histórico de Agendamentos (Minhas Reservas)</h3>
              {historicoCliente.length === 0 ? (
                <p style={{ color: '#777', fontStyle: 'italic' }}>Você ainda não realizou nenhum agendamento ou reserva.</p>
              ) : (
                <div style={styles.cardsGrid}>
                  {historicoCliente.map((card) => {
                    const ativoCancelavel = card.status === "Agendado" || card.status === "Reservado";
                    return (
                      <div key={card.id} style={{ 
                        ...styles.cardSlot, 
                        borderLeft: card.status === 'Completo' || card.status === 'Concluído' ? '5px solid #28a745' : ativoCancelavel ? '5px solid #007bff' : '5px solid #dc3545' 
                      }}>
                        <span style={{ 
                          ...styles.statusBadge, 
                          backgroundColor: card.status === 'Completo' || card.status === 'Concluído' ? '#e2f5ea' : ativoCancelavel ? '#e2ecf5' : '#fbebeb', 
                          color: card.status === 'Completo' || card.status === 'Concluído' ? '#28a745' : ativoCancelavel ? '#007bff' : '#dc3545' 
                        }}>
                          {card.status}
                        </span>
                        
                        <h4 style={{ margin: '10px 0 5px 0' }}>{card.tipo_servico}</h4>
                        <p style={styles.cardTexto}><strong>Profissional:</strong> {card.profissional || card.barbeiro_nome || 'Barbeiro'}</p>
                        <p style={styles.cardTexto}><strong>Data/Hora:</strong> {card.data_hora ? card.data_hora.replace('T', ' ') : ''}</p>
                        
                        <div style={styles.cardFooter}>
                          <div style={styles.footerRow}>
                            <span style={styles.preco}>R$ {card.valor ? Number(card.valor).toFixed(2) : "0.00"}</span>
                          </div>
                          
                          {/* Ação de Cancelamento pelo próprio cliente movida para o Card Elegante */}
                          {ativoCancelavel && (
                            <button 
                              style={styles.btnCancelar}
                              onClick={() => alterarStatusAgendamento(card.id, "Disponível", null)}
                            >
                              ❌ Cancelar Meu Agendamento
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  )
}

export default App