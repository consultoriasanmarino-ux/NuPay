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
        <div className="min-h-screen bg-background text-zinc-100">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-[60] w-72 border-r border-white/5 transition-all duration-500 ease-out lg:translate-x-0 overflow-y-auto",
                    "bg-[#0a0a0c]",
                    !isSidebarOpen && "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full p-6">
                    {/* Logo */}
                    <div className="flex items-center gap-4 px-3 mb-10 group mt-2">
                        <div
                            className="w-12 h-12 rounded-[14px] flex items-center justify-center font-black text-white text-base shadow-xl"
                            style={{ background: 'linear-gradient(135deg, #8A05BE, #A020D0)', boxShadow: '0 8px 16px rgba(138, 5, 190, 0.2)' }}
                        >
                            nu
                        </div>
                        <div>
                            <h1 className="font-black text-2xl tracking-tighter uppercase leading-none italic">NuPay</h1>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] mt-1" style={{ color: '#8A05BE' }}>PAINEL ADMIN</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all relative",
                                        isActive
                                            ? "text-white"
                                            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                                    )}
                                    style={isActive ? { background: '#8A05BE' } : undefined}
                                >
                                    <item.icon className="w-[18px] h-[18px]" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="pt-6 border-t border-white/5 mt-4 space-y-3">
                        <button
                            onClick={() => {
                                localStorage.removeItem('nupay_admin_token')
                                router.push('/admin/login')
                            }}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[13px] font-medium text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all"
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
                <header className="h-16 border-b border-white/5 sticky top-0 z-[50] flex items-center justify-between px-6 bg-[#0a0a0c]/80 backdrop-blur-xl">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-white/5 transition-all active:scale-90"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        <div className="relative flex-1 max-w-md hidden xl:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:border-[#8A05BE]/40 transition-all placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-500 leading-none mb-0.5">Status</p>
                                <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    Online
                                </p>
                            </div>
                            <div className="w-px h-6 bg-white/5" />
                            <div className="flex items-center gap-2">
                                <div>
                                    <p className="text-[10px] text-zinc-500 text-right leading-none mb-0.5">Usuário</p>
                                    <p className="text-[11px] font-semibold leading-none" style={{ color: '#8A05BE' }}>admin_master</p>
                                </div>
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center border"
                                    style={{ background: 'rgba(138, 5, 190, 0.1)', borderColor: 'rgba(138, 5, 190, 0.2)' }}
                                >
                                    <Shield className="w-4 h-4" style={{ color: '#8A05BE' }} />
                                </div>
                            </div>
                        </div>

                        <button className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                            <Bell className="w-4 h-4 text-zinc-500" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: '#8A05BE' }} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 pb-32 lg:p-8 max-w-[1600px] mx-auto w-full">
                    {children}
                </main>

                <footer className="p-6 opacity-20 hover:opacity-60 transition-opacity">
                    <div className="flex items-center justify-center gap-6 text-[10px] text-zinc-600">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            <span>v4.0.2</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                            <Cpu className="w-3 h-3" />
                            <span>Uptime 99.9%</span>
                        </div>
                    </div>
                </footer>
      </div>

      {/* Admin Mobile Menu */}
      <InteractiveMenu 
        activeTab={pathname}
        setActiveTab={(href) => router.push(href)}
        items={[
          { id: '/admin', label: 'Painel', icon: LayoutDashboard },
          { id: '/admin/leads', label: 'Leads', icon: Database },
          { id: '/admin/import', label: 'Import', icon: Upload },
          { id: '/admin/fichas', label: 'Fichas', icon: UserSquare2 },
          { id: '/admin/unassign', label: 'Desatrib.', icon: UserMinus },
          { id: '/admin/ligadores', label: 'Ligs', icon: Users },
          { id: '/admin/settings', label: 'Config', icon: Settings }
        ]}
      />
    </div>
  )
}
