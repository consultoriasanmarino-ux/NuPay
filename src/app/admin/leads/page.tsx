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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 selection:bg-primary/20">
            {/* Cabeçalho */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-[28px] bg-primary/10 border border-primary/20 shadow-2xl scale-110">
                            <LayoutGrid className="w-8 h-8 text-primary shadow-glow" />
                        </div>
                        <h2 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Base de Leads</h2>
                    </div>
                    <p className="text-muted-foreground font-medium italic opacity-60 text-lg flex items-center gap-3">
                        <Activity className="w-4 h-4 text-primary" />
                        Controle em tempo real de todos os leads cadastrados
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleRepairSystem}
                        className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.1)] italic"
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        Reparar Sistema
                    </button>
                    <button
                        onClick={handleFixStatus}
                        className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-2xl"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Normalizar Status
                    </button>
                    <button
                        onClick={handleExportMissingGov}
                        className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all active:scale-95 shadow-2xl italic"
                    >
                        <Download className="w-4 h-4" />
                        Exportar Sem Gov
                    </button>
                    <button
                        onClick={handleClearBase}
                        className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-[0.2em] hover:bg-destructive hover:text-white transition-all active:scale-95 shadow-2xl italic"
                    >
                        <Trash2 className="w-4 h-4" />
                        Limpar Base
                    </button>
                    <button
                        onClick={fetchLeads}
                        className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-secondary border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95"
                    >
                        <RefreshCcw className={cn("w-4 h-4 transition-transform duration-700", loading && "animate-spin")} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="glass p-8 rounded-[40px] flex items-center justify-between group hover:border-primary/20 transition-all">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] italic">Total de Leads</span>
                        <p className="text-4xl font-black italic tracking-tighter leading-none">{totalCount.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
                        <Database className="w-6 h-6" />
                    </div>
                </div>
                <div className="glass p-8 rounded-[40px] flex items-center justify-between group hover:border-amber-500/20 transition-all">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.3em] italic">Pendentes</span>
                        <p className="text-4xl font-black italic tracking-tighter leading-none">{incompleteCount.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/5 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity text-amber-500">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="PESQUISAR POR NOME OU CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary/30 border border-white/5 rounded-[28px] py-5 pl-14 pr-8 text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-primary/20 transition-all"
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
            <div className="glass rounded-[56px] overflow-hidden shadow-2xl relative border-white/5">
                {loading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse italic">Carregando leads...</p>
                    </div>
                )}

                <div className="overflow-x-auto scroll-smooth">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-secondary/40 border-b border-white/5">
                            <tr>
                                <th className="px-10 py-8 text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] italic leading-none">Identificação</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] italic leading-none">Renda / Score</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] italic leading-none">Localização</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] italic leading-none text-center">Status</th>
                                <th className="px-10 py-8 text-right text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] italic leading-none">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leads.length > 0 ? leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-primary/[0.03] group transition-all duration-300 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                                    <td className="px-10 py-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-[20px] bg-secondary/50 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/20 transition-all font-black text-xs text-zinc-700">SIG</div>
                                            <div className="space-y-2">
                                                <p className="text-lg font-black tracking-tighter truncate max-w-[240px] uppercase italic text-zinc-100 leading-none group-hover:text-primary transition-colors">{lead.full_name || 'SEM NOME'}</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] font-black text-zinc-600 tracking-[0.1em]">CPF: {lead.cpf}</p>
                                                    {lead.num_gov && (
                                                        <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full border border-emerald-500/20 italic tracking-widest">GOV ✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-10">
                                        <div className="space-y-4">
                                            <p className="text-xl font-black text-emerald-500 tracking-tighter leading-none italic uppercase">{lead.income ? Number(lead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---'}</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden border border-white/5 relative">
                                                    <div className={cn(
                                                        "h-full transition-all duration-1000",
                                                        (lead.score || 0) > 700 ? "bg-emerald-500 shadow-glow" : (lead.score || 0) > 400 ? "bg-amber-500" : "bg-destructive"
                                                    )} style={{ width: lead.score ? `${(lead.score / 1000) * 100}%` : '0%' }} />
                                                </div>
                                                <span className="text-[11px] font-black italic opacity-60">SCORE {lead.score || '--'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-10">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                                                <p className="font-black text-[11px] uppercase italic tracking-tighter text-zinc-400 leading-none truncate max-w-[150px]">{lead.city || 'SEM CIDADE'}</p>
                                            </div>
                                            <p className="text-[9px] font-black text-zinc-700 tracking-[0.3em] uppercase pl-5">Estado: {lead.state || 'UF'}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-10 text-center">
                                        <div className={cn(
                                            "inline-flex items-center gap-3 px-6 py-2.5 rounded-full border text-[9px] font-black uppercase tracking-[0.3em] italic leading-none",
                                            lead.status === 'incompleto' ? "bg-amber-500/5 text-amber-500 border-amber-500/10" :
                                                lead.status === 'consultado' ? "bg-primary/5 text-primary border-primary/10" :
                                                    lead.status === 'atribuido' ? "bg-blue-500/5 text-blue-400 border-blue-500/10" :
                                                        lead.status === 'ruim' ? "bg-destructive/5 text-destructive border-destructive/10" :
                                                            "bg-emerald-500/5 text-emerald-500 border-emerald-500/10"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full",
                                                lead.status === 'incompleto' ? "bg-amber-500" :
                                                    lead.status === 'consultado' ? "bg-primary" :
                                                        lead.status === 'atribuido' ? "bg-blue-400" :
                                                            lead.status === 'ruim' ? "bg-destructive" : "bg-emerald-500"
                                            )} />
                                            {getStatusLabel(lead.status)}
                                        </div>
                                    </td>
                                    <td className="px-10 py-10 text-right">
                                        <button
                                            className="p-4 rounded-2xl bg-secondary/50 border border-white/5 hover:bg-primary hover:text-white transition-all active:scale-95 shadow-2xl group/action"
                                        >
                                            <Eye className="w-5 h-5 group-hover/action:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan={5} className="px-10 py-40 text-center space-y-6">
                                        <div className="w-24 h-24 bg-secondary/20 rounded-[40px] border border-dashed border-white/10 flex items-center justify-center mx-auto mb-6">
                                            <AlertCircle className="w-12 h-12 text-zinc-800" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-3xl font-black uppercase italic tracking-tighter opacity-10">Nenhum Lead Encontrado</p>
                                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] italic">Importe leads para popular a base de dados.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Paginação */}
            <div className="flex flex-col md:flex-row items-center justify-between p-8 glass rounded-[40px] gap-8 border-white/5">
                <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 italic leading-none">Total na base</p>
                    <p className="text-lg font-black italic tracking-tighter text-white uppercase">{totalCount.toLocaleString()} leads cadastrados</p>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                        disabled={page === 1 || loading}
                        className="p-4 rounded-[20px] border border-white/5 bg-secondary text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-20 transition-all active:scale-95 shadow-2xl group"
                    >
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-[24px] border border-white/5 shadow-inner">
                        <span className="text-[10px] font-black bg-primary text-white px-6 py-3 rounded-[20px] italic shadow-glow">PÁG {page}</span>
                        <div className="w-px h-6 bg-white/5 mx-2" />
                        <span className="text-[10px] font-black text-zinc-600 px-6 py-3 italic">DE {Math.ceil(totalCount / 50) || 1}</span>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                        disabled={page * 50 >= totalCount || loading}
                        className="p-4 rounded-[20px] border border-white/5 bg-secondary text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-20 transition-all active:scale-95 shadow-2xl group"
                    >
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Modal de Detalhes */}
            {selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 lg:p-12 bg-background/95 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="glass w-full max-w-4xl rounded-[64px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[95vh] flex flex-col border-white/10">
                        {/* Header do Modal */}
                        <div className="px-12 py-12 border-b border-white/5 flex justify-between items-start bg-secondary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                            <div className="flex items-center gap-10 relative z-10">
                                <div className="w-28 h-28 rounded-[40px] bg-gradient-to-br from-primary/20 to-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl">
                                    <UserCheck className="w-16 h-16 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{selectedLead.full_name || 'LEAD SEM NOME'}</h3>
                                    <p className="text-sm text-zinc-500 font-black uppercase tracking-[0.4em] italic leading-none">CPF: <span className="text-white">{selectedLead.cpf}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="w-16 h-16 rounded-[28px] bg-secondary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all font-black text-zinc-500 shadow-2xl flex items-center justify-center relative z-10"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Corpo do Modal */}
                        <div className="p-12 overflow-y-auto flex-1 custom-scrollbar relative">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <section className="space-y-8">
                                    {/* Score e Renda */}
                                    <div className="bento-card bg-[#0c0c0e] p-10 rounded-[48px] border border-white/5 space-y-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] italic leading-none">Score Serasa</p>
                                            <p className="text-4xl font-black italic text-glow leading-none pt-4">{selectedLead.score || '--'} <span className="text-zinc-800 text-sm">/ 1000</span></p>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] italic leading-none">Renda Estimada</p>
                                            <p className="text-5xl font-black text-emerald-500 emerald-glow italic tracking-tighter leading-none pt-2">R$ {Number(selectedLead.income || 0).toLocaleString('pt-BR')}</p>
                                        </div>
                                    </div>

                                    {/* Localização */}
                                    <div className="glass p-10 rounded-[48px] border-white/5 space-y-6">
                                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] italic leading-none">Localização</p>
                                        <div className="space-y-2">
                                            <p className="text-3xl font-black italic uppercase tracking-tighter text-white">{selectedLead.city || 'SEM CIDADE'}</p>
                                            <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest pl-1">Estado: {selectedLead.state || 'UF'}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-8">
                                    {/* BIN e Validade - SEPARADOS */}
                                    <div className="bg-primary/5 border border-primary/20 p-10 rounded-[48px] relative overflow-hidden group">
                                        <div className="absolute -top-6 -right-6 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000 rotate-12">
                                            <CreditCard className="w-32 h-32 text-primary" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em] mb-8 italic leading-none">Dados do Cartão</p>
                                        <div className="space-y-6">
                                            <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">BIN do Cartão</p>
                                                <p className="text-3xl font-black italic text-white tracking-[0.3em] text-glow leading-none">{selectedLead.card_bin || '------'}</p>
                                            </div>
                                            <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Validade</p>
                                                <p className="text-3xl font-black italic text-white tracking-[0.2em] text-glow leading-none">{selectedLead.card_expiry || '--/----'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Número do Governo */}
                                    {selectedLead.num_gov && (
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-10 rounded-[48px] relative overflow-hidden group">
                                            <div className="absolute -top-6 -right-6 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000 rotate-12">
                                                <Smartphone className="w-32 h-32 text-emerald-500" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em] mb-4 italic leading-none text-glow">Número do Governo</p>
                                            <p className="text-5xl font-black text-white italic tracking-tighter leading-none pt-4">{selectedLead.num_gov}</p>
                                        </div>
                                    )}

                                    {/* Telefones */}
                                    <div className="bg-[#0c0c0e] border border-white/5 p-10 rounded-[48px]">
                                        <p className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.3em] mb-8 italic leading-none">Contatos Encontrados</p>
                                        <div className="flex flex-wrap gap-4">
                                            {selectedLead.phones?.length > 0 ? selectedLead.phones.map((p, i) => (
                                                <div key={i} className={cn(
                                                    "px-6 py-4 rounded-2xl border text-[12px] font-black transition-all flex items-center gap-3",
                                                    p === selectedLead.num_gov ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-glow" : "bg-black border-white/5 text-zinc-500"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", p === selectedLead.num_gov ? "bg-emerald-500 shadow-glow animate-pulse" : "bg-white/10")} />
                                                    {p}
                                                </div>
                                            )) : <span className="text-xs font-bold opacity-30 italic">Nenhum telefone encontrado.</span>}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Footer do Modal */}
                        <div className="px-12 py-10 border-t border-white/5 bg-secondary/10 flex gap-6">
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="flex-1 py-6 rounded-[32px] bg-secondary border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95 shadow-2xl italic"
                            >
                                Fechar Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
