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
  Star,
  Calendar,
  TrendingUp,
  Phone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase, Lead } from '@/lib/supabase'

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
      .eq('status', activeTab === 'pendentes' ? 'atribuido' : 'arquivado')
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

  const handleFinalize = async (leadId: string) => {
    setSaving(true)
    const { error } = await supabase
      .from('leads')
      .update({ status: 'arquivado', updated_at: new Date().toISOString() })
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

        {/* Tabs */}
        <div className="px-5 pb-3 md:px-8">
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
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 outline-none transition-all text-sm placeholder:text-zinc-600"
            style={{ borderColor: searchTerm ? 'rgba(130,10,209,0.3)' : undefined }}
          />
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <main className="flex-1 px-5 pb-8 md:px-8 md:max-w-2xl md:mx-auto md:w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'rgba(130,10,209,0.2)' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#820AD1' }} />
              </div>
              <div className="absolute inset-0 blur-[40px] rounded-full" style={{ background: 'rgba(130,10,209,0.2)' }} />
            </div>
            <p className="text-sm text-zinc-500 font-medium">Carregando fichas...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
              <PhoneCall className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Fila vazia</h3>
              <p className="text-sm text-zinc-500 max-w-xs">Nenhuma ficha aguardando. Aguarde uma nova atribuição do administrador.</p>
            </div>
            <button
              onClick={() => fetchLeads()}
              className="px-6 py-3 rounded-2xl text-sm font-semibold active:scale-95 transition-all shadow-lg text-white"
              style={{ background: '#820AD1', boxShadow: '0 8px 24px rgba(130,10,209,0.3)' }}
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
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 md:p-5 flex items-center gap-4 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:bg-violet-500/5 hover:border-violet-500/10 group"
                style={{ animationDelay: `${idx * 50}ms`, animation: 'fadeSlideUp 0.4s ease-out both' }}
              >
                {/* Avatar */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform" style={{ background: 'rgba(130,10,209,0.08)', borderColor: 'rgba(130,10,209,0.1)' }}>
                  <UserCircle2 className="w-6 h-6 md:w-7 md:h-7" style={{ color: '#9B30D9' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h4 className="font-bold text-sm md:text-base truncate leading-tight group-hover:text-violet-300 transition-colors">
                    {lead.full_name || 'Sem nome'}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span>CPF: {lead.cpf?.slice(0, 7)}...</span>
                    {lead.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.city}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-400">
                      {lead.income ? Number(lead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
                    </span>
                    {lead.num_gov && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">GOV ✓</span>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:translate-x-0.5 transition-all shrink-0" style={{ color: undefined }} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ===== DETAIL MODAL - FULLSCREEN MOBILE ===== */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0f] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="min-h-full flex flex-col">

            {/* Modal Header */}
            <div className="relative px-5 pt-5 pb-8 md:px-6 md:pt-6 md:pb-8">
              {/* Close Button */}
              <button
                onClick={() => setSelectedLead(null)}
                className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all z-20"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              {/* Purple Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />

              {/* Profile */}
              <div className="relative z-10 flex flex-col items-center text-center pt-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl mb-4" style={{ background: 'linear-gradient(135deg, #820AD1, #6B07AB)', boxShadow: '0 12px 32px rgba(130,10,209,0.3)' }}>
                  <UserCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight leading-tight max-w-[280px]">
                  {selectedLead.full_name || 'Sem Nome'}
                </h3>
                <p className="text-sm text-zinc-500 mt-1 font-mono">CPF: {selectedLead.cpf}</p>

                {/* Score Badge */}
                {selectedLead.score && (
                  <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: 'rgba(130,10,209,0.1)', border: '1px solid rgba(130,10,209,0.2)' }}>
                    <Star className="w-3.5 h-3.5 fill-current" style={{ color: '#9B30D9' }} />
                    <span className="text-sm font-bold" style={{ color: '#9B30D9' }}>Score {selectedLead.score}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-5 pb-6 space-y-4">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                  <p className="text-lg font-bold text-emerald-400 leading-none">
                    R$ {Number(selectedLead.income || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[10px] text-zinc-600 font-medium mt-1">Renda</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                  <Calendar className="w-4 h-4 mx-auto mb-2" style={{ color: '#820AD1' }} />
                  <p className="text-lg font-bold leading-none">
                    {selectedLead.age || '--'}
                  </p>
                  <p className="text-[10px] text-zinc-600 font-medium mt-1">Anos</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                  <MapPin className="w-4 h-4 mx-auto mb-2" style={{ color: '#820AD1' }} />
                  <p className="text-sm font-bold leading-none truncate">
                    {selectedLead.state || 'UF'}
                  </p>
                  <p className="text-[10px] text-zinc-600 font-medium mt-1">Estado</p>
                </div>
              </div>

              {/* Gov Number + Message Template */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-semibold text-emerald-400">Número do Governo</p>
                </div>
                <p className="text-3xl md:text-4xl font-bold text-white tracking-tight text-center py-2">
                  {selectedLead.num_gov ? selectedLead.num_gov.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : 'Não disponível'}
                </p>
              </div>

              {/* Message Template Section */}
              <div className="border rounded-2xl p-5 space-y-4" style={{ background: 'rgba(130,10,209,0.03)', borderColor: 'rgba(130,10,209,0.15)' }}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" style={{ color: '#9B30D9' }} />
                  <p className="text-xs font-semibold" style={{ color: '#9B30D9' }}>Mensagem de Abordagem</p>
                </div>

                {/* Editable Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-medium ml-1">Valor (R$)</label>
                    <input
                      type="text"
                      value={msgValor}
                      onChange={(e) => {
                        // Allow only numbers, dots, commas
                        const v = e.target.value.replace(/[^0-9.,]/g, '')
                        setMsgValor(v)
                      }}
                      className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-3 text-sm font-semibold outline-none transition-all text-center"
                      style={{ borderColor: 'rgba(130,10,209,0.15)' }}
                      placeholder="1.500,00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-medium ml-1">Data</label>
                    <input
                      type="text"
                      value={msgData}
                      onChange={(e) => {
                        let v = e.target.value.replace(/[^0-9/]/g, '')
                        // Auto-format: add / after DD and MM
                        if (v.length === 2 && !v.includes('/')) v += '/'
                        if (v.length === 5 && v.split('/').length === 2) v += '/'
                        if (v.length > 10) v = v.slice(0, 10)
                        setMsgData(v)
                      }}
                      className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-3 text-sm font-semibold outline-none transition-all text-center"
                      style={{ borderColor: 'rgba(130,10,209,0.15)' }}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-medium ml-1">Horário</label>
                  <input
                    type="text"
                    value={msgHora}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9:]/g, '')
                      if (v.length === 2 && !v.includes(':')) v += ':'
                      if (v.length > 5) v = v.slice(0, 5)
                      setMsgHora(v)
                    }}
                    className="w-full bg-black/30 border border-white/5 rounded-xl py-3 px-3 text-sm font-semibold outline-none transition-all text-center"
                    style={{ borderColor: 'rgba(130,10,209,0.15)' }}
                    placeholder="HH:MM"
                    maxLength={5}
                  />
                </div>

                {/* Message Preview */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] text-zinc-500 font-medium mb-2">Pré-visualização:</p>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {buildMessage()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCopyMessage}
                    className="py-3.5 rounded-xl border text-sm font-semibold active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                    style={{ borderColor: 'rgba(130,10,209,0.3)', color: '#9B30D9', background: 'rgba(130,10,209,0.05)' }}
                  >
                    {msgCopied ? (
                      <><CheckCircle2 className="w-4 h-4" /> Copiado!</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Copiar</>
                    )}
                  </button>
                  {selectedLead.num_gov && (
                    <button
                      onClick={() => {
                        const msg = encodeURIComponent(buildMessage())
                        window.open(`https://wa.me/55${selectedLead.num_gov?.replace(/\D/g, '')}?text=${msg}`, '_blank')
                      }}
                      className="py-3.5 bg-emerald-500 text-white rounded-xl font-bold text-sm active:scale-[0.97] transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 fill-white" />
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-violet-400" />
                  <p className="text-xs font-semibold text-zinc-400">Localização</p>
                </div>
                <p className="text-xl font-bold">{selectedLead.city || 'Cidade não informada'}</p>
                <p className="text-sm text-zinc-500 mt-1">Estado: {selectedLead.state || 'UF'} • Nasc: {selectedLead.birth_date ? new Date(selectedLead.birth_date + 'T00:00:00').toLocaleDateString('pt-BR') : '--/--/----'}</p>
              </div>

              {/* Card Data */}
              <div className="border rounded-2xl p-5 space-y-4" style={{ background: 'rgba(130,10,209,0.03)', borderColor: 'rgba(130,10,209,0.12)' }}>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" style={{ color: '#9B30D9' }} />
                  <p className="text-xs font-semibold" style={{ color: '#9B30D9' }}>Dados do Cartão</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <p className="text-[10px] text-zinc-600 font-medium mb-1">BIN</p>
                    <p className="text-xl font-bold tracking-wider" style={{ color: '#9B30D9' }}>{selectedLead.card_bin || '------'}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <p className="text-[10px] text-zinc-600 font-medium mb-1">Validade</p>
                    <p className="text-xl font-bold tracking-wider" style={{ color: '#9B30D9' }}>{selectedLead.card_expiry || '--/----'}</p>
                  </div>
                </div>
              </div>

              {/* Phone Numbers */}
              {selectedLead.phones && selectedLead.phones.length > 0 && (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <p className="text-xs font-semibold text-zinc-400">Outros Contatos</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.phones.map((phone, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-semibold border",
                          phone === selectedLead.num_gov
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-white/5 border-white/5 text-zinc-400"
                        )}
                      >
                        {phone}
                        {phone === selectedLead.num_gov && " ✓"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-5 py-4 border-t border-white/5 bg-[#0a0a0f] flex gap-3" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={() => setSelectedLead(null)}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/5 text-sm font-semibold hover:bg-white/10 active:scale-95 transition-all"
              >
                Voltar
              </button>
              {activeTab === 'pendentes' && (
                <button
                  onClick={() => handleFinalize(selectedLead.id)}
                  disabled={saving}
                  className="flex-[2] py-4 rounded-2xl text-white text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #820AD1, #6B07AB)', boxShadow: '0 8px 24px rgba(130,10,209,0.3)' }}
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Finalizar Atendimento
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
