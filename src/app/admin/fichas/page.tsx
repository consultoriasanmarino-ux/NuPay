'use client'

import { useState, useEffect } from 'react'
import { Filter, ChevronDown, UserCheck, MoreHorizontal, ChevronLeft, ChevronRight, Eye, PhoneCall, Loader2, Database, User, Search, AlertCircle, ShieldCheck } from 'lucide-react'
import { supabase, Lead } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function FichasPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [ligadores, setLigadores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [assigning, setAssigning] = useState<string | null>(null)
    const [selectedLigadorForLead, setSelectedLigadorForLead] = useState<{ [key: string]: string }>({})

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

        // 2. Buscar Leads Concluídos com Paginação
        const start = (page - 1) * ITEMS_PER_PAGE
        const end = start + ITEMS_PER_PAGE - 1

        const { data, count, error } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .eq('status', 'concluido')
            .order('created_at', { ascending: false })
            .range(start, end)

        if (!error && data) {
            setLeads(data as Lead[])
            setTotalCount(count || 0)
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [page])

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
            // Remover da lista local para dar feedback visual imediato
            setLeads(prev => prev.filter(l => l.id !== leadId))
            setTotalCount(prev => prev - 1)
        }
        setAssigning(null)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Central de Atribuição</h2>
                    <p className="text-muted-foreground font-medium italic underline decoration-primary/20">Leads Concluídos prontos para o radar dos ligadores.</p>
                </div>

                <div className="flex items-center gap-3 bg-[#111114] border border-white/5 px-6 py-3 rounded-2xl shadow-xl">
                    <Database className="w-5 h-5 text-primary" />
                    <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Disponíveis</p>
                        <p className="text-xl font-black italic text-white tracking-tighter leading-none">{totalCount} LEADS</p>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {leads.map((lead) => (
                            <div key={lead.id} className="bg-[#111114] border border-white/5 rounded-[40px] p-6 flex flex-col space-y-6 hover:border-primary/40 transition-all group shadow-2xl relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                                        <UserCheck className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">PRONTO</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-black uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors">
                                        {lead.full_name || 'LEAD SEM NOME'}
                                    </h4>
                                    <p className="text-xs font-mono text-zinc-500 font-bold">{lead.cpf}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Score</p>
                                        <p className="text-sm font-black italic">{lead.score || '--'}</p>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Renda</p>
                                        <p className="text-sm font-black italic">R$ {Math.floor(Number(lead.income || 0))}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Atribuir Ligador</p>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedLigadorForLead[lead.id] || ''}
                                            onChange={(e) => setSelectedLigadorForLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                            className="flex-1 bg-secondary/80 border border-border rounded-xl px-3 py-2.5 text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecionar...</option>
                                            {ligadores.map(lig => (
                                                <option key={lig.id} value={lig.id}>{lig.full_name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleAssign(lead.id)}
                                            disabled={assigning === lead.id}
                                            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                                        >
                                            {assigning === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-[#111114] border border-white/5 rounded-[40px] gap-6 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5">
                                <Search className="w-5 h-5 text-zinc-500" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 italic">Página Atual</p>
                                <p className="text-lg font-black italic">{page} <span className="text-zinc-700 mx-2">/</span> {Math.ceil(totalCount / ITEMS_PER_PAGE) || 1}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-secondary border border-border text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-20"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(p => (p * ITEMS_PER_PAGE < totalCount ? p + 1 : p))}
                                disabled={page * ITEMS_PER_PAGE >= totalCount}
                                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-20"
                            >
                                Próxima
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
