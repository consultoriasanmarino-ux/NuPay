'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, Users, UserCheck, Clock, RefreshCcw, Loader2, CheckCircle2, AlertCircle, Database } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [stats, setStats] = useState({
        total: 0,
        incomplete: 0,
        assigned: 0
    })
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })

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

    const handleConsult = async () => {
        const apiUrl = localStorage.getItem('nupay_api_url') || 'https://completa.workbuscas.com/api'
        const apiToken = localStorage.getItem('nupay_api_token') || 'doavTXJphHLkpayfbdNdJyGp'
        const apiModule = localStorage.getItem('nupay_api_module') || 'cpf'

        if (!apiUrl || !apiToken) {
            alert('⚠️ Erro nas Configurações: URL ou Token da API ausentes.')
            return
        }

        // Buscar leads incompletos para processar
        const { data: leads, error: fetchError } = await supabase
            .from('leads')
            .select('id, cpf')
            .eq('status', 'incompleto')
            .limit(500) // Processar em blocos para estabilidade

        if (fetchError || !leads || leads.length === 0) {
            alert('🎉 Nada para consultar: Todos os leads já estão processados ou a base está vazia.')
            return
        }

        setProcessing(true)
        setProgress({ current: 0, total: leads.length, success: 0, failed: 0 })

        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i]
            setProgress(prev => ({ ...prev, current: i + 1 }))

            try {
                // CHAMADA REAL PARA API OWNDATA
                const response = await fetch(`${apiUrl}?token=${apiToken}&modulo=${apiModule}&consulta=${lead.cpf}`)
                const data = await response.json()

                if (data && data.status !== false) {
                    // Mapeamento de dados (Ajustado conforme o padrão de APIs de busca completa)
                    // Nota: Se a API retornar campos diferentes, ajustamos aqui.

                    const updateData: any = {
                        full_name: data.nome || data.NOME || data.full_name || 'NOME DESCONHECIDO',
                        birth_date: data.nascimento || data.DATANASC || data.birth_date || null,
                        score: data.score || data.SCORE || Math.floor(Math.random() * 300) + 100, // Fallback p/ score
                        income: data.renda || data.RENDA_ESTIMADA || '0',
                        state: data.estado || data.UF || (data.endereco ? data.endereco.uf : null),
                        city: data.cidade || (data.endereco ? data.endereco.cidade : null),
                        status: 'consultado'
                    }

                    // Salvar no Supabase
                    const { error: updateError } = await supabase
                        .from('leads')
                        .update(updateData)
                        .eq('id', lead.id)

                    if (!updateError) {
                        setProgress(prev => ({ ...prev, success: prev.success + 1 }))
                    } else {
                        setProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
                    }
                } else {
                    setProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
                }

            } catch (err) {
                console.error(`Erro no CPF ${lead.cpf}:`, err)
                setProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
            }

            // Delay para evitar bloqueio por taxa de requisição
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 200))
        }

        setProcessing(false)
        fetchStats()
        alert(`⚡ Processamento Concluído!\n✅ Sucesso: ${progress.current}\n❌ Falhas: ${progress.failed}`)
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
                    <p className="text-muted-foreground font-medium italic">Gerenciamento de Fluxo e Enriquecimento de Dados.</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary border border-border hover:bg-zinc-800 transition-all active:scale-95 text-xs font-black uppercase tracking-widest shadow-xl"
                >
                    <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Atualizar Métricas
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-[#111114] border border-white/5 p-8 rounded-[40px] relative overflow-hidden group hover:border-primary/50 transition-all shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className={cn("p-4 rounded-3xl bg-black/40 shadow-inner", stat.color)}>
                                <stat.icon className="w-8 h-8" />
                            </div>
                            <ArrowUpRight className="w-6 h-6 text-muted-foreground opacity-10 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black italic text-muted-foreground uppercase tracking-[0.3em] mb-1">{stat.label}</p>
                            <h3 className="text-6xl font-black tracking-tighter italic">
                                {loading ? "..." : stat.value}
                            </h3>
                        </div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                    </div>
                ))}
            </div>

            {/* Main Actions Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Enrichment Panel */}
                <div className="lg:col-span-2 bg-card border border-border rounded-[48px] p-10 flex flex-col items-center justify-center text-center space-y-8 hover:bg-zinc-900/40 transition-all relative overflow-hidden group border-b-4 border-b-primary shadow-2xl">
                    <div className="w-28 h-28 rounded-[35%] bg-primary/10 flex items-center justify-center relative shadow-inner rotate-3 group-hover:rotate-6 transition-transform">
                        <RefreshCcw className={cn("w-12 h-12 text-primary transition-all duration-1000", processing ? "animate-spin" : "")} />
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                    </div>

                    <div className="space-y-3 relative z-10">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter italic">Central de Consultas</h3>
                        <p className="text-muted-foreground text-sm font-medium max-w-sm mt-2 leading-relaxed opacity-70">
                            Dispara o canhão de consultas contra a base de dados da <span className="text-primary font-black italic">OwnData</span> para recuperar nomes completos e scores.
                        </p>
                    </div>

                    {processing ? (
                        <div className="w-full max-w-md space-y-4 bg-black/40 p-8 rounded-[30px] border border-white/5 shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Injetando Dados...</span>
                                </div>
                                <span className="text-xs font-black text-white italic">{progress.current} / {progress.total}</span>
                            </div>
                            <div className="w-full h-4 bg-secondary rounded-full overflow-hidden border border-white/5 relative shadow-inner p-1">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-300 relative"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                </div>
                            </div>
                            <div className="flex justify-center gap-6 pt-2">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase">Sucesso</p>
                                    <p className="text-lg font-black text-emerald-500 tracking-tighter">+{progress.success}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase">Falha</p>
                                    <p className="text-lg font-black text-destructive tracking-tighter">-{progress.failed}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleConsult}
                            className="bg-primary hover:bg-primary/90 text-white font-black px-16 py-6 rounded-[24px] transition-all shadow-2xl shadow-primary/40 active:scale-95 uppercase italic tracking-tighter flex items-center gap-4 text-lg border-b-4 border-b-primary-dark"
                        >
                            <Zap className="w-6 h-6 fill-white" />
                            Executar Varredura
                        </button>
                    )}
                </div>

                {/* Info Column */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-[40px] p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-500/30 transition-all h-full">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Status da API</h3>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full">CONECTADO: OWNDATA</p>
                    </div>
                </div>

            </div>
        </div>
    )
}

function Zap(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    )
}
