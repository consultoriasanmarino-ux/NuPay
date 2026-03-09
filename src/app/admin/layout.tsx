'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Upload,
    Users,
    UserSquare2,
    UserMinus,
    LogOut,
    Menu,
    X,
    Search,
    ChevronDown,
    Bell,
    Database,
    Settings,
    Loader2,
    Zap,
    Cpu,
    Activity,
    Shield
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [authorized, setAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        if (pathname === '/admin/login') {
            setAuthorized(true)
            return
        }

        const token = localStorage.getItem('nupay_admin_token')
        if (token !== 'authenticated_admin_master') {
            router.push('/admin/login')
        } else {
            setAuthorized(true)
        }
    }, [router, pathname])

    if (authorized === null) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-grid">
                <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mt-8 animate-pulse italic">Authenticating Admin Protocol...</p>
            </div>
        )
    }

    if (pathname === '/admin/login') {
        return <>{children}</>
    }

    const menuItems = [
        { label: 'Intelligence', icon: LayoutDashboard, href: '/admin' },
        { label: 'Signal Base', icon: Database, href: '/admin/leads' },
        { label: 'Deploy In', icon: Upload, href: '/admin/import' },
        { label: 'Signal Queue', icon: UserSquare2, href: '/admin/fichas' },
        { label: 'Desatribuir', icon: UserMinus, href: '/admin/unassign' },
        { label: 'Access Nodes', icon: Users, href: '/admin/ligadores' },
        { label: 'Core Config', icon: Settings, href: '/admin/settings' },
    ]

    return (
        <div className="min-h-screen bg-background text-zinc-100 selection:bg-primary/30 bg-grid">
            {/* AI-Native Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-[60] w-80 glass border-r border-white/5 transition-all duration-700 ease-out lg:translate-x-0 overflow-y-auto m-4 rounded-[48px] shadow-2xl",
                    !isSidebarOpen && "-translate-x-[110%]"
                )}
            >
                <div className="flex flex-col h-full p-8">
                    <div className="flex items-center gap-5 px-4 mb-14 group">
                        <div className="w-14 h-14 rounded-[24px] bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-black text-white italic shadow-[0_10px_30px_rgba(129,140,248,0.4)] transition-transform group-hover:scale-110 duration-500 scale-110">N</div>
                        <div className="space-y-0.5">
                            <h1 className="font-black text-2xl tracking-tighter uppercase italic leading-none">Nu-Pay</h1>
                            <p className="text-[8px] font-black text-primary uppercase tracking-[0.4em] italic opacity-60">Admin Core Protocol</p>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-3">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-5 px-6 py-4.5 rounded-[24px] text-[11px] font-black uppercase tracking-[0.15em] transition-all group relative overflow-hidden italic",
                                    pathname === item.href
                                        ? "bg-primary text-white shadow-[0_15px_40px_rgba(129,140,248,0.3)] scale-105 z-10"
                                        : "text-zinc-600 hover:text-zinc-100 hover:bg-white/5"
                                )}
                            >
                                {pathname === item.href && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                                )}
                                <item.icon className={cn("w-5 h-5 transition-transform duration-500", pathname === item.href ? "text-white scale-110" : "group-hover:text-primary group-hover:scale-110")} />
                                {item.label}
                                {pathname === item.href && (
                                    <div className="absolute right-6 w-1.5 h-1.5 rounded-full bg-white shadow-glow animate-pulse" />
                                )}
                            </Link>
                        ))}
                    </nav>

                    <div className="pt-8 border-t border-white/5 mt-8 space-y-6">
                        <div className="px-6 space-y-4">
                            <div className="flex items-center justify-between opacity-30 group hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-black uppercase tracking-widest italic">Core Latency</span>
                                <span className="text-[10px] font-black italic">14ms</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[85%] h-full bg-primary" />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                localStorage.removeItem('nupay_admin_token')
                                router.push('/admin/login')
                            }}
                            className="flex items-center gap-5 px-6 py-5 w-full rounded-[24px] text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-destructive hover:bg-destructive/5 transition-all italic border border-transparent hover:border-destructive/10"
                        >
                            <LogOut className="w-5 h-5 rotate-180" />
                            Flush Session
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Viewport */}
            <div className={cn(
                "transition-all duration-700 ease-out min-h-screen flex flex-col",
                isSidebarOpen ? "lg:pl-[340px]" : "pl-0"
            )}>
                {/* AI-Native Global Header */}
                <header className="h-24 glass border-b border-white/5 sticky top-4 z-[50] flex items-center justify-between px-10 mx-4 rounded-[32px] shadow-2xl backdrop-blur-3xl group/header border-white/10">
                    <div className="flex items-center gap-8 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-90 border border-white/5"
                        >
                            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>

                        <div className="relative group/search flex-1 max-w-xl hidden xl:block">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within/search:text-primary transition-all duration-500" />
                            <input
                                type="text"
                                placeholder="GLOBAL SIGNAL SCANNER..."
                                className="w-full bg-black/40 border border-white/5 rounded-[24px] py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono italic placeholder:text-zinc-800"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Status Module */}
                        <div className="hidden md:flex items-center gap-4 px-6 py-3.5 rounded-[24px] bg-black/40 border border-white/5 shadow-inner">
                            <div className="text-right">
                                <p className="text-[8px] font-black uppercase text-zinc-600 leading-none mb-1.5 italic tracking-widest">Network Node</p>
                                <p className="text-[10px] font-black text-emerald-500 flex items-center gap-2 justify-end uppercase tracking-[0.2em] italic">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow" />
                                    Synchronized
                                </p>
                            </div>
                            <div className="w-px h-8 bg-white/5 mx-2" />
                            <div className="flex items-center gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase text-zinc-600 text-right italic tracking-widest">Identity</p>
                                    <p className="text-[10px] font-black text-indigo-400 italic leading-none">ADMIN_MASTER</p>
                                </div>
                                <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-indigo-500/20 to-primary/20 flex items-center justify-center font-black text-indigo-400 text-xs border border-indigo-500/20 shadow-2xl">
                                    <Shield className="w-5 h-5 rotate-12" />
                                </div>
                            </div>
                        </div>

                        <button className="relative w-12 h-12 rounded-2xl bg-secondary border border-white/5 flex items-center justify-center group/bell transition-all hover:bg-zinc-800">
                            <Bell className="w-5 h-5 text-zinc-500 group-hover/bell:text-white transition-colors" />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-4 border-[#09090b] shadow-glow" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-10 max-w-[1600px] mx-auto w-full animate-in fade-in duration-1000 slide-in-from-right-4">
                    {children}
                </main>

                <footer className="p-10 opacity-20 hover:opacity-100 transition-opacity duration-1000">
                    <div className="flex items-center justify-center gap-10">
                        <div className="flex items-center gap-3">
                            <Activity className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-[0.5em] italic">Core V4.0.2 Stable</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                        <div className="flex items-center gap-3">
                            <Cpu className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-[0.5em] italic">System Uptime 99.9%</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
