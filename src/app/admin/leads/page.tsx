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
        age: ''
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
            .order('created_at', { ascending: false })

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
        const { data, error } = await supabase
            .from('leads')
            .select('cpf')
            .is('num_gov', null)
            .neq('status', 'ruim')

        if (error) {
            alert('Erro ao exportar: ' + error.message)
        } else if (data && data.length > 0) {
            const cpfs = data.map(l => l.cpf).join('\n')
            const blob = new Blob([cpfs], { type: 'text/plain' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `cpfs_sem_gov_${new Date().toISOString().split('T')[0]}.txt`
            a.click()
            window.URL.revokeObjectURL(url)
        } else {
            alert('Nenhum CPF sem número do governo encontrado.')
        }
        setLoading(false)
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

    useEffect(() => {
        fetchLeads()
    }, [page, searchTerm, filters])

    return (
        <div className="space-y-12 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
            {/* Cabeçalho */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 stagger-1">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-[28px] glass glow-primary border-primary/30 group">
                            <LayoutGrid className="w-8 h-8 text-primary group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-display uppercase tracking-tight leading-none bg-gradient-to-r from-white via-white to-primary/50 bg-clip-text text-transparent">Base de Leads</h2>
                    </div>
                    <p className="text-muted-foreground font-medium text-lg flex items-center gap-3">
                        <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="font-mono text-sm tracking-wider uppercase opacity-70">Controle operacional em tempo real</span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleRepairSystem}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl glass-card text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:text-white hover:bg-emerald-500 transition-all active:scale-95 glow-emerald stagger-1"
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        Reparar Sistema
                    </button>
                    <button
                        onClick={handleFixStatus}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl glass-card text-gold text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:text-white hover:bg-gold/40 transition-all active:scale-95 glow-gold stagger-2"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Normalizar Status
                    </button>
                    <button
                        onClick={handleExportMissingGov}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl glass-card text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:text-white hover:bg-cyan-500/40 transition-all active:scale-95 glow-cyan stagger-3"
                    >
                        <Download className="w-4 h-4" />
                        Exportar CPFs
                    </button>
                    <button
                        onClick={handleClearBase}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl glass-card text-destructive text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:text-white hover:bg-destructive transition-all active:scale-95 stagger-4"
                    >
                        <Trash2 className="w-4 h-4" />
                        Limpar Base
                    </button>
                    <button
                        onClick={fetchLeads}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl glass-deep border-white/10 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95 stagger-5"
                    >
                        <RefreshCcw className={cn("w-4 h-4 transition-transform duration-700", loading && "animate-spin")} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-2">
                <div className="glass-card p-8 group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
                    <div className="space-y-1 relative z-10">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-[0.3em]">Total Leads</span>
                        <p className="text-5xl font-display italic tracking-tighter leading-none text-white">{totalCount.toLocaleString()}</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="status-dot bg-primary text-primary" />
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Base Ativa</span>
                    </div>
                </div>
                <div className="glass-card p-8 group overflow-hidden relative border-amber-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
                    <div className="space-y-1 relative z-10">
                        <span className="text-[10px] font-mono uppercase text-amber-500/70 tracking-[0.3em]">Pendentes</span>
                        <p className="text-5xl font-display italic tracking-tighter leading-none text-amber-500">{incompleteCount.toLocaleString()}</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="status-dot bg-amber-500 text-amber-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Aguardando GOV</span>
                    </div>
                </div>
                <div className="glass-card p-8 group overflow-hidden relative border-cyan-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
                    <div className="space-y-1 relative z-10">
                        <span className="text-[10px] font-mono uppercase text-cyan-400/70 tracking-[0.3em]">Eficiência</span>
                        <p className="text-5xl font-display italic tracking-tighter leading-none text-cyan-400">
                            {totalCount > 0 ? Math.round(((totalCount - incompleteCount) / totalCount) * 100) : 0}%
                        </p>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="status-dot bg-cyan-400 text-cyan-400" />
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Taxa de Conversão</span>
                    </div>
                </div>
                <div className="glass-card p-8 group overflow-hidden relative border-magenta/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-magenta/5 blur-3xl rounded-full" />
                    <div className="space-y-1 relative z-10">
                        <span className="text-[10px] font-mono uppercase text-magenta/70 tracking-[0.3em]">Projeção</span>
                        <p className="text-5xl font-display italic tracking-tighter leading-none text-magenta">HIGH</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="status-dot bg-magenta text-magenta animate-pulse" />
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Volume Estimado</span>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col lg:flex-row gap-6 items-center stagger-3">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Pesquisar por Nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full glass-deep border border-white/5 rounded-2xl py-5 pl-14 pr-8 text-[11px] font-mono uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    />
                </div>

                <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
                    {[
                        { label: 'Renda', key: 'income', options: [{ v: 'greater', l: 'Alta (>5k)' }, { v: 'less', l: 'Média (<5k)' }] },
                        { label: 'Score', key: 'score', options: [{ v: 'greater', l: 'Alto (>700)' }, { v: 'less', l: 'Baixo (<700)' }] },
                        { label: 'Idade', key: 'age', options: [{ v: 'greater', l: 'Acima 40' }, { v: 'less', l: 'Abaixo 40' }] }
                    ].map((f) => (
                        <div key={f.key} className="flex items-center gap-4 bg-secondary/20 border border-white/5 h-14 px-6 rounded-[24px] shrink-0">
                            <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic">{f.label}:</span>
                            <select
                                value={(filters as any)[f.key]}
                                onChange={(e) => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                                className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-white min-w-[100px]"
                            >
                                <option value="" className="bg-[#0c0c0e]">TODOS</option>
                                {f.options.map(opt => (
                                    <option key={opt.v} value={opt.v} className="bg-[#0c0c0e]">{opt.l}</option>
                                ))}
                            </select>
                        </div>
                    ))}

                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setFilters({ income: '', score: '', age: '' })
                        }}
                        className="flex items-center gap-3 px-8 h-14 rounded-[24px] bg-secondary/40 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                        <X className="w-4 h-4" /> Limpar
                    </button>
                </div>
            </div>

            {/* Tabela de Leads */}
            <div className="glass overflow-hidden shadow-2xl relative border-white/10 rounded-3xl stagger-4">
                {loading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-12 text-center">
                        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-6 glow-cyan rounded-full" />
                        <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-cyan-400 animate-pulse italic">Sincronizando Banco...</p>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-mono uppercase text-zinc-500 tracking-[0.4em]">Identificação</th>
                                <th className="px-10 py-6 text-[10px] font-mono uppercase text-zinc-500 tracking-[0.4em]">Finanças</th>
                                <th className="px-10 py-6 text-[10px] font-mono uppercase text-zinc-500 tracking-[0.4em]">Estado</th>
                                <th className="px-10 py-6 text-[10px] font-mono uppercase text-zinc-500 tracking-[0.4em] text-center">Status</th>
                                <th className="px-10 py-6 text-right text-[10px] font-mono uppercase text-zinc-500 tracking-[0.4em]">Operação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leads.length > 0 ? leads.map((lead, idx) => (
                                <tr 
                                    key={lead.id} 
                                    className={cn(
                                        "hover:bg-white/[0.02] group transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-right-4",
                                        `stagger-${(idx % 5) + 1}`
                                    )} 
                                    onClick={() => setSelectedLead(lead)}
                                >
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl glass-deep flex items-center justify-center font-mono text-[10px] text-zinc-600 border-white/5 group-hover:border-cyan-500/30 transition-all">
                                                {lead.full_name?.substring(0, 2).toUpperCase() || '??'}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-base font-display tracking-tight text-white group-hover:text-cyan-400 transition-colors">{lead.full_name || 'LEAD DESCONHECIDO'}</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] font-mono text-zinc-600 tracking-wider">CPF: {lead.cpf}</p>
                                                    {lead.num_gov && (
                                                        <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 italic">VINCULADO GOV</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="space-y-3">
                                            <p className="text-lg font-display text-emerald-400 leading-none">
                                                {lead.income ? Number(lead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---'}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-1 rounded-full bg-white/5 overflow-hidden border border-white/5">
                                                    <div className={cn(
                                                        "h-full transition-all duration-1000 shadow-glow",
                                                        (lead.score || 0) > 700 ? "bg-cyan-400" : (lead.score || 0) > 400 ? "bg-gold" : "bg-destructive"
                                                    )} style={{ width: lead.score ? `${(lead.score / 1000) * 100}%` : '0%' }} />
                                                </div>
                                                <span className="text-[9px] font-mono text-zinc-600">{lead.score || '--'} SCR</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-3.5 h-3.5 text-zinc-700" />
                                            <p className="font-mono text-[11px] text-zinc-400 uppercase tracking-tighter">{lead.city || '??'} / {lead.state || '??'}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-mono font-bold tracking-widest uppercase",
                                            lead.status === 'incompleto' ? "bg-gold/5 text-gold border-gold/10" :
                                                lead.status === 'consultado' ? "bg-primary/5 text-primary-light border-primary/10" :
                                                    lead.status === 'atribuido' ? "bg-cyan-500/5 text-cyan-400 border-cyan-500/10" :
                                                        lead.status === 'ruim' ? "bg-destructive/5 text-destructive border-destructive/10" :
                                                            "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                                        )}>
                                            <div className={cn("status-dot",
                                                lead.status === 'incompleto' ? "bg-gold" :
                                                    lead.status === 'consultado' ? "bg-primary" :
                                                        lead.status === 'atribuido' ? "bg-cyan-400" :
                                                            lead.status === 'ruim' ? "bg-destructive" : "bg-emerald-400"
                                            )} />
                                            {getStatusLabel(lead.status)}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button className="w-10 h-10 rounded-xl glass-deep border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all flex items-center justify-center">
                                            <Eye className="w-4 h-4" />
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
            <div className="flex flex-col md:flex-row items-center justify-between p-8 glass-card stagger-5">
                <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Métricas de Dados</p>
                    <p className="text-xl font-display text-white">{totalCount.toLocaleString()} <span className="opacity-40">registros totais</span></p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                        disabled={page === 1 || loading}
                        className="p-4 rounded-xl glass-deep border-white/5 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="bg-white/5 border border-white/5 rounded-xl px-6 py-4">
                        <span className="text-xs font-mono font-bold text-cyan-400 tracking-tighter">PAGE {page}</span>
                        <span className="mx-3 opacity-20">/</span>
                        <span className="text-xs font-mono text-zinc-600">{Math.ceil(totalCount / 50) || 1}</span>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                        disabled={page * 50 >= totalCount || loading}
                        className="p-4 rounded-xl glass-deep border-white/5 text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Modal de Detalhes */}
            {selectedLead && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-background/95 backdrop-blur-3xl animate-in fade-in duration-300">
                    <div className="glass w-full max-w-5xl rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh] flex flex-col border-white/10">
                        {/* Header do Modal */}
                        <div className="px-12 py-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-20 h-20 rounded-3xl glass glow-primary flex items-center justify-center border-primary/20">
                                    <UserCheck className="w-10 h-10 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-4xl font-display uppercase tracking-tight text-white">{selectedLead.full_name || 'DETALHES DO LEAD'}</h3>
                                    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">REGISTRO: <span className="text-cyan-400">{selectedLead.id}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="w-12 h-12 rounded-2xl glass-deep hover:bg-destructive transition-all flex items-center justify-center group"
                            >
                                <X className="w-6 h-6 group-hover:scale-110" />
                            </button>
                        </div>

                        {/* Corpo do Modal */}
                        <div className="p-12 overflow-y-auto flex-1 custom-scrollbar relative">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <section className="space-y-10">
                                    {/* Score e Renda */}
                                    <div className="glass-card p-10 space-y-8 border-cyan-500/10">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest">Índice de Crédito</p>
                                                <p className="text-5xl font-display italic text-cyan-400 glow-cyan leading-none">{selectedLead.score || '--'}</p>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest">Renda Estimada</p>
                                                <p className="text-3xl font-display text-white italic">R$ {Number(selectedLead.income || 0).toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-400 glow-cyan" style={{ width: `${(Number(selectedLead.score || 0) / 1000) * 100}%` }} />
                                        </div>
                                    </div>

                                    {/* Localização */}
                                    <div className="glass-card p-10 border-white/5 space-y-6">
                                        <div className="flex items-center gap-4 text-zinc-500">
                                            <MapPin className="w-5 h-5" />
                                            <span className="text-[10px] font-mono uppercase tracking-widest">Geolocalização</span>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-4xl font-display tracking-tight text-white uppercase">{selectedLead.city || 'DESCONHECIDO'}</p>
                                            <p className="text-base font-mono text-cyan-400/70 tracking-tighter">ESTADO DE {selectedLead.state || 'UF'}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-10">
                                    {/* Cartão e Gov */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="glass-card p-8 border-primary/20 bg-primary/5">
                                            <CreditCard className="w-6 h-6 text-primary mb-6" />
                                            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2">BIN</p>
                                            <p className="text-2xl font-mono text-white tracking-widest mb-4">{selectedLead.card_bin || '------'}</p>
                                            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2">VALIDADE</p>
                                            <p className="text-xl font-mono text-white">{selectedLead.card_expiry || '--/--'}</p>
                                        </div>
                                        <div className="glass-card p-8 border-emerald-500/20 bg-emerald-500/5">
                                            <Smartphone className="w-6 h-6 text-emerald-400 mb-6" />
                                            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2">NÚMERO GOV</p>
                                            <p className="text-2xl font-mono text-emerald-400 text-neon-emerald tracking-wide break-all">
                                                {selectedLead.num_gov || 'NÃO VINCULADO'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Telefones */}
                                    <div className="glass-card p-10 border-white/5">
                                        <div className="flex items-center gap-4 text-zinc-500 mb-8">
                                            <Activity className="w-5 h-5" />
                                            <span className="text-[10px] font-mono uppercase tracking-widest">Contatos Cruzados</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {selectedLead.phones?.length > 0 ? selectedLead.phones.map((p, i) => (
                                                <div key={i} className={cn(
                                                    "px-6 py-4 rounded-xl glass-deep flex items-center justify-between border-white/5",
                                                    p === selectedLead.num_gov && "border-emerald-500/30 bg-emerald-500/10"
                                                )}>
                                                    <span className="font-mono text-sm tracking-widest text-zinc-300">{p}</span>
                                                    {p === selectedLead.num_gov && (
                                                        <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-[0.2em]">Gov Principal</span>
                                                    )}
                                                </div>
                                            )) : <span className="text-xs font-mono text-zinc-700 italic">Contatos não disponíveis.</span>}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Footer do Modal */}
                        <div className="px-12 py-8 border-t border-white/5 bg-white/[0.02] flex gap-6">
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="flex-1 py-5 rounded-2xl glass-deep border-white/10 text-[10px] font-mono font-bold uppercase tracking-[0.3em] hover:bg-white/5 transition-all active:scale-95"
                            >
                                Encerrar Visualização
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
