'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, UserPlus, Users, FileText, LogOut, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        // Check if user is authenticated (Skip for /admin/login)
        if (pathname === '/admin/login') return

        const token = localStorage.getItem('nupay_admin_token')
        if (token !== 'authenticated_admin_master') {
            router.push('/admin/login')
        } else {
            setAuthorized(true)
        }
    }, [pathname, router])

    if (!authorized && pathname !== '/admin/login') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Verificando Credenciais...</p>
            </div>
        )
    }

    // Se for a página de login, renderizar apenas os filhos sem o layout administrativo
    if (pathname === '/admin/login') {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col fixed h-full z-50">
                <div className="p-6">
                    <Link href="/admin">
                        <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                            Nu-Pay Admin
                        </h1>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/admin" className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all group",
                        pathname === '/admin' ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}>
                        <LayoutDashboard className="w-5 h-5 group-hover:text-primary transition-colors" />
                        <span className="font-medium text-sm">Dashboard</span>
                    </Link>
                    <Link href="/admin/import" className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all group",
                        pathname === '/admin/import' ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}>
                        <FileText className="w-5 h-5 group-hover:text-primary transition-colors" />
                        <span className="font-medium text-sm">Importação</span>
                    </Link>
                    <Link href="/admin/fichas" className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all group",
                        pathname === '/admin/fichas' ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}>
                        <Users className="w-5 h-5 group-hover:text-primary transition-colors" />
                        <span className="font-medium text-sm">Aba Fichas</span>
                    </Link>
                    <Link href="/admin/ligadores" className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all group",
                        pathname === '/admin/ligadores' ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}>
                        <UserPlus className="w-5 h-5 group-hover:text-primary transition-colors" />
                        <span className="font-medium text-sm">Ligadores</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={() => {
                            localStorage.removeItem('nupay_admin_token')
                            router.push('/admin/login')
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all group text-muted-foreground"
                    >
                        <LogOut className="w-5 h-5 group-hover:text-destructive" />
                        <span className="font-medium text-sm">Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen bg-grid">
                <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Pesquisar leads..."
                            className="w-full bg-secondary/50 border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-semibold">Master Admin</p>
                            <p className="text-[10px] text-muted-foreground">online</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[1px]">
                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-bold text-xs ring-offset-background hover:scale-110 transition-transform">AD</div>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
