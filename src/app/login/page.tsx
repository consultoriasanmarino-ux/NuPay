'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PulseBeams } from '@/components/PulseBeams'

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
                setLoginError('Usuário ou senha incorretos')
            } else if (data.user) {
                localStorage.setItem('nupay_ligador_id', data.user.id)
                localStorage.setItem('nupay_ligador_user', username.trim())
                router.push('/')
            }
        } catch (err) {
            setLoginError('Erro de conexão. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const loginBeams = [
        {
            path: "M0 100 L858 100",
            gradientConfig: {
                initial: { x1: "0%", x2: "20%", y1: 100, y2: 100 },
                animate: { x1: ["0%", "100%"], x2: ["20%", "120%"], y1: 100, y2: 100 },
                transition: { duration: 4, repeat: Infinity, ease: "linear" }
            }
        },
        {
            path: "M0 350 L858 350",
            gradientConfig: {
                initial: { x1: "80%", x2: "100%", y1: 350, y2: 350 },
                animate: { x1: ["100%", "0%"], x2: ["80%", "-20%"], y1: 350, y2: 350 },
                transition: { duration: 5, repeat: Infinity, ease: "linear", delay: 1 }
            }
        },
        {
            path: "M150 0 L150 434",
            gradientConfig: {
                initial: { x1: "150", x2: "150", y1: "0%", y2: "20%" },
                animate: { x1: "150", x2: "150", y1: ["0%", "100%"], y2: ["20%", "120%"] },
                transition: { duration: 3, repeat: Infinity, ease: "linear", delay: 0.5 }
            }
        },
        {
            path: "M700 0 L700 434",
            gradientConfig: {
                initial: { x1: "700", x2: "700", y1: "80%", y2: "100%" },
                animate: { x1: "700", x2: "700", y1: ["100%", "0%"], y2: ["80%", "-20%"] },
                transition: { duration: 6, repeat: Infinity, ease: "linear", delay: 2 }
            }
        }
    ]

    return (
        <PulseBeams beams={loginBeams}>
            <div className="w-full max-w-sm space-y-12 relative z-10 p-8">
                {/* Logo */}
                <div className="text-center space-y-8 animate-in fade-in duration-1000 stagger-1">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-[32px] glass glow-primary flex items-center justify-center mx-auto shadow-2xl transition-all hover:scale-105 border-primary/20 rotate-3 hover:rotate-0">
                            <span className="text-4xl font-display text-primary font-bold">nu</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-6xl font-display tracking-tight text-white uppercase italic">NuPay</h1>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-cyan-400">Security Access Layer</p>
                    </div>
                </div>

                {/* Form */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 stagger-2">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 ml-2">Operator Identity</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="USUÁRIO"
                                    className="w-full glass-deep border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-xs font-mono font-bold outline-none focus:border-cyan-500/30 transition-all placeholder:text-zinc-800"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 ml-2">Access Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-magenta transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full glass-deep border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-xs font-mono font-bold outline-none focus:border-magenta/30 transition-all placeholder:text-zinc-800"
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-2xl text-destructive text-[10px] font-mono font-bold uppercase tracking-widest text-center animate-in shake-1 duration-500">
                                Access Denied: {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full glass-card py-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50 text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white hover:bg-primary group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-light opacity-0 group-hover:opacity-10 transition-opacity" />
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Authorize Access
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-4 opacity-50 animate-in fade-in duration-1000 stagger-3">
                    <div className="w-8 h-px bg-white/5" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-widest">Secure Terminal</span>
                    </div>
                    <div className="w-8 h-px bg-white/5" />
                </div>
            </div>
        </PulseBeams>
    )
}
