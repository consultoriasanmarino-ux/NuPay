'use client'

import { useState } from 'react'
import { Filter, ChevronDown, UserCheck, MoreHorizontal, ChevronLeft, ChevronRight, Eye, PhoneCall } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FichasPage() {
    const [selectedLeads, setSelectedLeads] = useState<number[]>([])
    const [leads, setLeads] = useState<any[]>([])

    const toggleSelect = (id: number) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(l => l !== id))
        } else {
            setSelectedLeads([...selectedLeads, id])
        }
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
                </div>
            </div>

            {/* Filters bar (mini) */}
            <div className="flex gap-4 p-4 rounded-xl bg-card border border-border overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border opacity-50">
                    <span className="text-xs font-bold">Idade:</span>
                    <span className="text-xs text-muted-foreground">--</span>
                </div>
                {/* ... other filters ... */}
            </div>

            {leads.length === 0 ? (
                <div className="bg-card border-2 border-dashed border-border rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                        <PhoneCall className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">A lista está vazia</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Importe arquivos na aba "Importação" para começar a gerenciar seus leads.</p>
                    </div>
                </div>
            ) : (
                /* Table section hidden until leads has data */
                null
            )}

            {/* Pagination (Zeroed) */}
            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                <p className="text-xs text-muted-foreground">Nenhum lead encontrado.</p>
                <div className="flex gap-2">
                    <button className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50" disabled>
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-50" disabled>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
