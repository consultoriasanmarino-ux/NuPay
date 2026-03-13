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
        age: '',
        sortBy: 'score',
        sortOrder: 'desc' as 'asc' | 'desc'
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
            .order(filters.sortBy || 'score', { ascending: filters.sortOrder === 'asc' })
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
        <div className="space-y-8 md:space-y-16 p-4 md:p-12 animate-in fade-in duration-1000 selection:bg-primary/20">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 md:gap-12 stagger-1">
                <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-5 md:gap-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[28px] glass glow-primary border border-primary/30 group rotate-3 hover:rotate-0 transition-transform flex items-center justify-center shrink-0">
                            <Activity className="w-6 h-6 md:w-9 md:h-9 text-primary group-hover:text-magenta transition-colors" />
                        </div>
                        <h2 className="text-3xl md:text-7xl font-display uppercase tracking-tight leading-none text-white italic">Central de Fichas</h2>
                    </div>
                    <p className="text-zinc-500 font-bold text-sm md:text-lg flex items-center gap-3 md:gap-4 italic">
                        <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
                        <span className="font-mono text-[9px] md:text-[11px] tracking-[0.2em] md:tracking-[0.4em] uppercase opacity-70">Fichas Validadas Terminal</span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 md:gap-5 items-center">
                    <Link
                        href="/admin/unassign"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 md:gap-4 px-6 md:px-10 py-4 md:py-5 rounded-[20px] md:rounded-[32px] glass glow-gold border border-gold/20 text-gold text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-gold hover:text-white transition-all active:scale-95 shadow-xl italic"
                    >
                        <Unlock className="w-4 h-4 md:w-5 md:h-5" />
                        Desatribuir
                    </Link>
                    <div className="flex-1 sm:flex-none flex items-center gap-4 md:gap-8 glass-card border border-primary/20 px-6 md:px-10 py-4 md:py-6 rounded-[24px] md:rounded-[48px] shadow-[0_32px_100px_rgba(0,0,0,0.5)] group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-primary/10 blur-[40px] md:blur-[60px] rounded-full group-hover:bg-primary/20 transition-colors" />
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl glass glow-primary flex items-center justify-center relative z-10 shrink-0">
                            <Database className="w-5 h-5 md:w-7 md:h-7 text-primary" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[8px] md:text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] md:tracking-[0.4em] leading-none mb-1 md:mb-3 italic">Estoque</p>
                            <p className="text-xl md:text-4xl font-display italic text-white tracking-tighter leading-none glow-primary-sm shrink-0 whitespace-nowrap">{totalCount} FICHAS</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Batch Bar */}
            <div className="flex flex-col xl:flex-row gap-6 md:gap-10 items-stretch stagger-2">
                {/* Batch Actions */}
                <div className="xl:flex-1">
                    <div className="glass shadow-[0_32px_100px_rgba(0,0,0,0.5)] border border-primary/20 p-6 md:p-10 rounded-[32px] md:rounded-[48px] bg-[#0d0118]/40 h-full flex flex-col justify-center group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-magenta/5 blur-[60px] md:blur-[80px] rounded-full group-hover:bg-magenta/10 transition-colors pointer-events-none" />
                        <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8 relative z-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[28px] glass glow-magenta flex items-center justify-center shrink-0 shadow-2xl group-hover:rotate-12 transition-transform">
                                <Layers className="w-6 h-6 md:w-9 md:h-9 text-magenta" />
                            </div>
                            <div className="flex-1 space-y-1 md:space-y-3 text-center lg:text-left">
                                <p className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-[0.3em] md:tracking-[0.5em] italic leading-none">Distribuição de Elite</p>
                                <p className="text-lg md:text-2xl font-display text-white italic tracking-tight">Carga de <span className="text-magenta glow-magenta-sm uppercase">10 PROTOCOLOS</span></p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full lg:w-auto">
                                <select
                                    value={selectedLigadorBatch}
                                    onChange={(e) => setSelectedLigadorBatch(e.target.value)}
                                    className="w-full sm:w-64 md:w-72 glass-deep border border-white/10 rounded-[20px] md:rounded-[32px] h-14 md:h-20 px-6 md:px-10 text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-widest outline-none focus:border-primary/40 cursor-pointer italic shadow-2xl appearance-none text-white text-center sm:text-left"
                                >
                                    <option value="" className="bg-[#0d0118]">OPERADOR...</option>
                                    {ligadores.map(l => (
                                        <option key={l.id} value={l.id} className="bg-[#0d0118] uppercase">👤 {l.full_name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleBatchAssign}
                                    disabled={batchAssigning || !selectedLigadorBatch}
                                    className="w-full sm:w-auto h-14 md:h-20 px-8 md:px-12 rounded-[20px] md:rounded-[32px] glass-deep glow-primary border border-primary/30 text-white text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-primary/20 disabled:opacity-20 transition-all active:scale-95 italic shadow-[0_16px_40px_rgba(151,1,254,0.2)] group/btn shrink-0"
                                >
                                    {batchAssigning ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                        <span className="flex items-center justify-center gap-3 md:gap-4">
                                            AUTORIZAR CARGA
                                            <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary fill-primary group-hover/btn:scale-125 transition-transform" />
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Sorting */}
                <div className="xl:w-[450px] flex flex-col gap-6">
                    <div className="glass shadow-[0_32px_100px_rgba(0,0,0,0.5)] border border-primary/20 p-8 rounded-[40px] bg-primary/5 flex flex-col justify-center">
                        <div className="flex items-center gap-6 mb-6">
                            <Filter className="w-6 h-6 text-primary" />
                            <p className="text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-[0.4em] italic leading-none">Ordenação de Carga</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                className="w-full glass-deep border border-white/10 rounded-[24px] h-16 px-6 text-[10px] font-mono font-bold uppercase outline-none focus:border-primary/40 cursor-pointer italic text-white"
                            >
                                <option value="score" className="bg-[#0d0118]">🎯 Por Score</option>
                                <option value="income" className="bg-[#0d0118]">💰 Por Renda</option>
                                <option value="age" className="bg-[#0d0118]">👤 Por Idade</option>
                            </select>
                            <select
                                value={filters.sortOrder}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                                className="w-full glass-deep border border-primary/20 rounded-[24px] h-16 px-6 text-[10px] font-mono font-bold uppercase outline-none focus:border-primary/40 cursor-pointer italic text-primary-light glow-primary-sm"
                            >
                                <option value="desc" className="bg-[#0d0118]">MAIOR → MENOR</option>
                                <option value="asc" className="bg-[#0d0118]">MENOR → MAIOR</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-center">
                        {[
                            { label: 'RENDA', key: 'income', options: [{ v: 'greater', l: 'ALTA (>5K)' }, { v: 'less', l: 'MÉDIA (<5K)' }] },
                            { label: 'SCORE', key: 'score', options: [{ v: 'greater', l: 'ALTO (>700)' }, { v: 'less', l: 'BAIXO (<700)' }] }
                        ].map((f) => (
                            <div key={f.key} className="flex items-center gap-5 glass-deep border border-white/10 h-16 px-8 rounded-[32px] shrink-0 shadow-xl">
                                <span className="text-[9px] font-mono font-bold uppercase text-zinc-600 tracking-widest italic">{f.label}:</span>
                                <select
                                    value={(filters as any)[f.key]}
                                    onChange={(e) => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="bg-transparent text-[10px] font-mono font-bold uppercase outline-none cursor-pointer text-white min-w-[120px] italic"
                                >
                                    <option value="" className="bg-[#0d0118]">TODOS</option>
                                    {f.options.map(opt => (
                                        <option key={opt.v} value={opt.v} className="bg-[#0d0118]">{opt.l}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 md:py-40 space-y-8 md:space-y-12 stagger-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-[40px] md:blur-[60px] rounded-full animate-pulse" />
                        <Loader2 className="w-12 h-12 md:w-20 md:h-20 text-primary animate-spin relative z-10" />
                    </div>
                    <p className="text-[10px] md:text-[12px] font-mono font-bold uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary animate-pulse italic">Sincronizando Terminal...</p>
                </div>
            ) : leads.length === 0 ? (
                <div className="glass shadow-[0_64px_150px_rgba(0,0,0,0.5)] border-dashed border-white/10 p-12 md:p-32 flex flex-col items-center justify-center text-center space-y-8 md:space-y-10 stagger-4 rounded-[32px] md:rounded-[64px] animate-in fade-in zoom-in duration-1000">
                    <div className="w-24 h-24 md:w-40 md:h-40 bg-zinc-900/40 rounded-[32px] md:rounded-[56px] flex items-center justify-center border-2 border-dashed border-white/5 group relative overflow-hidden">
                         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <PhoneCall className="w-12 h-12 md:w-20 md:h-20 group-hover:text-primary transition-all duration-500 text-zinc-800 relative z-10 group-hover:scale-110" />
                    </div>
                    <div className="space-y-3 md:space-y-4">
                        <h3 className="text-3xl md:text-5xl font-display uppercase italic tracking-tight text-white leading-none">Terminal em Standby</h3>
                        <p className="text-zinc-600 font-mono text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] max-w-sm mx-auto leading-relaxed italic">Nenhum registro validado disponível para atribuição imediata.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 stagger-4">
                    {leads.map((lead, idx) => (
                        <div key={lead.id} className={cn(
                            "glass shadow-[0_32px_80px_rgba(0,0,0,0.4)] p-6 md:p-12 flex flex-col space-y-8 md:space-y-12 group relative overflow-hidden rounded-[32px] md:rounded-[56px] border border-white/5 transition-all hover:bg-white/[0.02]",
                            `stagger-${(idx % 5) + 1} animate-in fade-in slide-in-from-bottom-6`
                        )}>
                            <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-primary/10 blur-[80px] md:blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-1000 pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10">
                                <div className="w-16 h-16 md:w-24 md:h-24 rounded-[28px] md:rounded-[40px] glass glow-primary flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform border border-primary/20 shrink-0">
                                    <UserCheck className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                                </div>
                                <div className="text-right space-y-2 md:space-y-3">
                                    <div className="flex items-center gap-2 md:gap-3 justify-end text-emerald-400">
                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse border-4 border-emerald-500/20 shadow-glow-emerald" />
                                        <p className="text-[8px] md:text-[11px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] px-3 md:px-6 py-1.5 md:py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 italic">Validated</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 md:gap-2 justify-end text-zinc-600 font-mono text-[8px] md:text-[9px] font-bold uppercase tracking-[0.1em] md:tracking-[0.3em] italic">
                                        <MapPin className="w-3 h-3 md:w-4 md:h-4 text-zinc-700" />
                                        <span className="truncate max-w-[120px] md:max-w-none">{lead.city || 'Brazil'}, {lead.state || 'UF'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-2 md:space-y-4">
                                <h4 className="text-2xl md:text-4xl font-display tracking-tight text-white group-hover:text-primary transition-colors leading-none uppercase italic truncate">
                                    {lead.full_name || 'REGISTRO ATIVO'}
                                </h4>
                                <p className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-[0.2em] md:tracking-[0.4em] italic leading-none">REGISTRO: <span className="text-zinc-500">{lead.cpf?.substring(0, 11)}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:gap-8 relative z-10">
                                {[
                                    { icon: ShieldCheck, label: 'Score', val: lead.score || '--', color: 'text-primary glow-primary font-display text-2xl md:text-4xl' },
                                    { icon: CreditCard, label: 'Renda', val: `${Number(lead.income || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`, color: 'text-white font-display text-xl md:text-3xl' },
                                ].map((item, i) => (
                                    <div key={i} className="glass-deep p-4 md:p-8 rounded-[24px] md:rounded-[40px] border border-white/5 space-y-3 md:space-y-5 hover:border-primary/20 transition-all shadow-xl">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <item.icon className="w-4 h-4 md:w-5 md:h-5 text-zinc-700" />
                                            <p className="text-[8px] md:text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest italic">{item.label}</p>
                                        </div>
                                        <p className={cn("italic leading-none tracking-tight truncate", item.color)}>{item.val}</p>
                                    </div>
                                ))}

                                <div className="col-span-2 glass-deep p-6 md:p-10 rounded-[28px] md:rounded-[40px] border border-emerald-500/10 flex items-center justify-between group/gov shadow-xl hover:bg-emerald-500/[0.02] transition-colors gap-4">
                                    <div className="space-y-1.5 md:space-y-3 overflow-hidden">
                                        <p className="text-[8px] md:text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Vinculação Gov</p>
                                        <p className="text-lg md:text-2xl font-mono text-white tracking-[0.1em] md:tracking-[0.2em] font-bold glow-emerald-sm italic truncate">
                                            {lead.num_gov || 'SECURED'}
                                        </p>
                                    </div>
                                    <Smartphone className="w-8 h-8 md:w-12 md:h-12 text-emerald-500/20 group-hover/gov:scale-125 transition-transform shrink-0" />
                                </div>
                            </div>

                            <div className="space-y-6 md:space-y-8 pt-6 md:pt-10 relative z-10 border-t border-white/5">
                                <div className="flex gap-4 md:gap-6">
                                    <div className="flex-1 relative group/owner overflow-hidden">
                                        <select
                                            value={selectedLigadorForLead[lead.id] || ''}
                                            onChange={(e) => setSelectedLigadorForLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                            className="w-full glass border border-white/10 rounded-[20px] md:rounded-[32px] py-4 md:py-7 px-6 md:px-10 text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.1em] md:tracking-[0.3em] outline-none group-hover/owner:border-primary/40 focus:border-primary transition-all cursor-pointer text-white italic shadow-2xl appearance-none text-center sm:text-left truncate pb-4"
                                        >
                                            <option value="" className="bg-[#0d0118]">OPERADOR</option>
                                            {ligadores.map(lig => (
                                                <option key={lig.id} value={lig.id} className="bg-[#0d0118] uppercase">👤 {lig.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => handleAssign(lead.id)}
                                        disabled={assigning === lead.id || !selectedLigadorForLead[lead.id]}
                                        className="w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-[24px] md:rounded-[40px] bg-primary text-white hover:bg-magenta active:scale-[0.94] transition-all shadow-[0_16px_40px_rgba(151,1,254,0.3)] flex items-center justify-center disabled:opacity-10 group/btn border border-primary/20"
                                    >
                                        {assigning === lead.id ? <Loader2 className="w-6 h-6 md:w-10 md:h-10 animate-spin" /> : <ShieldCheck className="w-8 h-8 md:w-12 md:h-12 group-hover/btn:scale-110 transition-transform" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination UI */}
            {leads.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-16 glass shadow-[0_64px_150px_rgba(0,0,0,0.8)] rounded-[32px] md:rounded-[64px] gap-8 md:gap-12 border border-white/10 stagger-5 bg-[#0d0118]/40 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 md:w-[500px] h-64 md:h-[500px] bg-primary/5 blur-[80px] md:blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex items-center gap-6 md:gap-12 relative z-10 w-full md:w-auto">
                        <div className="w-16 h-16 md:w-32 md:h-32 rounded-[24px] md:rounded-[48px] glass glow-magenta flex items-center justify-center border border-magenta/20 rotate-6 group-hover:rotate-0 transition-transform shrink-0">
                            <Cpu className="w-8 h-8 md:w-16 md:h-16 text-magenta animate-pulse" />
                        </div>
                        <div className="space-y-1 md:space-y-4 overflow-hidden">
                            <p className="text-[9px] md:text-[12px] font-mono font-bold uppercase tracking-[0.3em] md:tracking-[0.6em] text-zinc-600 italic leading-none whitespace-nowrap">Terminal</p>
                            <p className="text-3xl md:text-5xl font-display italic tracking-tight text-white leading-none whitespace-nowrap">
                                {page} <span className="text-primary mx-3 md:mx-6 text-xl md:text-2xl font-mono">/</span> {Math.ceil(totalCount / ITEMS_PER_PAGE) || 1}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8 relative z-10 w-full md:w-auto">
                        <button
                            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={page === 1}
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 md:gap-5 px-6 md:px-16 py-5 md:py-8 rounded-[20px] md:rounded-[40px] glass border border-white/10 text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] hover:bg-white/5 transition-all active:scale-95 disabled:opacity-10 text-zinc-400 italic shadow-2xl"
                        >
                            <ChevronLeft className="w-5 h-5 md:w-7 md:h-7" />
                            Anterior
                        </button>
                        <button
                            onClick={() => { setPage(p => (p * ITEMS_PER_PAGE < totalCount ? p + 1 : p)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={page * ITEMS_PER_PAGE >= totalCount}
                            className="flex-1 md:flex-none flex items-center justify-center gap-4 md:gap-6 px-10 md:px-24 py-5 md:py-8 rounded-[20px] md:rounded-[40px] bg-primary text-white text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] shadow-[0_16px_40px_rgba(151,1,254,0.3)] hover:bg-magenta transition-all active:scale-95 disabled:opacity-10 border border-primary/20 italic"
                        >
                            <span className="truncate">Próximo</span>
                            <ChevronRight className="w-5 h-5 md:w-7 md:h-7 shrink-0" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
