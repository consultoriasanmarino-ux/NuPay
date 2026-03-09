'use client'

import { useEffect, useState } from 'react'
import {
    Plus,
    User,
    Key,
    Trash2,
    Edit2,
    ShieldCheck,
    UserMinus,
    X,
    Loader2,
    Save,
    Users,
    Activity,
    Cpu,
    Zap,
    LayoutGrid,
    Search,
    UserCircle2,
    ShieldAlert
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function LigadoresPage() {
    const [ligadores, setLigadores] = useState<any[]>([])
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

    const fetchLigadores = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setLigadores(data)
        }
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
                alert('PROTOCOL ERROR: USERNAME ALREADY ARCHIVED IN CORE AUTH.')
                setSaving(false)
                return
            }

            if (authError) throw authError
            if (!userId) throw new Error('ID_SIGNAL_MISSING')

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
            alert('🚀 OPERATOR DEPLOYED TO SIGNAL CHAIN.')
        } catch (error: any) {
            alert('CORE FAILURE: ' + (error.message || 'UNKNOWN_ERROR'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('⚠️ SYSTEM WARNING: DE-ARCHIVE OPERATOR PERMANENTLY?')) return
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) alert('FLUSH FAILED: ' + error.message)
        else fetchLigadores()
    }

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
                        <div className="p-4 rounded-[28px] bg-primary/10 border border-primary/20 shadow-2xl scale-110">
                            <Users className="w-8 h-8 text-primary shadow-glow" />
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Operator Console</h2>
                    </div>
                    <p className="text-muted-foreground font-medium italic opacity-60 text-lg flex items-center gap-3">
                        <Cpu className="w-4 h-4 text-primary" />
                        Identity Management and Access Protocol
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH BY IDENTITY..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-secondary/30 border border-white/5 rounded-[28px] py-4 pl-14 pr-6 text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-4 px-10 py-5 rounded-[28px] bg-primary text-white font-black uppercase text-xs shadow-[0_20px_50px_rgba(129,140,248,0.3)] hover:scale-[1.03] transition-all active:scale-95 italic tracking-tighter border-b-4 border-black/20"
                    >
                        <Plus className="w-6 h-6" />
                        Deploy Operator
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-6">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse italic">Scanning User Matrix...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredLigadores.length === 0 ? (
                        <div className="md:col-span-2 lg:col-span-3 glass border-dashed border-white/5 p-32 rounded-[64px] flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
                            <div className="w-32 h-32 bg-secondary/30 rounded-[48px] border-2 border-dashed border-white/5 flex items-center justify-center text-zinc-800 transition-transform hover:scale-105 duration-500 relative group">
                                <UserMinus className="w-16 h-16 group-hover:text-primary transition-colors" />
                                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">No Active Signals</h3>
                                <p className="text-zinc-500 max-w-sm mx-auto italic font-medium">Initiate the "Deploy Operator" protocol to register active signals in the system matrix.</p>
                            </div>
                        </div>
                    ) : (
                        filteredLigadores.map((ligador) => (
                            <div key={ligador.id} className="glass p-10 rounded-[56px] relative overflow-hidden group card-hover border-white/5">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />

                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div className="w-18 h-18 rounded-[28px] bg-secondary border border-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all shadow-2xl">
                                        <UserCircle2 className="w-10 h-10 text-zinc-600 group-hover:text-primary transition-all duration-500" />
                                    </div>
                                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:text-primary hover:border-primary/30 transition-all hover:scale-110 active:scale-95 shadow-2xl">
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ligador.id)}
                                            className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:text-destructive hover:border-destructive/30 transition-all hover:scale-110 active:scale-95 shadow-2xl"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black italic text-zinc-600 uppercase tracking-[0.3em] leading-none mb-2">Signal Identity</p>
                                        <h4 className="text-3xl font-black uppercase italic tracking-tighter truncate leading-none group-hover:text-primary transition-colors decoration-primary/20 underline underline-offset-8">{ligador.full_name || 'PENDING IDENTITY'}</h4>
                                    </div>

                                    <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black italic text-zinc-600 uppercase tracking-[0.3em] leading-none">Access Node</p>
                                            <p className="font-mono text-xs font-black text-primary italic leading-none group-hover:text-glow transition-all">@{ligador.username}</p>
                                        </div>
                                        <div className={cn(
                                            "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-2xl italic leading-none",
                                            ligador.role === 'admin' ? "bg-amber-500/5 text-amber-500 border-amber-500/10" : "bg-primary/5 text-primary border-primary/10"
                                        )}>
                                            {ligador.role} Protocol
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Premium Modal - Deploy Operator */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 lg:p-12 bg-background/95 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="glass w-full max-w-2xl rounded-[64px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col border-white/10">
                        <div className="px-12 py-12 border-b border-white/5 flex justify-between items-start bg-secondary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                                    <User className="w-10 h-10 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Deploy Signal</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] italic">Access Authorization Protocol</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-16 h-16 rounded-[28px] bg-secondary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all font-black text-zinc-500 shadow-2xl flex items-center justify-center relative z-10"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-12 space-y-10">
                            <div className="space-y-10 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.3em] italic ml-6 leading-none">Signal Full Identity</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                        className="w-full bg-black/60 border border-white/5 rounded-[32px] py-6 px-10 font-black text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all uppercase tracking-widest placeholder:text-zinc-800 italic"
                                        placeholder="EX: CORE OPERATOR DELTA"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.3em] italic ml-6 leading-none">Access ID (Login)</label>
                                        <div className="relative group">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black scale-110 italic">@</span>
                                            <input
                                                type="text"
                                                required
                                                value={formData.username}
                                                onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase() }))}
                                                className="w-full bg-black/60 border border-white/5 rounded-[32px] py-6 pl-12 pr-6 font-black text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all tracking-widest italic"
                                                placeholder="identity_01"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.3em] italic ml-6 leading-none">Vault Access Key</label>
                                        <div className="relative group">
                                            <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                                                className="w-full bg-black/60 border border-white/5 rounded-[32px] py-6 pl-14 pr-6 font-black text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all tracking-widest"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary py-7 rounded-[32px] font-black uppercase italic tracking-tighter text-white shadow-[0_20px_50px_rgba(129,140,248,0.3)] flex items-center justify-center gap-6 active:scale-95 transition-all text-xl border-b-4 border-black/20 group/deploy"
                            >
                                {saving ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 fill-white group-hover/deploy:rotate-12 transition-transform" />}
                                {saving ? 'SIGNAL DEPLOYING...' : 'FINALIZE DEPLOYMENT'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
