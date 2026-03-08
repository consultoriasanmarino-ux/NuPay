import { LayoutDashboard, UserPlus, Users, FileText, LogOut, Search } from 'lucide-react'
import Link from 'next/link'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col fixed h-full z-50">
                <div className="p-6">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Nu-Pay Admin
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all group">
                        <LayoutDashboard className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        <span className="font-medium text-sm">Dashboard</span>
                    </Link>
                    <Link href="/admin/import" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all group">
                        <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        <span className="font-medium text-sm">Importação</span>
                    </Link>
                    <Link href="/admin/fichas" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all group">
                        <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        <span className="font-medium text-sm">Aba Fichas</span>
                    </Link>
                    <Link href="/admin/ligadores" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all group">
                        <UserPlus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        <span className="font-medium text-sm">Ligadores</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all group">
                        <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
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
                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-bold text-xs">AD</div>
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
