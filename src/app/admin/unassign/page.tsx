'use client'

import { useState, useEffect } from 'react'
import {
    UserMinus,
    Users,
    ChevronLeft,
    Loader2,
    Search,
    User,
    AlertCircle,
    Trash2,
    Unlock,
    X,
    Activity,
    Signal,
    Smartphone,
    Database,
    ShieldCheck,
    Zap
} from 'lucide-react'
import { supabase, Lead } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function UnassignPage() {
    const [ligadores, setLigadores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLigador, setSelectedLigador] = useState<any | null>(null)
    const [leads, setLeads] = useState<Lead[]>([])
    const [loadingLeads, setLoadingLeads] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchLigadores = async () => {
        setLoading(true)

        // Fetch ALL leads that have an owner (not archived) in batches
        let attributedLeads: any[] = []
        let from = 0
        const BATCH = 1000
        let hasMore = true

        while (hasMore) {
            const { data, error } = await supabase
                .from('leads')
                .select('owner_id')
                .not('owner_id', 'is', null)
                .neq('status', 'arquivado')
                .range(from, from + BATCH - 1)

            if (error) {
                console.error('Error fetching leads:', error.message)
                hasMore = false
            } else if (data && data.length > 0) {
                attributedLeads = [...attributedLeads, ...data]
                if (data.length < BATCH) hasMore = false
                else from += BATCH
            } else {
                hasMore = false
            }
        }

        const counts: { [key: string]: number } = {}
        attributedLeads.forEach(l => {
            if (l.owner_id) {
                counts[l.owner_id] = (counts[l.owner_id] || 0) + 1
            }
        })

        // Fetch all operators
        const { data: profs } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'ligador')
            .order('full_name')

        if (profs) {
            const data = profs.map(l => ({
                ...l,
                leadCount: counts[l.id] || 0
            }))
            setLigadores(data)
        }
        setLoading(false)
    }

    const fetchLeadsForLigador = async (lig: any) => {
        setLoadingLeads(true)
        setSelectedLigador(lig)

        const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('owner_id', lig.id)
            .neq('status', 'arquivado')
            .order('created_at', { ascending: false })

        setLeads(data as Lead[] || [])
        setLoadingLeads(false)
    }

    const handleUnassignLead = async (leadId: string) => {
        if (!confirm('CONFIRM: DE-ASSIGN SIGNAL FROM OPERATOR?')) return

        setProcessing(true)
        const { error } = await supabase
            .from('leads')
            .update({
                owner_id: null,
                status: 'concluido'
            })
            .eq('id', leadId)

        if (error) {
            alert('UNASSIGN FAILED: ' + error.message)
        } else {
            setLeads(prev => prev.filter(l => l.id !== leadId))
            // Update the count in the background
            setLigadores(prev => prev.map(l => l.id === selectedLigador.id ? { ...l, leadCount: l.leadCount - 1 } : l))
        }
        setProcessing(false)
    }

    const handleUnassignAll = async () => {
        if (!selectedLigador || leads.length === 0) return

        if (!confirm(`⚠️ CRITICAL: UNASSIGN ALL ${leads.length} SIGNALS FROM ${selectedLigador.full_name}?`)) return

        setProcessing(true)
        const ids = leads.map(l => l.id)

        const { error } = await supabase
            .from('leads')
            .update({
                owner_id: null,
                status: 'concluido'
            })
            .in('id', ids)

        if (error) {
            alert('FLASH UNASSIGN FAILED: ' + error.message)
        } else {
            alert('🚀 RADIUS CLEARED. SIGNALS RECALIBRATED TO BASE.')
            setLeads([])
            setLigadores(prev => prev.map(l => l.id === selectedLigador.id ? { ...l, leadCount: 0 } : l))
        }
        setProcessing(false)
    }

    useEffect(() => {
        fetchLigadores()
    }, [])

    const filteredLigadores = ligadores.filter(l =>
        l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 md:space-y-16 p-4 md:p-12 animate-in fade-in duration-1000 selection:bg-primary/20">
            {/* Header Bento */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 md:gap-12 stagger-1">
                <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-5 md:gap-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[28px] glass glow-gold border border-gold/30 group rotate-3 hover:rotate-0 transition-transform flex items-center justify-center shadow-2xl shrink-0">
                            <Unlock className="w-6 h-6 md:w-9 md:h-9 text-gold group-hover:text-white transition-colors" />
                        </div>
                        <h2 className="text-3xl md:text-7xl font-display uppercase tracking-tight leading-none text-white italic">Liberação de Sinais</h2>
                    </div>
                    <p className="text-zinc-500 font-bold text-sm md:text-lg flex items-center gap-3 md:gap-4 italic leading-none">
                        <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" />
                        <span className="font-mono text-[9px] md:text-[11px] tracking-[0.2em] md:tracking-[0.4em] uppercase opacity-70">Desatribuir Fichas</span>
                    </p>
                </div>

                {!selectedLigador && (
                    <div className="relative w-full xl:w-[450px] group stagger-2">
                        <div className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                            <Search className="w-4 h-4 md:w-5 md:h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="BUSCAR OPERADOR..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-16 md:h-24 glass-deep border border-white/10 rounded-[24px] md:rounded-[32px] pl-16 md:pl-20 pr-8 md:pr-10 text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] outline-none focus:border-primary/40 shadow-2xl transition-all placeholder:text-zinc-800 italic text-white"
                        />
                    </div>
                )}
            </div>

            {!selectedLigador ? (
                // Ligadores List
                loading ? (
                    <div className="flex flex-col items-center justify-center py-20 md:py-40 space-y-8 md:space-y-12 stagger-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-[40px] md:blur-[60px] rounded-full animate-pulse" />
                            <Loader2 className="w-12 h-12 md:w-20 md:h-20 text-primary animate-spin relative z-10" />
                        </div>
                        <p className="text-[10px] md:text-[12px] font-mono font-bold uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary animate-pulse italic">Escaneando Matriz...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 stagger-3">
                        {filteredLigadores.length === 0 ? (
                            <div className="col-span-full glass shadow-[0_64px_150px_rgba(0,0,0,0.5)] border-dashed border-white/10 p-12 md:p-32 flex flex-col items-center justify-center text-center space-y-8 rounded-[32px] md:rounded-[64px] animate-in fade-in zoom-in duration-1000">
                                <Users className="w-12 h-12 md:w-20 md:h-20 text-zinc-800" />
                                <h3 className="text-3xl md:text-5xl font-display uppercase italic tracking-tight text-white leading-none">Matriz Inativa</h3>
                            </div>
                        ) : (
                            filteredLigadores.map((lig, idx) => (
                                <button
                                    key={lig.id}
                                    onClick={() => fetchLeadsForLigador(lig)}
                                    className={cn(
                                        "glass p-8 md:p-12 rounded-[32px] md:rounded-[56px] text-left group border border-white/5 bg-[#0d0118]/40 relative overflow-hidden transition-all hover:bg-white/[0.02] shadow-[0_32px_80px_rgba(0,0,0,0.4)]",
                                        `stagger-${(idx % 5) + 1} animate-in fade-in slide-in-from-bottom-8`
                                    )}
                                >
                                    <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-primary/10 blur-[80px] md:blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 pointer-events-none" />

                                    <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-[32px] glass-deep border border-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:rotate-6 transition-all duration-500 shadow-2xl shrink-0">
                                            <User className="w-8 h-8 md:w-10 md:h-10 text-zinc-600 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className={cn(
                                            "px-4 md:px-8 py-2 md:py-3 rounded-full text-[8px] md:text-[10px] font-mono font-bold uppercase italic tracking-[0.1em] md:tracking-[0.2em] border shadow-2xl",
                                            lig.leadCount > 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-500 glow-gold-sm" : "bg-zinc-900/40 border-white/5 text-zinc-700"
                                        )}>
                                            {lig.leadCount} Sinais
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:space-y-4 relative z-10">
                                        <h4 className="text-2xl md:text-4xl font-display uppercase italic tracking-tighter truncate leading-none text-white group-hover:text-primary transition-colors">{lig.full_name}</h4>
                                        <p className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-[0.2em] md:tracking-[0.4em] italic leading-none">OPERADOR: <span className="text-zinc-500">@{lig.username}</span></p>
                                    </div>

                                    {lig.leadCount > 0 && (
                                        <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-white/5 flex items-center justify-between text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] text-zinc-600 group-hover:text-primary transition-all italic leading-none">
                                            <span>Visualizar Protocolos</span>
                                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 rotate-180 group-hover:translate-x-3 transition-transform" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )
            ) : (
                // Leads for Selected Ligador
                <div className="space-y-8 md:space-y-12 animate-in slide-in-from-right-12 duration-1000 stagger-2">
                    <div className="bg-[#0d0118]/60 p-8 md:p-12 rounded-[32px] md:rounded-[64px] border border-white/10 relative group shadow-[0_64px_150px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl flex flex-col xl:flex-row xl:items-center justify-between gap-8 md:gap-10">
                        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/5 blur-[80px] md:blur-[150px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

                        <div className="flex items-center gap-6 md:gap-10 relative z-10">
                            <button
                                onClick={() => setSelectedLigador(null)}
                                className="w-14 h-14 md:w-20 md:h-20 rounded-[20px] md:rounded-[32px] glass-deep hover:bg-white/5 transition-all flex items-center justify-center border border-white/10 shadow-2xl active:scale-90 group/back shrink-0"
                            >
                                <ChevronLeft className="w-6 h-6 md:w-10 md:h-10 group-hover:-translate-x-2 transition-transform" />
                            </button>
                            <div className="space-y-2 md:space-y-4">
                                <p className="text-[10px] md:text-[12px] font-mono font-bold uppercase text-amber-500 tracking-[0.3em] md:tracking-[0.6em] italic leading-none flex items-center gap-2 md:gap-3">
                                    <Zap className="w-3 h-3 md:w-4 md:h-4 animate-pulse fill-current" />
                                    Node Operativo
                                </p>
                                <h4 className="text-3xl md:text-5xl font-display uppercase italic tracking-tighter leading-none text-white truncate max-w-[200px] md:max-w-none">{selectedLigador.full_name}</h4>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 relative z-10 w-full xl:w-auto">
                            <div className="w-full sm:flex-1 xl:w-auto px-6 md:px-10 py-4 md:py-6 rounded-[20px] md:rounded-[32px] glass-deep border border-white/5 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 md:gap-3 shadow-inner bg-black/20">
                                <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase text-zinc-600 tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Sinais</p>
                                <p className="text-2xl md:text-4xl font-display italic text-white leading-none">{leads.length}</p>
                            </div>
                            <button
                                onClick={handleUnassignAll}
                                disabled={processing || leads.length === 0}
                                className="w-full sm:w-auto h-16 md:h-24 px-8 md:px-12 rounded-[20px] md:rounded-[32px] bg-destructive text-white font-mono font-bold uppercase italic tracking-[0.1em] md:tracking-[0.2em] text-[9px] md:text-[11px] flex items-center justify-center gap-4 md:gap-6 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-30 shadow-[0_16px_40px_rgba(225,29,72,0.3)] group/btnall border border-destructive/20 shrink-0"
                            >
                                <Trash2 className="w-5 h-5 md:w-7 md:h-7 group-hover:rotate-12 transition-transform" />
                                <span className="truncate">Liberar Tudo</span>
                            </button>
                        </div>
                    </div>

                    {loadingLeads ? (
                        <div className="flex flex-col items-center justify-center py-20 md:py-40 space-y-8 md:space-y-12 stagger-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-[40px] md:blur-[60px] rounded-full animate-pulse" />
                                <Loader2 className="w-12 h-12 md:w-20 md:h-20 text-primary animate-spin relative z-10" />
                            </div>
                            <p className="text-[10px] md:text-[12px] font-mono font-bold uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary italic">Sincronizando Sinais...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 stagger-3">
                            {leads.length === 0 ? (
                                <div className="col-span-full py-20 md:py-60 flex flex-col items-center justify-center gap-8 md:gap-12 text-center opacity-40 italic">
                                    <Activity className="w-20 h-20 md:w-32 md:h-32 animate-pulse text-zinc-800" />
                                    <p className="text-2xl md:text-4xl font-display uppercase italic tracking-[0.2em]">Radar Vazio</p>
                                </div>
                            ) : (
                                leads.map((lead, idx) => (
                                    <div key={lead.id} className={cn(
                                        "glass p-6 md:p-12 rounded-[32px] md:rounded-[56px] border border-white/5 group relative overflow-hidden transition-all hover:bg-white/[0.02] shadow-[0_32px_80px_rgba(0,0,0,0.4)]",
                                        `stagger-${(idx % 5) + 1} animate-in fade-in slide-in-from-bottom-8`
                                    )}>
                                        <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-amber-500/5 blur-[80px] md:blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 pointer-events-none" />

                                        <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-[32px] glass-deep flex items-center justify-center border border-white/5 shadow-2xl group-hover:bg-amber-500/10 group-hover:border-amber-500/30 group-hover:rotate-12 transition-all duration-500 shrink-0">
                                                <Signal className="w-8 h-8 md:w-10 md:h-10 text-zinc-600 group-hover:text-amber-500" />
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-3 text-amber-500">
                                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 animate-pulse border-4 border-amber-500/20 shadow-glow-amber-sm" />
                                                <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] px-3 md:px-6 py-1.5 md:py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 italic">Radar Ativo</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6 md:space-y-8 relative z-10">
                                            <div className="space-y-2 md:space-y-3">
                                                <h5 className="text-2xl md:text-3xl font-display uppercase italic tracking-tighter truncate leading-none text-white group-hover:text-amber-500 transition-colors">{lead.full_name || 'PENDENTE'}</h5>
                                                <p className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-[0.2em] md:tracking-[0.4em] italic font-mono truncate">REGISTRO: <span className="text-zinc-500">{lead.cpf?.substring(0, 11)}</span></p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                                <div className="glass-deep p-4 md:p-6 rounded-[20px] md:rounded-[32px] border border-white/5 space-y-2 md:space-y-3 overflow-hidden">
                                                    <p className="text-[8px] md:text-[9px] font-mono font-bold text-zinc-600 uppercase italic tracking-widest leading-none">IQ Score</p>
                                                    <p className="text-xl md:text-3xl font-display italic text-white leading-none truncate">{lead.score || '--'}</p>
                                                </div>
                                                <div className="glass-deep p-4 md:p-6 rounded-[20px] md:rounded-[32px] border border-white/5 space-y-2 md:space-y-3 overflow-hidden">
                                                    <p className="text-[8px] md:text-[9px] font-mono font-bold text-zinc-600 uppercase italic tracking-widest leading-none">Renda</p>
                                                    <p className="text-lg md:text-2xl font-display italic text-emerald-500 leading-none truncate">R$ {Number(lead.income || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleUnassignLead(lead.id)}
                                                disabled={processing}
                                                className="w-full h-14 md:h-20 mt-2 md:mt-4 rounded-[20px] md:rounded-[32px] glass-deep border border-white/10 text-zinc-500 hover:bg-destructive/10 hover:text-rose-500 hover:border-destructive/30 transition-all font-mono font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.4em] italic flex items-center justify-center gap-3 md:gap-5 active:scale-95 disabled:opacity-20 shadow-2xl group/release"
                                            >
                                                <Unlock className="w-4 h-4 md:w-6 md:h-6 group-hover/release:scale-110 transition-transform shrink-0" />
                                                Devolver à Base
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
