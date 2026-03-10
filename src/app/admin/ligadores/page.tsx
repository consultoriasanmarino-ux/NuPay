'use client'

import { useEffect, useState } from 'react'
import {
    Plus,
    User,
    Key,
    Trash2,
    Edit2,
    X,
    Loader2,
    Zap,
    Search,
    UserCircle2,
    TrendingUp,
    Phone,
    CheckCircle2,
    Clock,
    BarChart3,
    Users,
    Activity,
    RefreshCcw,
    ArrowUpRight,
    Target,
    Award,
    Flame
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type LigadorStats = {
    id: string
    full_name: string
    username: string
    role: string
    created_at: string
    total_atribuidas: number
    total_finalizadas: number
    total_pendentes: number
    taxa_sucesso: number
}

export default function LigadoresPage() {
    const [ligadores, setLigadores] = useState<LigadorStats[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        password: '',
        role: 'ligador'
    })

    // Totals
    const totalAtribuidas = ligadores.reduce((s, l) => s + l.total_atribuidas, 0)
    const totalFinalizadas = ligadores.reduce((s, l) => s + l.total_finalizadas, 0)
    const totalPendentes = ligadores.reduce((s, l) => s + l.total_pendentes, 0)
    const taxaGeral = totalAtribuidas > 0 ? Math.round((totalFinalizadas / totalAtribuidas) * 100) : 0

    const fetchLigadores = async () => {
        setLoading(true)

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error || !profiles) {
            setLoading(false)
            return
        }

        // Fetch lead stats for each ligador
        const statsPromises = profiles.map(async (profile) => {
            const [attrRes, finRes] = await Promise.all([
                supabase
                    .from('leads')
                    .select('id', { count: 'exact', head: true })
                    .eq('owner_id', profile.id)
                    .in('status', ['atribuido', 'arquivado', 'concluido']),
                supabase
                    .from('leads')
                    .select('id', { count: 'exact', head: true })
                    .eq('owner_id', profile.id)
                    .eq('status', 'arquivado')
            ])

            const total_atribuidas = (attrRes.count || 0)
            const total_finalizadas = (finRes.count || 0)
            const total_pendentes = total_atribuidas - total_finalizadas
            const taxa_sucesso = total_atribuidas > 0 ? Math.round((total_finalizadas / total_atribuidas) * 100) : 0

            return {
                ...profile,
                total_atribuidas,
                total_finalizadas,
                total_pendentes,
                taxa_sucesso
            } as LigadorStats
        })

        const results = await Promise.all(statsPromises)
        setLigadores(results)
        setLoading(false)
    }

    useEffect(() => {
        fetchLigadores()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const userEmail = `${formData.username.trim()}@axon.pay`
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userEmail,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                        username: formData.username.trim()
                    }
                }
            })

            let userId = authData.user?.id
            if (authError && authError.message.includes('already registered')) {
                alert('Este usuário já existe no sistema.')
                setSaving(false)
                return
            }

            if (authError) throw authError
            if (!userId) throw new Error('Erro ao criar usuário')

            await new Promise(resolve => setTimeout(resolve, 1500))

            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: userId,
                    full_name: formData.full_name.toUpperCase(),
                    username: formData.username.trim().toLowerCase(),
                    role: formData.role
                }])

            if (profileError) {
                await new Promise(resolve => setTimeout(resolve, 2000))
                const { error: retryError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: userId,
                        full_name: formData.full_name.toUpperCase(),
                        username: formData.username.trim().toLowerCase(),
                        role: formData.role
                    }])
                if (retryError) throw retryError
            }

            setIsModalOpen(false)
            setFormData({ full_name: '', username: '', password: '', role: 'ligador' })
            fetchLigadores()
            alert('✅ Ligador criado com sucesso!')
        } catch (error: any) {
            alert('Erro: ' + (error.message || 'Erro desconhecido'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('⚠️ Tem certeza que deseja excluir este ligador?')) return
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) alert('Erro ao excluir: ' + error.message)
        else fetchLigadores()
    }

    const filteredLigadores = ligadores.filter(l =>
        l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getRankIcon = (taxa: number) => {
        if (taxa >= 80) return <Flame className="w-4 h-4 text-orange-400" />
        if (taxa >= 50) return <Award className="w-4 h-4 text-amber-400" />
        if (taxa >= 20) return <TrendingUp className="w-4 h-4 text-emerald-400" />
        return <Activity className="w-4 h-4 text-zinc-500" />
    }

    const getRankColor = (taxa: number) => {
        if (taxa >= 80) return 'text-orange-400'
        if (taxa >= 50) return 'text-amber-400'
        if (taxa >= 20) return 'text-emerald-400'
        return 'text-zinc-500'
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-[28px] bg-primary/10 border border-primary/20 shadow-2xl">
                            <Users className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-4xl xl:text-5xl font-black tracking-tighter uppercase italic leading-none">Painel dos Ligadores</h2>
                    </div>
                    <p className="text-muted-foreground font-medium italic opacity-60 text-lg flex items-center gap-3">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Monitoramento em tempo real das operações
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <button
                        onClick={() => fetchLigadores()}
                        className="p-4 rounded-2xl bg-secondary border border-white/5 hover:border-primary/20 hover:text-primary transition-all active:scale-95"
                    >
                        <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                    <div className="relative flex-1 md:w-72 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar ligador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-secondary/30 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-[0_12px_40px_rgba(129,140,248,0.3)] hover:scale-[1.03] transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Ligador
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
                {[
                    { label: 'Total Ligadores', value: ligadores.filter(l => l.role === 'ligador').length, icon: Users, color: 'text-primary', bg: 'bg-primary/5 border-primary/10' },
                    { label: 'Fichas Ativas', value: totalPendentes, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/10' },
                    { label: 'Finalizadas', value: totalFinalizadas, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                    { label: 'Taxa Geral', value: `${taxaGeral}%`, icon: TrendingUp, color: taxaGeral >= 50 ? 'text-emerald-400' : 'text-amber-400', bg: taxaGeral >= 50 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/10' }
                ].map((stat, i) => (
                    <div key={i} className={cn("glass p-6 xl:p-8 rounded-[32px] border flex flex-col gap-4 hover:scale-[1.02] transition-all", stat.bg)}>
                        <div className="flex items-center justify-between">
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                            <ArrowUpRight className="w-4 h-4 text-zinc-700" />
                        </div>
                        <div>
                            <p className="text-3xl xl:text-4xl font-black italic tracking-tighter leading-none">{stat.value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-2">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ligadores Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="relative">
                        <Loader2 className="w-14 h-14 text-primary animate-spin" />
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    </div>
                    <p className="text-sm font-bold text-primary animate-pulse">Carregando dados...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredLigadores.length === 0 ? (
                        <div className="lg:col-span-2 xl:col-span-3 glass border-dashed border-white/5 p-24 rounded-[48px] flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-24 h-24 bg-secondary/30 rounded-[32px] border-2 border-dashed border-white/5 flex items-center justify-center text-zinc-700">
                                <Users className="w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Nenhum Ligador</h3>
                                <p className="text-zinc-500 max-w-sm mx-auto font-medium">Clique em "Novo Ligador" para cadastrar.</p>
                            </div>
                        </div>
                    ) : (
                        filteredLigadores.map((ligador) => (
                            <div key={ligador.id} className="glass rounded-[36px] xl:rounded-[48px] overflow-hidden group hover:border-primary/30 transition-all border-white/5">
                                {/* Card Header */}
                                <div className="p-6 xl:p-8 pb-0 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-secondary border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                                            <UserCircle2 className="w-7 h-7 text-zinc-500 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg xl:text-xl font-black uppercase italic tracking-tight truncate leading-none group-hover:text-primary transition-colors">
                                                {ligador.full_name || 'SEM NOME'}
                                            </h4>
                                            <p className="text-xs text-primary/60 font-mono mt-1">@{ligador.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => handleDelete(ligador.id)}
                                            className="p-2.5 rounded-xl bg-black/40 border border-white/5 hover:text-red-400 hover:border-red-500/20 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="p-6 xl:p-8 grid grid-cols-3 gap-3">
                                    <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/5">
                                        <p className="text-2xl font-black italic leading-none text-amber-400">{ligador.total_pendentes}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mt-1.5">Pendentes</p>
                                    </div>
                                    <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/5">
                                        <p className="text-2xl font-black italic leading-none text-emerald-400">{ligador.total_finalizadas}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mt-1.5">Finalizadas</p>
                                    </div>
                                    <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/5">
                                        <p className="text-2xl font-black italic leading-none">{ligador.total_atribuidas}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mt-1.5">Total</p>
                                    </div>
                                </div>

                                {/* Progress Bar + Rate */}
                                <div className="px-6 xl:px-8 pb-6 xl:pb-8 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {getRankIcon(ligador.taxa_sucesso)}
                                            <span className={cn("text-xs font-black italic", getRankColor(ligador.taxa_sucesso))}>
                                                {ligador.taxa_sucesso >= 80 ? 'Excelente' :
                                                    ligador.taxa_sucesso >= 50 ? 'Bom' :
                                                        ligador.taxa_sucesso >= 20 ? 'Regular' : 'Iniciante'}
                                            </span>
                                        </div>
                                        <span className={cn("text-lg font-black italic", getRankColor(ligador.taxa_sucesso))}>
                                            {ligador.taxa_sucesso}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                ligador.taxa_sucesso >= 80 ? "bg-gradient-to-r from-orange-500 to-orange-400" :
                                                    ligador.taxa_sucesso >= 50 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                                                        ligador.taxa_sucesso >= 20 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                                                            "bg-gradient-to-r from-zinc-600 to-zinc-500"
                                            )}
                                            style={{ width: `${Math.max(ligador.taxa_sucesso, 2)}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-medium">
                                        <Clock className="w-3 h-3" />
                                        <span>Cadastrado em {new Date(ligador.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>

                                {/* Role Badge */}
                                {ligador.role === 'admin' && (
                                    <div className="px-6 xl:px-8 pb-6 xl:pb-8 pt-0">
                                        <span className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/15 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                            Administrador
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal - Novo Ligador */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/95 backdrop-blur-3xl animate-in fade-in duration-300">
                    <div className="glass w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-white/10">
                        <div className="px-8 py-8 border-b border-white/5 flex justify-between items-center bg-secondary/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Novo Ligador</h3>
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-1">Cadastro de operador</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 rounded-xl bg-secondary hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20 transition-all uppercase"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 ml-1">Usuário (Login)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">@</span>
                                        <input
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase() }))}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-9 pr-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                            placeholder="joao01"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 ml-1">Senha</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-11 pr-4 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary py-5 rounded-2xl font-black uppercase text-white shadow-[0_12px_40px_rgba(129,140,248,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all text-sm"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-white" />}
                                {saving ? 'Criando...' : 'Criar Ligador'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
