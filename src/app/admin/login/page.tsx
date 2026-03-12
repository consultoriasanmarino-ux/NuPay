'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react'
import { PulseBeams } from '@/components/PulseBeams'

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

    const adminBeams = [
        {
            path: "M0 50 L858 50",
            gradientConfig: {
                initial: { x1: "0%", x2: "20%", y1: 50, y2: 50 },
                animate: { x1: ["0%", "100%"], x2: ["20%", "120%"], y1: 50, y2: 50 },
                transition: { duration: 3, repeat: Infinity, ease: "linear" }
            }
        },
        {
            path: "M0 400 L858 400",
            gradientConfig: {
                initial: { x1: "80%", x2: "100%", y1: 400, y2: 400 },
                animate: { x1: ["100%", "0%"], x2: ["80%", "-20%"], y1: 400, y2: 400 },
                transition: { duration: 4, repeat: Infinity, ease: "linear", delay: 1 }
            }
        },
        {
            path: "M300 0 L300 434",
            gradientConfig: {
                initial: { x1: "300", x2: "300", y1: "0%", y2: "20%" },
                animate: { x1: "300", x2: "300", y1: ["0%", "100%"], y2: ["20%", "120%"] },
                transition: { duration: 3.5, repeat: Infinity, ease: "linear", delay: 0.5 }
            }
        },
        {
            path: "M600 0 L600 434",
            gradientConfig: {
                initial: { x1: "600", x2: "600", y1: "80%", y2: "100%" },
                animate: { x1: "600", x2: "600", y1: ["100%", "0%"], y2: ["80%", "-20%"] },
                transition: { duration: 5, repeat: Infinity, ease: "linear", delay: 2 }
            }
        }
    ]

    return (
        <PulseBeams beams={adminBeams}>
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
        </PulseBeams>
    )
}
