'use client'

import { useState } from 'react'
import { Plus, User, Key, Trash2, Edit2, ShieldCheck, UserMinus } from 'lucide-react'

export default function LigadoresPage() {
    const [ligadores, setLigadores] = useState<any[]>([])

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestão de Ligadores</h2>
                    <p className="text-muted-foreground">Crie e gerencie os operadores que realizarão as ligações.</p>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                    <Plus className="w-5 h-5" />
                    Novo Ligador
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ligadores.length === 0 ? (
                    <div className="md:col-span-2 lg:col-span-3 bg-card/40 border-2 border-dashed border-border p-12 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center text-muted-foreground/30">
                            <UserMinus className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Nenhum operador cadastrado</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Clique em "Novo Ligador" para registrar os usuários que farão as ligações.</p>
                        </div>
                    </div>
                ) : (
                    ligadores.map((ligador) => (
                        /* card implementation ... kept but unused when list is empty */
                        null
                    ))
                )}
            </div>
        </div>
    )
}
