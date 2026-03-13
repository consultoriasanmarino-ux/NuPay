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
    Bell,
    Database,
    Settings,
    Loader2,
    Activity,
    Cpu,
    Shield
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { InteractiveMenu } from '@/components/InteractiveMenu'

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
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#8A05BE' }} />
                    <div className="absolute inset-0 blur-3xl rounded-full" style={{ background: 'rgba(138, 5, 190, 0.15)' }} />
                </div>
                <p className="text-sm font-medium mt-6 animate-pulse" style={{ color: '#8A05BE' }}>Autenticando...</p>
            </div>
        )
    }

    if (pathname === '/admin/login') {
        return <>{children}</>
    }

    const menuItems = [
        { label: 'Painel', icon: LayoutDashboard, href: '/admin' },
        { label: 'Leads (Base)', icon: Database, href: '/admin/leads' },
        { label: 'Importar', icon: Upload, href: '/admin/import' },
        { label: 'Fichas', icon: UserSquare2, href: '/admin/fichas' },
        { label: 'Desatribuir', icon: UserMinus, href: '/admin/unassign' },
        { label: 'Ligadores', icon: Users, href: '/admin/ligadores' },
        { label: 'Configurações', icon: Settings, href: '/admin/settings' },
    ]

    return (
        <div className="min-h-screen bg-background text-zinc-100 overflow-x-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-[60] w-72 border-r border-white/10 transition-all duration-500 ease-out overflow-y-auto bg-[#0d0118]/95 backdrop-blur-3xl",
                    "hidden lg:block",
                    !isSidebarOpen && "lg:-translate-x-full shadow-[20px_0_50px_rgba(130,10,209,0.1)]"
                )}
            >
                <div className="flex flex-col h-full p-8">
                    {/* Logo */}
                    <div className="flex items-center gap-5 px-3 mb-12 group mt-2">
                        <div
                            className="w-14 h-14 rounded-[22px] flex items-center justify-center font-black text-white text-lg shadow-xl glow-primary border border-primary/20 rotate-3 group-hover:rotate-0 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #820ad1, #a333ff)' }}
                        >
                            nu
                        </div>
                        <div>
                            <h1 className="font-display text-2xl tracking-tight uppercase leading-none italic text-white">NuPay</h1>
                            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] mt-2 text-primary-light">PAINEL ADMIN</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-4 px-6 py-4 rounded-[24px] text-[13px] font-mono font-bold uppercase tracking-wider transition-all relative group/item",
                                        isActive
                                            ? "text-white shadow-glow-primary"
                                            : "text-zinc-500 hover:text-white hover:bg-white/5"
                                    )}
                                    style={isActive ? { background: 'linear-gradient(135deg, #820ad1, #a333ff)' } : undefined}
                                >
                                    <item.icon className={cn("w-[20px] h-[20px] transition-transform", isActive ? "scale-110" : "group-hover/item:scale-110")} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="pt-8 border-t border-white/10 mt-6 space-y-4">
                        <button
                            onClick={() => {
                                localStorage.removeItem('nupay_admin_token')
                                router.push('/admin/login')
                            }}
                            className="flex items-center gap-4 px-6 py-4 w-full rounded-[24px] text-[12px] font-mono font-bold uppercase tracking-wider text-zinc-600 hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                            <LogOut className="w-[18px] h-[18px] rotate-180" />
                            Sair da Sessão
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <div className={cn(
                "transition-all duration-500 ease-out min-h-screen flex flex-col",
                isSidebarOpen ? "lg:pl-72" : "pl-0"
            )}>
                {/* Header */}
                <header className="h-20 border-b border-white/10 sticky top-0 z-[50] flex items-center justify-between px-8 bg-[#0d0118]/80 backdrop-blur-2xl">
                    <div className="flex items-center gap-6 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-3 rounded-2xl glass-deep border border-white/5 hover:bg-primary/20 hover:border-primary/40 transition-all active:scale-90 hidden lg:flex"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-primary" />}
                        </button>

                        {/* Mobile Branding */}
                        <div className="flex items-center gap-3 lg:hidden">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs glow-primary" style={{ background: 'linear-gradient(135deg, #820ad1, #a333ff)' }}>
                                nu
                            </div>
                            <span className="font-display text-xl tracking-tight italic uppercase text-white">NuPay</span>
                        </div>

                        <div className="relative flex-1 max-w-md hidden xl:block group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Sistema de Busca Global..."
                                className="w-full glass-deep border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-[11px] font-mono font-bold uppercase tracking-[0.2em] outline-none focus:border-primary/50 transition-all placeholder:text-zinc-800"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-5 px-6 py-3 rounded-2xl glass-deep border border-white/10 shadow-glow-sm">
                            <div className="text-right">
                                <p className="text-[10px] font-mono font-bold text-zinc-600 leading-none mb-1 uppercase tracking-widest">Master</p>
                                <p className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                    Terminal
                                </p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[10px] font-mono font-bold text-zinc-600 text-right leading-none mb-1 uppercase tracking-widest">Profile</p>
                                    <p className="text-[11px] font-mono font-bold text-primary-light uppercase tracking-widest leading-none">admin_master</p>
                                </div>
                                <div
                                    className="w-10 h-10 rounded-[14px] flex items-center justify-center glass glow-primary border border-primary/30"
                                >
                                    <Shield className="w-5 h-5 text-primary-light" />
                                </div>
                            </div>
                        </div>

                        <button className="relative w-11 h-11 rounded-2xl glass glow-primary border border-primary/20 flex items-center justify-center hover:scale-105 transition-all">
                            <Bell className="w-5 h-5 text-primary-light" />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-magenta animate-pulse shadow-[0_0_15px_rgba(255,0,229,0.6)]" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-8 pb-32 lg:p-12 max-w-[1600px] mx-auto w-full animate-in fade-in duration-700">
                    {children}
                </main>

                <footer className="p-10 opacity-30">
                    <div className="flex items-center justify-center gap-10 text-[10px] font-mono font-bold uppercase tracking-[0.5em] text-zinc-700">
                        <div className="flex items-center gap-3">
                            <Activity className="w-4 h-4 text-primary" />
                            <span>v5.1.0-ULTRA</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Cpu className="w-4 h-4 text-cyan-400" />
                            <span>UPTIME 100% SECURE</span>
                        </div>
                    </div>
                </footer>
      </div>

      {/* Admin Mobile Menu */}
      <div className="lg:hidden">
        <InteractiveMenu 
            activeTab={pathname}
            setActiveTab={(href) => router.push(href)}
            items={[
            { id: '/admin', label: 'Home', icon: LayoutDashboard },
            { id: '/admin/leads', label: 'Base', icon: Database },
            { id: '/admin/import', label: 'Import', icon: Upload },
            { id: '/admin/fichas', label: 'Fichas', icon: UserSquare2 },
            { id: '/admin/unassign', label: 'Desat.', icon: UserMinus },
            { id: '/admin/ligadores', label: 'Users', icon: Users },
            { id: '/admin/settings', label: 'Set', icon: Settings }
            ]}
        />
      </div>
    </div>
  )
}
