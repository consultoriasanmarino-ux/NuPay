'use client'

import { useState, useEffect } from 'react'
import {
    Filter,
    ChevronDown,
    UserCheck,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Eye,
    PhoneCall,
    Loader2,
    Database,
    User,
    Search,
    AlertCircle,
    ShieldCheck,
    MapPin,
    Calendar,
    Clock,
    Layers,
    Zap,
    Cpu,
    Unlock,
    Activity,
    Smartphone,
    CreditCard,
    LayoutGrid,
    X,
    UserMinus,
    Trash2
} from 'lucide-react'
import Link from 'next/link'
import { supabase, Lead } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function FichasPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [ligadores, setLigadores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [assigning, setAssigning] = useState<string | null>(null)
    const [batchAssigning, setBatchAssigning] = useState(false)
    const [selectedLigadorForLead, setSelectedLigadorForLead] = useState<{ [key: string]: string }>({})
    const [selectedLigadorBatch, setSelectedLigadorBatch] = useState('')

    const [filters, setFilters] = useState({
        income: '',
        score: '',
        age: ''
    })

    const ITEMS_PER_PAGE = 50

    const fetchData = async () => {
        setLoading(true)

        const { data: ligs } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'ligador')
            .order('full_name')

        if (ligs) setLigadores(ligs)

        const start = (page - 1) * ITEMS_PER_PAGE
        const end = start + ITEMS_PER_PAGE - 1

        let query = supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('status', 'concluido')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false })
            .range(start, end)

        if (filters.income === 'greater') query = query.gte('income', 5000)
        if (filters.income === 'less') query = query.lte('income', 4999)
        if (filters.score === 'greater') query = query.gte('score', 700)
        if (filters.score === 'less') query = query.lte('score', 699)
        if (filters.age === 'greater') query = query.gte('age', 40)
        if (filters.age === 'less') query = query.lte('age', 39)

        const { data, count, error } = await query

        if (!error && data) {
            setLeads(data as Lead[])
            setTotalCount(count || 0)
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [page, filters])

    const handleAssign = async (leadId: string) => {
        const ownerId = selectedLigadorForLead[leadId]
        if (!ownerId) {
            alert('Selecione um ligador primeiro.')
            return
        }

        setAssigning(leadId)

        const { error } = await supabase
            .from('leads')
            .update({
                owner_id: ownerId,
                status: 'atribuido'
            })
            .eq('id', leadId)

        if (error) {
            alert('Erro: ' + error.message)
        } else {
            setLeads(prev => prev.filter(l => l.id !== leadId))
            setTotalCount(prev => prev - 1)
        }
        setAssigning(null)
    }

    const handleBatchAssign = async () => {
        if (!selectedLigadorBatch) {
            alert('Selecione um ligador para atribuição em lote.')
            return
        }

        const leadsToAssign = leads.slice(0, 10)
        if (leadsToAssign.length === 0) {
            alert('Nenhum lead disponível.')
            return
        }

        const selectedLigadorName = ligadores.find(l => l.id === selectedLigadorBatch)?.full_name || 'este ligador'
        if (!confirm(`Confirmar: Atribuir ${leadsToAssign.length} fichas para ${selectedLigadorName}?`)) return

        setBatchAssigning(true)
        const ids = leadsToAssign.map(l => l.id)

        const { error } = await supabase
            .from('leads')
            .update({
                owner_id: selectedLigadorBatch,
                status: 'atribuido'
            })
            .in('id', ids)

        if (error) {
            alert('Erro na atribuição: ' + error.message)
        } else {
            alert(`✅ ${leadsToAssign.length} fichas atribuídas com sucesso.`)
            fetchData()
        }
        setBatchAssigning(false)
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 selection:bg-primary/20">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-[28px] bg-primary/10 border border-primary/20 shadow-2xl scale-110">
                            <Activity className="w-8 h-8 text-primary shadow-glow" />
                        </div>
                        <h2 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Central de Fichas</h2>
                    </div>
                    <p className="text-muted-foreground font-medium italic opacity-60 text-lg flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        Fichas validadas prontas para atribuição aos ligadores
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/admin/unassign"
                        className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-2xl italic"
                    >
                        <Unlock className="w-5 h-5" />
                        Desatribuir Fichas
                    </Link>
                    <div className="flex items-center gap-4 bg-secondary/30 border border-white/5 px-8 py-4 rounded-[24px] shadow-2xl group">
                        <Database className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                        <div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-1 shadow-glow-sm">Disponíveis</p>
                            <p className="text-2xl font-black italic text-white tracking-tighter">{totalCount} FICHAS</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Batch Bar */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 glass p-6 rounded-[48px] border-white/5 backdrop-blur-3xl shadow-xl">
                    {[
                        { label: 'Renda', key: 'income', options: [{ v: 'greater', l: 'Acima de 5k' }, { v: 'less', l: 'Abaixo de 5k' }] },
                        { label: 'Score', key: 'score', options: [{ v: 'greater', l: 'Acima de 700' }, { v: 'less', l: 'Abaixo de 700' }] },
                        { label: 'Idade', key: 'age', options: [{ v: 'greater', l: '40+ anos' }, { v: 'less', l: 'Menos de 40' }] }
                    ].map((f) => (
                        <div key={f.key} className="relative group">
                            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-all duration-300" />
                            <select
                                value={(filters as any)[f.key]}
                                onChange={(e) => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
                                className="w-full bg-black/40 border border-white/5 rounded-[24px] py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer text-zinc-400 group-hover:text-white"
                            >
                                <option value="">{f.label} (Filtro)</option>
                                {f.options.map(o => <option key={o.v} value={o.v} className="bg-[#0c0c0e]">{o.l}</option>)}
                            </select>
                        </div>
                    ))}
                </div>

                <div className="glass bg-primary/5 border border-primary/20 p-6 rounded-[48px] flex items-center gap-4 group">
                    <div className="relative flex-1 group/select">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary group-hover/select:scale-110 transition-transform" />
                        <select
                            value={selectedLigadorBatch}
                            onChange={(e) => setSelectedLigadorBatch(e.target.value)}
                            className="w-full bg-black/40 border border-primary/20 rounded-[20px] py-4 pl-10 pr-4 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer text-primary shadow-glow-sm"
                        >
                            <option value="" className="bg-[#0c0c0e] text-zinc-500">Selecionar Ligador...</option>
                            {ligadores.map(lig => (
                                <option key={lig.id} value={lig.id} className="bg-[#0c0c0e]">{lig.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleBatchAssign}
                        disabled={batchAssigning || loading || leads.length === 0}
                        className="bg-primary text-white p-5 rounded-[20px] hover:scale-105 active:scale-95 transition-all shadow-glow flex items-center gap-3 px-6 border-b-4 border-black/20"
                    >
                        {batchAssigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-6 h-6" />}
                        <span className="text-[10px] font-black uppercase tracking-tighter">10 SIG</span>
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-6">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse italic">Carregando fichas...</p>
                </div>
            ) : leads.length === 0 ? (
                <div className="glass border-dashed border-white/5 rounded-[64px] p-32 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-700">
                    <div className="w-28 h-28 bg-secondary/30 rounded-[40px] flex items-center justify-center text-zinc-800 border-2 border-dashed border-white/10 group">
                        <PhoneCall className="w-14 h-14 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">Fila Vazia</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto italic font-medium">Nenhuma ficha disponível para atribuição. Enriqueça ou importe novos leads.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {leads.map((lead) => (
                        <div key={lead.id} className="glass rounded-[56px] p-10 flex flex-col space-y-8 hover:border-primary/40 transition-all group card-hover border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center justify-between relative z-10">
                                <div className="w-18 h-18 rounded-[28px] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                    <UserCheck className="w-9 h-9 text-primary shadow-glow" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-500/5 px-6 py-2.5 rounded-full border border-emerald-500/10 mb-3 italic emerald-glow">Pronta</p>
                                    <div className="flex items-center gap-2 justify-end text-zinc-600">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">{lead.city || 'GLOBAL'}, {lead.state || 'UF'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-2">
                                <h4 className="text-3xl font-black uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors leading-none decoration-primary/20 underline underline-offset-8">
                                    {lead.full_name || 'SEM NOME'}
                                </h4>
                                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] italic">CPF: <span className="text-zinc-400">{lead.cpf}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-5 relative z-10">
                                {[
                                    { icon: ShieldCheck, label: 'Score', val: lead.score || '--', color: 'text-white' },
                                    { icon: Database, label: 'Renda', val: `R$ ${Number(lead.income || 0).toLocaleString('pt-BR')}`, color: 'text-emerald-500' },
                                    { icon: Calendar, label: 'Idade', val: `${lead.age || '--'} ANOS`, color: 'text-blue-400' },
                                    { icon: Clock, label: 'Nº Gov', val: lead.num_gov || 'Pendente', color: 'text-white', full: true }
                                ].map((item, i) => (
                                    <div key={i} className={cn("glass-deep p-6 rounded-[32px] border-white/5 hover:border-white/10 transition-all", item.full && "col-span-2")}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <item.icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-primary transition-colors" />
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none">{item.label}</p>
                                        </div>
                                        <p className={cn("text-2xl font-black italic leading-none tracking-tighter", item.color, item.full && "text-sm")}>{item.val}</p>
                                    </div>
                                ))}
                                <div className="glass-deep p-6 rounded-[32px] border-white/5 col-span-1 border-primary/10">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 italic">BIN</p>
                                    <p className="text-2xl font-black italic text-primary text-glow leading-none">{lead.card_bin || 'N/D'}</p>
                                </div>
                                <div className="glass-deep p-6 rounded-[32px] border-white/5 col-span-1 border-primary/10">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 italic">Validade</p>
                                    <p className="text-2xl font-black italic text-primary text-glow leading-none">{lead.card_expiry || 'N/D'}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 relative z-10">
                                <div className="flex items-center gap-3 mb-1">
                                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">Atribuir a Ligador</p>
                                </div>
                                <div className="flex gap-4">
                                    <select
                                        value={selectedLigadorForLead[lead.id] || ''}
                                        onChange={(e) => setSelectedLigadorForLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                        className="flex-1 bg-black/40 border border-white/5 rounded-[24px] px-8 py-5 text-[11px] font-black uppercase italic tracking-[0.1em] outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer shadow-inner text-white group-hover:border-primary/20 transition-all"
                                    >
                                        <option value="" className="bg-[#0c0c0e] text-zinc-600">Selecionar Ligador...</option>
                                        {ligadores.map(lig => (
                                            <option key={lig.id} value={lig.id} className="bg-[#0c0c0e]">{lig.full_name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleAssign(lead.id)}
                                        disabled={assigning === lead.id}
                                        className="w-16 h-16 shrink-0 rounded-[28px] bg-primary text-white hover:bg-primary/90 transition-all shadow-glow flex items-center justify-center active:scale-95 disabled:opacity-50 border-b-4 border-black/20 group/btn"
                                    >
                                        {assigning === lead.id ? <Loader2 className="w-7 h-7 animate-spin" /> : <ShieldCheck className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination UI */}
            {leads.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between p-10 glass rounded-[64px] gap-8 shadow-2xl border-white/5">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[32px] bg-secondary/80 border border-white/5 flex items-center justify-center shadow-inner group">
                            <Cpu className="w-10 h-10 text-zinc-700 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic leading-none mb-2">Página</p>
                            <p className="text-3xl font-black italic tracking-tighter leading-none">{page} <span className="text-zinc-800 mx-4 text-sm font-black italic">DE</span> {Math.ceil(totalCount / ITEMS_PER_PAGE) || 1}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={page === 1}
                            className="flex items-center gap-4 px-10 py-6 rounded-[28px] bg-secondary border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-20 shadow-xl italic"
                        >
                            <ChevronLeft className="w-6 h-6" />
                            Anterior
                        </button>
                        <button
                            onClick={() => { setPage(p => (p * ITEMS_PER_PAGE < totalCount ? p + 1 : p)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={page * ITEMS_PER_PAGE >= totalCount}
                            className="flex items-center gap-4 px-12 py-6 rounded-[28px] bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-glow hover:scale-[1.03] transition-all active:scale-95 disabled:opacity-20 italic border-b-4 border-black/20"
                        >
                            Próxima
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
