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

        // Fetch attributed leads to count them per operator
        const { data: attributedLeads } = await supabase
            .from('leads')
            .select('owner_id')
            .eq('status', 'atribuido')

        const counts: { [key: string]: number } = {}
        attributedLeads?.forEach(l => {
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
            .eq('status', 'atribuido')
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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 selection:bg-primary/20">
            {/* Header Bento */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-[28px] bg-amber-500/10 border border-amber-500/20 shadow-2xl scale-110">
                            <UserMinus className="w-8 h-8 text-amber-500 shadow-glow-amber" />
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Desatribuir Sinais</h2>
                    </div>
                    <p className="text-muted-foreground font-medium italic opacity-60 text-lg flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-primary" />
                        Protocolo de De-Atribuição e Re-Distribuição de Leads
                    </p>
                </div>

                {!selectedLigador && (
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-all duration-300" />
                        <input
                            type="text"
                            placeholder="Pesquisar Ligador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-[24px] py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-primary/40 transition-all italic placeholder:text-zinc-800"
                        />
                    </div>
                )}
            </div>

            {!selectedLigador ? (
                // Ligadores List
                loading ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-6">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 text-primary animate-spin" />
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse italic">Escaneando Matriz de Operadores...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredLigadores.length === 0 ? (
                            <div className="col-span-full glass border-dashed border-white/5 rounded-[64px] p-32 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
                                <Users className="w-16 h-16 text-zinc-800" />
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Nenhum Ligador Encontrado</h3>
                            </div>
                        ) : (
                            filteredLigadores.map(lig => (
                                <button
                                    key={lig.id}
                                    onClick={() => fetchLeadsForLigador(lig)}
                                    className="glass p-10 rounded-[56px] text-left group card-hover border-white/5 bg-secondary/10 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />

                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="w-16 h-16 rounded-[24px] bg-secondary border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                                            <User className="w-8 h-8 text-zinc-600 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className={cn(
                                            "px-5 py-2.5 rounded-full text-[10px] font-black uppercase italic tracking-widest border shadow-inner",
                                            lig.leadCount > 0 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-black/40 border-white/5 text-zinc-600"
                                        )}>
                                            {lig.leadCount} Fichas
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative z-10">
                                        <h4 className="text-2xl font-black uppercase italic tracking-tighter truncate leading-none group-hover:text-primary transition-colors">{lig.full_name}</h4>
                                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic font-mono">@{lig.username}</p>
                                    </div>

                                    {lig.leadCount > 0 && (
                                        <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-primary transition-colors italic">
                                            <span>Abrir Protocolo</span>
                                            <ChevronLeft className="w-4 h-4 rotate-180" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )
            ) : (
                // Leads for Selected Ligador
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                    <div className="flex flex-col md:flex-row items-center justify-between bg-black/40 p-8 rounded-[48px] border border-white/5 relative group shadow-2xl overflow-hidden backdrop-blur-3xl">
                        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

                        <div className="flex items-center gap-8 relative z-10 w-full md:w-auto">
                            <button
                                onClick={() => setSelectedLigador(null)}
                                className="w-16 h-16 rounded-[28px] bg-secondary hover:bg-zinc-800 transition-all flex items-center justify-center border border-white/5 shadow-2xl active:scale-90"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.4em] mb-1.5 italic leading-none flex items-center gap-2">
                                    <Zap className="w-3 h-3 animate-pulse" />
                                    Gerenciando Node:
                                </p>
                                <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-white">{selectedLigador.full_name}</h4>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-8 md:mt-0 relative z-10">
                            <div className="px-8 py-5 rounded-[24px] bg-secondary border border-white/5 flex flex-col items-end gap-1 shadow-inner">
                                <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic leading-none">Sinais Capturados</p>
                                <p className="text-2xl font-black italic text-white leading-none">{leads.length}</p>
                            </div>
                            <button
                                onClick={handleUnassignAll}
                                disabled={processing || leads.length === 0}
                                className="px-10 py-5 rounded-[24px] bg-destructive text-white font-black uppercase italic tracking-tighter text-sm flex items-center gap-4 hover:scale-[1.03] transition-all active:scale-95 disabled:opacity-30 border-b-4 border-black/20 shadow-2xl relative overflow-hidden group/btnall"
                            >
                                <Trash2 className="w-6 h-6 group-hover/btnall:rotate-12 transition-transform" />
                                Liberar Tudo (Flash)
                            </button>
                        </div>
                    </div>

                    {loadingLeads ? (
                        <div className="flex flex-col items-center justify-center py-40 space-y-6">
                            <Loader2 className="w-16 h-16 text-primary animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">Sincronizando Cadeia de Sinais...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {leads.length === 0 ? (
                                <div className="col-span-full py-40 flex flex-col items-center justify-center gap-8 opacity-30 italic">
                                    <Activity className="w-20 h-20 animate-pulse text-zinc-800" />
                                    <p className="text-2xl font-black uppercase italic tracking-widest">Nenhum Sinal Atribuído no Momento</p>
                                </div>
                            ) : (
                                leads.map(lead => (
                                    <div key={lead.id} className="glass p-8 rounded-[48px] border-white/5 hover:border-amber-500/20 transition-all group relative overflow-hidden card-hover">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div className="w-16 h-16 rounded-[24px] bg-secondary flex items-center justify-center border border-white/5 shadow-2xl group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all">
                                                <Signal className="w-8 h-8 text-zinc-600 group-hover:text-amber-500" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/5 px-5 py-2 rounded-full border border-amber-500/10 italic">Ativo no Radar</p>
                                            </div>
                                        </div>

                                        <div className="space-y-5 relative z-10">
                                            <div className="space-y-1.5">
                                                <h5 className="text-2xl font-black uppercase italic tracking-tighter truncate leading-none group-hover:text-white transition-colors">{lead.full_name || 'PENDENTE'}</h5>
                                                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic font-mono">CPF: {lead.cpf}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/40 p-4 rounded-3xl border border-white/5">
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">IQ Signal</p>
                                                    <p className="text-xl font-black italic">{lead.score || '--'}</p>
                                                </div>
                                                <div className="bg-black/40 p-4 rounded-3xl border border-white/5">
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Renda Est.</p>
                                                    <p className="text-base font-black italic text-emerald-500">R$ {Number(lead.income || 0).toLocaleString('pt-BR')}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleUnassignLead(lead.id)}
                                                disabled={processing}
                                                className="w-full h-16 mt-4 rounded-[24px] bg-secondary border border-white/5 text-zinc-400 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-4 active:scale-95 group/release"
                                            >
                                                <Unlock className="w-5 h-5 group-hover/release:scale-110 transition-transform" />
                                                Liberar para a Base
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
