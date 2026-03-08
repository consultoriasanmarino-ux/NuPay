'use client'

import { useState } from 'react'
import { Plus, User, Key, Trash2, Edit2, ShieldCheck } from 'lucide-react'

export default function LigadoresPage() {
    const [ligadores, setLigadores] = useState([
        { id: 1, nome: 'João da Silva', login: 'joaocrm', tickets: 142, status: 'online' },
        { id: 2, nome: 'Maria Oliveira', login: 'maria_leads', tickets: 89, status: 'offline' },
        { id: 3, nome: 'Pedro Santos', login: 'pedromaster', tickets: 256, status: 'ocupado' },
    ])

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
                {ligadores.map((ligador) => (
                    <div key={ligador.id} className="bg-card border border-border p-6 rounded-2xl space-y-6 hover:border-primary/50 transition-all relative overflow-hidden group">
                        {/* User Info */}
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center relative">
                                    <User className="w-6 h-6 text-muted-foreground" />
                                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${ligador.status === 'online' ? 'bg-emerald-500' : ligador.status === 'ocupado' ? 'bg-orange-500' : 'bg-gray-500'
                                        }`} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{ligador.nome}</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                        <ShieldCheck className="w-3 h-3" />
                                        Ligador Ativo
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Credentials Preview */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-xs font-medium">Login</span>
                                </div>
                                <span className="text-xs font-bold font-mono">{ligador.login}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
                                <div className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-xs font-medium">Senha</span>
                                </div>
                                <span className="text-xs font-bold font-mono">••••••••</span>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-4 py-2">
                            <div className="text-center p-3 rounded-xl bg-accent text-accent-foreground">
                                <p className="text-[10px] uppercase font-black opacity-50">Fichas</p>
                                <p className="text-xl font-bold">{ligador.tickets}</p>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-accent text-accent-foreground">
                                <p className="text-[10px] uppercase font-black opacity-50">Conversão</p>
                                <p className="text-xl font-bold">12%</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border border-border hover:bg-secondary transition-all">
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar
                            </button>
                            <button className="p-2 rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Background Blob */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-3xl rounded-full" />
                    </div>
                ))}

                {/* Empty State / Add Card */}
                <button className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all group">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold">Adicionar Novo Operador</p>
                </button>
            </div>
        </div>
    )
}
