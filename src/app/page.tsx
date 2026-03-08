'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  PhoneCall,
  MapPin,
  CreditCard,
  TrendingUp,
  Calendar,
  User,
  Smartphone,
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  Clock,
  ShieldCheck,
  Database,
  Zap
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

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-grid">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Protegendo sua Conexão...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-2xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-black text-white italic shadow-lg shadow-primary/20 rotate-12">N</div>
          <h1 className="font-black text-xl tracking-tighter hidden sm:block italic">Nu-Pay <span className="text-primary tracking-widest text-[10px] uppercase ml-2 not-italic underline decoration-primary/20">Terminal</span></h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="relative group cursor-pointer p-2 rounded-xl hover:bg-secondary/50 transition-colors" onClick={() => fetchLeads()}>
            <Zap className={cn("w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors", loading && "animate-pulse text-primary")} />
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex items-center gap-4 group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black tracking-tight uppercase italic">{localStorage.getItem('nupay_ligador_user') || 'Ligador'}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center justify-end gap-1.5 pt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operacional
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('nupay_ligador_user')
                localStorage.removeItem('nupay_ligador_id')
                router.push('/login')
              }}
              className="p-3 rounded-xl bg-secondary/50 border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all active:scale-95 shadow-xl"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10 space-y-10">

        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Terminal de Atendimento</h2>
            <p className="text-muted-foreground font-medium italic">Sistema de Gestão de Fichas em Tempo Real.</p>
          </div>

          <div className="flex p-1.5 bg-secondary/50 backdrop-blur-md rounded-2xl border border-border shadow-2xl">
            <button
              onClick={() => setActiveTab('pendentes')}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'pendentes' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pendentes ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('finalizadas')}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'finalizadas' ? "bg-zinc-800 text-white shadow-xl" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Finalizadas
            </button>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse leading-none italic">Sincronizando Terminal...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-[#111114] border-2 border-dashed border-white/5 rounded-[48px] p-24 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-secondary/50 rounded-3xl flex items-center justify-center text-muted-foreground/20 border border-white/5 relative">
              <PhoneCall className="w-12 h-12" />
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Tudo em dia!</h3>
              <p className="text-sm text-muted-foreground italic opacity-50">Nenhuma ficha aguardando sua ação no momento. Fique atento às notificações do Admin.</p>
            </div>
            <button
              onClick={() => fetchLeads()}
              className="bg-secondary hover:bg-zinc-800 border border-white/10 text-[10px] font-black uppercase tracking-widest px-10 py-5 rounded-2xl transition-all active:scale-95 shadow-xl"
            >
              Recarregar Painel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-[#111114] border border-white/5 rounded-[40px] p-8 flex flex-col space-y-6 hover:border-primary/40 transition-all group shadow-2xl relative overflow-hidden cursor-pointer active:scale-95"
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full border border-primary/10 mb-2 italic">NOVA FICHA</p>
                    <div className="flex items-center gap-2 justify-end text-zinc-500 italic">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{lead.city || 'CIDADE'}, {lead.state || 'UF'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors leading-none">
                    {lead.full_name || 'LEAD SEM NOME'}
                  </h4>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">CPF: {lead.cpf}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-3xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Score</p>
                    <p className="text-xl font-black italic leading-none">{lead.score || '--'}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-3xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Renda</p>
                    <p className="text-lg font-black italic text-emerald-500 leading-none">R$ {Number(lead.income || 0).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase italic">{lead.age || '--'} ANOS</span>
                  </div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 italic">
                    Ver Ficha Completa
                    <Zap className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Lead Selecionado */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#111114] border border-white/10 w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                  <User className="w-10 h-10 text-primary font-black" />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-1">{selectedLead.full_name || 'LEAD SEM NOME'}</h3>
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.3em] italic">CPF: {selectedLead.cpf}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-zinc-800 transition-all font-black text-zinc-500 shadow-xl"
              >
                <XCircle className="w-7 h-7" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-6">
                  <div className="bg-black/30 p-5 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1 italic">Score Serasa</p>
                    <div className="flex items-center gap-4">
                      <p className="text-3xl font-black italic">{selectedLead.score || '--'}</p>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-primary shadow-lg shadow-primary/40" style={{ width: `${(selectedLead.score || 0) / 10}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/30 p-5 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1 italic">Renda Estimada</p>
                    <p className="text-2xl font-black text-emerald-500 italic">R$ {Number(selectedLead.income || 0).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-black/30 p-5 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1 italic">Idade Detalhada</p>
                    <p className="text-2xl font-black italic">{selectedLead.age || '--'} ANOS</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Nasc: {selectedLead.birth_date ? new Date(selectedLead.birth_date + 'T00:00:00').toLocaleDateString('pt-BR') : '--/--/--'}</p>
                  </div>
                  <div className="bg-black/30 p-5 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1 italic">Localização</p>
                    <p className="text-2xl font-black italic uppercase">{selectedLead.city || 'DESCONHECIDA'}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Estado: {selectedLead.state || 'UF'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[32px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <Smartphone className="w-16 h-16 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] mb-3 italic">Número GOV Primário</p>
                  <div className="flex items-center gap-4">
                    <p className="text-4xl font-black text-white italic tracking-tighter leading-none">{selectedLead.num_gov || 'PENDENTE'}</p>
                    <button
                      onClick={() => window.open(`https://wa.me/55${selectedLead.num_gov?.replace(/\D/g, '')}`, '_blank')}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      Chamar WhatsApp
                    </button>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-6 rounded-[32px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <CreditCard className="w-16 h-16 text-primary" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mb-4 italic">Informações de Cartão</p>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">BIN Cartão</p>
                      <p className="text-3xl font-black italic text-white tracking-widest leading-none">{selectedLead.card_bin || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Validade / CVV</p>
                      <p className="text-3xl font-black italic text-white tracking-widest leading-none">{selectedLead.card_expiry || '--/--'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 p-8 rounded-[32px]">
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-4 italic">Outros Contatos Disponíveis</p>
                <div className="flex flex-wrap gap-3">
                  {selectedLead.phones && selectedLead.phones.length > 0 ? selectedLead.phones.map((phone, idx) => (
                    <div key={idx} className={cn(
                      "px-5 py-3 rounded-2xl border text-[11px] font-black transition-all flex items-center gap-3",
                      phone === selectedLead.num_gov ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-zinc-900 border-white/5 text-zinc-400"
                    )}>
                      {phone}
                      {phone === selectedLead.num_gov && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                  )) : <span className="text-xs italic text-zinc-700">Nenhum outro número no radar...</span>}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-zinc-900/50 flex gap-4">
              <button
                onClick={() => setSelectedLead(null)}
                className="flex-1 py-5 rounded-3xl bg-secondary border border-border text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
              >
                Voltar à Fila
              </button>
              {activeTab === 'pendentes' && (
                <button
                  onClick={() => handleFinalize(selectedLead.id)}
                  disabled={saving}
                  className="flex-[2] py-5 rounded-3xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Finalizar Atendimento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
