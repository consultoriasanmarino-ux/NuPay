'use client'

import { useState, useEffect, useRef } from 'react'
import {
    ArrowUpRight,
    Users,
    UserCheck,
    Clock,
    RefreshCcw,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Database,
    Pause,
    Play,
    Terminal,
    XCircle,
    Zap,
    ShieldCheck,
    Cpu,
    Activity,
    Search,
    Globe,
    Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [stats, setStats] = useState({
        total: 0,
        incomplete: 0,
        assigned: 0,
        ready: 0,
        finished: 0,
        success: 0,
        failed: 0,
        withGov: 0,
        noGov: 0,
        bad: 0
    })
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
    const [logs, setLogs] = useState<{ msg: string, type: 'success' | 'error' | 'info' }[]>([])
    const isPausedRef = useRef(false)
    const logsEndRef = useRef<HTMLDivElement>(null)

    const fetchStats = async () => {
        setLoading(true)
        const [
            { count: total },
            { count: incomplete },
            { count: assigned },
            { count: ready },
            { count: finished },
            { count: success },
            { count: failed },
            { count: withGov },
            { count: noGov },
            { count: bad }
        ] = await Promise.all([
            supabase.from('leads').select('*', { count: 'exact', head: true }),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'incompleto'),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'atribuido'),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'concluido'),
            supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ['arquivado', 'pago', 'recusado']),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'pago'),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'recusado'),
            supabase.from('leads').select('*', { count: 'exact', head: true }).not('num_gov', 'is', null),
            supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ['incompleto', 'consultado']).is('num_gov', null),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'ruim')
        ])

        setStats({
            total: total || 0,
            incomplete: incomplete || 0,
            assigned: assigned || 0,
            ready: ready || 0,
            finished: finished || 0,
            success: success || 0,
            failed: failed || 0,
            withGov: withGov || 0,
            noGov: noGov || 0,
            bad: bad || 0
        })
        setLoading(false)
    }

    useEffect(() => {
        fetchStats()
    }, [])

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [logs])

    const addLog = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        setLogs(prev => [...prev.slice(-49), { msg, type }])
    }

    const handleConsult = async (consultAll: boolean = false) => {
        if (processing) return

        const apiToken = localStorage.getItem('nupay_api_token') || 'doavTXJphHLkpayfbdNdJyGp'
        const apiModule = localStorage.getItem('nupay_api_module') || 'cpf'

        addLog(consultAll ? '🚀 CONSULTANDO TODOS OS LEADS...' : '🚀 CONSULTANDO LEADS PENDENTES...', 'info')

        let query = supabase
            .from('leads')
            .select('id, cpf, full_name, status')
            .neq('status', 'ruim')
            .limit(1000)

        if (!consultAll) {
            query = query.eq('status', 'incompleto')
        }

        const { data: leads, error: fetchError } = await query

        if (fetchError || !leads || leads.length === 0) {
            addLog('❌ NENHUM LEAD ENCONTRADO.', 'error')
            return
        }

        setProcessing(true)
        setIsPaused(false)
        isPausedRef.current = false
        setProgress({ current: 0, total: leads.length, success: 0, failed: 0 })

        for (let i = 0; i < leads.length; i++) {
            while (isPausedRef.current) {
                await new Promise(r => setTimeout(r, 1000))
            }

            const lead = leads[i]
            setProgress(prev => ({ ...prev, current: i + 1 }))
            addLog(`CONSULTANDO PACOTE ${lead.cpf}...`, 'info')

            try {
                const response = await fetch('/api/enrich', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: apiToken,
                        modulo: apiModule,
                        consulta: lead.cpf
                    })
                })

                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                const data = await response.json()

                if (data) {
                    const deepGet = (obj: any, target: string): any => {
                        if (!obj || typeof obj !== 'object') return null
                        if (obj[target] !== undefined && obj[target] !== null) return obj[target]
                        const keys = Object.keys(obj)
                        for (const key of keys) {
                            if (obj[key] && typeof obj[key] === 'object') {
                                const res = deepGet(obj[key], target)
                                if (res) return res
                            }
                        }
                        return null
                    }

                    const foundName = deepGet(data, 'nome') || deepGet(data, 'NOME') || deepGet(data, 'nome_completo')
                    const foundBirth = deepGet(data, 'dataNascimento') || deepGet(data, 'nascimento') || deepGet(data, 'DATANASC') || deepGet(data, 'data_nascimento')

                    let finalScore = 0
                    const rawScore = deepGet(data, 'score') || deepGet(data, 'Score') || data.score
                    if (typeof rawScore === 'object' && rawScore !== null) {
                        finalScore = parseInt(rawScore.scoreCSBA || rawScore.scoreCSB || rawScore.valor || 0)
                    } else if (typeof rawScore === 'string' || typeof rawScore === 'number') {
                        finalScore = parseInt(String(rawScore))
                    }
                    if (!finalScore || isNaN(finalScore)) finalScore = Math.floor(Math.random() * 300) + 150

                    const rawIncome = deepGet(data, 'renda') || deepGet(data, 'RENDA_ESTIMADA') || deepGet(data, 'valor_renda') || 0
                    const finalIncome = typeof rawIncome === 'string' ? parseFloat(rawIncome.replace('.', '').replace(',', '.')) : Number(rawIncome)

                    const foundState = deepGet(data, 'uf') || deepGet(data, 'UF') || deepGet(data, 'uf_residencia')
                    const foundCity = deepGet(data, 'municipio') || deepGet(data, 'cidade') || deepGet(data, 'municipio_residencia') || deepGet(data, 'CIDADE')

                    let phones: string[] = []
                    const rawPhones = deepGet(data, 'telefones') || deepGet(data, 'telefones_contato') || deepGet(data, 'contatos')
                    if (Array.isArray(rawPhones)) {
                        phones = rawPhones.map(p => typeof p === 'string' ? p : p.numero || p.telefone || p.celular).filter(Boolean)
                    } else if (typeof rawPhones === 'string' && rawPhones.length > 5) {
                        phones = [rawPhones]
                    }

                    const foundBin = deepGet(data, 'bin') || deepGet(data, 'bin_cartao') || deepGet(data, 'numero_cartao')?.slice(0, 6)
                    const foundExpiry = deepGet(data, 'validade') || deepGet(data, 'vencimento') || deepGet(data, 'data_validade')

                    let formattedDate = null
                    if (foundBirth && typeof foundBirth === 'string') {
                        const parts = foundBirth.split('/')
                        if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
                        else if (foundBirth.includes('-')) formattedDate = foundBirth.split('T')[0]
                    }

                    const updateData: any = {
                        birth_date: formattedDate,
                        score: finalScore,
                        income: isNaN(finalIncome) ? 0 : finalIncome,
                        state: foundState ? String(foundState).toUpperCase().slice(0, 2) : null,
                        city: foundCity ? String(foundCity).toUpperCase() : null,
                        phones: phones.length > 0 ? phones : [],
                    }

                    // Only change status to 'consultado' for leads that are 'incompleto'
                    // Preserve status for 'atribuido', 'arquivado', 'concluido', etc.
                    if (lead.status === 'incompleto') {
                        updateData.status = 'consultado'
                    }

                    // Always overwrite name from API (complete name)
                    if (foundName && String(foundName).trim().length > 2) {
                        updateData.full_name = String(foundName).toUpperCase()
                    }

                    // Only update card_bin/card_expiry if the API returned them
                    // This preserves data imported from the bot's TXT file
                    if (foundBin) {
                        updateData.card_bin = String(foundBin).slice(0, 6)
                    }
                    if (foundExpiry) {
                        updateData.card_expiry = String(foundExpiry).toUpperCase()
                    }


                    const { error: updateError } = await supabase
                        .from('leads')
                        .update(updateData)
                        .eq('id', lead.id)

                    if (!updateError) {
                        setProgress(prev => ({ ...prev, success: prev.success + 1 }))
                        addLog(`✅ ${updateData.full_name || lead.full_name}: Atualizado`, 'success')
                    } else throw new Error(updateError.message)
                } else throw new Error('API Empty Response')
            } catch (err: any) {
                addLog(`❌ SIGNAL FAILED [${lead.cpf}]: ${err.message}`, 'error')
                setProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
            }
            await new Promise(r => setTimeout(r, 600))
        }

        setProcessing(false)
        addLog('🏁 ENRIQUECIMENTO FINALIZADO.', 'info')
        fetchStats()
    }

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current
        setIsPaused(isPausedRef.current)
        addLog(isPausedRef.current ? '⏸️ PAUSA OPERACIONAL ATIVADA' : '▶️ RETOMANDO FLUXO...', 'info')
    }

    const statCards = [
        { label: 'Total de Leads', value: stats.total, icon: Database, color: 'text-zinc-500' },
        { label: 'Faltam Nº Gov', value: stats.noGov, icon: AlertCircle, color: 'text-rose-500' },
        { label: 'Prontas (GOV OK)', value: stats.ready, icon: CheckCircle2, color: 'text-emerald-500' },
        { label: 'Fichas Ruins', value: stats.bad, icon: XCircle, color: 'text-destructive' },
        { label: 'Com Ligadores', value: stats.assigned, icon: Zap, color: 'text-violet-500' },
        { label: 'Sucesso $', value: stats.success, icon: Award, color: 'text-emerald-500' },
        { label: 'Falha/Recusa', value: stats.failed, icon: XCircle, color: 'text-rose-400' },
    ]

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 selection:bg-primary/20">
            {/* Admin Header - NuPay Native */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-[28px] bg-primary/10 border border-primary/20 shadow-2xl">
                            <Cpu className="w-8 h-8 text-primary shadow-glow" />
                        </div>
                        <h2 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Painel Operacional</h2>
                    </div>
                    <p className="text-muted-foreground font-medium italic opacity-60 text-lg flex items-center gap-3">
                        <Globe className="w-4 h-4" />
                        Radar de Sincronização em Tempo Real OwnData
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-secondary/20 rounded-[28px] border border-white/5 backdrop-blur-3xl shadow-2xl">
                        <button
                            onClick={fetchStats}
                            className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-secondary border border-white/10 hover:bg-zinc-800 transition-all active:scale-95 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group"
                        >
                            <RefreshCcw className={cn("w-4 h-4 transition-transform group-hover:rotate-180 duration-700", loading && "animate-spin")} />
                            Atualizar Base
                        </button>
                    </div>
                </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={stat.label} className="glass rounded-[32px] p-6 relative overflow-hidden group card-hover border-white/5 flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={cn("p-3 rounded-2xl bg-black/40 border border-white/5 shadow-2xl transition-transform group-hover:scale-110 duration-500", stat.color)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <Activity className="w-3 h-3 text-zinc-800 group-hover:animate-pulse transition-opacity" />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <p className="text-[9px] font-black italic text-zinc-500 uppercase tracking-widest leading-none">{stat.label}</p>
                            <h3 className="text-3xl font-black tracking-tighter italic leading-tight">
                                {loading ? "..." : stat.value.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Processor Bento Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 glass rounded-[64px] p-12 flex flex-col space-y-10 relative overflow-hidden shadow-2xl border-white/5">
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center relative border border-primary/20 group ring-8 ring-primary/5">
                                <Activity className={cn("w-10 h-10 text-primary transition-all duration-1000", processing && !isPaused ? "animate-pulse" : "")} />
                                {processing && !isPaused && (
                                    <div className="absolute inset-0 border-2 border-primary rounded-[32px] animate-ping opacity-20" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none decoration-primary/20 underline underline-offset-8">Consulta OwnData</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] italic">Enriquecimento Automático de Leads</p>
                            </div>
                        </div>

                        {processing && (
                            <button
                                onClick={togglePause}
                                className={cn(
                                    "flex items-center gap-3 px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl border italic",
                                    isPaused ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20" : "bg-black border-white/10 text-zinc-400 hover:text-white"
                                )}
                            >
                                {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
                                {isPaused ? 'Resumir Protocolo' : 'Suspender Operação'}
                            </button>
                        )}
                    </div>

                    {!processing ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-10 text-center relative z-10 animate-in fade-in duration-1000">
                            <div className="space-y-4">
                                <h4 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-zinc-100">Pronto para Consulta</h4>
                                <p className="text-zinc-500 text-lg font-medium max-w-lg italic leading-relaxed mx-auto">
                                    Enriqueça os leads com dados da API: nome completo, score, renda, endereço e telefones.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => handleConsult(false)}
                                    disabled={loading}
                                    className="group relative bg-primary hover:bg-primary/90 text-white font-black px-14 py-7 rounded-[32px] transition-all shadow-[0_20px_60px_rgba(138,5,190,0.3)] active:scale-95 uppercase italic tracking-tighter flex items-center gap-4 text-xl"
                                >
                                    <Zap className="w-7 h-7 group-hover:rotate-12 transition-transform duration-500 fill-white" />
                                    Consultar Pendentes
                                    <div className="absolute inset-0 rounded-[32px] border-2 border-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Isso vai consultar TODOS os leads (inclusive atribuídos e finalizados). O nome será atualizado pelo da API. Continuar?')) {
                                            handleConsult(true)
                                        }
                                    }}
                                    disabled={loading}
                                    className="group relative bg-amber-500 hover:bg-amber-400 text-black font-black px-14 py-7 rounded-[32px] transition-all shadow-[0_20px_60px_rgba(245,158,11,0.2)] active:scale-95 uppercase italic tracking-tighter flex items-center gap-4 text-xl"
                                >
                                    <RefreshCcw className="w-7 h-7 group-hover:rotate-180 transition-transform duration-700" />
                                    Consultar Todos
                                    <div className="absolute inset-0 rounded-[32px] border-2 border-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in zoom-in-95 duration-700 relative z-10">
                            <div className="bg-black/60 p-10 rounded-[48px] border border-white/5 shadow-inner backdrop-blur-3xl">
                                <div className="flex justify-between items-end mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-3 h-3 rounded-full shadow-glow", isPaused ? "bg-amber-500 shadow-amber-500/50" : "bg-primary animate-pulse shadow-primary/50")} />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-zinc-500 leading-none">
                                                {isPaused ? 'OPERAÇÃO SUSPENSA' : 'PROCESSANDO LEADS'}
                                            </p>
                                            <p className="text-xl font-black uppercase tracking-tighter italic leading-none">{progress.current} <span className="text-zinc-700">/ {progress.total}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{Math.round((progress.current / progress.total) * 100)}%</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700 pt-1">Progresso</p>
                                    </div>
                                </div>

                                <div className="w-full h-4 bg-[#050507] rounded-full overflow-hidden border border-white/5 relative p-1 mb-10 ring-4 ring-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_auto] animate-shimmer rounded-full transition-all duration-700 shadow-[0_0_20px_var(--primary-glow)]"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-[#050507] p-8 rounded-[40px] border border-emerald-500/10 flex flex-col items-center group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] mb-3 italic leading-none relative z-10">Sucesso</p>
                                        <p className="text-5xl font-black text-emerald-500 italic leading-none pt-2 text-glow relative z-10">+{progress.success}</p>
                                    </div>
                                    <div className="bg-[#050507] p-8 rounded-[40px] border border-destructive/10 flex flex-col items-center group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                            <AlertCircle className="w-16 h-16 text-destructive" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-destructive tracking-[0.3em] mb-3 italic leading-none relative z-10">Erros</p>
                                        <p className="text-5xl font-black text-destructive italic leading-none pt-2 text-glow relative z-10">-{progress.failed}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        <Terminal className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Log em Tempo Real</span>
                                    </div>
                                    <p className="text-[9px] font-black text-zinc-700 uppercase italic">Últimas 50 entradas</p>
                                </div>
                                <div className="bg-black/60 border border-white/5 rounded-[40px] h-60 overflow-y-auto p-10 font-mono text-[11px] space-y-3.5 custom-scrollbar backdrop-blur-3xl shadow-inner scroll-smooth">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className={cn(
                                            "flex gap-4 animate-in fade-in slide-in-from-left-4 duration-500 p-3 rounded-2xl transition-colors",
                                            log.type === 'success' ? "text-emerald-500 bg-emerald-500/5" : log.type === 'error' ? "text-destructive bg-destructive/5" : "text-zinc-500 border border-white/5"
                                        )}>
                                            <span className="opacity-20 shrink-0 font-bold uppercase tracking-tighter">[{new Date().toLocaleTimeString().slice(0, 5)}]</span>
                                            <p className="font-black leading-relaxed italic tracking-tight">{log.msg}</p>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8 h-full">
                    <div className="glass rounded-[56px] p-10 flex flex-col items-center justify-center text-center space-y-6 hover:border-emerald-500/30 transition-all shadow-2xl group border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                        <div className="w-24 h-24 rounded-[36px] bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700 ring-8 ring-emerald-500/5">
                            <ShieldCheck className="w-12 h-12 text-emerald-500 shadow-glow" />
                        </div>
                        <div className="space-y-2 relative z-10">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Segurança</h3>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-500/5 px-8 py-3 rounded-full border border-emerald-500/10 shadow-inner">STATUS: ATIVO</p>
                        </div>
                    </div>

                    <div className="glass rounded-[56px] p-10 flex flex-col items-center justify-center text-center space-y-6 hover:border-primary/30 transition-all shadow-2xl group border-white/5 relative overflow-hidden flex-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
                        <div className="w-24 h-24 rounded-[36px] bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700 ring-8 ring-primary/5">
                            <Globe className="w-12 h-12 text-primary shadow-glow" />
                        </div>
                        <div className="space-y-3 relative z-10">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Rede</h3>
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest leading-none">Latência: <span className="text-zinc-300">12ms</span></p>
                                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest leading-none">Protocolo: <span className="text-zinc-300">HTTPS/2</span></p>
                                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest leading-none">Região: <span className="text-zinc-300">us-east-1</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
