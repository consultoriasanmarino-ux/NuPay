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
    total_sucessos: number
    total_falhas: number
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
    const totalSucessos = ligadores.reduce((s, l) => s + l.total_sucessos, 0)
    const totalFalhas = ligadores.reduce((s, l) => s + l.total_falhas, 0)
    const totalPendentes = ligadores.reduce((s, l) => s + l.total_pendentes, 0)
    const taxaGeral = totalAtribuidas > 0 ? Math.round((totalSucessos / totalAtribuidas) * 100) : 0

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
            const [attrRes, sucRes, falRes] = await Promise.all([
                supabase
                    .from('leads')
                    .select('id', { count: 'exact', head: true })
                    .eq('owner_id', profile.id)
                    .in('status', ['atribuido', 'arquivado', 'concluido', 'pago', 'recusado']),
                supabase
                    .from('leads')
                    .select('id', { count: 'exact', head: true })
                    .eq('owner_id', profile.id)
                    .eq('status', 'pago'),
                supabase
                    .from('leads')
                    .select('id', { count: 'exact', head: true })
                    .eq('owner_id', profile.id)
                    .in('status', ['recusado', 'arquivado']) // Count old archived as failure as requested
            ])

            const total_atribuidas = (attrRes.count || 0)
            const total_sucessos = (sucRes.count || 0)
            const total_falhas = (falRes.count || 0)
            const total_pendentes = total_atribuidas - (total_sucessos + total_falhas)
            const taxa_sucesso = (total_sucessos + total_falhas) > 0 ? Math.round((total_sucessos / (total_sucessos + total_falhas)) * 100) : 0

            return {
                ...profile,
                total_atribuidas,
                total_sucessos,
                total_falhas,
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
        <div className="space-y-16 animate-in fade-in duration-1000 selection:bg-primary/20 p-8 md:p-12">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 stagger-1">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[28px] glass glow-primary border border-primary/30 flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform group">
                            <Users className="w-9 h-9 text-primary group-hover:text-magenta transition-colors" />
                        </div>
                        <h2 className="text-5xl md:text-7xl font-display uppercase tracking-tight leading-none text-white italic">Elite de Operadores</h2>
                    </div>
                    <p className="text-zinc-500 font-bold text-lg italic flex items-center gap-4">
                        <BarChart3 className="w-5 h-5 text-emerald-400 animate-pulse" />
                        <span className="font-mono text-[11px] tracking-[0.4em] uppercase opacity-70">Monitoramento Biométrico e Performance Operacional Axon</span>
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-5 w-full xl:w-auto">
                    <button
                        onClick={() => fetchLigadores()}
                        className="w-16 h-16 shrink-0 rounded-[28px] glass border border-white/5 hover:border-primary/40 hover:text-primary transition-all active:scale-95 flex items-center justify-center shadow-xl group"
                    >
                        <RefreshCcw className={cn("w-6 h-6 transition-transform group-hover:rotate-180 duration-1000", loading && "animate-spin")} />
                    </button>
                    <div className="relative flex-1 md:w-96 group">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-all" />
                        <input
                            type="text"
                            placeholder="Buscar Identidade Terminal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0d0118]/40 border border-white/10 rounded-[32px] py-5.5 pl-16 pr-8 text-[11px] font-mono font-bold uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-zinc-700 italic"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full md:w-auto h-16 px-12 rounded-[32px] bg-primary text-white font-display text-lg italic uppercase tracking-tighter shadow-[0_16px_40px_rgba(151,1,254,0.3)] hover:bg-magenta hover:scale-[1.03] transition-all active:scale-95 flex items-center justify-center gap-4 border border-primary/20"
                    >
                        <Plus className="w-6 h-6" />
                        Novo Operador
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 stagger-2">
                {[
                    { label: 'Unidade de Operação', value: ligadores.filter(l => l.role === 'ligador').length, icon: Users, color: 'text-primary', glow: 'glow-primary' },
                    { label: 'Fichas em Sinc', value: totalPendentes, icon: Target, color: 'text-amber-400', glow: 'glow-gold' },
                    { label: 'Capital Captado', value: totalSucessos, icon: CheckCircle2, color: 'text-emerald-400', glow: 'glow-emerald' },
                    { label: 'Protocolos Falhos', value: totalFalhas, icon: X, color: 'text-rose-400', glow: 'glow-magenta' }
                ].map((stat, i) => (
                    <div key={i} className="glass shadow-[0_32px_100px_rgba(0,0,0,0.4)] p-10 rounded-[48px] border border-white/5 flex flex-col gap-6 hover:bg-white/[0.02] transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
                        <div className="flex items-center justify-between relative z-10">
                            <div className={cn("w-14 h-14 rounded-2xl glass flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 duration-500", stat.glow)}>
                                <stat.icon className={cn("w-7 h-7", stat.color)} />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-zinc-800" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-[0.4em] mb-2 leading-none italic">{stat.label}</h4>
                            <p className="text-5xl font-display italic tracking-tighter leading-none text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ligadores Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-12 stagger-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                        <Loader2 className="w-20 h-20 text-primary animate-spin relative z-10" />
                    </div>
                    <p className="text-[12px] font-mono font-bold uppercase tracking-[0.6em] text-primary animate-pulse italic">Sincronizando Terminal de Operadores...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10 stagger-4">
                    {filteredLigadores.length === 0 ? (
                        <div className="lg:col-span-2 xl:col-span-3 glass shadow-[0_64px_150px_rgba(0,0,0,0.5)] border-dashed border-white/10 p-32 flex flex-col items-center justify-center text-center space-y-10 rounded-[64px] animate-in fade-in zoom-in duration-1000">
                            <div className="w-40 h-40 bg-zinc-900/40 rounded-[56px] flex items-center justify-center border-2 border-dashed border-white/5 group relative overflow-hidden">
                                <Users className="w-20 h-20 group-hover:text-primary transition-all duration-500 text-zinc-800 relative z-10 group-hover:scale-110" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-5xl font-display uppercase italic tracking-tight text-white leading-none">Unidade Vazia</h3>
                                <p className="text-zinc-600 font-mono text-[11px] font-bold uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed italic">Nenhum operador registrado no terminal.</p>
                            </div>
                        </div>
                    ) : (
                        filteredLigadores.map((ligador) => (
                            <div key={ligador.id} className="glass shadow-[0_32px_80px_rgba(0,0,0,0.4)] p-12 flex flex-col space-y-12 group relative overflow-hidden rounded-[56px] border border-white/5 transition-all hover:bg-white/[0.02]">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-1000 pointer-events-none" />
                                
                                {/* Card Header */}
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-[32px] glass glow-primary border border-primary/20 flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform">
                                            <UserCircle2 className="w-10 h-10 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-display tracking-tight text-white group-hover:text-primary transition-colors leading-none uppercase italic">
                                                {ligador.full_name || 'SEM NOME'}
                                            </h4>
                                            <p className="text-[11px] font-mono font-bold text-primary/60 uppercase tracking-[0.2em] mt-2 italic">@{ligador.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 relative z-20">
                                        <button
                                            onClick={() => handleDelete(ligador.id)}
                                            className="w-12 h-12 rounded-[18px] glass border border-white/10 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 transition-all active:scale-90"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-8 relative z-10">
                                    <div className="glass-deep p-8 rounded-[40px] border border-white/5 flex flex-col items-center justify-center space-y-4 group/stat hover:bg-white/[0.04] transition-colors shadow-xl">
                                        <p className="text-5xl font-display italic leading-none text-amber-500 glow-gold-sm">{ligador.total_pendentes}</p>
                                        <div className="flex items-center gap-3 opacity-60">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-500 italic">Pendentes</p>
                                        </div>
                                    </div>
                                    <div className="glass-deep p-8 rounded-[40px] border border-white/5 flex flex-col items-center justify-center space-y-4 group/stat hover:bg-white/[0.04] transition-colors shadow-xl">
                                        <p className="text-5xl font-display italic leading-none text-emerald-500 glow-emerald-sm">{ligador.total_sucessos}</p>
                                        <div className="flex items-center gap-3 opacity-60">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-500 italic">Sucessos</p>
                                        </div>
                                    </div>
                                    <div className="glass-deep p-8 rounded-[40px] border border-white/5 flex flex-col items-center justify-center space-y-4 group/stat hover:bg-white/[0.04] transition-colors shadow-xl">
                                        <p className="text-5xl font-display italic leading-none text-rose-500 glow-magenta-sm">{ligador.total_falhas}</p>
                                        <div className="flex items-center gap-3 opacity-60">
                                            <X className="w-4 h-4 text-rose-500" />
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-zinc-500 italic">Falhas</p>
                                        </div>
                                    </div>
                                    <div className="glass-deep p-8 rounded-[40px] border border-white/5 flex flex-col items-center justify-center space-y-4 group/stat hover:bg-white/[0.04] transition-colors shadow-xl">
                                        <p className="text-5xl font-display italic leading-none text-zinc-400">{ligador.total_atribuidas}</p>
                                        <div className="flex items-center gap-3 opacity-60">
                                            <Target className="w-4 h-4 text-zinc-400" />
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-500 italic">Total</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar + Rate */}
                                <div className="space-y-6 relative z-10 border-t border-white/5 pt-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center border border-white/5">
                                                {getRankIcon(ligador.taxa_sucesso)}
                                            </div>
                                            <span className={cn("text-[11px] font-mono font-bold uppercase tracking-[0.3em] italic", getRankColor(ligador.taxa_sucesso))}>
                                                {ligador.taxa_sucesso >= 80 ? 'Protocolo Elite' :
                                                    ligador.taxa_sucesso >= 50 ? 'Performance Alta' :
                                                        ligador.taxa_sucesso >= 20 ? 'Operação Ativa' : 'Iniciação'}
                                            </span>
                                        </div>
                                        <span className={cn("text-4xl font-display italic glow-primary-sm", getRankColor(ligador.taxa_sucesso))}>
                                            {ligador.taxa_sucesso}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-[#05010a] rounded-full overflow-hidden border border-white/10 p-0.5 ring-4 ring-white/[0.02]">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000 shadow-glow-primary",
                                                ligador.taxa_sucesso >= 80 ? "bg-gradient-to-r from-orange-500 to-orange-400" :
                                                    ligador.taxa_sucesso >= 50 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                                                        ligador.taxa_sucesso >= 20 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                                                            "bg-gradient-to-r from-zinc-600 to-zinc-500"
                                            )}
                                            style={{ width: `${Math.max(ligador.taxa_sucesso, 2)}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-700 font-mono font-bold uppercase tracking-widest italic pt-2">
                                        <Clock className="w-4 h-4 text-zinc-800" />
                                        <span>Terminal Ativado em {new Date(ligador.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>

                                {/* Role Badge */}
                                {ligador.role === 'admin' && (
                                    <div className="absolute bottom-6 right-10">
                                        <span className="px-6 py-2 bg-primary/10 border border-primary/30 rounded-full text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-primary shadow-glow-sm italic">
                                            Root Admin
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
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-[#05010a]/95 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="glass shadow-[0_64px_150px_rgba(0,0,0,0.8)] w-full max-w-2xl rounded-[64px] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500 relative group">
                         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        
                        <div className="px-12 py-12 border-b border-white/5 flex justify-between items-center bg-[#0d0118]/40 relative z-10">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 rounded-[32px] glass glow-primary flex items-center justify-center border border-primary/20 rotate-6 group-hover:rotate-0 transition-transform">
                                    <User className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-4xl font-display uppercase italic tracking-tight text-white leading-none">Novo Operador</h3>
                                    <p className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-[0.4em] mt-3 italic">Mapeamento de Identidade Terminal</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-16 h-16 rounded-[28px] glass border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 transition-all flex items-center justify-center active:scale-90"
                            >
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-12 space-y-10 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-[0.4em] italic ml-2">Nome Completo do Ativo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                    className="w-full glass-deep border border-white/10 rounded-[40px] py-8 px-10 text-lg font-display uppercase italic tracking-tight outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all text-white shadow-2xl"
                                    placeholder="EX: GABRIEL HENRIQUE"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-[0.4em] italic ml-2">Identidade (Login)</label>
                                    <div className="relative">
                                        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-primary font-mono font-bold text-lg">@</span>
                                        <input
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase() }))}
                                            className="w-full glass-deep border border-white/10 rounded-[32px] py-7 pl-16 pr-8 text-[12px] font-mono font-bold outline-none focus:border-primary/40 transition-all text-white placeholder:text-zinc-800"
                                            placeholder="operador.alpha"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-[0.4em] italic ml-2">Chave de Acesso</label>
                                    <div className="relative">
                                        <Key className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-800" />
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                                            className="w-full glass-deep border border-white/10 rounded-[32px] py-7 pl-18 pr-8 text-[12px] font-mono font-bold outline-none focus:border-primary/40 transition-all text-white placeholder:text-zinc-800"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full h-24 bg-primary text-white rounded-[40px] font-display text-2xl italic uppercase tracking-tighter shadow-[0_24px_60px_rgba(151,1,254,0.4)] flex items-center justify-center gap-6 active:scale-[0.96] transition-all border border-primary/20 group/btn mt-10"
                            >
                                {saving ? <Loader2 className="w-10 h-10 animate-spin" /> : <Zap className="w-10 h-10 text-white fill-white group-hover:rotate-12 transition-transform" />}
                                <span>{saving ? 'Codificando Operador...' : 'Ativar Operador'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
