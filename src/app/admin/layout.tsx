'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Upload,
    Users,
    UserSquare2,
    LogOut,
    Menu,
    X,
    Search,
    ChevronDown,
    Bell,
    Database,
    Loader2
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
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Verificando Credenciais...</p>
            </div>
        )
    }

    // If we are on the login page, just render the content without sidebar
    if (pathname === '/admin/login') {
        return <>{children}</>
    }

    const menuItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { label: 'Leads (Base)', icon: Database, href: '/admin/leads' },
        { label: 'Importação', icon: Upload, href: '/admin/import' },
        { label: 'Aba Fichas', icon: UserSquare2, href: '/admin/fichas' },
        { label: 'Ligadores', icon: Users, href: '/admin/ligadores' },
    ]

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-primary selection:text-white">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-[#111114] border-r border-white/5 transition-transform duration-300 transform lg:translate-x-0 overflow-y-auto",
                    !isSidebarOpen && "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-3 px-2 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-black text-white italic shadow-lg shadow-primary/20">N</div>
                        <h1 className="font-black text-xl tracking-tighter">Nu-Pay Admin</h1>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group",
                                    pathname === item.href
                                        ? "bg-primary text-white shadow-xl shadow-primary/20"
                                        : "text-zinc-500 hover:text-zinc-100 hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-white" : "group-hover:text-primary")} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="pt-6 border-t border-white/5">
                        <button
                            onClick={() => {
                                localStorage.removeItem('nupay_admin_token')
                                router.push('/admin/login')
                            }}
                            className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl text-sm font-bold text-zinc-500 hover:text-destructive hover:bg-destructive/5 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            Sair
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={cn(
                "transition-all duration-300",
                isSidebarOpen ? "lg:pl-72" : "pl-0"
            )}>
                {/* Header */}
                <header className="h-20 border-b border-white/5 bg-[#111114]/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 lg:hidden rounded-xl bg-white/5"
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <div className="relative group flex-1 max-w-md hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Pesquisar leads..."
                            className="w-full bg-black/20 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#111114] border border-white/5">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-zinc-500 leading-none mb-1">Status</p>
                                <p className="text-xs font-black text-emerald-500 flex items-center gap-1.5 justify-end uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    Online
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center font-black text-indigo-500 text-xs shadow-inner">AD</div>
                        </div>
                    </div>
                </header>

                <main className="p-8 max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
