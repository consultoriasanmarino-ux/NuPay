'use client'

import { useEffect, useState } from 'react'
import { supabase, Lead } from '@/lib/supabase'
import {
    Search, Filter, ChevronDown, CheckCircle2, Clock,
    MapPin, ShieldCheck, UserCheck, AlertCircle,
    ChevronLeft, ChevronRight, MoreHorizontal, Eye,
    RefreshCcw, Loader2, X
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

    const fetchLeads = async () => {
        setLoading(true)
        const start = (page - 1) * 50
        const end = start + 49

        // Query para os leads atuais (paginados)
        let query = supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .range(start, end)
            .order('created_at', { ascending: false })

        if (searchTerm) {
            query = query.or(`cpf.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        }

        const { data, error, count } = await query

        // Query para o total de incompletos
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

    const handleClearBase = async () => {
        if (!confirm('⚠️ ATENÇÃO: Isso apagará TODOS os leads do banco de dados para sempre. Deseja continuar?')) return

        setLoading(true)
        const { error } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Deleta tudo

        if (error) {
            alert('Erro ao limpar base: ' + error.message)
        } else {
            alert('🚀 Base recalibrada com sucesso!')
            fetchLeads()
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchLeads()
    }, [page, searchTerm])

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Gerenciamento de Leads</h2>
                    <p className="text-muted-foreground font-medium italic">Visualize e controle o status de toda a sua base.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleClearBase}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-black uppercase hover:bg-destructive hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-destructive/5"
                    >
                        <AlertCircle className="w-4 h-4" />
                        Limpar Toda a Base
                    </button>
                    <button
                        onClick={fetchLeads}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary border border-border text-xs font-black uppercase hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                        Atualizar Base
                    </button>
                </div>
            </div>

            {/* Stats Mini Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Total</span>
                    <span className="text-lg font-black">{totalCount}</span>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-yellow-500">Incompletos</span>
                    <span className="text-lg font-black">{incompleteCount}</span>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Pesquisar por Nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                </div>
                <div className="flex gap-2 w-full lg:w-auto overflow-x-auto scrollbar-hide">
                    <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-secondary border border-border text-xs font-black uppercase whitespace-nowrap"><Filter className="w-3.5 h-3.5" /> Estado</button>
                    <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-secondary border border-border text-xs font-black uppercase whitespace-nowrap"><Filter className="w-3.5 h-3.5" /> Score</button>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-secondary border border-border text-xs font-black uppercase whitespace-nowrap hover:bg-destructive/10 hover:text-destructive group transition-colors"
                    >
                        <X className="w-3.5 h-3.5" /> Limpar
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-card border border-border rounded-[32px] overflow-hidden shadow-2xl relative">
                {loading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest animate-pulse">Consultando Banco...</p>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-[#111114] border-b border-white/5">
                            <tr>
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Lead / CPF</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Nascimento / Idade</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Renda / Score</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Localidade</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Status Base</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leads.length > 0 ? leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-primary/5 group transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border group-hover:border-primary/30 transition-all font-black italic text-xs">LP</div>
                                            <div>
                                                <p className="font-extrabold tracking-tight truncate max-w-[180px] uppercase">{lead.full_name || 'PENDENTE'}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{lead.cpf}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold">{lead.birth_date ? new Date(lead.birth_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-- / -- / --'}</p>
                                        <p className="text-[10px] font-black text-primary uppercase mt-0.5 tracking-widest">{lead.age ? `${lead.age} ANOS` : 'CONSULTAR'}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-emerald-500 tracking-tighter">{lead.income ? Number(lead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ --.---'}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className={cn(
                                                "w-20 h-1.5 rounded-full bg-secondary overflow-hidden border border-white/5 relative",
                                                (lead.score || 0) > 700 ? "ring-1 ring-emerald-500/20" : ""
                                            )}>
                                                <div className={cn(
                                                    "h-full transition-all duration-1000",
                                                    lead.score ? (lead.score > 700 ? "bg-emerald-500" : "bg-yellow-500") : "bg-muted w-0"
                                                )} style={{ width: lead.score ? `${(lead.score / 1000) * 100}%` : '0%' }} />
                                            </div>
                                            <span className="text-[10px] font-black">{lead.score || '--'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                            <p className="font-bold text-xs uppercase italic tracking-tighter truncate max-w-[120px]">{lead.city || 'CIDADE'}/{lead.state || 'UF'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest",
                                            lead.status === 'incompleto' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                lead.status === 'consultado' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        )}>
                                            {lead.status === 'incompleto' ? <Clock className="w-3 h-3" /> :
                                                lead.status === 'consultado' ? <Search className="w-3 h-3" /> :
                                                    <CheckCircle2 className="w-3 h-3" />}
                                            {lead.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                            onClick={() => setSelectedLead(lead)}
                                            className="p-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-primary/20 hover:text-primary transition-all active:scale-90"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center space-y-4">
                                        <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                                        <div>
                                            <p className="text-xl font-black uppercase tracking-tighter opacity-20 italic">Nenhum Registro no Radar</p>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-2">Sua base de leads está limpa.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalhes */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="bg-[#111114] border border-white/10 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                    >
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <UserCheck className="w-8 h-8 text-primary font-black" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">{selectedLead.full_name || 'LEAD SEM NOME'}</h3>
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">{selectedLead.cpf}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-zinc-800 transition-all font-black"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-10 grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Data de Nascimento</p>
                                    <p className="text-lg font-bold">{selectedLead.birth_date ? new Date(selectedLead.birth_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-- / -- / --'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Idade</p>
                                    <p className="text-lg font-bold">{selectedLead.age ? `${selectedLead.age} ANOS` : 'NÃO CALCULADO'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Renda Estimada</p>
                                    <p className="text-lg font-bold text-emerald-500">{selectedLead.income ? Number(selectedLead.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ --.---'}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Localidade</p>
                                    <p className="text-lg font-bold uppercase">{selectedLead.city || 'CIDADE Desconhecida'} / {selectedLead.state || 'UF'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Score Serasa</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-2xl font-black">{selectedLead.score || '--'}</p>
                                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-primary" style={{ width: `${(selectedLead.score || 0) / 10}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Telefones</p>
                                    <div className="flex gap-2 flex-wrap mt-1">
                                        {selectedLead.phones?.length > 0 ? selectedLead.phones.map((p, i) => (
                                            <span key={i} className="text-[10px] font-black bg-zinc-800 px-3 py-1 rounded-lg border border-white/5">{p}</span>
                                        )) : <span className="text-xs font-bold opacity-30 italic">Nenhum telefone encontrado</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-zinc-900/50 border-t border-white/5 flex gap-4">
                            <div className="flex-1 p-4 rounded-2xl bg-black/40 border border-white/5">
                                <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic mb-1">Criação do Registro</p>
                                <p className="text-[11px] font-bold opacity-50">{new Date(selectedLead.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-black/40 border border-white/5">
                                <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic mb-1">Status Base</p>
                                <p className="text-[11px] font-black text-primary uppercase">{selectedLead.status}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination Container */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-card border border-border rounded-3xl gap-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">
                    Radar Master • <span className="text-foreground">{totalCount}</span> REGISTROS TOTAIS
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="p-3 rounded-xl border border-border bg-secondary/50 hover:bg-accent disabled:opacity-30 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1">
                        <span className="text-xs font-black bg-primary text-white px-4 py-2 rounded-lg italic">0{page}</span>
                        <span className="text-xs font-black text-muted-foreground px-4 py-2 opacity-50 italic">-- DE --</span>
                        <span className="text-xs font-black bg-secondary border border-border text-foreground px-4 py-2 rounded-lg italic">{Math.ceil(totalCount / 50) || 1}</span>
                    </div>

                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * 50 >= totalCount || loading}
                        className="p-3 rounded-xl border border-border bg-secondary/50 hover:bg-accent disabled:opacity-30 transition-all active:scale-95"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

