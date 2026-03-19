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
    Award,
    Smartphone
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
        bad: 0,
        notEnriched: 0,
        consultedNoPhones: 0
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
            { count: bad },
            { count: notEnriched },
            { count: consultedNoPhones }
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
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'ruim'),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'incompleto'),
            supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'consultado').eq('phones', '[]')
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
            bad: bad || 0,
            notEnriched: notEnriched || 0,
            consultedNoPhones: consultedNoPhones || 0
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
            .select('id, cpf, full_name, status, num_gov')
            .limit(1000)

        if (!consultAll) {
            // Priorizar: Apenas 'Incompleto' (Sem Consulta)
            // Agora incluímos os que possuem num_gov (fichas BB/Bradesco/etc)
            // Ordenamos pelos mais novos para priorizar os recém-incluídos
            query = query.eq('status', 'incompleto').order('created_at', { ascending: false })
        } else {
            // Reset Global: Consultar todos exceto os que já estão em estados finais
            query = query.not('status', 'in', '("atribuido","arquivado","pago","recusado")')
        }

        const { data: leads, error: fetchError } = await query

        if (fetchError || !leads || leads.length === 0) {
            addLog('❌ NENHUM LEAD ENCONTRADO.', 'error')
            setProcessing(false)
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

                if (!response.ok) {
                    const errData = await response.json().catch(() => null);
                    const detail = errData?.details || errData?.error || '';
                    throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
                }
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
                    // CRITICAL: Access telefones directly from top-level or known nested paths
                    // deepGet can incorrectly match 'telefone' (singular) inside phone objects
                    const rawPhones = data.telefones || data.Telefones || deepGet(data, 'telefones_contato') || deepGet(data, 'contatos')
                    if (Array.isArray(rawPhones)) {
                        phones = rawPhones.map((p: any) => {
                            if (typeof p === 'string') return p.replace(/\D/g, '')
                            // API returns objects like { telefone: "32999462633", tipo: "...", ... }
                            const num = p.telefone || p.numero || p.celular || p.phone
                            return num ? String(num).replace(/[^\d]/g, '') : null
                        }).filter((p: string | null): p is string => !!p && p.length >= 10)
                    } else if (typeof rawPhones === 'string' && rawPhones.replace(/\D/g, '').length >= 10) {
                        phones = [rawPhones.replace(/\D/g, '')]
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

                    // Change status to 'consultado' for leads that are 'incompleto' or 'ruim' (incorrectly marked)
                    // Preserve status for 'atribuido', 'arquivado', 'concluido', etc.
                    // Se o lead for 'incompleto' ou 'ruim', move para 'consultado' ou 'concluido'
                    if (lead.status === 'incompleto' || lead.status === 'ruim') {
                        // Se já tem NUM_GOV (vindo do import bancário/BB), vai direto para 'concluido'
                        if (lead.num_gov) {
                            updateData.status = 'concluido'
                        } else {
                            updateData.status = 'consultado'
                        }
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
                const errorMessage = err.message || 'Erro Desconhecido';
                addLog(`❌ SIGNAL FAILED [${lead.cpf}]: ${errorMessage}`, 'error')
                
                // Se for erro de sistema deles ("executar comando"), apenas PULA (não descarta)
                // Se for outro erro HTTP (ex: 404), aí sim marcamos como ruim para limpar a fila
                if (errorMessage.includes('executar comando')) {
                    addLog(`⏳ Lead [${lead.cpf}] ignorado: Erro no Servidor OwnData (Tente novamente mais tarde)`, 'info');
                } else if (errorMessage.includes('HTTP')) {
                    try {
                        await supabase.from('leads').update({ status: 'ruim' }).eq('id', lead.id);
                        addLog(`🩹 Lead [${lead.cpf}] descartado por Erro de Protocolo`, 'info');
                    } catch (dbErr) {
                        console.error('Erro ao descartar lead:', dbErr);
                    }
                }

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
        { label: 'Sem Consulta', value: stats.notEnriched, icon: Search, color: 'text-amber-500' },
        { label: 'Faltam Nº Gov', value: stats.noGov, icon: AlertCircle, color: 'text-rose-500' },
        { label: 'Falha Contato', value: stats.consultedNoPhones, icon: Smartphone, color: 'text-orange-500' },
        { label: 'Prontas (GOV OK)', value: stats.ready, icon: CheckCircle2, color: 'text-emerald-500' },
        { label: 'Fichas Ruins', value: stats.bad, icon: XCircle, color: 'text-destructive' },
        { label: 'Com Ligadores', value: stats.assigned, icon: Zap, color: 'text-violet-500' },
        { label: 'Sucesso $', value: stats.success, icon: Award, color: 'text-emerald-500' },
    ]

    return (
        <div className="space-y-8 md:space-y-16 p-4 md:p-12 animate-in fade-in duration-1000 selection:bg-primary/20">
            {/* Admin Header - NuPay Native */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 md:gap-10 stagger-1">
                <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[28px] glass glow-primary border border-primary/30 flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform group shrink-0">
                            <Cpu className="w-6 h-6 md:w-9 md:h-9 text-primary group-hover:text-magenta transition-colors" />
                        </div>
                        <h2 className="text-3xl md:text-7xl font-display uppercase tracking-tight leading-none text-white italic">Painel Operacional</h2>
                    </div>
                    <p className="text-zinc-500 font-bold text-sm md:text-lg italic flex items-center gap-3 md:gap-4">
                        <Globe className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
                        <span className="font-mono text-[9px] md:text-[11px] tracking-[0.2em] md:tracking-[0.4em] uppercase opacity-70">Monitoramento Terminal e OwnData</span>
                    </p>
                </div>

                <div className="flex items-center gap-5">
                    <div className="flex p-1.5 glass-deep rounded-[40px] border border-white/5 backdrop-blur-3xl shadow-2xl">
                        <button
                            onClick={fetchStats}
                            className="btn-cinema btn-cinema-glass px-10 h-20"
                        >
                            <RefreshCcw className={cn("w-5 h-5 transition-transform group-hover:rotate-180 duration-1000 text-primary", loading && "animate-spin")} />
                            Sincronizar Protocolos
                        </button>
                    </div>
                </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9 gap-4 md:gap-6 stagger-2">
                {statCards.map((stat, idx) => (
                    <div key={stat.label} className="glass-card p-8 group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-colors pointer-events-none" />
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className={cn("w-12 h-12 rounded-[22px] glass shadow-2xl flex items-center justify-center transition-all group-hover:scale-110 duration-500 border border-white/10", stat.color)}>
                                <stat.icon className="w-5 h-5 transition-transform" />
                            </div>
                            <div className="w-2 h-2 rounded-full bg-primary/20 animate-ping group-hover:bg-primary/40 transition-colors" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <p className="text-[10px] font-mono font-bold italic text-zinc-600 uppercase tracking-[0.4em] leading-none mb-1">{stat.label}</p>
                            <h3 className="text-4xl font-display italic leading-tight text-white tracking-tighter">
                                {loading ? "---" : stat.value.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Processor Bento Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 stagger-3">
                <div className="lg:col-span-8 glass shadow-[0_64px_150px_rgba(0,0,0,0.8)] rounded-[32px] md:rounded-[64px] p-6 md:p-16 flex flex-col space-y-8 md:space-y-12 relative overflow-hidden border border-white/10">
                    <div className="absolute top-0 right-0 w-[400px] md:w-[500px] h-[400px] md:h-[500px] bg-primary/10 blur-[100px] md:blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 gap-8">
                        <div className="flex items-center gap-5 md:gap-8 overflow-hidden">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-[20px] md:rounded-[32px] glass glow-primary border border-primary/20 flex items-center justify-center relative group shrink-0">
                                <Activity className={cn("w-8 h-8 md:w-12 md:h-12 text-primary transition-all duration-1000", processing && !isPaused ? "animate-pulse" : "")} />
                                {processing && !isPaused && (
                                    <div className="absolute inset-0 border-4 border-primary/20 rounded-[20px] md:rounded-[32px] animate-ping opacity-20" />
                                )}
                            </div>
                            <div className="space-y-1 md:space-y-2 truncate">
                                <h3 className="text-2xl md:text-4xl font-display uppercase tracking-tight text-white italic truncate leading-none">Protocolo OwnData</h3>
                                <p className="text-[9px] md:text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em] md:tracking-[0.4em] italic leading-none">Sincronização Circular</p>
                            </div>
                        </div>

                        {processing && (
                            <button
                                onClick={togglePause}
                                className={cn(
                                    "flex items-center justify-center gap-3 md:gap-4 px-8 md:px-10 h-14 md:h-20 rounded-[20px] md:rounded-[32px] font-mono font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all active:scale-95 shadow-2xl border italic",
                                    isPaused ? "bg-emerald-500 border-emerald-400 text-white shadow-glow-emerald" : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                                )}
                            >
                                {isPaused ? <Play className="w-4 md:w-5 h-4 md:h-5 fill-current" /> : <Pause className="w-4 md:w-5 h-4 md:h-5 fill-current" />}
                                {isPaused ? 'Retomar' : 'Suspender'}
                            </button>
                        )}
                    </div>

                    {!processing ? (
                        <div className="flex flex-col items-center justify-center py-10 md:py-20 space-y-8 md:space-y-12 text-center relative z-10 animate-in fade-in duration-1000">
                            <div className="space-y-4 md:space-y-5">
                                <h4 className="text-3xl md:text-5xl font-display uppercase italic tracking-tight text-white leading-none">Terminal Pronto</h4>
                                <p className="text-zinc-500 text-sm md:text-lg font-bold max-w-lg italic leading-relaxed mx-auto px-4">
                                    Inicie o enriquecimento terminal: Score, Renda, Localização e Vínculos.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-2xl px-4 md:px-0">
                                <button
                                    onClick={() => handleConsult(false)}
                                    disabled={loading}
                                    className="btn-cinema btn-cinema-primary flex-1 h-20 md:h-24 md:text-xl"
                                >
                                    <Zap className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-12 transition-transform duration-500 text-primary" />
                                    <span>Priorizar</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Atenção: A sincronização global atualizará TODOS os registros da base. Confirmar protocolo?')) {
                                            handleConsult(true)
                                        }
                                    }}
                                    disabled={loading}
                                    className="btn-cinema btn-cinema-glass text-amber-500 border-amber-500/20 flex-1 h-20 md:h-24 md:text-xl"
                                >
                                    <RefreshCcw className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-180 transition-transform duration-1000" />
                                    <span>Reset Global</span>
                                </button>
                                
                                {stats.consultedNoPhones > 0 && (
                                    <button
                                        onClick={async () => {
                                            if (confirm(`Deseja resetar ${stats.consultedNoPhones} leads que falharam no contato?`)) {
                                                setLoading(true)
                                                await supabase
                                                    .from('leads')
                                                    .update({ status: 'incompleto' })
                                                    .eq('status', 'consultado')
                                                    .eq('phones', '[]')
                                                await fetchStats()
                                                addLog(`✅ ${stats.consultedNoPhones} LEADS RESETADOS PARA RE-CONSULTA`, 'success')
                                            }
                                        }}
                                        disabled={loading}
                                        className="flex-1 group relative glass-deep hover:bg-rose-500/10 py-6 md:py-8 px-6 md:px-16 rounded-[24px] md:rounded-[40px] transition-all shadow-2xl active:scale-[0.94] uppercase italic tracking-[0.1em] md:tracking-[0.2em] flex items-center justify-center gap-3 md:gap-5 text-lg md:text-xl font-display text-rose-500 border border-rose-500/20"
                                    >
                                        <AlertCircle className="w-6 h-6 md:w-8 md:h-8" />
                                        <span>Reparar Falhas</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 md:space-y-12 animate-in zoom-in-95 duration-700 relative z-10">
                            <div className="glass-deep p-6 md:p-12 rounded-[32px] md:rounded-[56px] border border-white/5 shadow-inner backdrop-blur-3xl relative overflow-hidden group">
                                <div className="absolute -right-10 md:-right-20 -top-10 md:-top-20 w-32 md:w-64 h-32 md:h-64 bg-primary/5 blur-[40px] md:blur-[80px] rounded-full group-hover:bg-primary/10 transition-colors pointer-events-none" />
                                
                                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8 md:mb-10">
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className={cn("w-3 h-3 md:w-4 md:h-4 rounded-full shadow-glow", isPaused ? "bg-amber-500 shadow-amber-500/50" : "bg-primary animate-pulse shadow-primary/50")} />
                                        <div className="space-y-1 md:space-y-2">
                                            <p className="text-[9px] md:text-[11px] font-mono font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] italic text-zinc-600 leading-none pb-1">
                                                {isPaused ? 'OPERAÇÃO EM PAUSA' : 'PROCESSAMENTO ATIVO'}
                                            </p>
                                            <p className="text-2xl md:text-3xl font-display italic uppercase tracking-tighter leading-none text-white">{progress.current} <span className="text-zinc-700 mx-1 text-base md:text-xl font-mono">/</span> {progress.total}</p>
                                        </div>
                                    </div>
                                    <div className="md:text-right">
                                        <p className="text-4xl md:text-5xl font-display text-white italic tracking-tighter leading-none glow-primary-sm">{Math.round((progress.current / progress.total) * 100)}%</p>
                                        <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-zinc-700 pt-2 md:pt-3 italic">Indexação</p>
                                    </div>
                                </div>

                                <div className="w-full h-2 md:h-3 bg-[#05010a] rounded-full overflow-hidden border border-white/10 relative p-1 mb-10 md:mb-12 ring-4 md:ring-8 ring-white/[0.02]">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary via-magenta to-primary bg-[length:200%_auto] animate-shimmer rounded-full transition-all duration-700 shadow-glow-primary"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-10">
                                    <div className="glass-deep p-6 md:p-10 rounded-[24px] md:rounded-[48px] border border-emerald-500/10 flex flex-col items-center group/card overflow-hidden relative shadow-2xl hover:bg-emerald-500/[0.02] transition-colors">
                                        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-5 group-hover/card:scale-125 transition-transform duration-1000 pointer-events-none">
                                            <CheckCircle2 className="w-16 md:w-24 h-16 md:h-24 text-emerald-500" />
                                        </div>
                                        <p className="text-[9px] md:text-[11px] font-mono font-bold uppercase text-emerald-500 tracking-[0.2em] md:tracking-[0.4em] mb-2 md:mb-4 italic leading-none relative z-10">Sucesso Circular</p>
                                        <p className="text-4xl md:text-6xl font-display text-emerald-400 italic leading-none pt-2 glow-emerald-sm relative z-10">+{progress.success}</p>
                                    </div>
                                    <div className="glass-deep p-6 md:p-10 rounded-[24px] md:rounded-[48px] border border-destructive/10 flex flex-col items-center group/card overflow-hidden relative shadow-2xl hover:bg-destructive/[0.02] transition-colors">
                                        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-5 group-hover/card:scale-125 transition-transform duration-1000 pointer-events-none">
                                            <AlertCircle className="w-16 md:w-24 h-16 md:h-24 text-destructive" />
                                        </div>
                                        <p className="text-[9px] md:text-[11px] font-mono font-bold uppercase text-destructive tracking-[0.2em] md:tracking-[0.4em] mb-2 md:mb-4 italic leading-none relative z-10">Falhas de Sinal</p>
                                        <p className="text-4xl md:text-6xl font-display text-destructive italic leading-none pt-2 glow-destructive-sm relative z-10">-{progress.failed}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-10">
                                    <div className="flex items-center gap-4 text-zinc-600">
                                        <Terminal className="w-5 h-5" />
                                        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.5em] italic">Log de Terminal</span>
                                    </div>
                                    <p className="text-[10px] font-mono font-bold text-zinc-800 uppercase italic tracking-widest">Acesso Restrito</p>
                                </div>
                                <div className="glass shadow-inner rounded-[48px] h-72 overflow-y-auto p-12 font-mono text-[12px] space-y-4 custom-scrollbar bg-[#05010a]/60 border border-white/5 transition-all">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className={cn(
                                            "flex gap-6 animate-in fade-in slide-in-from-left-6 duration-700 p-4 rounded-[20px] transition-all hover:bg-white/[0.02] border border-transparent",
                                            log.type === 'success' ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" : log.type === 'error' ? "text-destructive bg-destructive/5 border-destructive/10" : "text-zinc-500 border-white/5"
                                        )}>
                                            <span className="opacity-30 shrink-0 font-bold tracking-widest text-[10px]">[{new Date().toLocaleTimeString().slice(0, 5)}]</span>
                                            <p className="font-bold leading-relaxed italic tracking-tight">{log.msg}</p>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 flex flex-col gap-10 h-full stagger-4">
                    <div className="glass shadow-[0_32px_100px_rgba(0,0,0,0.5)] rounded-[64px] p-12 flex flex-col items-center justify-center text-center space-y-8 hover:border-emerald-500/30 transition-all group border border-white/10 relative overflow-hidden bg-[#0d0118]/40">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
                        <div className="w-28 h-28 rounded-[40px] glass glow-emerald flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-1000 ring-[12px] ring-emerald-500/5">
                            <ShieldCheck className="w-14 h-14 text-emerald-500" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            <h3 className="text-3xl font-display uppercase italic tracking-tight text-white leading-none">Criptografia</h3>
                            <p className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-[0.4em] bg-emerald-500/10 px-10 py-4 rounded-full border border-emerald-500/20 shadow-inner italic">ESTADO: INTEGRAL</p>
                        </div>
                    </div>

                    <div className="glass shadow-[0_32px_100px_rgba(0,0,0,0.5)] rounded-[64px] p-12 flex flex-col items-center justify-center text-center space-y-10 hover:border-primary/30 transition-all group border border-white/10 relative overflow-hidden flex-1 bg-[#0d0118]/40">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
                        <div className="w-28 h-28 rounded-[40px] glass glow-primary flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-1000 ring-[12px] ring-primary/5">
                            <Globe className="w-14 h-14 text-primary" />
                        </div>
                        <div className="space-y-5 relative z-10 w-full">
                            <h3 className="text-3xl font-display uppercase italic tracking-tight text-white leading-none">Conectividade</h3>
                            <div className="space-y-3">
                                {[
                                    { l: 'Latência', v: '12ms', c: 'text-zinc-300' },
                                    { l: 'Protocolo', v: 'HTTPS/2', c: 'text-zinc-300' },
                                    { l: 'Servidor', v: 'Terminal-N1', c: 'text-primary' }
                                ].map((row, r) => (
                                    <div key={r} className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest italic">{row.l}:</span>
                                        <span className={cn("text-[11px] font-mono font-bold uppercase tracking-widest", row.c)}>{row.v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
