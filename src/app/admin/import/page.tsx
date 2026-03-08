'use client'

import { useState, useRef } from 'react'
import { Upload, FileType, CheckCircle2, AlertCircle, FileText, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ImportPage() {
    const [dragActive, setDragActive] = useState(false)
    const [mode, setMode] = useState<'cpf' | 'bot'>('bot')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [results, setResults] = useState<{ success: number, ignored: number } | null>(null)
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
                setResults(null)
            } else {
                alert("Por favor, selecione apenas arquivos .txt")
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
            setResults(null)
        }
    }

    const parseFileContent = (content: string) => {
        const lines = content.split('\n');
        const leads: any[] = [];

        lines.forEach(line => {
            if (mode === 'bot') {
                // Regex para capturar: NOME e CPF (ID) no formato do log_extracao.txt
                // Ex: #1 | BIN: 516292 | VAL: 01 / 2032 | NOME: GABRIEL P CORDEIRO | 🆔 16705445750
                const nameMatch = line.match(/NOME:\s*([^|]+)/);
                const cpfMatch = line.match(/🆔\s*(\d+)/);

                if (cpfMatch) {
                    leads.push({
                        cpf: cpfMatch[1].trim(),
                        full_name: nameMatch ? nameMatch[1].trim() : 'NOME_AUSENTE',
                        status: 'incompleto'
                    });
                }
            } else {
                // Modo CPF apenas: Busca qualquer sequência de 11 números
                const cpfMatch = line.match(/\d{11}/);
                if (cpfMatch) {
                    leads.push({
                        cpf: cpfMatch[0],
                        status: 'incompleto'
                    });
                }
            }
        });

        return leads;
    }

    const handleUpload = async () => {
        if (!selectedFile) return
        setUploading(true)

        try {
            const text = await selectedFile.text();
            const leads = parseFileContent(text);

            if (leads.length === 0) {
                alert("Nenhum lead válido encontrado no arquivo com o formato selecionado.");
                setUploading(false);
                return;
            }

            // SIMULAÇÃO DE BANCO DE DADOS (Aqui entraria o supabase.from('leads').upsert)
            console.log('Leads processados:', leads);

            setTimeout(() => {
                setUploading(false);
                setResults({ success: leads.length, ignored: 0 });
                setSelectedFile(null);
            }, 1500);

        } catch (err) {
            console.error(err);
            alert("Erro ao ler o arquivo.");
            setUploading(false);
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Importação de Central</h2>
                    <p className="text-muted-foreground font-medium italic">Selecione o canhão de extração e anexe sua log .txt</p>
                </div>
                {results && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl animate-bounce">
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Sucesso!</p>
                        <p className="text-sm font-bold">+{results.success} Leads Injetados</p>
                    </div>
                )}
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setMode('cpf')}
                    className={cn(
                        "p-6 rounded-3xl border-2 transition-all text-left group relative overflow-hidden",
                        mode === 'cpf' ? "bg-primary/10 border-primary shadow-2xl shadow-primary/10" : "bg-card border-border hover:border-zinc-700"
                    )}
                >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110",
                        mode === 'cpf' ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                        <FileType className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-lg tracking-tight uppercase italic">Modo 1: Lista CPF</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-bold opacity-80 uppercase">Extração de CPFs Limpos</p>
                </button>

                <button
                    onClick={() => setMode('bot')}
                    className={cn(
                        "p-6 rounded-3xl border-2 transition-all text-left group relative overflow-hidden",
                        mode === 'bot' ? "bg-primary/10 border-primary shadow-2xl shadow-primary/10" : "bg-card border-border hover:border-zinc-700"
                    )}
                >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110",
                        mode === 'bot' ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                        <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-lg tracking-tight uppercase italic">Modo 2: Extrator Bot</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-bold opacity-80 uppercase">Formato: BIN | VAL | NOME | 🆔</p>
                </button>
            </div>

            {/* Upload Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={cn(
                    "w-full aspect-[2/0.8] border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center space-y-6 transition-all relative overflow-hidden cursor-pointer",
                    dragActive ? "border-primary bg-primary/5 scale-[1.01] ring-4 ring-primary/10" : "border-border bg-card/50 hover:bg-zinc-900/50",
                    selectedFile ? "border-emerald-500/50 bg-emerald-500/5 cursor-default" : ""
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
                        <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center relative shadow-2xl animate-pulse">
                            <Upload className={cn("w-10 h-10 transition-all", dragActive ? "text-primary " : "text-muted-foreground")} />
                            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-2xl font-black tracking-tighter uppercase italic">Anexar Log de Extração</p>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">Toque aqui ou arraste o .txt central</p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-500 w-full px-10">
                        <div className="flex items-center gap-6 bg-card p-6 rounded-[30px] border border-emerald-500/30 shadow-2xl w-full max-w-md relative overflow-hidden">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                <FileText className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-black tracking-tight truncate">{selectedFile.name}</p>
                                <p className="text-[10px] font-black uppercase text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB • {mode === 'bot' ? 'EXTRATOR' : 'SOLO CPF'}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                className="p-2 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive hover:text-white transition-all shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                            disabled={uploading}
                            className="px-16 py-5 bg-primary text-white font-black text-sm rounded-[24px] hover:bg-primary/90 transition-all shadow-2xl shadow-primary/40 flex items-center gap-4 active:scale-95 disabled:opacity-50 uppercase italic tracking-tighter"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Injetando na Base...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-6 h-6" />
                                    Confirmar Carga de Leads
                                </>
                            )}
                        </button>
                    </div>
                )}

                <div className="absolute bottom-8 flex items-center gap-3 px-6 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/5 shadow-2xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Encryption Active • Raw TXT Only</span>
                </div>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-[30px] bg-card border border-border flex items-center gap-4 group hover:border-primary/30 transition-all cursor-crosshair">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Carga Total</p>
                        <p className="text-xl font-black italic">-- --</p>
                    </div>
                </div>
                {/* ... */}
            </div>
        </div>
    )
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

function Users(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
