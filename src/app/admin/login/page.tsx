'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react'

export default function AdminLoginPage() {
    const [pin, setPin] = useState('')
    const [error, setError] = useState(false)
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (pin === '171033') {
            localStorage.setItem('nupay_admin_token', 'authenticated_admin_master')
            router.push('/admin')
        } else {
            setError(true)
            setPin('')
            setTimeout(() => setError(false), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-grid">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        <ShieldAlert className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter">Área Restrita</h1>
                    <p className="text-muted-foreground">Insira o PIN de 6 dígitos para acessar o Painel Master.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="password"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className={`w-full bg-card border ${error ? 'border-destructive animate-shake' : 'border-border'} rounded-2xl py-4 pl-12 pr-4 text-center text-2xl font-black tracking-[1em] outline-none focus:ring-4 focus:ring-primary/10 transition-all`}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={pin.length !== 6}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary/20"
                    >
                        Acessar Dashboard
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>

                {error && (
                    <p className="text-center text-destructive font-bold text-sm animate-bounce">
                        PIN INCORRETO. ACESSO NEGADO.
                    </p>
                )}
            </div>
        </div>
    )
}
