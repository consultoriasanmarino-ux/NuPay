'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Key, ArrowRight, Wallet, ShieldCheck, Loader2, Zap, Globe, Cpu } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function LigadorLoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [loginError, setLoginError] = useState('')
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username || !password) {
            setLoginError('PREENCHA TODOS OS CAMPOS DO PROTOCOLO')
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
                setLoginError('CREDENCIAIS INVÁLIDAS NO RADAR')
            } else if (data.user) {
                localStorage.setItem('nupay_ligador_id', data.user.id)
                localStorage.setItem('nupay_ligador_user', username.trim())
                router.push('/')
            }
        } catch (err) {
            setLoginError('FALHA NA CONEXÃO COM O CORE SYSTEM.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-grid selection:bg-primary/20">
            <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                {/* AI-Native Logo Section */}
                <div className="text-center space-y-4">
                    <div className="relative inline-block group">
                        <div className="w-24 h-24 bg-gradient-to-tr from-primary to-indigo-600 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 rotate-12 group-hover:rotate-0 transition-transform duration-700 relative z-10">
                            <Wallet className="w-12 h-12 text-white shadow-glow" />
                        </div>
                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:scale-125 transition-transform duration-700" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent italic leading-tight">
                            Nu-Pay
                        </h1>
                        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.5em] italic opacity-60 flex items-center justify-center gap-3">
                            <Zap className="w-3 h-3 fill-zinc-500" />
                            Terminal Operacional
                            <Zap className="w-3 h-3 fill-zinc-500" />
                        </p>
                    </div>
                </div>

                {/* Form Logic */}
                <div className="glass p-12 rounded-[56px] shadow-2xl relative overflow-hidden group border-white/5">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl -z-0 rounded-full" />

                    <form onSubmit={handleLogin} className="space-y-8 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 ml-4 italic">Credencial de Usuário</label>
                            <div className="relative group">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="IDENTIFICAÇÃO..."
                                    className="w-full bg-black/40 border border-white/5 rounded-[24px] py-5 pl-14 pr-6 text-xs outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all font-black uppercase tracking-widest placeholder:text-zinc-800"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 ml-4 italic">Chave de Protocolo</label>
                            <div className="relative group">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/40 border border-white/5 rounded-[24px] py-5 pl-14 pr-6 text-xs outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all font-black tracking-widest placeholder:text-zinc-800"
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-2xl text-destructive text-[9px] font-black uppercase tracking-[0.2em] text-center animate-in shake-1 duration-500 italic">
                                ERROR CODE: {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-[24px] flex items-center justify-center gap-4 transition-all shadow-[0_20px_50px_rgba(129,140,248,0.3)] active:scale-95 group/btn disabled:opacity-50 italic text-sm tracking-tighter"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    Sincronizar Terminal
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform duration-500" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Metrics */}
                <div className="flex items-center justify-center gap-10 opacity-30 group">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-zinc-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">SSL v3 Secured</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                    <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-zinc-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] group-hover:text-primary transition-colors">Global Core Proxy</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
