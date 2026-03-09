'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  PhoneCall,
  MapPin,
  CreditCard,
  TrendingUp,
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Search,
  RefreshCcw,
  Smartphone,
  UserCircle2,
  Database
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

  const filteredLeads = leads.filter(l =>
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.cpf?.includes(searchTerm)
  )

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-grid">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse italic">Shielding Session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid flex flex-col selection:bg-primary/30 selection:text-white">
      {/* AI-Native Header */}
      <header className="h-24 border-b border-white/5 bg-background/80 backdrop-blur-2xl flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-black text-white italic shadow-2xl shadow-primary/30 rotate-12 group-hover:rotate-0 transition-transform duration-500">N</div>
          <div className="space-y-0.5">
            <h1 className="font-black text-2xl tracking-tighter italic leading-none">Nu-Pay</h1>
            <p className="text-[9px] font-bold text-primary tracking-[0.3em] uppercase opacity-60">Terminal <span className="text-zinc-500">v2.0</span></p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="hidden lg:flex items-center gap-6 px-6 py-2.5 bg-secondary/30 rounded-full border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Database Live</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-3 group px-2 cursor-pointer" onClick={() => fetchLeads()}>
              <RefreshCcw className={cn("w-3.5 h-3.5 text-zinc-400 group-hover:text-primary transition-colors", loading && "animate-spin text-primary")} />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Sync</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black tracking-tight uppercase italic">
                {typeof window !== 'undefined' ? localStorage.getItem('nupay_ligador_user') : 'Ligador'}
              </p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] pt-0.5">Sessão Ativa</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('nupay_ligador_user')
                localStorage.removeItem('nupay_ligador_id')
                router.push('/login')
              }}
              className="p-4 rounded-2xl bg-secondary/50 border border-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all active:scale-95 shadow-2xl group"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-8 lg:p-12 space-y-12">
        {/* Control Bar - Bento Style */}
        <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                <LayoutGrid className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Minha Fila</h2>
            </div>
            <p className="text-muted-foreground font-medium italic opacity-60 text-lg">Central de Atendimento e Conversão Operacional.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            {/* Search Pill */}
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="BUSCAR POR NOME OU CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-[28px] bg-secondary/30 border border-white/5 outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all font-black text-[10px] uppercase tracking-widest"
              />
            </div>

            {/* Tabs Pill */}
            <div className="flex p-1.5 bg-secondary/20 backdrop-blur-md rounded-[32px] border border-white/5 shadow-inner w-full md:w-auto">
              <button
                onClick={() => setActiveTab('pendentes')}
                className={cn(
                  "flex-1 md:flex-none px-10 py-3.5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  activeTab === 'pendentes' ? "bg-primary text-white shadow-2xl shadow-primary/30" : "text-zinc-500 hover:text-white"
                )}
              >
                Pendentes ({leads.length})
              </button>
              <button
                onClick={() => setActiveTab('finalizadas')}
                className={cn(
                  "flex-1 md:flex-none px-10 py-3.5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  activeTab === 'finalizadas' ? "bg-white/10 text-white shadow-xl" : "text-zinc-500 hover:text-white"
                )}
              >
                Finalizadas
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse leading-none italic">Sincronização Ativa</p>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Aguarde um instante...</p>
            </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-[#0c0c0e] border border-dashed border-white/5 rounded-[64px] p-24 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-700">
            <div className="w-32 h-32 bg-secondary/50 rounded-[48px] flex items-center justify-center text-zinc-800 border-2 border-dashed border-white/5 relative group">
              <PhoneCall className="w-16 h-16 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-3 max-w-sm">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Fila Vazia</h3>
              <p className="text-sm text-zinc-500 italic font-medium leading-relaxed">Nenhuma ficha aguardando sua ação neste radar. Aguarde uma nova atribuição do Admin.</p>
            </div>
            <button
              onClick={() => fetchLeads()}
              className="bg-secondary hover:bg-zinc-800 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] px-12 py-5 rounded-[28px] transition-all active:scale-95 shadow-2xl"
            >
              Verificar Radar
            </button>
          </div>
        ) : (
          <section className="bento-grid">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="glass rounded-[48px] p-10 flex flex-col space-y-8 card-hover relative overflow-hidden group cursor-pointer"
                onClick={() => setSelectedLead(lead)}
              >
                {/* Glare Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-0 rounded-full group-hover:bg-primary/10 transition-colors" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="w-18 h-18 rounded-[32px] bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <UserCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <div className="text-right flex flex-col items-end gap-3">
                    <div className="px-5 py-2 rounded-full bg-primary/5 border border-primary/20">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic leading-none">Ready to Treatment</p>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 italic">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{lead.city || 'RADAR'}, {lead.state || 'UF'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 relative z-10">
                  <h4 className="text-3xl font-black uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors leading-none decoration-primary/20 underline-offset-8">
                    {lead.full_name || 'LEAD SEM NOME'}
                  </h4>
                  <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest italic group-hover:text-zinc-500">CPF IDENT: {lead.cpf}</p>
                </div>

                <div className="grid grid-cols-2 gap-5 relative z-10">
                  <div className="bg-background/80 p-6 rounded-[32px] border border-white/5 space-y-1">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Score</p>
                    <p className="text-2xl font-black italic text-glow leading-none">{lead.score || '--'}</p>
                  </div>
                  <div className="bg-background/80 p-6 rounded-[32px] border border-white/5 space-y-1">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Renda</p>
                    <p className="text-2xl font-black italic text-emerald-500 emerald-glow leading-none">R$ {Number(lead.income || 0).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                    <span className="text-[11px] font-black text-zinc-500 uppercase italic leading-none">{lead.age || '--'} ANOS DE IDADE</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-primary shadow-2xl shadow-primary/30 group-hover:rotate-12 transition-transform duration-500">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* AI-Native Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12 bg-background/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="glass w-full max-w-4xl rounded-[64px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[95vh] flex flex-col border-white/10">
            {/* Modal Header */}
            <div className="px-12 py-12 border-b border-white/5 flex justify-between items-start bg-secondary/20 relative overflow-hidden">
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

              <div className="flex items-center gap-10 relative z-10">
                <div className="w-28 h-28 rounded-[40px] bg-gradient-to-br from-primary/20 to-indigo-600/20 flex items-center justify-center border border-primary/30 shadow-2xl">
                  <UserCircle2 className="w-16 h-16 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{selectedLead.full_name || 'LEAD SEM NOME'}</h3>
                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">Vip Qualified</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 font-black uppercase tracking-[0.4em] italic leading-none">Document Identification: <span className="text-white">{selectedLead.cpf}</span></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-16 h-16 rounded-[28px] bg-secondary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all font-black text-zinc-500 shadow-2xl flex items-center justify-center relative z-10"
              >
                <XCircle className="w-8 h-8" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-12 overflow-y-auto flex-1 custom-scrollbar relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                <section className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic flex items-center gap-3 mb-6">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Metrics & Financials
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#0c0c0e] p-8 rounded-[40px] border border-white/5 space-y-4">
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic leading-none">Score Serasa</p>
                      <div className="space-y-4">
                        <p className="text-4xl font-black italic text-glow leading-none">{selectedLead.score || '--'}</p>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-primary shadow-[0_0_20px_var(--primary-glow)]" style={{ width: `${(selectedLead.score || 0) / 10}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0c0c0e] p-8 rounded-[40px] border border-white/5 space-y-2">
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic leading-none">Renda Estimada</p>
                      <p className="text-3xl font-black text-emerald-500 emerald-glow italic leading-none pt-2">R$ {Number(selectedLead.income || 0).toLocaleString('pt-BR')}</p>
                      <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest pt-2">Monthly Estimate</p>
                    </div>
                  </div>
                  <div className="bg-[#0c0c0e] p-8 rounded-[40px] border border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic leading-none">Age Information</p>
                      <p className="text-3xl font-black italic tracking-tighter leading-none pt-2">{selectedLead.age || '--'} ANOS</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic leading-none">Birth Date</p>
                      <p className="text-xl font-bold italic opacity-60 pt-2">{selectedLead.birth_date ? new Date(selectedLead.birth_date + 'T00:00:00').toLocaleDateString('pt-BR') : '--/--/--'}</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic flex items-center gap-3 mb-6">
                    <Smartphone className="w-3.5 h-3.5" />
                    Contact Architecture
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-10 rounded-[48px] relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000 rotate-12">
                      <Smartphone className="w-32 h-32 text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em] mb-4 italic leading-none">Validated Gov Number</p>
                    <div className="flex flex-col gap-6">
                      <p className="text-5xl font-black text-white italic tracking-tighter leading-none">{selectedLead.num_gov || 'PENDING'}</p>
                      <button
                        onClick={() => window.open(`https://wa.me/55${selectedLead.num_gov?.replace(/\D/g, '')}`, '_blank')}
                        className="w-full py-5 bg-emerald-500 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3"
                      >
                        <MessageSquare className="w-4 h-4 fill-white" />
                        Start Connection
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#0c0c0e] p-8 rounded-[40px] border border-white/5 space-y-1">
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic leading-none">Current Location</p>
                    <p className="text-3xl font-black italic uppercase tracking-tighter pt-2 leading-none">{selectedLead.city || 'RADAR MISSING'}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pt-2">Region: {selectedLead.state || 'UF'}</p>
                  </div>
                </section>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <section className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic flex items-center gap-3 mb-6">
                    <CreditCard className="w-3.5 h-3.5" />
                    Advanced Card Data
                  </div>
                  <div className="bg-primary/5 border border-primary/20 p-10 rounded-[48px] relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000 rotate-12">
                      <CreditCard className="w-32 h-32 text-primary" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em] mb-6 italic leading-none">Card Intelligence</p>
                    <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">BIN Identification</p>
                        <p className="text-4xl font-black italic text-white tracking-[0.2em] text-glow leading-none">{selectedLead.card_bin || '---'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Expiration Cycle</p>
                        <p className="text-4xl font-black italic text-white tracking-[0.1em] text-glow leading-none">{selectedLead.card_expiry || '--/--'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic flex items-center gap-3 mb-6">
                    <Database className="w-3.5 h-3.5" />
                    Signal Database
                  </div>
                  <div className="bg-[#0c0c0e] border border-white/5 p-8 rounded-[40px] flex-1">
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-6 italic leading-none">Cross-Referenced Contacts</p>
                    <div className="flex flex-wrap gap-4">
                      {selectedLead.phones && selectedLead.phones.length > 0 ? selectedLead.phones.map((phone, idx) => (
                        <div key={idx} className={cn(
                          "px-6 py-4 rounded-2xl border text-[12px] font-black transition-all flex items-center gap-3",
                          phone === selectedLead.num_gov ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-black border-white/5 text-zinc-500"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", phone === selectedLead.num_gov ? "bg-emerald-500" : "bg-white/10")} />
                          {phone}
                          {phone === selectedLead.num_gov && <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />}
                        </div>
                      )) : <span className="text-xs italic text-zinc-700 italic">No phone data signals detected...</span>}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-12 py-10 border-t border-white/5 bg-secondary/10 flex gap-6">
              <button
                onClick={() => setSelectedLead(null)}
                className="flex-1 py-6 rounded-[32px] bg-secondary border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95 shadow-2xl italic"
              >
                Re-queue Lead
              </button>
              {activeTab === 'pendentes' && (
                <button
                  onClick={() => handleFinalize(selectedLead.id)}
                  disabled={saving}
                  className="flex-[2] py-6 rounded-[32px] bg-primary text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(129,140,248,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 italic"
                >
                  {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <ShieldCheck className="w-6 h-6" />
                      Certify Treatment
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
