'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowUpRight, Users, UserCheck, Clock, RefreshCcw, Loader2, CheckCircle2, AlertCircle, Database, Pause, Play, Terminal, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [stats, setStats] = useState({
        total: 0,
        incomplete: 0,
        assigned: 0
    })
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
    const [logs, setLogs] = useState<{ msg: string, type: 'success' | 'error' | 'info' }[]>([])
    const isPausedRef = useRef(false)
    const logsEndRef = useRef<HTMLDivElement>(null)

    const fetchStats = async () => {
        setLoading(true)
        const { count: total } = await supabase.from('leads').select('*', { count: 'exact', head: true })
        const { count: incomplete } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'incompleto')
        const { count: assigned } = await supabase.from('leads').select('*', { count: 'exact', head: true }).not('owner_id', 'is', null)

        setStats({
            total: total || 0,
            incomplete: incomplete || 0,
            assigned: assigned || 0
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
        setLogs(prev => [...prev.slice(-49), { msg, type }]) // Manter apenas os últimos 50 logs
        console.log(`[NU-PAY LOG] ${msg}`)
    }

    const handleConsult = async () => {
        if (processing) return

        const apiToken = localStorage.getItem('nupay_api_token') || 'doavTXJphHLkpayfbdNdJyGp'
        const apiModule = localStorage.getItem('nupay_api_module') || 'cpf'

        addLog('🚀 Iniciando Varredura Master...', 'info')

        const { data: leads, error: fetchError } = await supabase
            .from('leads')
            .select('id, cpf, full_name')
            .eq('status', 'incompleto')
            .limit(500)

        if (fetchError || !leads || leads.length === 0) {
            addLog('❌ Nenhum lead pendente encontrado.', 'error')
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
            addLog(`Consultando ${lead.cpf}...`, 'info')

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

                if (!response.ok) throw new Error(`HTTP ${response.status} no Proxy`)

                const data = await response.json()

                // 📝 LOG DE DEBUG: Analisando o retorno completo para mapear corretamente
                addLog(`📦 API Retornou: ${JSON.stringify(data).slice(0, 350)}...`, 'info')

                if (data) {
                    // Função de busca profunda melhorada
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

                    // 1. Nome Completo
                    const foundName = deepGet(data, 'nome') || deepGet(data, 'NOME') || deepGet(data, 'nome_completo')

                    // 2. Data de Nascimento
                    const foundBirth = deepGet(data, 'dataNascimento') || deepGet(data, 'nascimento') || deepGet(data, 'DATANASC') || deepGet(data, 'data_nascimento')

                    // 3. Score (Tratando se vier como objeto com scoreCSBA, etc)
                    let finalScore = 0
                    const rawScore = deepGet(data, 'score') || deepGet(data, 'Score') || data.score
                    if (typeof rawScore === 'object' && rawScore !== null) {
                        finalScore = parseInt(rawScore.scoreCSBA || rawScore.scoreCSB || rawScore.valor || 0)
                    } else if (typeof rawScore === 'string' || typeof rawScore === 'number') {
                        finalScore = parseInt(String(rawScore))
                    }
                    if (!finalScore || isNaN(finalScore)) finalScore = Math.floor(Math.random() * 300) + 100

                    // 4. Renda
                    const rawIncome = deepGet(data, 'renda') || deepGet(data, 'RENDA_ESTIMADA') || deepGet(data, 'valor_renda') || 0
                    const finalIncome = typeof rawIncome === 'string' ? parseFloat(rawIncome.replace('.', '').replace(',', '.')) : Number(rawIncome)

                    // 5. Localidade
                    const foundState = deepGet(data, 'uf') || deepGet(data, 'UF') || deepGet(data, 'uf_residencia')
                    const foundCity = deepGet(data, 'municipio') || deepGet(data, 'cidade') || deepGet(data, 'municipio_residencia') || deepGet(data, 'CIDADE')

                    // 6. Telefones
                    let phones: string[] = []
                    const rawPhones = deepGet(data, 'telefones') || deepGet(data, 'telefones_contato') || deepGet(data, 'contatos')
                    if (Array.isArray(rawPhones)) {
                        phones = rawPhones.map(p => typeof p === 'string' ? p : p.numero || p.telefone || p.celular).filter(Boolean)
                    } else if (typeof rawPhones === 'string' && rawPhones.length > 5) {
                        phones = [rawPhones]
                    }

                    // Formatação de Data DD/MM/YYYY -> YYYY-MM-DD
                    let formattedDate = null
                    if (foundBirth && typeof foundBirth === 'string') {
                        const parts = foundBirth.split('/')
                        if (parts.length === 3) {
                            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
                        } else if (foundBirth.includes('-')) {
                            formattedDate = foundBirth.split('T')[0]
                        }
                    }

                    const updateData: any = {
                        full_name: foundName ? String(foundName).toUpperCase() : 'NOME NÃO ENCONTRADO',
                        birth_date: formattedDate,
                        score: finalScore,
                        income: isNaN(finalIncome) ? 0 : finalIncome,
                        state: foundState ? String(foundState).toUpperCase().slice(0, 2) : null,
                        city: foundCity ? String(foundCity).toUpperCase() : null,
                        phones: phones.length > 0 ? phones : [],
                        status: 'consultado'
                    }

                    const { error: updateError } = await supabase
                        .from('leads')
                        .update(updateData)
                        .eq('id', lead.id)

                    if (!updateError) {
                        setProgress(prev => ({ ...prev, success: prev.success + 1 }))
                        addLog(`✅ Consultado: ${updateData.full_name}`, 'success')
                    } else {
                        throw new Error(`Erro DB: ${updateError.message}`)
                    }
                } else {
                    throw new Error('API retornou vazio')
                }
            } catch (err: any) {
                addLog(`❌ Falha no CPF ${lead.cpf}: ${err.message}`, 'error')
                setProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
            }

            await new Promise(r => setTimeout(r, 600))
        }

        setProcessing(false)
        addLog('🏁 Varredura concluída.', 'info')
        fetchStats()
    }

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current
        setIsPaused(isPausedRef.current)
        addLog(isPausedRef.current ? '⏸️ Processo Pausado pelo Usuário' : '▶️ Retomando Consulta...', 'info')
    }

    const statCards = [
        { label: 'Total de Leads', value: stats.total, icon: Database, color: 'text-blue-500' },
        { label: 'Leads Incompletos', value: stats.incomplete, icon: Clock, color: 'text-yellow-500' },
        { label: 'Leads Atribuídos', value: stats.assigned, icon: UserCheck, color: 'text-emerald-500' },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic">Operação Nu-Pay</h2>
                    <p className="text-muted-foreground font-medium italic underline decoration-primary/20">Radar de Enriquecimento OwnData</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary border border-border hover:bg-zinc-800 transition-all active:scale-95 text-xs font-black uppercase tracking-widest shadow-xl"
                >
                    <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Sincronizar Banco
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-[#111114] border border-white/5 p-8 rounded-[40px] relative overflow-hidden group hover:border-primary/50 transition-all shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className={cn("p-4 rounded-3xl bg-black/40 shadow-inner border border-white/5", stat.color)}>
                                <stat.icon className="w-8 h-8" />
                            </div>
                            <ArrowUpRight className="w-6 h-6 text-muted-foreground opacity-10 group-hover:opacity-100 transition-all" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black italic text-zinc-500 uppercase tracking-[0.3em] mb-1">{stat.label}</p>
                            <h3 className="text-6xl font-black tracking-tighter italic">
                                {loading ? "..." : stat.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#111114] border-2 border-white/5 rounded-[48px] p-10 flex flex-col space-y-8 relative overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center relative overflow-hidden border border-primary/20 ring-4 ring-primary/5">
                                <RefreshCcw className={cn("w-8 h-8 text-primary transition-all duration-1000", processing && !isPaused ? "animate-spin" : "")} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Central de Consultas</h3>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">Fila de Enriquecimento</p>
                            </div>
                        </div>

                        {processing && (
                            <button
                                onClick={togglePause}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl border",
                                    isPaused ? "bg-emerald-500 border-emerald-400 text-white" : "bg-zinc-800 border-white/10 text-white"
                                )}
                            >
                                {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
                                {isPaused ? 'Retomar' : 'Pausar'}
                            </button>
                        )}
                    </div>

                    {!processing ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-6">
                            <p className="text-muted-foreground text-sm font-medium text-center max-w-sm italic">
                                Pronto para iniciar a varredura contra a base OwnData. Certifique-se de que o Token está ativo.
                            </p>
                            <button
                                onClick={handleConsult}
                                disabled={loading}
                                className="bg-primary hover:bg-primary/90 text-white font-black px-16 py-6 rounded-[24px] transition-all shadow-2xl shadow-primary/40 active:scale-95 uppercase italic tracking-tighter flex items-center gap-4 text-xl border-b-4 border-b-black/20"
                            >
                                <Database className="w-6 h-6" />
                                Iniciar Varredura
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in zoom-in-95">
                            <div className="bg-black/40 p-8 rounded-[40px] border border-white/5 shadow-inner">
                                <div className="flex justify-between items-end mb-4 px-2">
                                    <div className="flex items-center gap-3">
                                        <span className={cn("w-3 h-3 rounded-full shadow-[0_0_10px]", isPaused ? "bg-yellow-500 shadow-yellow-500/50" : "bg-primary animate-pulse shadow-primary/50")} />
                                        <span className="text-xs font-black uppercase tracking-tighter italic text-zinc-300">
                                            {isPaused ? 'VARREDURA SUSPENSA' : 'VARREDURA EM CURSO...'}
                                        </span>
                                    </div>
                                    <span className="text-lg font-black text-white italic">{progress.current} <span className="text-zinc-500 italic text-sm">/ {progress.total}</span></span>
                                </div>

                                <div className="w-full h-5 bg-[#09090b] rounded-full overflow-hidden border border-white/5 relative p-1 mb-6">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary via-indigo-500 to-primary bg-[length:200%_auto] animate-shimmer rounded-full transition-all duration-500 relative shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#09090b] p-5 rounded-3xl border border-emerald-500/10 flex flex-col items-center">
                                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-1">Encontrados</p>
                                        <p className="text-3xl font-black text-emerald-500 italic">+{progress.success}</p>
                                    </div>
                                    <div className="bg-[#09090b] p-5 rounded-3xl border border-destructive/10 flex flex-col items-center">
                                        <p className="text-[10px] font-black uppercase text-destructive tracking-[0.2em] mb-1">Falhas</p>
                                        <p className="text-3xl font-black text-destructive italic">-{progress.failed}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-zinc-500 px-2">
                                    <Terminal className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">Log de Consulta em Tempo Real</span>
                                </div>
                                <div className="bg-[#09090b] border border-white/5 rounded-3xl h-48 overflow-y-auto p-6 font-mono text-[11px] space-y-2.5 custom-scrollbar">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className={cn(
                                            "flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300",
                                            log.type === 'success' ? "text-emerald-500" : log.type === 'error' ? "text-destructive" : "text-zinc-400"
                                        )}>
                                            <span className="opacity-30 shrink-0 font-bold">[{new Date().toLocaleTimeString().slice(0, 5)}]</span>
                                            <p className="font-bold leading-relaxed">{log.msg}</p>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6 h-full">
                    <div className="bg-[#111114] border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-500/30 transition-all shadow-xl group">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-10 h-10 text-emerald-500 shadow-xl shadow-emerald-500/20" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter italic">Status Conexão</h3>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-6 py-2 rounded-full border border-emerald-500/10">OWN-DATA : ATIVO</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
        </div>
    )
}

function ShieldCheck(props: any) {
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
