'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
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

    return (
        <div className="min-h-[100dvh] bg-[#0a0a0f] flex flex-col items-center justify-center p-6 selection:bg-violet-500/20">
            {/* Background Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-violet-600/8 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-sm space-y-10 relative z-10">
                {/* Logo */}
                <div className="text-center space-y-4" style={{ animation: 'fadeSlideUp 0.6s ease-out both' }}>
                    <div className="relative inline-block">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-800 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-violet-600/30">
                            <span className="text-3xl font-black text-white">N</span>
                        </div>
                        <div className="absolute inset-0 bg-violet-500/20 blur-[50px] rounded-full" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-white">Nu-Pay</h1>
                        <p className="text-sm text-zinc-500 mt-1">Acesso do Ligador</p>
                    </div>
                </div>

                {/* Form */}
                <div style={{ animation: 'fadeSlideUp 0.6s ease-out 0.15s both' }}>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500 ml-1">Usuário</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Seu nome de usuário"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500 ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-zinc-700"
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm font-medium text-center animate-in shake-1 duration-500">
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-violet-600/30 active:scale-[0.97] disabled:opacity-50 text-sm mt-6"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Entrar
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 opacity-30" style={{ animation: 'fadeSlideUp 0.6s ease-out 0.3s both' }}>
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[11px] text-zinc-500 font-medium">Conexão protegida</span>
                </div>
            </div>

            <style jsx global>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
