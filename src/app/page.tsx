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
    <div className="min-h-screen selection:bg-primary/20 bg-background overflow-x-hidden">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-[#0d0118]/80 backdrop-blur-2xl border-b border-white/10 px-6 py-6 md:px-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 group">
            <div className="w-14 h-14 rounded-[22px] glass glow-primary flex items-center justify-center font-display text-primary text-2xl font-bold border border-primary/20 rotate-3 group-hover:rotate-0 transition-transform cursor-pointer shadow-2xl">
              nu
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-2xl tracking-tight leading-none text-white italic">NuPay</h1>
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-primary-light mt-2 italic">{userName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex glass-deep p-1.5 rounded-[24px] border border-white/10 mr-4 hidden md:flex">
              <button
                onClick={() => setActiveTab('pendentes')}
                className={cn(
                  "px-8 py-3 rounded-[20px] text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                  activeTab === 'pendentes' ? "bg-primary text-white shadow-glow-primary" : "text-zinc-500 hover:text-white"
                )}
              >
                Fichas ({leads.length})
              </button>
              <button
                onClick={() => setActiveTab('finalizadas')}
                className={cn(
                  "px-8 py-3 rounded-[20px] text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                  activeTab === 'finalizadas' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
                )}
              >
                Histórico
              </button>
            </div>

            <button
              onClick={() => fetchLeads()}
              className="w-12 h-12 rounded-[20px] glass-deep flex items-center justify-center hover:bg-primary/20 active:scale-90 transition-all border border-white/5 group"
            >
              <RefreshCcw className={cn("w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors", loading && "animate-spin text-primary")} />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('nupay_ligador_user')
                localStorage.removeItem('nupay_ligador_id')
                router.push('/login')
              }}
              className="w-12 h-12 rounded-[20px] glass-deep flex items-center justify-center hover:bg-destructive/20 active:scale-90 transition-all border border-white/5 group"
            >
              <LogOut className="w-5 h-5 text-zinc-400 group-hover:text-destructive transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== SEARCH BAR ===== */}
      <div className="px-6 py-10 md:px-12">
        <div className="max-w-6xl mx-auto relative group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-6 rounded-[32px] glass-deep border border-white/10 outline-none transition-all text-[11px] font-mono font-bold uppercase tracking-widest placeholder:text-zinc-800 focus:border-primary/40 shadow-2xl"
          />
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <main className="flex-1 px-6 pb-32 md:px-12">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-8">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-primary glow-primary rounded-full" />
                <div className="absolute inset-0 blur-3xl rounded-full bg-primary/20 animate-pulse" />
              </div>
              <p className="text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-[0.5em] animate-pulse italic">Sincronizando Sistema de Fichas...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-10 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-32 h-32 rounded-[48px] glass-deep flex items-center justify-center border border-white/5 shadow-2xl">
                <PhoneCall className="w-12 h-12 text-zinc-800" />
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-4xl font-display uppercase tracking-tight text-white italic">Fila Vazia</h3>
                <p className="text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-widest leading-relaxed italic">Nenhuma ficha pendente no terminal operacional.</p>
              </div>
              <button
                onClick={() => fetchLeads()}
                className="px-12 py-6 rounded-[32px] bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all shadow-glow-sm"
              >
                Atualizar Terminal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLeads.map((lead, idx) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={cn(
                    "glass-card p-10 flex flex-col items-center text-center gap-8 cursor-pointer group relative overflow-hidden rounded-[56px] border-white/5 hover:border-primary/30 transition-all hover:translate-y-[-8px] shadow-2xl",
                    `stagger-${(idx % 5) + 1} animate-in fade-in slide-in-from-bottom-8`
                  )}
                >
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-colors" />
                  
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-[36px] glass glow-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform member-badge border-primary/20">
                    <UserCircle2 className="w-12 h-12 text-primary-light" />
                  </div>

                  {/* Info */}
                  <div className="w-full space-y-3 relative z-10">
                    <h4 className="font-display text-2xl tracking-tight text-white group-hover:text-primary transition-colors uppercase italic leading-none">
                      {lead.full_name?.split(' ')[0] || 'Cliente'}
                    </h4>
                    <p className="text-[10px] text-zinc-600 font-mono font-bold tracking-[0.3em] uppercase italic">
                      CPF {lead.cpf?.slice(0, 3)}..{lead.cpf?.slice(-2)}
                    </p>
                    
                    <div className="pt-8 border-t border-white/5 mt-6">
                      <p className="text-3xl font-display italic text-emerald-400 leading-none glow-emerald-sm">
                        {lead.income ? Number(lead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '---'}
                      </p>
                      <p className="text-[9px] font-mono font-bold text-zinc-700 uppercase tracking-[0.4em] mt-3 italic">Renda Estimada</p>
                    </div>

                    {lead.num_gov && (
                      <div className="mt-6">
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-6 py-2.5 rounded-full font-mono font-bold border border-emerald-500/20 uppercase tracking-[0.2em] italic glow-emerald shadow-lg">GOV VINCULADO</span>
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
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-[40px] overflow-y-auto overscroll-contain animate-in fade-in duration-500">
          <div className="min-h-full flex flex-col p-6 md:p-12 animate-in zoom-in-95 duration-500">
            <div className="max-w-4xl mx-auto w-full glass-deep rounded-[64px] overflow-hidden border border-white/10 shadow-[0_0_120px_rgba(130,10,209,0.15)] relative">
              {/* Modal Header */}
              <div className="relative px-10 pt-16 pb-20 border-b border-white/5 bg-white/[0.01]">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="absolute top-10 right-10 w-14 h-14 rounded-[24px] glass-deep hover:bg-destructive/20 hover:text-destructive transition-all flex items-center justify-center z-20 border border-white/10 group"
                >
                  <X className="w-7 h-7 text-zinc-500 group-hover:scale-110 transition-transform" />
                </button>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-[44px] glass glow-primary flex items-center justify-center shadow-3xl mb-10 border border-primary/30">
                    <UserCircle2 className="w-16 h-16 text-primary-light" />
                  </div>
                  <h3 className="text-5xl font-display uppercase tracking-tighter leading-none text-white italic max-w-2xl px-4">
                    {selectedLead.full_name || 'Registro Ativo'}
                  </h3>
                  <div className="flex items-center gap-6 mt-6">
                    <p className="text-[12px] font-mono font-bold text-zinc-500 uppercase tracking-widest">IDENTIFICAÇÃO: <span className="text-primary-light">{selectedLead.cpf}</span></p>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                    <p className="text-[12px] font-mono font-bold text-zinc-500 uppercase tracking-widest">IDADE: <span className="text-white">{selectedLead.age || '??'} ANOS</span></p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-10 md:p-16 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Score e Renda */}
                  <div className="glass-card p-12 space-y-10 border border-primary/10 rounded-[48px] shadow-2xl">
                    <div className="flex justify-between items-end">
                      <div className="space-y-3">
                        <p className="text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-[0.3em] italic">Score Crédito</p>
                        <p className="text-6xl font-display italic text-primary-light glow-primary-sm leading-none">{selectedLead.score || '--'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-[0.3em] mb-3 italic">Origem</p>
                        <p className="text-3xl font-display text-white italic uppercase tracking-widest leading-none">{selectedLead.state || 'UF'}</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary shadow-glow-primary" style={{ width: `${(Number(selectedLead.score || 0) / 1000) * 100}%` }} />
                    </div>
                  </div>

                  {/* Número Gov */}
                  <div className="glass-card p-12 border border-emerald-500/10 bg-emerald-500/[0.03] relative overflow-hidden group rounded-[48px] shadow-2xl">
                    <Smartphone className="absolute -right-10 -bottom-10 w-44 h-44 text-emerald-500/5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="relative z-10 space-y-6">
                      <p className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-emerald-500 italic">Telefone Vinculado GOV</p>
                      <p className="text-5xl font-display text-white tracking-tighter leading-none glow-emerald-sm">
                        {selectedLead.num_gov || 'NÃO LOCALIZADO'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Script Section */}
                <div className="glass-card p-12 border border-white/5 space-y-10 rounded-[48px] shadow-3xl bg-[#ffffff]/[0.01]">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-[24px] glass glow-primary flex items-center justify-center border border-primary/20">
                      <MessageSquare className="w-7 h-7 text-primary" />
                    </div>
                    <h5 className="text-2xl font-display uppercase italic tracking-tight text-white leading-none">Script de Segurança</h5>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-zinc-600 block px-4 italic">Valor Transação</label>
                      <input
                        type="text"
                        value={msgValor}
                        onChange={e => setMsgValor(e.target.value)}
                        className="w-full glass-deep border border-white/10 rounded-[28px] py-6 px-8 text-sm font-mono font-bold italic outline-none focus:border-primary/50 transition-all text-center placeholder:text-zinc-800"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-zinc-600 block px-4 italic">Data Registro</label>
                      <input
                        type="text"
                        value={msgData}
                        onChange={e => setMsgData(e.target.value)}
                        className="w-full glass-deep border border-white/10 rounded-[28px] py-6 px-8 text-sm font-mono font-bold italic outline-none focus:border-primary/50 transition-all text-center placeholder:text-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="bg-white/[0.02] rounded-[40px] p-10 border border-white/5 italic text-zinc-400 text-sm md:text-base leading-relaxed whitespace-pre-line font-mono font-medium tracking-tight selection:bg-primary/30 shadow-inner">
                    {buildMessage()}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    <button
                      onClick={handleCopyMessage}
                      className="py-7 rounded-[32px] glass glow-primary border border-primary/30 text-[11px] font-mono font-bold uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-4 text-primary-light hover:bg-primary hover:text-white shadow-2xl hover:translate-y-[-4px]"
                    >
                      {msgCopied ? 'SINC. ÁREA DE TRANSFERÊNCIA!' : 'Copiar Protocolo'}
                    </button>
                    {selectedLead.num_gov && (
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(buildMessage())
                          window.open(`https://wa.me/55${selectedLead.num_gov?.replace(/\D/g, '')}?text=${msg}`, '_blank')
                        }}
                        className="py-7 bg-emerald-500 rounded-[32px] font-mono font-bold uppercase tracking-[0.3em] text-white shadow-[0_20px_50px_rgba(16,185,129,0.3)] active:scale-95 transition-all text-[11px] flex items-center justify-center gap-4 hover:translate-y-[-4px] border-b-4 border-black/20"
                      >
                        <Phone className="w-5 h-5 fill-white" />
                        Atendimento Local
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row gap-8">
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="flex-1 py-7 rounded-[32px] glass-deep border border-white/10 text-[11px] font-mono font-bold uppercase tracking-[0.5em] hover:bg-white/5 transition-all italic text-zinc-500"
                  >
                    Retroceder Terminal
                  </button>
                  {activeTab === 'pendentes' && (
                    <div className="flex-[2] flex gap-6">
                      <button
                        onClick={() => handleFinalize(selectedLead.id as string, 'recusado')}
                        disabled={saving}
                        className="flex-1 py-7 rounded-[32px] glass-deep border border-destructive/20 text-destructive text-[11px] font-mono font-bold uppercase tracking-[0.5em] hover:bg-destructive hover:text-white transition-all flex items-center justify-center gap-3 italic"
                      >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sinalizar Falha'}
                      </button>
                      <button
                        onClick={() => handleFinalize(selectedLead.id as string, 'pago')}
                        disabled={saving}
                        className="flex-[2] py-7 rounded-[32px] bg-primary text-white text-[11px] font-mono font-bold uppercase tracking-[0.5em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_20px_60px_rgba(130,10,209,0.4)] hover:translate-y-[-4px] border-b-4 border-black/20 italic"
                      >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar Conversão'}
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
          { id: 'pendentes', label: 'Terminal', icon: Clock },
          { id: 'finalizadas', label: 'Histórico', icon: History }
        ]}
      />
    </div>
  )
}
