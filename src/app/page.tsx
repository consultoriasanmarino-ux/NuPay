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
  Star
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
    <div className="min-h-[100dvh] bg-[#0a0a0f] text-white flex flex-col overflow-x-hidden" style={{ '--nu-purple': '#820AD1', '--nu-purple-light': '#9B30D9', '--nu-purple-dark': '#6B07AB' } as any}>
      {/* ===== MOBILE-FIRST HEADER ===== */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#0a0a0f]/90 border-b border-white/5">
        <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
          {/* Logo + User */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #820AD1, #6B07AB)', boxShadow: '0 8px 24px rgba(130,10,209,0.3)' }}>
              N
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg leading-none tracking-tight">Nu-Pay</h1>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: '#820AD1' }}>{userName}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLeads()}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-violet-500/10 active:scale-90 transition-all"
            >
              <RefreshCcw className={cn("w-4 h-4 text-zinc-400", loading && "animate-spin")} style={loading ? { color: '#820AD1' } : {}} />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('nupay_ligador_user')
                localStorage.removeItem('nupay_ligador_id')
                router.push('/login')
              }}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/10 active:scale-90 transition-all"
            >
              <LogOut className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Tabs Desktop - Hidden on Mobile because of InteractiveMenu */}
        <div className="hidden md:block px-8 pb-3">
          <div className="flex p-1 bg-white/5 rounded-2xl w-full">
            <button
              onClick={() => setActiveTab('pendentes')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                activeTab === 'pendentes'
                  ? "text-white shadow-lg"
                  : "text-zinc-500 hover:text-white"
              )}
              style={activeTab === 'pendentes' ? { background: 'linear-gradient(135deg, #820AD1, #6B07AB)', boxShadow: '0 8px 24px rgba(130,10,209,0.3)' } : {}}
            >
              Pendentes ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('finalizadas')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                activeTab === 'finalizadas'
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-zinc-500 hover:text-white"
              )}
            >
              Finalizadas
            </button>
          </div>
        </div>
      </header>

      {/* ===== SEARCH BAR ===== */}
      <div className="px-5 py-4 md:px-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 outline-none transition-all text-sm placeholder:text-zinc-700 focus:border-[#820AD1]/30 focus:ring-1 focus:ring-[#820AD1]/20"
          />
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <main className="flex-1 px-5 pb-32 md:px-8 md:max-w-2xl md:mx-auto md:w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'rgba(130,10,209,0.2)' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#820AD1' }} />
              </div>
              <div className="absolute inset-0 blur-[40px] rounded-full" style={{ background: 'rgba(130,10,209,0.2)' }} />
            </div>
            <p className="text-sm text-zinc-500 font-medium tracking-tight">Carregando fichas...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <PhoneCall className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="text-center space-y-2 px-6">
              <h3 className="text-xl font-bold tracking-tight italic">FILA VAZIA</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Nenhuma ficha aguardando. Aguarde uma nova atribuição.</p>
            </div>
            <button
              onClick={() => fetchLeads()}
              className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl text-white"
              style={{ background: '#820AD1', boxShadow: '0 8px 32px rgba(130,10,209,0.3)' }}
            >
              Atualizar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead, idx) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="bg-white/[0.03] border border-white/5 rounded-[24px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:bg-violet-500/5 hover:border-violet-500/10 group relative overflow-hidden"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform" style={{ background: 'rgba(130,10,209,0.08)', borderColor: 'rgba(130,10,209,0.1)' }}>
                  <UserCircle2 className="w-7 h-7" style={{ color: '#9B30D9' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h4 className="font-bold text-sm md:text-base truncate leading-tight group-hover:text-violet-300 transition-colors uppercase tracking-tight">
                    {lead.full_name || 'Sem nome'}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-medium">
                    <span>CPF: {lead.cpf?.slice(0, 7)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-400">
                      {lead.income ? Number(lead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
                    </span>
                    {lead.num_gov && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-black border border-emerald-500/20 uppercase tracking-tighter">GOV ✓</span>
                    )}
                    {activeTab === 'finalizadas' && (
                      <span className={cn(
                        "text-[9px] px-2.5 py-1 rounded-full font-black border uppercase tracking-tighter",
                        lead.status === 'pago' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                        lead.status === 'recusado' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        "bg-white/5 text-zinc-400 border-white/10"
                      )}>
                        {lead.status === 'pago' ? 'Sucesso' : lead.status === 'recusado' ? 'Falha' : 'Finalizada'}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-zinc-800" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ===== DETAIL MODAL ===== */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0f] overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="min-h-full flex flex-col">
            {/* Modal Header */}
            <div className="relative px-6 pt-8 pb-10">
              <button
                onClick={() => setSelectedLead(null)}
                className="absolute top-5 right-5 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all z-20"
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[32px] flex items-center justify-center shadow-2xl mb-6 ring-8 ring-primary/5" style={{ background: 'linear-gradient(135deg, #820AD1, #6B07AB)' }}>
                  <UserCircle2 className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter leading-tight uppercase italic max-w-[300px]">
                  {selectedLead.full_name || 'Sem Nome'}
                </h3>
                <p className="text-xs text-zinc-500 mt-2 font-mono tracking-widest uppercase">CPF: {selectedLead.cpf}</p>

                {selectedLead.score && (
                  <div className="mt-4 flex items-center gap-2 px-5 py-2 rounded-full font-black italic bg-primary/10 border border-primary/20 text-primary uppercase text-[10px] tracking-widest shadow-lg">
                    <Star className="w-4 h-4 fill-primary" />
                    Score {selectedLead.score}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-12 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                 <div className="bg-white/5 rounded-3xl p-5 text-center border border-white/5">
                   <p className="text-xl font-black italic text-emerald-400">R$ {Number(selectedLead.income || 0).toLocaleString('pt-BR')}</p>
                   <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-1">Renda</p>
                 </div>
                 <div className="bg-white/5 rounded-3xl p-5 text-center border border-white/5">
                   <p className="text-xl font-black italic">{selectedLead.age || '--'}</p>
                   <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-1">Idade</p>
                 </div>
                 <div className="bg-white/5 rounded-3xl p-5 text-center border border-white/5">
                   <p className="text-sm font-black italic uppercase truncate">{selectedLead.state || 'UF'}</p>
                   <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-1">Estado</p>
                 </div>
              </div>

              <div className="bg-emerald-500 overflow-hidden relative rounded-[32px] p-8 shadow-2xl group transition-all" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 20px 40px rgba(16,185,129,0.2)' }}>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">TELEFONE GOVERNO</p>
                  <p className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">
                    {selectedLead.num_gov ? selectedLead.num_gov.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : 'NÃO INFO'}
                  </p>
                </div>
                <Smartphone className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
              </div>

              <div className="bg-white/5 border border-white/5 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h5 className="font-black italic uppercase text-xs tracking-widest">Script de Abordagem</h5>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Valor do Gasto</label>
                    <input
                      type="text"
                      value={msgValor}
                      onChange={e => setMsgValor(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm font-black italic outline-none focus:border-primary/30 transition-all text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Data da Compra</label>
                    <input
                      type="text"
                      value={msgData}
                      onChange={e => setMsgData(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm font-black italic outline-none focus:border-primary/30 transition-all text-center"
                    />
                  </div>
                </div>

                <div className="bg-black/60 rounded-2xl p-5 border border-white/5 italic text-zinc-400 text-xs leading-relaxed whitespace-pre-line">
                  {buildMessage()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleCopyMessage}
                    className="py-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
                    style={{ borderColor: 'rgba(130,10,209,0.3)', color: '#9B30D9' }}
                  >
                    {msgCopied ? 'Copiado ✓' : 'Copiar Texto'}
                  </button>
                  {selectedLead.num_gov && (
                    <button
                      onClick={() => {
                        const msg = encodeURIComponent(buildMessage())
                        window.open(`https://wa.me/55${selectedLead.num_gov?.replace(/\D/g, '')}?text=${msg}`, '_blank')
                      }}
                      className="py-4 bg-emerald-500 rounded-2xl font-black uppercase text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-3"
                    >
                      <Phone className="w-4 h-4 fill-white" />
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-6 bg-[#0a0a0f] border-t border-white/5 flex gap-4">
               <button
                  onClick={() => setSelectedLead(null)}
                  className="px-8 py-5 rounded-[24px] bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Voltar
                </button>
                {activeTab === 'pendentes' && (
                  <>
                    <button
                      onClick={() => handleFinalize(selectedLead.id, 'recusado')}
                      disabled={saving}
                      className="flex-1 py-5 rounded-[24px] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Falha ✕'}
                    </button>
                    <button
                      onClick={() => handleFinalize(selectedLead.id, 'pago')}
                      disabled={saving}
                      className="flex-[2] py-5 rounded-[24px] text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/20"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sucesso ✓'}
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Interactive Menu */}
      <InteractiveMenu 
        activeTab={activeTab}
        setActiveTab={setActiveTab as any}
        items={[
          { id: 'pendentes', label: 'Pendentes', icon: Clock },
          { id: 'finalizadas', label: 'Finalizadas', icon: CheckCircle2 }
        ]}
      />
    </div>
  )
}
