import { useEffect, useState } from 'react'
import { Plus, User, Key, Trash2, Edit2, ShieldCheck, UserMinus, X, Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function LigadoresPage() {
    const [ligadores, setLigadores] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
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

        // Nota: No mundo real, criaríamos no Auth. Mas como estamos num MVP Admin,
        // vamos simular inserindo no profiles. Em uma versão final, isso chamaria uma Edge Function.
        const { error } = await supabase
            .from('profiles')
            .insert([{
                id: crypto.randomUUID(), // Mock ID para perfis manuais (idealmente do auth)
                full_name: formData.full_name,
                username: formData.username,
                role: formData.role
            }])

        if (error) {
            alert('Erro ao cadastrar: ' + error.message)
        } else {
            setIsModalOpen(false)
            setFormData({ full_name: '', username: '', password: '', role: 'ligador' })
            fetchLigadores()
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente remover este ligador?')) return

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)

        if (error) alert('Erro ao remover: ' + error.message)
        else fetchLigadores()
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Gestão de Ligadores</h2>
                    <p className="text-muted-foreground font-medium italic underline decoration-primary/20">Crie e gerencie os operadores do sistema.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-black uppercase text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 italic tracking-tighter"
                >
                    <Plus className="w-5 h-5" />
                    Novo Ligador
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-4 animate-pulse">Carregando Operadores...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ligadores.length === 0 ? (
                        <div className="md:col-span-2 lg:col-span-3 bg-[#111114] border-2 border-dashed border-white/5 p-20 rounded-[48px] flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
                            <div className="w-24 h-24 bg-secondary/50 rounded-3xl flex items-center justify-center text-muted-foreground/30 border border-white/5 shadow-inner transition-transform hover:rotate-12">
                                <UserMinus className="w-12 h-12" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">Nenhum operador cadastrado</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto italic opacity-50">Clique em "Novo Ligador" para registrar os usuários que farão as ligações.</p>
                            </div>
                        </div>
                    ) : (
                        ligadores.map((ligador) => (
                            <div key={ligador.id} className="bg-[#111114] border border-white/5 p-8 rounded-[40px] relative overflow-hidden group hover:border-primary/50 transition-all shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-colors">
                                        <User className="w-7 h-7 text-zinc-400 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button className="p-2 rounded-xl bg-secondary border border-border hover:text-primary transition-all">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ligador.id)}
                                            className="p-2 rounded-xl bg-secondary border border-border hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black italic text-zinc-500 uppercase tracking-[0.2em] mb-1">Operador / Nome</p>
                                        <h4 className="text-xl font-black uppercase italic tracking-tighter truncate">{ligador.full_name || 'SEM NOME'}</h4>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div>
                                            <p className="text-[10px] font-black italic text-zinc-500 uppercase tracking-[0.2em] mb-1 text-left">Username</p>
                                            <p className="font-mono text-xs font-bold text-primary italic">@{ligador.username}</p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            ligador.role === 'admin' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
                                        )}>
                                            {ligador.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal Novo Ligador */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#111114] border border-white/10 w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <User className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Novo Operador</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-zinc-800 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                                        placeholder="Ex: João da Silva"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">Username</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">@</span>
                                            <input
                                                type="text"
                                                required
                                                value={formData.username}
                                                onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase() }))}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-10 pr-6 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                placeholder="joao123"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">Senha Inicial</label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary py-5 rounded-2xl font-black uppercase italic tracking-tighter text-white shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg border-b-4 border-black/20"
                            >
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                                {saving ? 'CADASTRANDO...' : 'CADASTRAR OPERADOR'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
