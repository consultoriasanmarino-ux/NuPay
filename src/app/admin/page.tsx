import { ArrowUpRight, Users, UserCheck, Clock, RefreshCcw } from 'lucide-react'

export default function AdminDashboard() {
    const stats = [
        { label: 'Total de Leads', value: '0', icon: Users, color: 'text-blue-500' },
        { label: 'Leads Incompletos', value: '0', icon: Clock, color: 'text-yellow-500' },
        { label: 'Leads Atribuídos', value: '0', icon: UserCheck, color: 'text-emerald-500' },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Master</h2>
                <p className="text-muted-foreground">Bem-vindo ao centro de operações do Nu-Pay.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-secondary/50 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <h3 className="text-3xl font-bold mt-1 tracking-tighter">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:bg-accent/5 transition-all">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <RefreshCcw className="w-8 h-8 text-primary animate-spin-slow" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Consultar Leads</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mt-2">
                            Inicie o processo de enriquecimento de dados para todos os leads com status "incompleto".
                        </p>
                    </div>
                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary/20">
                        Iniciar Consulta em Massa
                    </button>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                    <h3 className="text-xl font-bold mb-2">Atividade Recente</h3>
                    <p className="text-muted-foreground text-sm">Nenhuma atividade registrada ainda.</p>
                </div>
            </div>
        </div>
    )
}
