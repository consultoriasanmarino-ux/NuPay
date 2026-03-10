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
        <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Atmospheric glow */}
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(138, 5, 190, 0.12) 0%, transparent 70%)' }} />

            <div className="w-full max-w-sm space-y-8 relative z-10" style={{ animation: 'fadeUp 0.6s ease-out' }}>
                <div className="text-center space-y-3">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
                        style={{ background: 'rgba(138, 5, 190, 0.1)', borderColor: 'rgba(138, 5, 190, 0.2)' }}
                    >
                        <ShieldAlert className="w-8 h-8" style={{ color: '#8A05BE' }} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Área Restrita</h1>
                    <p className="text-sm text-zinc-500">Insira o PIN de 6 dígitos para acessar.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                            type="password"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-center text-xl font-bold tracking-[0.8em] outline-none transition-all text-white placeholder:text-zinc-700"
                            style={{ borderColor: error ? '#ef4444' : undefined }}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={pin.length !== 6}
                        className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 active:scale-[0.98]"
                        style={{ background: '#8A05BE', boxShadow: '0 8px 24px rgba(138, 5, 190, 0.3)' }}
                    >
                        Acessar Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                {error && (
                    <p className="text-center text-red-400 font-semibold text-sm">
                        PIN incorreto. Tente novamente.
                    </p>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
