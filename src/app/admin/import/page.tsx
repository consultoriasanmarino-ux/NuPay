'use client'

import { useState, useRef } from 'react'
import {
    Upload,
    FileType,
    CheckCircle2,
    AlertCircle,
    FileText,
    X,
    Loader2,
    UserCheck,
    Database,
    Zap,
    Cpu,
    Activity,
    CloudIcon,
    Terminal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function ImportPage() {
    const [dragActive, setDragActive] = useState(false)
    const [mode, setMode] = useState<'cpf' | 'bot' | 'gov' | 'rejected'>('bot')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [results, setResults] = useState<{ success: number, ignored: number, updated?: number, new?: number, existing?: number, bad?: number } | null>(null)
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
                alert("PROTOCOL ERROR: .TXT FILES ONLY")
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
            let fullName = '';
            let card_bin = null;
            let card_expiry = null;

            if (mode === 'bot') {
                // Format 1: NOME: Fulano | 🆔 12345678900 | BIN: 516292 | VAL: 01/2030
                const nameMatch = line.match(/NOME:\s*([^|]+)/);
                const cpfMatch1 = line.match(/🆔\s*([\d.-]+)/);
                const binMatch1 = line.match(/BIN:\s*(\d+)/);
                const valMatch = line.match(/VAL:\s*(\d+\s*\/\s*\d+)/);

                // Format 2: 1️⃣ 516292 | 👤Gabriela fernandes | 📝15574748770
                const cpfMatch2 = line.match(/📝\s*([\d.-]+)/);
                const nameMatch2 = line.match(/👤\s*([^|]+)/);
                const binMatch2 = line.match(/(\d{6})\s*\|/);

                if (cpfMatch1) {
                    // Format 1
                    cpf = cpfMatch1[1].trim();
                    fullName = nameMatch ? nameMatch[1].trim().toUpperCase() : 'NOME_AUSENTE';
                    if (binMatch1) card_bin = binMatch1[1].trim().slice(0, 6);
                    if (valMatch) card_expiry = valMatch[1].trim().replace(/\s/g, '');
                } else if (cpfMatch2) {
                    // Format 2
                    cpf = cpfMatch2[1].trim();
                    fullName = nameMatch2 ? nameMatch2[1].trim().toUpperCase() : 'NOME_AUSENTE';
                    if (binMatch2) card_bin = binMatch2[1].trim().slice(0, 6);
                }
            } else if (mode === 'cpf' || mode === 'rejected') {
                const cpfMatch = line.match(/[\d.-]{11,14}/);
                if (cpfMatch) cpf = cpfMatch[0];
            } else if (mode === 'gov') {
                const match = line.match(/([\d.-]+)-(\d{2})/);
                if (match) {
                    cpf = match[1].replace(/\D/g, '');
                    govMatches.push({ cpf: cpf, lastTwo: match[2] });
                }
            }

            if (cpf) {
                // Limpa o CPF (remove pontos, traços, espaços) e garante a normalização de 11 dígitos
                cpf = cpf.replace(/\D/g, '').padStart(11, '0');
                
                if (cpf.length === 11 && !seenCpfs.has(cpf)) {
                    seenCpfs.add(cpf);
                    const leadObj: any = { cpf };
                    if (fullName) leadObj.full_name = fullName;
                    if (card_bin) leadObj.card_bin = card_bin;
                    if (card_expiry) leadObj.card_expiry = card_expiry;
                    leads.push(leadObj);
                }
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
                    alert("PACÔMETRO ZERO: CPF-XX FORM NOT DETECTED");
                    setUploading(false);
                    return;
                }

                let updatedCount = 0;
                let badCount = 0;
                let alreadyHadCount = 0;

                for (const item of govMatches) {
                    const { data: leadData } = await supabase
                        .from('leads')
                        .select('id, phones, status, num_gov')
                        .eq('cpf', item.cpf)
                        .single();

                    if (leadData) {
                        // Se já tem num_gov, não faz nada com esse lead
                        if (leadData.num_gov) {
                            alreadyHadCount++;
                            continue;
                        }

                        const phones = leadData.phones || [];
                        const govPhone = phones.find((p: string) => {
                            const clean = p.replace(/\D/g, '');
                            return clean.endsWith(item.lastTwo);
                        });

                        if (govPhone) {
                            // SÓ muda o status se a ficha ainda estiver pendente (não atribuída)
                            const shouldUpdateStatus = ['incompleto', 'consultado', 'processando', 'ruim'].includes(leadData.status);
                            
                            const updateData: any = { num_gov: govPhone };
                            if (shouldUpdateStatus) {
                                updateData.status = 'concluido';
                            }

                            await supabase
                                .from('leads')
                                .update(updateData)
                                .eq('id', leadData.id);
                            updatedCount++;
                        } else {
                            // SE não encontrou o número gov, tenta marcar como ficha ruim
                            // Só não marca se já estiver finalizada (concluido/arquivado) para não bagunçar histórico
                            const canMarkAsRuim = !['concluido', 'arquivado'].includes(leadData.status);
                            if (canMarkAsRuim) {
                                const { error: markError } = await supabase
                                    .from('leads')
                                    .update({ status: 'ruim' })
                                    .eq('id', leadData.id);

                                if (markError) {
                                    console.error('Erro ao marcar como ruim:', markError.message);
                                } else {
                                    badCount++;
                                }
                            }
                        }
                    }
                }
                setResults({ 
                    success: 0, 
                    ignored: govMatches.length - (updatedCount + badCount + alreadyHadCount), 
                    updated: updatedCount, 
                    bad: badCount, 
                    existing: alreadyHadCount 
                });
                setSelectedFile(null);
                setUploading(false);
                return;
            }

            if (mode === 'rejected') {
                if (leads.length === 0) {
                    alert("SIGNAL FAILURE: NO CPFS FOUND");
                    setUploading(false);
                    return;
                }

                const cpfsToReject = leads.map(l => l.cpf);
                
                // Update status to 'ruim' for all these CPFs
                const { error: updateError } = await supabase
                    .from('leads')
                    .update({ status: 'ruim' })
                    .in('cpf', cpfsToReject);

                if (updateError) {
                    alert(`DB SIGNAL DROP: ${updateError.message}`);
                } else {
                    setResults({ success: leads.length, ignored: 0, updated: leads.length });
                    setSelectedFile(null);
                }
                setUploading(false);
                return;
            }

            if (leads.length === 0) {
                alert("SIGNAL FAILURE: NO VALID LEADS");
                setUploading(false);
                return;
            }

            // 1. Verificar quais CPFs já existem para NÃO atualizar nem duplicar
            const cpfsToImport = leads.map(l => l.cpf);
            const { data: existingLeadsData } = await supabase
                .from('leads')
                .select('cpf')
                .in('cpf', cpfsToImport);
            
            const existingCpfsInDb = new Set(existingLeadsData?.map(l => l.cpf) || []);
            const onlyNewLeads = leads.filter(l => !existingCpfsInDb.has(l.cpf));

            let currentError = null;
            if (onlyNewLeads.length > 0) {
                const { error } = await supabase
                    .from('leads')
                    .insert(onlyNewLeads);
                currentError = error;
            }

            if (currentError) {
                alert(`DB SIGNAL DROP: ${currentError.message}`);
            } else {
                setResults({ 
                    success: leads.length, 
                    new: onlyNewLeads.length,
                    existing: existingCpfsInDb.size,
                    ignored: existingCpfsInDb.size 
                });
                setSelectedFile(null);
            }
        } catch (err) {
            alert("CORE UNKNOWN ERROR DURING UPLOAD");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 selection:bg-primary/20">
            {/* Header Bento */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-[28px] bg-primary/10 border border-primary/20 shadow-2xl scale-110">
                            <CloudIcon className="w-8 h-8 text-primary shadow-glow" />
                        </div>
                        <h2 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Protocolo Data-In</h2>
                    </div>
                    <p className="text-muted-foreground font-medium italic opacity-60 text-lg flex items-center gap-3">
                        <Terminal className="w-4 h-4" />
                        Injeção Massiva de Sinais no Core System
                    </p>
                </div>

                {results && (
                    <div className="glass px-10 py-6 rounded-[32px] animate-in zoom-in border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em] leading-none mb-2 italic">Signal Sync Complete</p>
                        <div className="text-2xl font-black text-white italic tracking-tighter flex flex-col items-end">
                            {mode === 'gov' ? (
                                <div className="space-y-1 flex flex-col items-end">
                                    <span className="text-emerald-500">🚀 {results.updated} GOV VIRTUALIZED</span>
                                    <span className="text-rose-500">🚫 {results.bad} MARCADOS COMO RUIM</span>
                                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">
                                        {results.existing} JÁ POSSUÍAM NÚMERO GOV
                                    </span>
                                </div>
                            ) : mode === 'rejected' ? (
                                <span>🚫 {results.updated} MARCADOS COMO RUIM</span>
                            ) : (
                                <>
                                    <span>+{results.new} NOVO RECORDS</span>
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                        {results.existing} JÁ EXISTIAM (IGNORADOS)
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mode Selectors - Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { id: 'cpf', icon: FileType, title: 'Modo 1: Lista CPF', desc: 'Injeção de Base Bruta', color: 'text-amber-500' },
                    { id: 'bot', icon: Upload, title: 'Modo 2: Extrator Bot', desc: 'Parsers de Log Bin/Val', color: 'text-primary' },
                    { id: 'gov', icon: UserCheck, title: 'Modo 3: Núms GOV', desc: 'CPF-XX Validation', color: 'text-emerald-500' },
                    { id: 'rejected', icon: AlertCircle, title: 'Modo 4: Recusados', desc: 'Marcar como Ficha Ruim', color: 'text-destructive' }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setMode(item.id as any)}
                        className={cn(
                            "glass p-10 rounded-[48px] border-2 transition-all text-left relative overflow-hidden group/card card-hover",
                            mode === item.id ? "bg-primary/5 border-primary shadow-[0_0_40px_rgba(138,5,190,0.1)]" : "bg-card border-white/5 opacity-40 hover:opacity-100"
                        )}
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full" />
                        <div className={cn("p-5 rounded-[24px] bg-black/40 border border-white/5 w-fit mb-8 transition-transform group-hover/card:scale-110 duration-500 shadow-2xl", item.color)}>
                            <item.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none mb-1">{item.title}</h3>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none mt-2">{item.desc}</p>
                    </button>
                ))}
            </div>

            {/* Upload Zone */}
            <div
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "w-full aspect-[2/0.7] border-2 border-dashed rounded-[64px] flex flex-col items-center justify-center space-y-8 transition-all relative overflow-hidden group shadow-2xl",
                    dragActive ? "border-primary bg-primary/10" : "border-white/5 bg-secondary/20",
                    selectedFile ? "border-emerald-500/40 bg-emerald-500/5 cursor-default" : "cursor-pointer hover:border-primary/50"
                )}
            >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileChange} className="hidden" />

                {!selectedFile ? (
                    <div className="text-center space-y-6 relative z-10">
                        <div className="w-24 h-24 bg-black/40 rounded-[32px] border border-white/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-700 shadow-2xl relative">
                            <Upload className="w-10 h-10 text-zinc-600 group-hover:text-primary transition-colors" />
                            <div className="absolute inset-0 bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-black uppercase italic tracking-tighter leading-none">Deploy Central Signal Log</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] italic opacity-60">CLIQUE OU ARRASTE O ARQUIVO .TXT PARA O RADAR</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-10 w-full max-w-xl animate-in zoom-in-95 duration-500 px-10 relative z-10">
                        <div className="glass p-8 rounded-[36px] border border-emerald-500/20 w-full flex items-center gap-6 relative group/file shadow-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                <FileText className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Arquivo Preparado</p>
                                <p className="text-lg font-black italic tracking-tighter truncate leading-none">{selectedFile.name}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                className="w-12 h-12 rounded-2xl bg-secondary hover:bg-destructive/10 hover:text-destructive transition-all flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                            disabled={uploading}
                            className="w-full bg-primary text-white font-black py-7 rounded-[32px] shadow-[0_20px_60px_rgba(138,5,190,0.3)] flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95 transition-all text-xl italic tracking-tighter border-b-4 border-black/20 group/upload"
                        >
                            {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 fill-white group-upload:rotate-12 transition-transform" />}
                            {uploading ? "SINCRONIZANDO CORE DATABASE..." : "DEPLOY SIGNALS TO CLOUD"}
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Intel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="glass p-10 rounded-[48px] flex items-center gap-8 border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-3xl bg-secondary border border-white/5 flex items-center justify-center shadow-inner">
                        <Cpu className="w-8 h-8 text-zinc-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Protocol Logic</p>
                        <p className="text-lg font-black italic tracking-tighter">Regex-Driven Stream Parsing</p>
                    </div>
                </div>
                <div className="glass p-10 rounded-[48px] flex items-center gap-8 border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-3xl bg-secondary border border-white/5 flex items-center justify-center shadow-inner">
                        <Activity className="w-8 h-8 text-zinc-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">System Health</p>
                        <p className="text-lg font-black italic tracking-tighter text-emerald-500 emerald-glow">Node Connected 100%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
