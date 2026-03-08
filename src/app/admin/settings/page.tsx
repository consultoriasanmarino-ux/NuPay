'use client'

import { useState, useEffect } from 'react'
import { Settings, Globe, ShieldCheck, Save, Loader2, Key, Info, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
    const [apiUrl, setApiUrl] = useState('https://completa.workbuscas.com/api')
    const [apiToken, setApiToken] = useState('doavTXJphHLkpayfbdNdJyGp')
    const [apiModule, setApiModule] = useState('cpf')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        // Carregar configurações salvas ou usar as fornecidas pelo usuário como padrão
        const savedUrl = localStorage.getItem('nupay_api_url')
        const savedToken = localStorage.getItem('nupay_api_token')
        const savedModule = localStorage.getItem('nupay_api_module')

        if (savedUrl) setApiUrl(savedUrl)
        if (savedToken) setApiToken(savedToken)
        if (savedModule) setApiModule(savedModule)
    }, [])

    const handleSave = () => {
        setSaving(true)
        setMessage(null)

        try {
            localStorage.setItem('nupay_api_url', apiUrl)
            localStorage.setItem('nupay_api_token', apiToken)
            localStorage.setItem('nupay_api_module', apiModule)

            setTimeout(() => {
                setSaving(false)
                setMessage({ type: 'success', text: 'Credenciais da OwnData salvas!' })
            }, 800)
        } catch (err) {
            setSaving(false)
            setMessage({ type: 'error', text: 'Erro ao persistir chaves.' })
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Configurações de Central</h2>
                    <p className="text-muted-foreground font-medium italic underline decoration-primary/30">Integração Direta com a OwnData API.</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Zap className="w-6 h-6 text-primary fill-primary/20" />
                </div>
            </div>

            <div className="bg-card border border-border rounded-[40px] p-8 lg:p-12 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Globe className="w-48 h-48 rotate-12" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* API URL */}
                    <div className="space-y-3 col-span-full">
                        <div className="flex items-center gap-2 px-1">
                            <Globe className="w-4 h-4 text-primary" />
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">URL do Manancial</label>
                        </div>
                        <input
                            type="text"
                            placeholder="https://completa.workbuscas.com/api"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            className="w-full bg-[#0a0a0c] border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        />
                    </div>

                    {/* API TOKEN */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <Key className="w-4 h-4 text-primary" />
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Token de Acesso Master</label>
                        </div>
                        <input
                            type="text"
                            placeholder="doavTXJphHLkpayfbdNdJyGp"
                            value={apiToken}
                            onChange={(e) => setApiToken(e.target.value)}
                            className="w-full bg-[#0a0a0c] border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        />
                    </div>

                    {/* MODULO */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <Settings className="w-4 h-4 text-primary" />
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Módulo de Consulta</label>
                        </div>
                        <input
                            type="text"
                            placeholder="cpf"
                            value={apiModule}
                            onChange={(e) => setApiModule(e.target.value)}
                            className="w-full bg-[#0a0a0c] border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none uppercase"
                        />
                    </div>
                </div>

                <div className="p-8 bg-zinc-900/50 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-6 relative group">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                        <Info className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-black uppercase italic tracking-tighter">Funcionamento da Autenticação</p>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed opacity-60">
                            A estrutura da requisição será montada da seguinte forma:<br />
                            <code className="text-primary mt-1 block font-mono px-2 py-1 bg-black/40 rounded italic">
                                {apiUrl}?token={apiToken.slice(0, 5)}...&modulo={apiModule}&consulta=CPF
                            </code>
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div className="hidden sm:block">
                        {message && (
                            <div className={cn(
                                "flex items-center gap-3 animate-in slide-in-from-left-4 duration-500",
                                message.type === 'success' ? "text-emerald-500" : "text-destructive"
                            )}>
                                <div className={cn("w-2 h-2 rounded-full", message.type === 'success' ? "bg-emerald-500 animate-pulse" : "bg-destructive")} />
                                <p className="text-xs font-black uppercase tracking-widest italic">{message.text}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-14 py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 hover:bg-primary/95 group"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        {saving ? 'CONFIGURANDO...' : 'SALVAR E ATIVAR'}
                    </button>
                </div>
            </div>
        </div>
    )
}
