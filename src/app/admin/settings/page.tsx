'use client'

import { useState, useEffect } from 'react'
import {
    Settings,
    Globe,
    ShieldCheck,
    Save,
    Loader2,
    Key,
    Info,
    Zap,
    Cpu,
    Activity,
    Shield,
    Server,
    Wifi,
    CloudIcon,
    Terminal
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
    const [apiUrl, setApiUrl] = useState('https://completa.workbuscas.com/api')
    const [apiToken, setApiToken] = useState('doavTXJphHLkpayfbdNdJyGp')
    const [apiModule, setApiModule] = useState('cpf')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
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
                setMessage({ type: 'success', text: 'SIGNAL KEYS SYNCED TO CORE' })
            }, 1200)
        } catch (err) {
            setSaving(false)
            setMessage({ type: 'error', text: 'PROTOCOL FAILURE: PERSISTENCE ERROR' })
        }
    }

    return (
        <div className="space-y-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 selection:bg-primary/20">
            {/* Header Bento */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-[28px] bg-primary/10 border border-primary/20 shadow-2xl scale-110">
                            <Settings className="w-8 h-8 text-primary shadow-glow" />
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Core Integration</h2>
                    </div>
                    <p className="text-muted-foreground font-medium italic opacity-60 text-lg flex items-center gap-3">
                        <Server className="w-4 h-4 text-primary" />
                        External API Handlers and Authentication Chains
                    </p>
                </div>

                <div className="flex items-center gap-5 glass px-8 py-4 rounded-[24px] border-emerald-500/10 shadow-glow-sm">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-glow" />
                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] italic">Encryption Layer Active</p>
                </div>
            </div>

            <div className="glass border-white/5 rounded-[64px] p-10 lg:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.6)] space-y-14 relative overflow-hidden group">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                    {/* API URL Component */}
                    <div className="space-y-4 col-span-full">
                        <div className="flex items-center gap-4 px-6">
                            <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-zinc-500" />
                            </div>
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Central API Endpoint</label>
                        </div>
                        <input
                            type="text"
                            placeholder="https://completa.workbuscas.com/api"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            className="w-full bg-black/60 border border-white/5 rounded-[32px] py-6 px-10 text-xs font-black outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-mono italic shadow-inner placeholder:text-zinc-800"
                        />
                    </div>

                    {/* API TOKEN Component */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 px-6">
                            <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                                <Key className="w-5 h-5 text-zinc-500" />
                            </div>
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Auth Token Protocol</label>
                        </div>
                        <input
                            type="text"
                            placeholder="doavTXJphHLkpayfbdNdJyGp"
                            value={apiToken}
                            onChange={(e) => setApiToken(e.target.value)}
                            className="w-full bg-black/60 border border-white/5 rounded-[32px] py-6 px-10 text-xs font-black outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-mono italic shadow-inner placeholder:text-zinc-800"
                        />
                    </div>

                    {/* MODULE Component */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 px-6">
                            <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                                <Cpu className="w-5 h-5 text-zinc-500" />
                            </div>
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Search Module ID</label>
                        </div>
                        <input
                            type="text"
                            placeholder="cpf"
                            value={apiModule}
                            onChange={(e) => setApiModule(e.target.value)}
                            className="w-full bg-black/60 border border-white/5 rounded-[32px] py-6 px-10 text-xs font-black outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-mono italic uppercase shadow-inner placeholder:text-zinc-800"
                        />
                    </div>
                </div>

                {/* Intel Information Section */}
                <div className="p-10 glass bg-primary/5 rounded-[48px] border-primary/10 flex flex-col md:flex-row gap-10 relative group/intel overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover/intel:rotate-12 group-hover/intel:scale-125 transition-transform duration-1000">
                        <Terminal className="w-64 h-64" />
                    </div>
                    <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center shrink-0 border border-primary/20 shadow-2xl relative z-10">
                        <Info className="w-10 h-10 text-primary shadow-glow" />
                    </div>
                    <div className="space-y-4 relative z-10 flex-1">
                        <p className="text-2xl font-black uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors">Integration Logic Schema</p>
                        <p className="text-xs text-zinc-500 font-medium leading-relaxed opacity-80 max-w-2xl">
                            The internal crawler will construct the signal request using the following parameters from the core configuration module:<br />
                            <div className="mt-6 flex flex-wrap gap-2">
                                <span className="bg-black/60 px-4 py-2 rounded-xl text-[10px] font-mono text-primary italic border border-white/5 shadow-inner">
                                    GET {apiUrl}?token=***&modulo={apiModule}&consulta=CPF
                                </span>
                            </div>
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-4 relative z-10">
                    <div className="h-16 flex items-center gap-6">
                        {message && (
                            <div className={cn(
                                "flex items-center gap-5 animate-in slide-in-from-left-6 duration-700 glass px-8 py-4 rounded-[20px] border-white/5 shadow-2xl",
                                message.type === 'success' ? "text-emerald-500 border-emerald-500/20" : "text-destructive border-destructive/20"
                            )}>
                                <div className={cn("w-2 h-2 rounded-full", message.type === 'success' ? "bg-emerald-500 animate-pulse shadow-glow" : "bg-destructive")} />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic leading-none">{message.text}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full md:w-auto px-16 py-7 bg-primary text-white font-black rounded-[32px] shadow-[0_20px_60px_rgba(129,140,248,0.3)] flex items-center justify-center gap-5 transition-all active:scale-95 disabled:opacity-50 hover:scale-[1.03] text-xl italic tracking-tighter border-b-4 border-black/20 group/save"
                    >
                        {saving ? <Loader2 className="w-8 h-8 animate-spin" /> : <Save className="w-8 h-8 group-hover/save:scale-110 transition-transform" />}
                        {saving ? 'SYNCRONIZING...' : 'CORE DEPLOY UPDATE'}
                    </button>
                </div>
            </div>

            {/* Technical Metrics Footer */}
            <div className="flex items-center justify-center gap-12 opacity-30 group pb-8">
                <div className="flex items-center gap-3">
                    <Wifi className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] italic group-hover:text-primary transition-colors">Edge Node Ready</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                <div className="flex items-center gap-3">
                    <CloudIcon className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] italic group-hover:text-primary transition-colors">Cloud Persistence Sync</span>
                </div>
            </div>
        </div>
    )
}
