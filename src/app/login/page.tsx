'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Key, ArrowRight, Wallet, ShieldCheck, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LigadorLoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [loginError, setLoginError] = useState('')
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username || !password) {
            setLoginError('Preencha todos os campos')
            return
        }

        setLoading(true)
        setLoginError('')

        const email = `${username.trim().toLowerCase()}@axon.pay`

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                setLoginError('Usuário ou senha inválidos')
            } else if (data.user) {
                localStorage.setItem('nupay_ligador_id', data.user.id)
                localStorage.setItem('nupay_ligador_user', username.trim())
                router.push('/')
            }
        } catch (err) {
            setLoginError('Ocorreu um erro ao tentar entrar.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 bg-grid">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Logo Section */}
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-primary to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                        Nu-Pay
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">Portal do Ligador</p>
                </div>

                {/* Form */}
                <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                    <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Usuário</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Seu usuário"
                                    className="w-full bg-secondary/50 border border-border rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha</label>
                            <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-secondary/50 border border-border rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-[10px] font-black uppercase tracking-widest text-center animate-in shake-1 duration-300">
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 group/btn disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Entrar no Painel
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Glass Decor */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-0 rounded-full" />
                </div>

                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sessão Criptografada</span>
                </div>
            </div>
        </div>
    )
}
