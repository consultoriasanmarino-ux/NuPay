'use client'

import { useState } from 'react'
import { Filter, ChevronDown, UserCheck, MoreHorizontal, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FichasPage() {
    const [selectedLeads, setSelectedLeads] = useState<number[]>([])

    const leads = [
        { id: 1, nome: 'Ricardo Silva de Souza', cpf: '123.***.***-00', idade: 42, renda: 'R$ 5.400', score: 820, estado: 'SP', status: 'concluido' },
        { id: 2, nome: 'Ana Paula Oliveira', cpf: '456.***.***-11', idade: 28, renda: 'R$ 3.200', score: 650, estado: 'RJ', status: 'concluido' },
        { id: 3, nome: 'Carlos Eduardo Ferreira', cpf: '789.***.***-22', idade: 35, renda: 'R$ 8.900', score: 940, estado: 'MG', status: 'concluido' },
        // Simulating more rows...
    ]

    const toggleSelect = (id: number) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(l => l !== id))
        } else {
            setSelectedLeads([...selectedLeads, id])
        }
    }

    const selectBatch = () => {
        const batch = leads.slice(0, 10).map(l => l.id)
        setSelectedLeads(batch)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Aba Fichas</h2>
                    <p className="text-muted-foreground">Gerenciamento avançado e atribuição de leads.</p>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-sm font-medium hover:bg-accent transition-all">
                        <Filter className="w-4 h-4" />
                        Filtros Avançados
                        <ChevronDown className="w-4 h-4" />
                    </button>

                    {selectedLeads.length > 0 && (
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 animate-in zoom-in-95">
                            <UserCheck className="w-4 h-4" />
                            Atribuir {selectedLeads.length} selecionados
                        </button>
                    )}

                    <button onClick={selectBatch} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all">
                        Selecionar 10
                    </button>
                </div>
            </div>

            {/* Filters bar (mini) */}
            <div className="flex gap-4 p-4 rounded-xl bg-card border border-border overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border">
                    <span className="text-xs font-bold">Idade:</span>
                    <span className="text-xs text-muted-foreground">25 - 55 anos</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border">
                    <span className="text-xs font-bold">Estado:</span>
                    <span className="text-xs text-muted-foreground">Todos</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border">
                    <span className="text-xs font-bold">Renda:</span>
                    <span className="text-xs text-muted-foreground">Min. R$ 2.000</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border">
                    <span className="text-xs font-bold">Score:</span>
                    <span className="text-xs text-muted-foreground">Min. 600</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase font-black text-muted-foreground bg-secondary/50 border-b border-border">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input type="checkbox" className="rounded border-border bg-background" />
                            </th>
                            <th className="px-6 py-4">Nome Completo</th>
                            <th className="px-6 py-4">Idade</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4">Renda</th>
                            <th className="px-6 py-4">Score</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {leads.map((lead) => (
                            <tr
                                key={lead.id}
                                className={cn(
                                    "hover:bg-accent/5 transition-colors group",
                                    selectedLeads.includes(lead.id) && "bg-primary/5"
                                )}
                            >
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedLeads.includes(lead.id)}
                                        onChange={() => toggleSelect(lead.id)}
                                        className="rounded border-border bg-background"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold">{lead.nome}</div>
                                    <div className="text-xs text-muted-foreground">{lead.cpf}</div>
                                </td>
                                <td className="px-6 py-4 font-medium">{lead.idade} anos</td>
                                <td className="px-6 py-4 text-muted-foreground">{lead.estado}</td>
                                <td className="px-6 py-4 font-bold text-emerald-500">{lead.renda}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded text-[10px] font-black",
                                        lead.score > 800 ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
                                    )}>
                                        {lead.score}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-blue-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                        Completo
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 rounded-lg hover:bg-accent transition-all group-hover:text-primary">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 rounded-lg hover:bg-accent transition-all">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                <p className="text-xs text-muted-foreground">Exibindo <span className="text-foreground font-bold">1 - 50</span> de 12.482 leads</p>
                <div className="flex gap-2">
                    <button className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50" disabled>
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg border border-border bg-primary text-white font-bold text-xs px-4">1</button>
                    <button className="p-2 rounded-lg border border-border hover:bg-accent text-xs px-4">2</button>
                    <button className="p-2 rounded-lg border border-border hover:bg-accent text-xs px-4">3</button>
                    <button className="p-2 rounded-lg border border-border hover:bg-accent">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
