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
            <div className="w-full max-w-sm space-y-16 relative z-10 p-12 glass shadow-[0_64px_150px_rgba(0,0,0,0.8)] rounded-[64px] border border-white/10 overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-colors" />

                {/* Logo */}
                <div className="text-center space-y-10 animate-in fade-in duration-1000 stagger-1 pt-4">
                    <div className="relative inline-block">
                        <div className="w-28 h-28 rounded-[36px] glass glow-primary flex items-center justify-center mx-auto shadow-2xl transition-all hover:scale-105 border-primary/20 rotate-6 hover:rotate-0">
                            <span className="text-5xl font-display text-primary font-bold">nu</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-7xl font-display tracking-tight text-white uppercase italic leading-none">NuPay</h1>
                        <p className="text-[11px] font-mono font-bold uppercase tracking-[0.5em] text-primary italic">Terminal de Operação</p>
                    </div>
                </div>

                {/* Form */}
                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 stagger-2 pb-4">
                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-zinc-600 ml-6 italic">Identity</label>
                            <div className="relative group/input">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within/input:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="OPERADOR"
                                    className="w-full glass-deep border border-white/10 rounded-[32px] py-6 pl-16 pr-8 text-xs font-mono font-bold outline-none focus:border-primary/40 focus:bg-primary/5 shadow-2xl transition-all placeholder:text-zinc-800 uppercase tracking-widest"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-zinc-600 ml-6 italic">Access Key</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within/input:text-magenta transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full glass-deep border border-white/10 rounded-[32px] py-6 pl-16 pr-8 text-xs font-mono font-bold outline-none focus:border-magenta/40 focus:bg-magenta/5 shadow-2xl transition-all placeholder:text-zinc-800 tracking-widest"
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-[24px] text-destructive text-[11px] font-mono font-bold uppercase tracking-widest text-center animate-in shake-1 duration-500 italic">
                                Acesso Negado: {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full glass glow-primary-sm py-6 rounded-[32px] flex items-center justify-center gap-5 transition-all active:scale-[0.96] disabled:opacity-50 text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-white hover:bg-primary/20 border border-primary/20 shadow-2xl group/btn overflow-hidden relative italic"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-magenta opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                            {loading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : (
                                <>
                                    Autorizar Acesso
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform text-primary" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-6 opacity-40 animate-in fade-in duration-1000 stagger-3 pb-4">
                    <div className="w-12 h-px bg-white/10" />
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span className="text-[10px] text-zinc-600 font-mono font-bold uppercase tracking-[0.4em] italic leading-none">Terminal Seguro</span>
                    </div>
                    <div className="w-12 h-px bg-white/10" />
                </div>
            </div>
        </PulseBeams>
    )
}
