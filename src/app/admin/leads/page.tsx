'use client'

import { useEffect, useState } from 'react'
import { supabase, Lead } from '@/lib/supabase'
import {
    Search, Filter, ChevronDown, CheckCircle2, Clock,
    MapPin, ShieldCheck, UserCheck, AlertCircle,
    ChevronLeft, ChevronRight, MoreHorizontal, Eye,
    RefreshCcw, Loader2, X, Download, Trash2, Database,
    Smartphone, Zap, CreditCard, LayoutGrid, Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [incompleteCount, setIncompleteCount] = useState(0)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [filters, setFilters] = useState({
        income: '',
        score: '',
        age: '',
        sortBy: 'created_at',
        sortOrder: 'desc' as 'asc' | 'desc'
    })

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'incompleto': return 'PENDENTE'
            case 'consultado': return 'CONSULTADO'
            case 'concluido': return 'CONCLUÍDO'
            case 'atribuido': return 'ATRIBUÍDO'
            case 'arquivado': return 'ARQUIVADO'
            case 'pago': return 'SUCESSO $'
            case 'recusado': return 'FALHA/RECUSA'
            case 'ruim': return 'FICHA RUIM'
            default: return status.toUpperCase()
        }
    }

    const fetchLeads = async () => {
        setLoading(true)
        const start = (page - 1) * 50
        const end = start + 49

        let query = supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .range(start, end)
            .order(filters.sortBy || 'created_at', { ascending: filters.sortOrder === 'asc' })

        let cleanSearch = searchTerm
        if (/[\d.-]{11,14}/.test(searchTerm)) {
            // Se parecer um CPF, limpa pontos e traços para bater com o banco
            cleanSearch = searchTerm.replace(/\D/g, '')
        }

        if (cleanSearch) {
            query = query.or(`cpf.ilike.%${cleanSearch}%,full_name.ilike.%${searchTerm}%`)
        }

        if (filters.income === 'greater') query = query.gte('income', 5000)
        if (filters.income === 'less') query = query.lte('income', 4999)
        if (filters.score === 'greater') query = query.gte('score', 700)
        if (filters.score === 'less') query = query.lte('score', 699)
        if (filters.age === 'greater') query = query.gte('age', 40)
        if (filters.age === 'less') query = query.lte('age', 39)

        const { data, error, count } = await query

        const { count: incCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'incompleto')

        if (!error && data) {
            setLeads(data as Lead[])
            setTotalCount(count || 0)
            setIncompleteCount(incCount || 0)
        }
        setLoading(false)
    }

    const handleExportMissingGov = async () => {
        setLoading(true)
        const BATCH_SIZE = 1000
        let allData: { cpf: string }[] = []
        let from = 0
        let hasMore = true

        try {
            while (hasMore) {
                const { data, error } = await supabase
                    .from('leads')
                    .select('cpf')
                    .is('num_gov', null)
                    .neq('status', 'ruim')
                    .order('id')
                    .range(from, from + BATCH_SIZE - 1)

                if (error) throw error

                if (data && data.length > 0) {
                    allData = [...allData, ...data]
                    if (data.length < BATCH_SIZE) {
                        hasMore = false
                    } else {
                        from += BATCH_SIZE
                    }
                } else {
                    hasMore = false
                }
            }

            if (allData.length > 0) {
                const uniqueCpfs = Array.from(new Set(allData.map(l => l.cpf)))
                const cpfs = uniqueCpfs.join('\n')
                const blob = new Blob([cpfs], { type: 'text/plain' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `cpfs_sem_gov_${uniqueCpfs.length}_leads_${new Date().toISOString().split('T')[0]}.txt`
                a.click()
                window.URL.revokeObjectURL(url)
            } else {
                alert('Nenhum CPF sem número do governo encontrado.')
            }
        } catch (error: any) {
            alert('Erro ao exportar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleClearBase = async () => {
        if (!confirm('⚠️ ATENÇÃO: Isso vai APAGAR TODOS os leads do banco de dados. Tem certeza?')) return
        setLoading(true)
        const { error } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) alert('Erro ao limpar: ' + error.message)
        else {
            alert('🚀 Base limpa com sucesso!')
            fetchLeads()
        }
        setLoading(false)
    }
    const handleFixStatus = async () => {
        if (!confirm('⚠️ NORMALIZAR: Vai corrigir status apenas de leads NÃO atribuídos. Leads atribuídos NÃO serão afetados. Continuar?')) return
        setLoading(true)

        const { error: err1 } = await supabase
            .from('leads')
            .update({ status: 'incompleto' })
            .eq('status', 'concluido')
            .is('num_gov', null)
            .is('owner_id', null)

        const { error: err2 } = await supabase
            .from('leads')
            .update({ status: 'concluido' })
            .not('num_gov', 'is', null)
            .is('owner_id', null)
            .in('status', ['incompleto', 'consultado'])

        if (err1 || err2) alert('Erro: ' + (err1?.message || err2?.message))
        else {
            alert('🛠️ Normalização concluída! Leads atribuídos não foram afetados.')
            fetchLeads()
        }
        setLoading(false)
    }

    const handleRepairSystem = async () => {
        if (!confirm('🚀 REPARAR SISTEMA: Isso vai unificar CPFs duplicados e devolver fichas perdidas para os ligadores. Continuar?')) return
        setLoading(true)

        try {
            const res = await fetch('/api/fix-assigned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: 'fix-assigned-171033' })
            })
            const data = await res.json()
            
            if (res.ok) {
                alert(`✅ Reparação Concluída!\n\n- Fichas devolvidas: ${data.fichas_restauradas_para_ligador}\n- Duplicatas removidas: ${data.duplicatas_de_formatacao_removidas}`)
                fetchLeads()
            } else {
                alert('Erro na reparação: ' + data.error)
            }
        } catch (err) {
            alert('Falha na comunicação com o servidor.')
        } finally {
            setLoading(false)
        }
    }

    const handleFixRuim = async () => {
        if (!confirm('🔧 CORRIGIR FICHAS RUINS: Vai buscar TODOS os leads marcados como "ruim" que nunca foram consultados (sem score, sem renda) e devolver para "incompleto" (sem consulta). Continuar?')) return
        setLoading(true)

        try {
            // Buscar TODOS os leads com status 'ruim' usando paginação para garantir que pegamos tudo
            let ruimLeads: any[] = []
            let from = 0
            const BATCH_FETCH = 1000
            let hasMoreRuim = true

            while (hasMoreRuim) {
                const { data, error: fetchErr } = await supabase
                    .from('leads')
                    .select('id, cpf, score, income, phones, full_name, status')
                    .eq('status', 'ruim')
                    .order('id')
                    .range(from, from + BATCH_FETCH - 1)

                if (fetchErr) {
                    alert('Erro ao buscar leads ruins: ' + fetchErr.message)
                    setLoading(false)
                    return
                }

                if (data && data.length > 0) {
                    ruimLeads = [...ruimLeads, ...data]
                    if (data.length < BATCH_FETCH) hasMoreRuim = false
                    else from += BATCH_FETCH
                } else {
                    hasMoreRuim = false
                }
            }

            if (ruimLeads.length === 0) {
                alert('✅ Nenhum lead com status "ruim" encontrado!')
                setLoading(false)
                return
            }

            // Filtrar: leads que NÃO foram consultados (sem score E sem renda = nunca passou pela API)
            // Ou leads que têm phones vazio/null (nunca enriquecidos de verdade)
            const leadsToFix = ruimLeads.filter(lead => {
                const hasNoScore = !lead.score || lead.score === 0
                const hasNoIncome = !lead.income || lead.income === 0
                const hasNoPhones = !lead.phones || (Array.isArray(lead.phones) && lead.phones.length === 0)
                
                // Se não tem score NEM renda → nunca foi consultado, definitivamente errado
                if (hasNoScore && hasNoIncome) return true
                
                // Se não tem telefones → nunca foi enriquecido corretamente
                if (hasNoPhones && hasNoScore) return true
                
                return false
            })

            if (leadsToFix.length === 0) {
                alert(`✅ Todos os ${ruimLeads.length} leads "ruim" parecem estar corretos (já foram consultados e têm dados).`)
                setLoading(false)
                return
            }

            // Atualizar em batches
            const ids = leadsToFix.map(l => l.id)
            const BATCH = 300
            let fixed = 0

            for (let i = 0; i < ids.length; i += BATCH) {
                const batch = ids.slice(i, i + BATCH)
                const { error } = await supabase
                    .from('leads')
                    .update({ status: 'incompleto' })
                    .in('id', batch)
                
                if (!error) fixed += batch.length
            }

            alert(`✅ CORREÇÃO COMPLETA!\n\n📊 Total de leads "ruim": ${ruimLeads.length}\n🔧 Corrigidos (sem consulta → incompleto): ${fixed}\n✅ Legitimamente ruins (consultados): ${ruimLeads.length - leadsToFix.length}`)
            fetchLeads()
        } catch (err) {
            alert('Erro na correção: ' + String(err))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeads()
    }, [page, searchTerm, filters])

    return (
        <div className="space-y-8 md:space-y-16 p-4 md:p-12 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
            {/* Cabeçalho */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 md:gap-12 stagger-1">
                <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-4 md:gap-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[28px] glass glow-primary border border-primary/30 group rotate-3 hover:rotate-0 transition-transform flex items-center justify-center shrink-0">
                            <LayoutGrid className="w-7 h-7 md:w-9 md:h-9 text-primary group-hover:text-magenta transition-colors" />
                        </div>
                        <h2 className="text-3xl md:text-7xl font-display uppercase tracking-tight leading-none text-white italic">Painel de Leads - V3</h2>
                    </div>
                    <p className="text-zinc-500 font-bold text-sm md:text-lg flex items-center gap-3 md:gap-4 italic">
                        <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" />
                        <span className="font-mono text-[9px] md:text-[11px] tracking-[0.2em] md:tracking-[0.4em] uppercase opacity-70">Sistema Terminal de Controle Operacional</span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-4">
                    <button
                        onClick={handleRepairSystem}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-10 py-3 md:py-5 rounded-[20px] md:rounded-[32px] glass glow-emerald border border-emerald-500/20 text-emerald-400 text-[9px] md:text-[10px] font-mono font-bold uppercase hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                    >
                        <Zap className="w-3 md:w-4 h-3 md:h-4 fill-current" />
                        Reparar
                    </button>
                    <button
                        onClick={handleFixRuim}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-10 py-3 md:py-5 rounded-[20px] md:rounded-[32px] glass border border-rose-500/20 text-rose-400 text-[9px] md:text-[10px] font-mono font-bold uppercase hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-xl"
                    >
                        <AlertCircle className="w-3 md:w-4 h-3 md:h-4" />
                        Fix Ruins
                    </button>
                    <button
                        onClick={handleFixStatus}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-10 py-3 md:py-5 rounded-[20px] md:rounded-[32px] glass glow-gold border border-gold/20 text-gold text-[9px] md:text-[10px] font-mono font-bold uppercase hover:bg-gold/40 hover:text-white transition-all active:scale-95"
                    >
                        <ShieldCheck className="w-3 md:w-4 h-3 md:h-4" />
                        Status
                    </button>
                    <button
                        onClick={handleExportMissingGov}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-10 py-3 md:py-5 rounded-[20px] md:rounded-[32px] glass glow-cyan border border-cyan-500/20 text-cyan-400 text-[9px] md:text-[10px] font-mono font-bold uppercase hover:bg-cyan-500/40 hover:text-white transition-all active:scale-95"
                    >
                        <Download className="w-3 md:w-4 h-3 md:h-4" />
                        Export
                    </button>
                    <button
                        onClick={handleClearBase}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-10 py-3 md:py-5 rounded-[20px] md:rounded-[32px] glass-deep border border-destructive/20 text-destructive text-[9px] md:text-[10px] font-mono font-bold uppercase hover:bg-destructive hover:text-white transition-all active:scale-95 shadow-xl"
                    >
                        <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
                        Clean
                    </button>
                    <button
                        onClick={fetchLeads}
                        className="w-10 h-10 md:w-14 md:h-14 rounded-[16px] md:rounded-[28px] glass-deep border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all active:scale-95 group"
                    >
                        <RefreshCcw className={cn("w-4 md:w-5 h-4 md:h-5 text-zinc-500 group-hover:text-primary transition-colors", loading && "animate-spin text-primary")} />
                    </button>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 stagger-2">
                <div className="glass-card p-6 md:p-10 group overflow-hidden relative rounded-[32px] md:rounded-[56px] border border-white/5 shadow-2xl">
                    <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-primary/10 blur-[40px] md:blur-[60px] rounded-full group-hover:bg-primary/20 transition-colors" />
                    <div className="space-y-1 md:space-y-2 relative z-10">
                        <span className="text-[9px] md:text-[11px] font-mono font-bold uppercase text-zinc-600 tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Total Leads</span>
                        <p className="text-4xl md:text-6xl font-display italic tracking-tighter leading-none text-white glow-primary-sm">{totalCount.toLocaleString()}</p>
                    </div>
                    <div className="mt-4 md:mt-8 flex items-center gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-primary shadow-glow-primary animate-pulse" />
                        <span className="text-[8px] md:text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-widest italic leading-none">Base Sincronizada</span>
                    </div>
                </div>
                <div className="glass-card p-6 md:p-10 group overflow-hidden relative rounded-[32px] md:rounded-[56px] border border-amber-500/10 shadow-2xl">
                    <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-amber-500/10 blur-[40px] md:blur-[60px] rounded-full group-hover:bg-amber-500/20 transition-colors" />
                    <div className="space-y-1 md:space-y-2 relative z-10">
                        <span className="text-[9px] md:text-[11px] font-mono font-bold uppercase text-amber-500/70 tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Pendentes</span>
                        <p className="text-4xl md:text-6xl font-display italic tracking-tighter leading-none text-amber-500 glow-amber-sm">{incompleteCount.toLocaleString()}</p>
                    </div>
                    <div className="mt-4 md:mt-8 flex items-center gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-amber-500 shadow-glow-amber animate-pulse" />
                        <span className="text-[8px] md:text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-widest italic leading-none">Aguardando GOV</span>
                    </div>
                </div>
                <div className="glass-card p-6 md:p-10 group overflow-hidden relative rounded-[32px] md:rounded-[56px] border border-cyan-500/10 shadow-2xl">
                    <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-cyan-500/10 blur-[40px] md:blur-[60px] rounded-full group-hover:bg-cyan-500/20 transition-colors" />
                    <div className="space-y-1 md:space-y-2 relative z-10">
                        <span className="text-[9px] md:text-[11px] font-mono font-bold uppercase text-cyan-400/70 tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Eficiência</span>
                        <p className="text-4xl md:text-6xl font-display italic tracking-tighter leading-none text-cyan-400 glow-cyan-sm">
                            {totalCount > 0 ? Math.round(((totalCount - incompleteCount) / totalCount) * 100) : 0}%
                        </p>
                    </div>
                    <div className="mt-4 md:mt-8 flex items-center gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
                        <span className="text-[8px] md:text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-widest italic leading-none">Taxa Cruzada</span>
                    </div>
                </div>
                <div className="glass-card p-6 md:p-10 group overflow-hidden relative rounded-[32px] md:rounded-[56px] border border-magenta/10 shadow-2xl">
                    <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-magenta/10 blur-[40px] md:blur-[60px] rounded-full group-hover:bg-magenta/20 transition-colors" />
                    <div className="space-y-1 md:space-y-2 relative z-10">
                        <span className="text-[9px] md:text-[11px] font-mono font-bold uppercase text-magenta/70 tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Previsão</span>
                        <p className="text-4xl md:text-6xl font-display italic tracking-tighter leading-none text-magenta glow-magenta-sm">ULTRA</p>
                    </div>
                    <div className="mt-4 md:mt-8 flex items-center gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-magenta shadow-glow-magenta animate-pulse" />
                        <span className="text-[8px] md:text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-widest italic leading-none">Volume Terminal</span>
                    </div>
                </div>
            </div>

            {/* Filtros e Ordenação */}
            <div className="flex flex-col lg:flex-row gap-8 items-stretch stagger-3">
                <div className="relative flex-1 group w-full lg:w-auto">
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                        <Search className="w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Pesquisar por Nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-24 glass-deep border border-white/10 rounded-[32px] pl-20 pr-10 text-[11px] font-mono font-bold uppercase tracking-[0.3em] outline-none focus:border-primary/40 shadow-2xl transition-all placeholder:text-zinc-800 italic"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center">
                    {/* Ordenação Global */}
                    <div className="flex items-center gap-6 glass border border-primary/20 h-24 px-10 rounded-[32px] shadow-glow-sm bg-primary/5">
                        <div className="w-10 h-10 rounded-xl glass-deep flex items-center justify-center">
                            <Filter className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest italic">Critério</span>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                className="bg-transparent text-[11px] font-mono font-bold uppercase outline-none cursor-pointer text-white min-w-[140px] italic"
                            >
                                <option value="created_at" className="bg-[#0d0118]">📅 RECENTES</option>
                                <option value="income" className="bg-[#0d0118]">💰 POR RENDA</option>
                                <option value="score" className="bg-[#0d0118]">🎯 POR SCORE</option>
                                <option value="age" className="bg-[#0d0118]">👤 POR IDADE</option>
                            </select>
                        </div>
                        <div className="w-px h-10 bg-white/10 mx-2" />
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest italic">Direção</span>
                            <select
                                value={filters.sortOrder}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                                className="bg-transparent text-[11px] font-mono font-bold uppercase outline-none cursor-pointer text-primary-light italic glow-primary-sm"
                            >
                                <option value="desc" className="bg-[#0d0118]">MAIOR → MENOR</option>
                                <option value="asc" className="bg-[#0d0118]">MENOR → MAIOR</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto custom-scrollbar items-center">
                        {[
                            { label: 'RENDA', key: 'income', options: [{ v: 'greater', l: 'ALTA (>5K)' }, { v: 'less', l: 'MÉDIA (<5K)' }] },
                            { label: 'SCORE', key: 'score', options: [{ v: 'greater', l: 'ALTO (>700)' }, { v: 'less', l: 'BAIXO (<700)' }] }
                        ].map((f) => (
                            <div key={f.key} className="flex items-center gap-5 glass-deep border border-white/10 h-24 px-8 rounded-[32px] shrink-0 shadow-xl">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-mono font-bold uppercase text-zinc-600 tracking-widest italic">{f.label}</span>
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
                            </div>
                        ))}

                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setFilters({ 
                                    income: '', 
                                    score: '', 
                                    age: '',
                                    sortBy: 'created_at',
                                    sortOrder: 'desc'
                                })
                            }}
                            className="flex items-center gap-4 px-10 h-24 rounded-[32px] bg-white/5 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive transition-all italic shadow-2xl group"
                        >
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            REINICIAR
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabela de Leads */}
            <div className="glass shadow-[0_32px_100px_rgba(0,0,0,0.5)] relative border-white/10 rounded-[48px] stagger-4 overflow-hidden border">
                {loading && (
                    <div className="absolute inset-0 bg-[#0d0118]/80 backdrop-blur-2xl z-20 flex flex-col items-center justify-center p-12 text-center">
                        <Loader2 className="w-20 h-20 text-primary animate-spin mb-8 glow-primary rounded-full" />
                        <p className="text-[12px] font-mono font-bold uppercase tracking-[0.5em] text-primary animate-pulse italic">Sincronizando Banco de Dados...</p>
                    </div>
                )}

                <div className="overflow-x-auto overscroll-none">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#ffffff]/[0.02] border-b border-white/10">
                            <tr>
                                <th className="px-12 py-8 text-[11px] font-mono font-bold uppercase text-zinc-600 tracking-[0.4em] italic">Identificação Terminal</th>
                                <th className="px-12 py-8 text-[11px] font-mono font-bold uppercase text-zinc-600 tracking-[0.4em] italic">Análise Financeira</th>
                                <th className="px-12 py-8 text-[11px] font-mono font-bold uppercase text-zinc-600 tracking-[0.4em] italic">Origem</th>
                                <th className="px-12 py-8 text-[11px] font-mono font-bold uppercase text-zinc-600 tracking-[0.4em] italic text-center">Status</th>
                                <th className="px-12 py-8 text-right text-[11px] font-mono font-bold uppercase text-zinc-600 tracking-[0.4em] italic">Operação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leads.length > 0 ? leads.map((lead, idx) => (
                                <tr 
                                    key={lead.id} 
                                    className={cn(
                                        "hover:bg-[#ffffff]/[0.03] group transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-right-8",
                                        `stagger-${(idx % 5) + 1}`
                                    )} 
                                    onClick={() => setSelectedLead(lead)}
                                >
                                    <td className="px-12 py-10">
                                        <div className="flex items-center gap-8">
                                            <div className="w-14 h-14 rounded-[20px] glass-deep flex items-center justify-center font-mono font-bold text-[11px] text-zinc-600 border border-white/5 group-hover:border-primary/40 group-hover:text-primary transition-all">
                                                {lead.full_name?.substring(0, 2).toUpperCase() || '??'}
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xl font-display tracking-tight text-white group-hover:text-primary-light transition-colors italic leading-none">{lead.full_name || 'LEAD DESCONHECIDO'}</p>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-[11px] font-mono font-bold text-zinc-600 tracking-widest uppercase">CPF: {lead.cpf}</p>
                                                    {lead.num_gov && (
                                                        <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 italic glow-emerald-sm">VINCULADO GOV</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10">
                                        <div className="space-y-4">
                                            <p className="text-2xl font-display italic text-emerald-400 leading-none glow-emerald-sm">
                                                {lead.income ? Number(lead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '---'}
                                            </p>
                                            <div className="flex items-center gap-5">
                                                <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
                                                    <div className={cn(
                                                        "h-full transition-all duration-1000 shadow-glow-primary",
                                                        (lead.score || 0) > 700 ? "bg-primary" : (lead.score || 0) > 400 ? "bg-cyan-400" : "bg-destructive"
                                                    )} style={{ width: lead.score ? `${(lead.score / 1000) * 100}%` : '0%' }} />
                                                </div>
                                                <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest italic">{lead.score || '--'} SCR</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10">
                                        <div className="flex items-center gap-4">
                                            <MapPin className="w-4 h-4 text-zinc-700" />
                                            <p className="font-mono font-bold text-[12px] text-zinc-500 uppercase tracking-tighter italic leading-none">{lead.city || '??'} <span className="text-zinc-800 mx-2">/</span> {lead.state || '??'}</p>
                                        </div>
                                    </td>
                                    <td className="px-12 py-10 text-center">
                                        <div className={cn(
                                            "inline-flex items-center gap-3 px-6 py-2.5 rounded-full border text-[10px] font-mono font-bold tracking-[0.2em] uppercase italic bg-zinc-900/40",
                                            lead.status === 'incompleto' ? "text-gold border-gold/20 shadow-glow-gold-sm" :
                                                lead.status === 'consultado' ? "text-primary-light border-primary/20 shadow-glow-primary-sm" :
                                                    lead.status === 'atribuido' ? "text-cyan-400 border-cyan-500/20 shadow-glow-cyan-sm" :
                                                        lead.status === 'ruim' ? "text-destructive border-destructive/20" :
                                                            "text-emerald-400 border-emerald-500/20 shadow-glow-emerald-sm"
                                        )}>
                                            <div className={cn("w-2 h-2 rounded-full",
                                                lead.status === 'incompleto' ? "bg-gold animate-pulse" :
                                                    lead.status === 'consultado' ? "bg-primary animate-pulse" :
                                                        lead.status === 'atribuido' ? "bg-cyan-400 animate-pulse" :
                                                            lead.status === 'ruim' ? "bg-destructive" : "bg-emerald-400 animate-pulse"
                                            )} />
                                            {getStatusLabel(lead.status)}
                                        </div>
                                    </td>
                                    <td className="px-12 py-10 text-right">
                                        <button className="w-12 h-12 rounded-2xl glass-deep border border-white/5 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center group/btn active:scale-90">
                                            <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan={5} className="px-10 py-40 text-center">
                                        <AlertCircle className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600">Nenhum registro encontrado no sistema.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Paginação */}
            <div className="flex flex-col md:flex-row items-center justify-between p-10 glass shadow-2xl rounded-[48px] stagger-5 border-white/5 bg-[#0d0118]/50">
                <div className="space-y-2">
                    <p className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-zinc-600 italic">Métricas Operacionais</p>
                    <p className="text-3xl font-display text-white italic leading-none">{totalCount.toLocaleString()} <span className="text-zinc-700 text-sm font-bold mx-2 italic uppercase">Registros Cruzados</span></p>
                </div>

                <div className="flex items-center gap-6 mt-6 md:mt-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                        disabled={page === 1 || loading}
                        className="w-14 h-14 rounded-2xl glass-deep border border-white/10 text-zinc-600 hover:text-primary hover:border-primary/40 disabled:opacity-10 transition-all flex items-center justify-center active:scale-90"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="glass-deep border border-white/10 rounded-[28px] px-10 py-4 shadow-inner">
                        <span className="text-[11px] font-mono font-bold text-primary-light tracking-[0.3em] uppercase italic">Página {page}</span>
                        <span className="mx-4 text-white/50 text-[11px] font-bold">/</span>
                        <span className="text-[11px] font-mono font-bold text-zinc-700 uppercase italic">{Math.ceil(totalCount / 50) || 1}</span>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                        disabled={page * 50 >= totalCount || loading}
                        className="w-14 h-14 rounded-2xl glass-deep border border-white/10 text-zinc-600 hover:text-primary hover:border-primary/40 disabled:opacity-10 transition-all flex items-center justify-center active:scale-90"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Modal de Detalhes */}
            {selectedLead && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 bg-[#000000]/80 backdrop-blur-3xl animate-in fade-in duration-500 overflow-y-auto">
                    <div className="glass w-full max-w-6xl rounded-[32px] md:rounded-[64px] overflow-hidden shadow-[0_64px_150px_rgba(0,0,0,1)] animate-in zoom-in-95 slide-in-from-bottom-20 duration-700 flex flex-col border border-white/10 relative my-auto max-h-[92vh]">
                        <div className="absolute top-0 right-0 w-[400px] md:w-[500px] h-[400px] md:h-[500px] bg-primary/10 blur-[100px] md:blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        
                        {/* Header do Modal */}
                        <div className="px-6 md:px-16 py-6 md:py-12 border-b border-white/5 flex justify-between items-center bg-[#ffffff]/0.01 relative z-10 gap-4">
                            <div className="flex items-center gap-4 md:gap-10 overflow-hidden">
                                <div className="w-12 h-12 md:w-24 md:h-24 rounded-[16px] md:rounded-[32px] glass glow-primary flex items-center justify-center border border-primary/30 group shrink-0">
                                    <UserCheck className="w-6 h-6 md:w-12 md:h-12 text-primary group-hover:text-magenta transition-colors" />
                                </div>
                                <div className="space-y-1 md:space-y-2 overflow-hidden">
                                    <h3 className="text-xl md:text-5xl font-display uppercase tracking-tight text-white italic truncate leading-none">{selectedLead.full_name || 'DETALHES'}</h3>
                                    <p className="text-[8px] md:text-[12px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] md:tracking-[0.4em] italic truncate leading-none">REGISTRO: <span className="text-primary-light">{selectedLead.id?.substring(0, 10)}...</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="w-10 h-10 md:w-16 md:h-16 rounded-[12px] md:rounded-[28px] glass-deep hover:bg-destructive hover:text-white border border-white/5 transition-all flex items-center justify-center group/close shrink-0"
                            >
                                <X className="w-5 h-5 md:w-8 md:h-8 group-hover/close:rotate-90 transition-transform" />
                            </button>
                        </div>

                        {/* Corpo do Modal */}
                        <div className="px-6 md:px-16 py-6 md:py-12 overflow-y-auto flex-1 custom-scrollbar relative z-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                                <section className="space-y-8 md:space-y-12">
                                    {/* Score e Renda */}
                                    <div className="glass-card p-6 md:p-12 space-y-6 md:space-y-10 rounded-[24px] md:rounded-[48px] border border-primary/20 bg-primary/5 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute -right-5 md:-right-10 -top-5 md:-top-10 w-24 md:w-40 h-24 md:h-40 bg-primary/20 blur-[40px] md:blur-[50px] rounded-full group-hover:bg-primary/30 transition-colors" />
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end relative z-10 gap-4">
                                            <div className="space-y-1 md:space-y-3">
                                                <p className="text-[9px] md:text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Score</p>
                                                <p className="text-5xl md:text-7xl font-display italic text-primary-light glow-primary leading-none">{selectedLead.score || '--'}</p>
                                            </div>
                                            <div className="sm:text-right space-y-1 md:space-y-3">
                                                <p className="text-[9px] md:text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Ticket de Renda</p>
                                                <p className="text-2xl md:text-4xl font-display text-white italic leading-none">{selectedLead.income ? Number(selectedLead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '---'}</p>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 md:h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                            <div className="h-full bg-primary shadow-glow-primary transition-all duration-1000" style={{ width: `${(Number(selectedLead.score || 0) / 1000) * 100}%` }} />
                                        </div>
                                    </div>

                                    {/* Localização */}
                                    <div className="glass-card p-6 md:p-12 border border-white/10 rounded-[24px] md:rounded-[48px] space-y-4 md:space-y-8 shadow-2xl">
                                        <div className="flex items-center gap-3 md:gap-5 text-zinc-600">
                                            <MapPin className="w-4 md:w-6 h-4 md:h-6 shrink-0" />
                                            <span className="text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Geoverificação</span>
                                        </div>
                                        <div className="space-y-2 md:space-y-3">
                                            <p className="text-2xl md:text-5xl font-display tracking-tight text-white uppercase italic leading-none truncate">{selectedLead.city || 'DESCONHECIDO'}</p>
                                            <p className="text-base md:text-xl font-mono font-bold text-primary-light/70 tracking-tighter italic uppercase underline underline-offset-4 md:underline-offset-8 decoration-primary/30 leading-none">{selectedLead.state || 'UF'}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-8 md:space-y-12">
                                    {/* Cartão e Gov */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                                        <div className="glass-card p-6 md:p-10 border border-secondary/30 bg-secondary/10 rounded-[20px] md:rounded-[40px] shadow-2xl group transition-all hover:bg-secondary/20">
                                            <CreditCard className="w-6 md:w-8 h-6 md:h-8 text-secondary mb-4 md:mb-8 group-hover:scale-110 transition-transform" />
                                            <p className="text-[8px] md:text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-3 italic leading-none">BIN CARTÃO</p>
                                            <p className="text-xl md:text-3xl font-mono text-white tracking-[0.1em] md:tracking-[0.2em] mb-4 md:mb-6 leading-none">{selectedLead.card_bin || '------'}</p>
                                            <p className="text-[8px] md:text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-3 italic leading-none">EXPIRA</p>
                                            <p className="text-lg md:text-2xl font-mono text-white font-bold italic leading-none">{selectedLead.card_expiry || '--/--'}</p>
                                        </div>
                                        <div className="glass-card p-6 md:p-10 border border-emerald-500/20 bg-emerald-500/5 rounded-[20px] md:rounded-[40px] shadow-2xl group transition-all hover:bg-emerald-500/10 overflow-hidden">
                                            <Smartphone className="w-6 md:w-8 h-6 md:h-8 text-emerald-400 mb-4 md:mb-8 group-hover:scale-110 transition-transform" />
                                            <p className="text-[8px] md:text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-3 italic leading-none">NÚMERO GOV</p>
                                            <p className="text-xl md:text-2xl font-mono text-emerald-400 glow-emerald font-bold tracking-tight break-all leading-tight italic">
                                                {selectedLead.num_gov || 'SEM VINCULO'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Telefones */}
                                    <div className="glass-card p-6 md:p-12 border border-white/10 rounded-[24px] md:rounded-[48px] shadow-2xl overflow-hidden relative group">
                                         <div className="absolute -left-10 -bottom-10 w-32 md:w-40 h-32 md:h-40 bg-zinc-900/50 blur-[40px] md:blur-[50px] rounded-full" />
                                        <div className="flex items-center gap-4 text-zinc-600 mb-6 md:mb-10 relative z-10">
                                            <Activity className="w-5 h-5 md:w-6 md:h-6" />
                                            <span className="text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Contatos Cruzados</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 relative z-10">
                                            {selectedLead.phones?.length > 0 ? selectedLead.phones.map((p, i) => (
                                                <div key={i} className={cn(
                                                    "px-6 md:px-8 py-4 md:py-5 rounded-[16px] md:rounded-[24px] glass-deep flex items-center justify-between border border-white/5 group/phone transition-all hover:border-primary/20",
                                                    p === selectedLead.num_gov && "border-emerald-500/40 bg-emerald-500/10 glow-emerald-sm"
                                                )}>
                                                    <span className="font-mono text-sm md:text-lg font-bold tracking-widest text-zinc-300 italic truncate pr-4">{p}</span>
                                                    {p === selectedLead.num_gov ? (
                                                        <span className="text-[7px] md:text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-[0.1em] md:tracking-[0.3em] italic bg-emerald-500/10 px-2 md:px-4 py-1 rounded-full border border-emerald-500/20 shrink-0">GOV</span>
                                                    ) : (
                                                        <span className="text-[7px] md:text-[9px] font-mono font-bold text-zinc-700 uppercase tracking-[0.1em] md:tracking-[0.2em] italic opacity-0 group-hover/phone:opacity-100 transition-opacity shrink-0">SEC</span>
                                                    )}
                                                </div>
                                            )) : (
                                                <div className="py-6 text-center glass-deep rounded-[16px] md:rounded-[24px] border border-dashed border-white/10">
                                                    <p className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-widest italic opacity-40">Nenhum registro</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Footer do Modal */}
                        <div className="px-6 md:px-16 py-6 md:py-10 border-t border-white/5 bg-[#ffffff]/0.02 flex gap-4 md:gap-8 relative z-10">
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="flex-1 py-4 md:py-7 rounded-[18px] md:rounded-[32px] glass-deep border border-white/10 text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] hover:bg-primary/10 hover:border-primary/40 hover:text-primary-light transition-all active:scale-95 italic shadow-2xl"
                            >
                                <span className="flex items-center justify-center gap-3 md:gap-4">
                                    Fechar Terminal
                                    <ChevronDown className="w-5 h-5 opacity-50" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
