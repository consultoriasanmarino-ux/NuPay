'use client'

import { useState, useRef } from 'react'
import { Upload, FileType, CheckCircle2, AlertCircle, FileText, X, Loader2, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function ImportPage() {
    const [dragActive, setDragActive] = useState(false)
    const [mode, setMode] = useState<'cpf' | 'bot' | 'gov'>('bot')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [results, setResults] = useState<{ success: number, ignored: number, updated?: number } | null>(null)
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
        const govMatches: { cpf: string, lastTwo: string }[] = [];
        const seenCpfs = new Set();

        lines.forEach(line => {
            let cpf = '';
            let fullName = 'NOME_AUSENTE';

            if (mode === 'bot') {
                const nameMatch = line.match(/NOME:\s*([^|]+)/);
                const cpfMatch = line.match(/🆔\s*(\d+)/);
                if (cpfMatch) {
                    cpf = cpfMatch[1].trim();
                    fullName = nameMatch ? nameMatch[1].trim() : 'NOME_AUSENTE';
                }
            } else if (mode === 'cpf') {
                const cpfMatch = line.match(/\d{11}/);
                if (cpfMatch) {
                    cpf = cpfMatch[0];
                }
            } else if (mode === 'gov') {
                // Formato: 12345678901-88
                const match = line.match(/(\d{11})-(\d{2})/);
                if (match) {
                    govMatches.push({ cpf: match[1], lastTwo: match[2] });
                }
            }

            if (cpf && cpf.length === 11 && !seenCpfs.has(cpf)) {
                seenCpfs.add(cpf);
                leads.push({
                    cpf: cpf,
                    full_name: fullName,
                    status: 'incompleto'
                });
            }
        });

        return { leads, govMatches };
    }

    const handleUpload = async () => {
        if (!selectedFile) return
        setUploading(true)

        try {
            const text = await selectedFile.text();
            const { leads, govMatches } = parseFileContent(text);

            if (mode === 'gov') {
                if (govMatches.length === 0) {
                    alert("Nenhum registro no formato CPF-XX encontrado.");
                    setUploading(false);
                    return;
                }

                let updatedCount = 0;
                for (const item of govMatches) {
                    // Busca o lead pelo CPF
                    const { data: leadData } = await supabase
                        .from('leads')
                        .select('id, phones')
                        .eq('cpf', item.cpf)
                        .single();

                    if (leadData) {
                        const phones = leadData.phones || [];
                        // Tenta encontrar o telefone que termina com os 2 dígitos
                        const govPhone = phones.find((p: string) => {
                            const clean = p.replace(/\D/g, '');
                            return clean.endsWith(item.lastTwo);
                        });

                        if (govPhone) {
                            await supabase
                                .from('leads')
                                .update({ num_gov: govPhone, status: 'concluido' })
                                .eq('id', leadData.id);
                            updatedCount++;
                        }
                    }
                }
                setResults({ success: 0, ignored: govMatches.length - updatedCount, updated: updatedCount });
                setSelectedFile(null);
                setUploading(false);
                return;
            }

            if (leads.length === 0) {
                alert("Nenhum lead válido encontrado no arquivo.");
                setUploading(false);
                return;
            }

            // INTEGRACAO REAL COM SUPABASE
            const { data, error } = await supabase
                .from('leads')
                .upsert(leads, { onConflict: 'cpf' })
                .select();

            if (error) {
                console.error('Erro Supabase:', error);
                alert(`Erro ao salvar no banco: ${error.message}`);
            } else {
                setResults({ success: data?.length || 0, ignored: leads.length - (data?.length || 0) });
                setSelectedFile(null);
            }

        } catch (err) {
            console.error(err);
            alert("Erro ao processar arquivo.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">Importação de Central</h2>
                    <p className="text-muted-foreground font-medium italic">Injete os dados diretamente no banco de dados.</p>
                </div>
                {results && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl animate-in zoom-in">
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest leading-none mb-1">Carga Finalizada</p>
                        <p className="text-lg font-black text-white italic">
                            {results.updated !== undefined ? `🚀 ${results.updated} Leads Concluídos` : `+${results.success} Leads no Banco`}
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <button onClick={() => setMode('cpf')} className={cn("p-6 rounded-3xl border-2 transition-all text-left", mode === 'cpf' ? "bg-primary/10 border-primary shadow-xl" : "bg-card border-border")}>
                    <FileType className="w-10 h-10 mb-4" />
                    <h3 className="font-black uppercase italic tracking-tighter">Modo 1: Lista CPF</h3>
                </button>
                <button onClick={() => setMode('bot')} className={cn("p-6 rounded-3xl border-2 transition-all text-left", mode === 'bot' ? "bg-primary/10 border-primary shadow-xl" : "bg-card border-border")}>
                    <Upload className="w-10 h-10 mb-4" />
                    <h3 className="font-black uppercase italic tracking-tighter">Modo 2: Extrator Bot</h3>
                </button>
                <button onClick={() => setMode('gov')} className={cn("p-6 rounded-3xl border-2 transition-all text-left group", mode === 'gov' ? "bg-primary/10 border-primary shadow-xl" : "bg-card border-border")}>
                    <UserCheck className={cn("w-10 h-10 mb-4", mode === 'gov' ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                    <h3 className="font-black uppercase italic tracking-tighter">Importar Núms GOV</h3>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Formato: CPF-XX</p>
                </button>
            </div>

            <div
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "w-full aspect-[2/0.8] border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center space-y-4 transition-all cursor-pointer relative",
                    dragActive ? "border-primary bg-primary/5" : "border-border bg-card/50",
                    selectedFile ? "border-emerald-500/50 bg-emerald-500/5 cursor-default" : ""
                )}
            >
                <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileChange} className="hidden" />

                {!selectedFile ? (
                    <div className="text-center group">
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                        <p className="text-xl font-black uppercase tracking-tighter">Anexar Log de Extração</p>
                        <p className="text-xs font-bold text-muted-foreground mt-1 opacity-60">CLIQUE PARA SELECIONAR</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6 w-full max-w-md animate-in zoom-in duration-300 px-6">
                        <div className="flex items-center gap-4 bg-card p-5 rounded-2xl border border-emerald-500/30 w-full relative">
                            <FileText className="text-emerald-500" />
                            <div className="flex-1 truncate font-bold text-sm">{selectedFile.name}</div>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-destructive"><X className="w-4 h-4" /></button>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                            disabled={uploading}
                            className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
                        >
                            {uploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                            {uploading ? "SALVANDO NO SUPABASE..." : "ENVIAR PARA O BANCO"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
