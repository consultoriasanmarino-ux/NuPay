'use client'

import { useState, useRef } from 'react'
import { Upload, FileType, CheckCircle2, AlertCircle, FileText, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ImportPage() {
    const [dragActive, setDragActive] = useState(false)
    const [mode, setMode] = useState<'cpf' | 'bot'>('cpf')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (file.name.endsWith('.txt')) {
                setSelectedFile(file)
            } else {
                alert("Por favor, selecione apenas arquivos .txt")
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleUpload = async () => {
        if (!selectedFile) return
        setUploading(true)

        // Simulação do processamento de upload
        setTimeout(() => {
            setUploading(false)
            setSelectedFile(null)
            alert(`Arquivo ${selectedFile.name} processado com sucesso no Modo ${mode === 'cpf' ? '1' : '2'}!`)
        }, 2000)
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Importação de Leads</h2>
                <p className="text-muted-foreground">Escolha o formato e anexe seu arquivo .txt para processar.</p>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setMode('cpf')}
                    className={cn(
                        "p-6 rounded-2xl border transition-all text-left group relative overflow-hidden",
                        mode === 'cpf' ? "bg-primary/10 border-primary ring-1 ring-primary/50" : "bg-card border-border hover:border-muted-foreground"
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
                        "p-6 rounded-2xl border transition-all text-left group relative overflow-hidden",
                        mode === 'bot' ? "bg-primary/10 border-primary ring-1 ring-primary/50" : "bg-card border-border hover:border-muted-foreground"
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
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "w-full aspect-[2/1] border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center space-y-6 transition-all relative overflow-hidden",
                    dragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card hover:bg-zinc-900/50",
                    selectedFile ? "border-emerald-500/50 bg-emerald-500/5" : ""
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {!selectedFile ? (
                    <>
                        <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center relative shadow-xl">
                            <Upload className={cn("w-10 h-10 transition-all", dragActive ? "text-primary animate-bounce" : "text-muted-foreground")} />
                            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-2xl font-black tracking-tight">Anexe sua Lista</p>
                            <p className="text-muted-foreground font-medium">Arraste seu arquivo .txt aqui ou clique abaixo</p>
                        </div>
                        <button
                            onClick={handleButtonClick}
                            className="px-8 py-3 bg-white text-black font-black text-sm rounded-xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 active:scale-95"
                        >
                            Selecionar Arquivo
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center space-y-6 animate-in zoom-in-95">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center relative">
                            <FileText className="w-10 h-10 text-emerald-500" />
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">{(selectedFile.size / 1024).toFixed(2)} KB • Pronto para Importar</p>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="px-10 py-4 bg-primary text-white font-black text-sm rounded-2xl hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    PROCESSANDO...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    INICIAR IMPORTAÇÃO
                                </>
                            )}
                        </button>
                    </div>
                )}

                <div className="absolute bottom-6 flex items-center gap-3 px-4 py-1.5 bg-accent/30 rounded-full border border-border/50">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Formatos Suportados: Solo .txt</span>
                </div>
            </div>

            {/* Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border group hover:border-emerald-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm font-black">Status de Entrada</p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">Todo lead importado começa como "incompleto" para triagem.</p>
                    </div>
                </div>
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border group hover:border-yellow-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <p className="text-sm font-black">Antiduplicidade</p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">O sistema higieniza automaticamente CPFs já existentes na base.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
