'use client'

import { useState } from 'react'
import { Upload, FileType, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ImportPage() {
    const [dragActive, setDragActive] = useState(false)
    const [mode, setMode] = useState<'cpf' | 'bot'>('cpf')

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Importação de Leads</h2>
                <p className="text-muted-foreground">Escolha o formato e arraste seu arquivo .txt para processar.</p>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setMode('cpf')}
                    className={cn(
                        "p-6 rounded-2xl border transition-all text-left group",
                        mode === 'cpf' ? "bg-primary/10 border-primary" : "bg-card border-border hover:border-muted-foreground"
                    )}
                >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                        mode === 'cpf' ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                        <FileType className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">Modo 1: Apenas CPFs</h3>
                    <p className="text-sm text-muted-foreground mt-1">Ideal para listas simples de identificação.</p>
                </button>

                <button
                    onClick={() => setMode('bot')}
                    className={cn(
                        "p-6 rounded-2xl border transition-all text-left group",
                        mode === 'bot' ? "bg-primary/10 border-primary" : "bg-card border-border hover:border-muted-foreground"
                    )}
                >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                        mode === 'bot' ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                        <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">Modo 2: Coletas do Bot</h3>
                    <p className="text-sm text-muted-foreground mt-1">BIN, Data Validade, Nome e CPF.</p>
                </button>
            </div>

            {/* Upload Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                className={cn(
                    "w-full aspect-[2/1] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center space-y-4 transition-all",
                    dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card",
                )}
            >
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Upload className={cn("w-10 h-10 transition-all", dragActive ? "text-primary animate-bounce" : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                    <p className="text-xl font-bold">Arraste seu arquivo .txt aqui</p>
                    <p className="text-muted-foreground mt-1">ou clique para selecionar do seu computador</p>
                </div>
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest bg-accent px-3 py-1 rounded-full">
                    Suporta apenas arquivos de texto (.txt)
                </p>
            </div>

            {/* Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-4 p-4 rounded-xl bg-card border border-border">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                        <p className="text-sm font-bold">Status Automático</p>
                        <p className="text-xs text-muted-foreground">Todos os leads importados entram com status "incompleto".</p>
                    </div>
                </div>
                <div className="flex gap-4 p-4 rounded-xl bg-card border border-border">
                    <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                    <div>
                        <p className="text-sm font-bold">Verificação de Duplicatas</p>
                        <p className="text-xs text-muted-foreground">Sistema ignora automaticamente CPFs que já estão no banco.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
