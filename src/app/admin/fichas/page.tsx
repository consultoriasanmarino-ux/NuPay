'use client'

import { useState, useEffect } from 'react'
import { Filter, ChevronDown, UserCheck, MoreHorizontal, ChevronLeft, ChevronRight, Eye, PhoneCall, Loader2, Database, User, Search, AlertCircle, ShieldCheck, MapPin, Calendar, Clock, Layers } from 'lucide-react'
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
        income: '', // 'greater', 'less'
        score: '',
        age: ''
    })

    const ITEMS_PER_PAGE = 50

    const fetchData = async () => {
        setLoading(true)

        // 1. Buscar Ligadores para o Select
        const { data: ligs } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'ligador')
            .order('full_name')

        if (ligs) setLigadores(ligs)

        // 2. Buscar Leads Concluídos com Paginação e Filtros
        const start = (page - 1) * ITEMS_PER_PAGE
        const end = start + ITEMS_PER_PAGE - 1

        let query = supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('status', 'concluido')
            .order('score', { ascending: false }) // Ordenar por melhor score por padrão
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
            alert('Por favor, selecione um ligador primeiro.')
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
            alert('Erro ao atribuir: ' + error.message)
        } else {
            setLeads(prev => prev.filter(l => l.id !== leadId))
            setTotalCount(prev => prev - 1)
        }
        setAssigning(null)
    }

    const handleBatchAssign = async () => {
        if (!selectedLigadorBatch) {
            alert('Por favor, selecione um ligador para o lote.')
            return
        }

        const leadsToAssign = leads.slice(0, 10)
        if (leadsToAssign.length === 0) {
            alert('Nenhum lead disponível para atribuir.')
            return
        }

        const selectedLigadorName = ligadores.find(l => l.id === selectedLigadorBatch)?.full_name || 'este ligador'
        if (!confirm(`Deseja atribuir os primeiros ${leadsToAssign.length} leads para ${selectedLigadorName}?`)) return

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
            alert('Erro na atribuição em lote: ' + error.message)
        } else {
            alert(`✅ ${leadsToAssign.length} leads atribuídos com sucesso!`)
            fetchData() // Recarregar base
        }
        setBatchAssigning(false)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Central de Atribuição</h2>
                    <p className="text-muted-foreground font-medium italic underline decoration-primary/20">Leads Concluídos prontos para o radar dos ligadores.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 bg-[#111114] border border-white/5 px-6 py-3 rounded-2xl shadow-xl">
                        <Database className="w-5 h-5 text-primary" />
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Disponíveis</p>
                            <p className="text-xl font-black italic text-white tracking-tighter leading-none">{totalCount} LEADS</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros e Atribuição em Lote */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#111114] border border-white/5 p-4 rounded-[32px] shadow-xl">
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <select
                            value={filters.income}
                            onChange={(e) => setFilters(p => ({ ...p, income: e.target.value }))}
                            className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Renda (Todas)</option>
                            <option value="greater">Maior que 5k</option>
                            <option value="less">Menor que 5k</option>
                        </select>
                    </div>

                    <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <select
                            value={filters.score}
                            onChange={(e) => setFilters(p => ({ ...p, score: e.target.value }))}
                            className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Score (Todos)</option>
                            <option value="greater">Maior que 700</option>
                            <option value="less">Menor que 700</option>
                        </select>
                    </div>

                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <select
                            value={filters.age}
                            onChange={(e) => setFilters(p => ({ ...p, age: e.target.value }))}
                            className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Idade (Todas)</option>
                            <option value="greater">Maior que 40 anos</option>
                            <option value="less">Menor que 40 anos</option>
                        </select>
                    </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-[32px] flex items-center gap-3">
                    <div className="relative flex-1 group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <select
                            value={selectedLigadorBatch}
                            onChange={(e) => setSelectedLigadorBatch(e.target.value)}
                            className="w-full bg-black/40 border border-primary/20 rounded-xl py-3 pl-9 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer text-primary"
                        >
                            <option value="">Lote para...</option>
                            {ligadores.map(lig => (
                                <option key={lig.id} value={lig.id}>{lig.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleBatchAssign}
                        disabled={batchAssigning || loading || leads.length === 0}
                        className="bg-primary text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2 px-4"
                    >
                        {batchAssigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                        <span className="text-[10px] font-black uppercase">10 UND</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Sincronizando Fichas...</p>
                </div>
            ) : leads.length === 0 ? (
                <div className="bg-[#111114] border-2 border-dashed border-white/5 rounded-[48px] p-24 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl">
                    <div className="w-24 h-24 bg-secondary/50 rounded-3xl flex items-center justify-center text-muted-foreground/20 border border-white/5">
                        <PhoneCall className="w-12 h-12" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Nenhum Lead para Atribuição</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto italic opacity-50 mt-2">Os leads aparecerão aqui assim que forem marcados como "Concluídos" no processo de enriquecimento ou importação.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {leads.map((lead) => (
                            <div key={lead.id} className="bg-[#111114] border border-white/5 rounded-[40px] p-8 flex flex-col space-y-6 hover:border-primary/40 transition-all group shadow-2xl relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <UserCheck className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 mb-2">PRONTO</p>
                                        <div className="flex items-center gap-2 justify-end text-zinc-500">
                                            <MapPin className="w-3 h-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">{lead.city || 'CIDADE'}, {lead.state || 'UF'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-2xl font-black uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors leading-none">
                                        {lead.full_name || 'LEAD SEM NOME'}
                                    </h4>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1 italic">CPF: {lead.cpf}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/40 p-4 rounded-3xl border border-white/5 hover:border-primary/20 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="w-3 h-3 text-primary" />
                                            <p className="text-[9px] font-black text-zinc-600 uppercase">Score Serasa</p>
                                        </div>
                                        <p className="text-2xl font-black italic text-white leading-none">{lead.score || '--'}</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-3xl border border-white/5 hover:border-emerald-500/20 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className="w-3 h-3 text-emerald-500" />
                                            <p className="text-[9px] font-black text-zinc-600 uppercase">Renda Est.</p>
                                        </div>
                                        <p className="text-xl font-black italic text-emerald-500 leading-none">R$ {Number(lead.income || 0).toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-3xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-3 h-3 text-blue-500" />
                                            <p className="text-[9px] font-black text-zinc-600 uppercase">Idade</p>
                                        </div>
                                        <p className="text-xl font-black italic leading-none">{lead.age || '--'} ANOS</p>
                                    </div>
                                    <div className="bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-3 h-3 text-emerald-500" />
                                            <p className="text-[9px] font-black text-emerald-500 uppercase">Num. GOV</p>
                                        </div>
                                        <p className="text-sm font-black italic text-white truncate">{lead.num_gov || 'PENDENTE'}</p>
                                    </div>
                                </div>

                                <div className="bg-black/20 p-4 rounded-3xl border border-white/5 space-y-2">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">Contatos Encontrados</p>
                                    <div className="flex flex-wrap gap-2">
                                        {lead.phones && lead.phones.length > 0 ? lead.phones.slice(0, 3).map((p: string, i: number) => (
                                            <span key={i} className={cn(
                                                "text-[9px] font-black px-3 py-1.5 rounded-xl border",
                                                p === lead.num_gov ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500" : "bg-white/5 border-white/5 text-zinc-400"
                                            )}>
                                                {p} {p === lead.num_gov && '⭐'}
                                            </span>
                                        )) : <span className="text-[9px] font-black text-zinc-700 italic">Nenhum número local...</span>}
                                        {(lead.phones?.length || 0) > 3 && <span className="text-[9px] font-black text-zinc-600">+{lead.phones.length - 3}</span>}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-3 h-3 text-primary" />
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Destinar ao Ligador</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <select
                                            value={selectedLigadorForLead[lead.id] || ''}
                                            onChange={(e) => setSelectedLigadorForLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                            className="flex-1 bg-secondary/80 border border-border rounded-2xl px-4 py-3 text-xs font-black uppercase outline-none focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecionar...</option>
                                            {ligadores.map(lig => (
                                                <option key={lig.id} value={lig.id}>{lig.full_name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleAssign(lead.id)}
                                            disabled={assigning === lead.id}
                                            className="w-12 h-12 shrink-0 rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 disabled:opacity-50"
                                        >
                                            {assigning === lead.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-[#111114] border border-white/5 rounded-[48px] gap-6 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                                <Search className="w-6 h-6 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 italic leading-none mb-1">Paginação Master</p>
                                <p className="text-2xl font-black italic tracking-tighter leading-none">{page} <span className="text-zinc-700 mx-2 text-sm italic">de</span> {Math.ceil(totalCount / ITEMS_PER_PAGE) || 1}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={page === 1}
                                className="flex items-center gap-2 px-8 py-5 rounded-2xl bg-secondary border border-border text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-20 shadow-xl"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Anterior
                            </button>
                            <button
                                onClick={() => { setPage(p => (p * ITEMS_PER_PAGE < totalCount ? p + 1 : p)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={page * ITEMS_PER_PAGE >= totalCount}
                                className="flex items-center gap-2 px-10 py-5 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-20 italic italic tracking-tighter"
                            >
                                Próxima Fila
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
