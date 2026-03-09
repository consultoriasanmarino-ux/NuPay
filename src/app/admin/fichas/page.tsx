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

    // Unassign Logic State
    const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false)
    const [unassignData, setUnassignData] = useState<any[]>([])
    const [loadingUnassign, setLoadingUnassign] = useState(false)
    const [selectedLigadorToUnassign, setSelectedLigadorToUnassign] = useState<string | null>(null)
    const [leadsToUnassign, setLeadsToUnassign] = useState<Lead[]>([])
    const [processingUnassign, setProcessingUnassign] = useState(false)

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
            alert('PROTOCOL ERROR: SELECT OPERATOR FIRST.')
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
            alert('DB ERROR: ' + error.message)
        } else {
            setLeads(prev => prev.filter(l => l.id !== leadId))
            setTotalCount(prev => prev - 1)
        }
        setAssigning(null)
    }

    const handleBatchAssign = async () => {
        if (!selectedLigadorBatch) {
            alert('PROTOCOL ERROR: SELECT BATCH OPERATOR.')
            return
        }

        const leadsToAssign = leads.slice(0, 10)
        if (leadsToAssign.length === 0) {
            alert('RADAR EMPTY: NO LEADS AVAILABLE.')
            return
        }

        const selectedLigadorName = ligadores.find(l => l.id === selectedLigadorBatch)?.full_name || 'este ligador'
        if (!confirm(`CONFIRM: ASSIGN ${leadsToAssign.length} SIGNALS TO ${selectedLigadorName}?`)) return

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
            alert('BATCH FAILURE: ' + error.message)
        } else {
            alert(`✅ ${leadsToAssign.length} SIGNALS SYNCED SUCCESSFULLY.`)
            fetchData()
        }
        setBatchAssigning(false)
    }

    // Unassign Logic
    const openUnassignModal = async () => {
        setIsUnassignModalOpen(true)
        setLoadingUnassign(true)

        // Fetch Operators and their attributed lead counts
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

        const data = ligadores.map(l => ({
            ...l,
            leadCount: counts[l.id] || 0
        })).filter(l => l.leadCount > 0)

        setUnassignData(data)
        setLoadingUnassign(false)
    }

    const fetchLeadsForLigador = async (ligId: string) => {
        setLoadingUnassign(true)
        setSelectedLigadorToUnassign(ligId)

        const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('owner_id', ligId)
            .eq('status', 'atribuido')
            .order('created_at', { ascending: false })

        setLeadsToUnassign(data as Lead[] || [])
        setLoadingUnassign(false)
    }

    const handleUnassignLead = async (leadId: string) => {
        if (!confirm('CONFIRM: DE-ASSIGN SIGNAL FROM OPERATOR?')) return

        setProcessingUnassign(true)
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
            setLeadsToUnassign(prev => prev.filter(l => l.id !== leadId))
            // Update counts in main list if necessary? No, only on fetchData
            fetchData()
        }
        setProcessingUnassign(false)
    }

    const handleUnassignAll = async () => {
        if (!selectedLigadorToUnassign || leadsToUnassign.length === 0) return

        const ligName = unassignData.find(l => l.id === selectedLigadorToUnassign)?.full_name
        if (!confirm(`⚠️ CRITICAL: UNASSIGN ALL ${leadsToUnassign.length} SIGNALS FROM ${ligName}?`)) return

        setProcessingUnassign(true)
        const ids = leadsToUnassign.map(l => l.id)

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
            setLeadsToUnassign([])
            setSelectedLigadorToUnassign(null)
            openUnassignModal() // Refresh operator list
            fetchData()
        }
        setProcessingUnassign(false)
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
                        <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Signal Queue Center</h2>
                    </div>
                    <p className="text-muted-foreground font-medium italic opacity-60 text-lg flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        Validated Leads Ready for Operator Interaction
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={openUnassignModal}
                        className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-2xl italic"
                    >
                        <Unlock className="w-5 h-5" />
                        Unlock Assigned Signals
                    </button>
                    <div className="flex items-center gap-4 bg-secondary/30 border border-white/5 px-8 py-4 rounded-[24px] shadow-2xl group">
                        <Database className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                        <div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-1 shadow-glow-sm">Available IQ</p>
                            <p className="text-2xl font-black italic text-white tracking-tighter">{totalCount} SIGNALS</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Batch Bar */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 glass p-6 rounded-[48px] border-white/5 backdrop-blur-3xl shadow-xl">
                    {[
                        { label: 'Renda', key: 'income', options: [{ v: 'greater', l: 'Top Range (>5k)' }, { v: 'less', l: 'Mid Range (<5k)' }] },
                        { label: 'Score', key: 'score', options: [{ v: 'greater', l: 'Elite Signal (>700)' }, { v: 'less', l: 'Standard (<700)' }] },
                        { label: 'Idade', key: 'age', options: [{ v: 'greater', l: 'Senior (40+)' }, { v: 'less', l: 'Junior (<40)' }] }
                    ].map((f) => (
                        <div key={f.key} className="relative group">
                            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-all duration-300" />
                            <select
                                value={(filters as any)[f.key]}
                                onChange={(e) => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
                                className="w-full bg-black/40 border border-white/5 rounded-[24px] py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer text-zinc-400 group-hover:text-white"
                            >
                                <option value="">{f.label} Portal</option>
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
                            <option value="" className="bg-[#0c0c0e] text-zinc-500">Target Protocol...</option>
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
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse italic">Connecting to Signal Matrix...</p>
                </div>
            ) : leads.length === 0 ? (
                <div className="glass border-dashed border-white/5 rounded-[64px] p-32 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-700">
                    <div className="w-28 h-28 bg-secondary/30 rounded-[40px] flex items-center justify-center text-zinc-800 border-2 border-dashed border-white/10 group">
                        <PhoneCall className="w-14 h-14 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">Queue Exhausted</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto italic font-medium">Inject new validated protocols or enrich pending signals to populate the assignment radar.</p>
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
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-500/5 px-6 py-2.5 rounded-full border border-emerald-500/10 mb-3 italic emerald-glow">Signal Ready</p>
                                    <div className="flex items-center gap-2 justify-end text-zinc-600">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">{lead.city || 'GLOBAL'}, {lead.state || 'UF'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-2">
                                <h4 className="text-3xl font-black uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors leading-none decoration-primary/20 underline underline-offset-8">
                                    {lead.full_name || 'PENDING IDENTITY'}
                                </h4>
                                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] italic">Network ID: <span className="text-zinc-400">{lead.cpf}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-5 relative z-10">
                                {[
                                    { icon: ShieldCheck, label: 'Score Signal', val: lead.score || '--', color: 'text-white' },
                                    { icon: Database, label: 'Capital IQ', val: `R$ ${Number(lead.income || 0).toLocaleString('pt-BR')}`, color: 'text-emerald-500' },
                                    { icon: Calendar, label: 'Cycle Range', val: `${lead.age || '--'} ANOS`, color: 'text-blue-400' },
                                    { icon: Clock, label: 'Gov Protocol', val: lead.num_gov || 'PENDING', color: 'text-white', full: true }
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
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 italic">BIN Node</p>
                                    <p className="text-2xl font-black italic text-primary text-glow leading-none">{lead.card_bin || '---'}</p>
                                </div>
                                <div className="glass-deep p-6 rounded-[32px] border-white/5 col-span-1 border-primary/10">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3 italic">Vault Exp.</p>
                                    <p className="text-2xl font-black italic text-primary text-glow leading-none">{lead.card_expiry || '--/--'}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 relative z-10">
                                <div className="flex items-center gap-3 mb-1">
                                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">Deploy to Operator Node</p>
                                </div>
                                <div className="flex gap-4">
                                    <select
                                        value={selectedLigadorForLead[lead.id] || ''}
                                        onChange={(e) => setSelectedLigadorForLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                        className="flex-1 bg-black/40 border border-white/5 rounded-[24px] px-8 py-5 text-[11px] font-black uppercase italic tracking-[0.1em] outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer shadow-inner text-white group-hover:border-primary/20 transition-all"
                                    >
                                        <option value="" className="bg-[#0c0c0e] text-zinc-600">Select Node ID...</option>
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
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic leading-none mb-2">Protocol Page Index</p>
                            <p className="text-3xl font-black italic tracking-tighter leading-none">{page} <span className="text-zinc-800 mx-4 text-sm font-black italic">OF MATRIX</span> {Math.ceil(totalCount / ITEMS_PER_PAGE) || 1}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={page === 1}
                            className="flex items-center gap-4 px-10 py-6 rounded-[28px] bg-secondary border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-20 shadow-xl italic"
                        >
                            <ChevronLeft className="w-6 h-6" />
                            Prev Sequence
                        </button>
                        <button
                            onClick={() => { setPage(p => (p * ITEMS_PER_PAGE < totalCount ? p + 1 : p)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={page * ITEMS_PER_PAGE >= totalCount}
                            className="flex items-center gap-4 px-12 py-6 rounded-[28px] bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-glow hover:scale-[1.03] transition-all active:scale-95 disabled:opacity-20 italic border-b-4 border-black/20"
                        >
                            Next Radar Data
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Unassign Signals Modal */}
            {isUnassignModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 lg:p-12 bg-background/95 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="glass w-full max-w-5xl rounded-[64px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col border-white/10 max-h-[90vh]">
                        <div className="px-12 py-12 border-b border-white/5 flex justify-between items-center bg-secondary/20 relative">
                            <div className="flex items-center gap-10">
                                <div className="w-20 h-20 rounded-[32px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-2xl scale-110">
                                    <Unlock className="w-10 h-10 text-amber-500 shadow-glow-amber" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Unlock assigned Signals</h3>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] italic">De-Assignment and Redistribution Protocol</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsUnassignModalOpen(false)}
                                className="w-16 h-16 rounded-[28px] bg-secondary hover:bg-destructive/10 hover:text-destructive transition-all font-black text-zinc-500 shadow-2xl flex items-center justify-center"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="p-12 overflow-hidden flex flex-col flex-1 gap-12">
                            {/* Operator Selector for Unassign */}
                            {!selectedLigadorToUnassign ? (
                                <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-4">
                                    <p className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.4em] italic leading-none">Select Access Node to De-Archivate</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {loadingUnassign ? (
                                            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-6">
                                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Scanning Operators Matrix...</p>
                                            </div>
                                        ) : unassignData.length === 0 ? (
                                            <div className="col-span-full py-20 glass border-dashed rounded-[48px] flex flex-col items-center justify-center gap-6 opacity-30">
                                                <AlertCircle className="w-16 h-16" />
                                                <p className="text-xl font-black uppercase italic tracking-widest">No Active Assignments Detected</p>
                                            </div>
                                        ) : unassignData.map(lig => (
                                            <button
                                                key={lig.id}
                                                onClick={() => fetchLeadsForLigador(lig.id)}
                                                className="glass p-10 rounded-[48px] text-left group card-hover border-white/5 bg-secondary/10"
                                            >
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="w-16 h-16 rounded-[24px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                                        <User className="w-8 h-8" />
                                                    </div>
                                                    <div className="px-5 py-2 rounded-full bg-black/40 border border-white/5 text-[10px] font-black uppercase italic tracking-widest text-zinc-500">
                                                        {lig.leadCount} SIGS
                                                    </div>
                                                </div>
                                                <h4 className="text-2xl font-black uppercase italic tracking-tighter truncate leading-none group-hover:text-amber-500 transition-colors uppercase">{lig.full_name}</h4>
                                                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mt-4">Node ID: <span className="text-zinc-500 font-mono">@{lig.username}</span></p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-hidden flex flex-col gap-10">
                                    <div className="flex items-center justify-between bg-black/40 p-8 rounded-[40px] border border-white/5 relative group">
                                        <div className="flex items-center gap-8">
                                            <button
                                                onClick={() => setSelectedLigadorToUnassign(null)}
                                                className="w-14 h-14 rounded-[22px] bg-secondary hover:bg-zinc-800 transition-all flex items-center justify-center border border-white/5"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.4em] mb-1.5 italic leading-none">De-assigning Signals FROM:</p>
                                                <h4 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-white">{unassignData.find(l => l.id === selectedLigadorToUnassign)?.full_name}</h4>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleUnassignAll}
                                            disabled={processingUnassign || leadsToUnassign.length === 0}
                                            className="px-10 py-5 rounded-[24px] bg-destructive text-white font-black uppercase italic tracking-tighter text-sm flex items-center gap-4 hover:scale-[1.03] transition-all active:scale-95 disabled:opacity-30 border-b-4 border-black/20 shadow-2xl"
                                        >
                                            <Trash2 className="w-6 h-6" />
                                            Flash Unassign All
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                        {loadingUnassign ? (
                                            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-6">
                                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Relocking Signal Chain...</p>
                                            </div>
                                        ) : leadsToUnassign.length === 0 ? (
                                            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-6 opacity-30">
                                                <UserMinus className="w-16 h-16" />
                                                <p className="text-xl font-black uppercase italic tracking-widest">No Signals Captured</p>
                                            </div>
                                        ) : leadsToUnassign.map(lead => (
                                            <div key={lead.id} className="glass p-8 rounded-[40px] flex items-center justify-between border-white/5 hover:border-amber-500/30 transition-all group">
                                                <div className="flex items-center gap-6 min-w-0">
                                                    <div className="w-14 h-14 rounded-[20px] bg-secondary flex items-center justify-center border border-white/5 shadow-2xl group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all">
                                                        <SignalIcon className="w-7 h-7 text-zinc-600 group-hover:text-amber-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="text-lg font-black uppercase italic tracking-tighter truncate leading-none mb-1.5">{lead.full_name || 'PENDING IDENTITY'}</h5>
                                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">{lead.cpf}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnassignLead(lead.id)}
                                                    disabled={processingUnassign}
                                                    className="w-14 h-14 rounded-[20px] bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all active:scale-90 shadow-2xl group/sub"
                                                >
                                                    <Unlock className="w-6 h-6 group-hover/sub:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function SignalIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 20h.01" />
            <path d="M7 20v-4" />
            <path d="M12 20v-8" />
            <path d="M17 20V8" />
            <path d="M22 20V4" />
        </svg>
    )
}
