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
    const [dragActive2, setDragActive2] = useState(false)
    const [mode, setMode] = useState<'cpf' | 'bot' | 'gov' | 'checker_gov' | 'rejected'>('bot')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedFile2, setSelectedFile2] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState<{ phase: string, current: number, total: number } | null>(null)
    const [results, setResults] = useState<{ totalFile: number, duplicatesInFile: number, newAdded: number, alreadyInDb: number, errors: number, updated?: number, bad?: number, invalidLines?: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const fileInput2Ref = useRef<HTMLInputElement>(null)

    const BATCH_SIZE = 300

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

    const handleDrag2 = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive2(true)
        } else if (e.type === "dragleave") {
            setDragActive2(false)
        }
    }

    const handleDrop2 = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive2(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (file.name.endsWith('.txt')) {
                setSelectedFile2(file)
                setResults(null)
            } else {
                alert("PROTOCOL ERROR: .TXT FILES ONLY")
            }
        }
    }

    const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile2(e.target.files[0])
            setResults(null)
        }
    }

    const parseFileContent = (content: string, overrideMode?: string) => {
        const lines = content.split('\n');
        const leads: any[] = [];
        const govMatches: { cpf: string, lastTwo: string }[] = [];
        const checkerMatches: { cpf: string, phone: string }[] = [];
        const seenCpfs = new Set();

        const currentMode = overrideMode || mode;

        lines.forEach(line => {
            let cpf = '';
            let fullName = '';
            let card_bin = null;
            let card_expiry = null;

            if (currentMode === 'bot') {
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
            } else if (currentMode === 'cpf' || currentMode === 'rejected') {
                const cpfMatch = line.match(/[\d.-]{11,14}/);
                if (cpfMatch) cpf = cpfMatch[0];
            } else if (currentMode === 'gov') {
                const match = line.match(/([\d.-]+)-(\d+)/);
                if (match) {
                    cpf = match[1].replace(/\D/g, '').padStart(11, '0');
                    govMatches.push({ cpf: cpf, lastTwo: match[2].replace(/\D/g, '') });
                }
            } else if (currentMode === 'checker_gov') {
                const match = line.match(/([\d.-]+).*TELEFONE:\s*(\d+)/i);
                if (match) {
                    cpf = match[1].replace(/\D/g, '').padStart(11, '0');
                    checkerMatches.push({ cpf: cpf, phone: match[2].replace(/\D/g, '') });
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

        return { leads, govMatches, checkerMatches };
    }

    const handleUpload = async () => {
        if (!selectedFile) return
        setUploading(true)
        setResults(null)
        setProgress({ phase: 'Lendo arquivo...', current: 0, total: 0 })

        try {
            if (mode === 'checker_gov') {
                if (!selectedFile || !selectedFile2) {
                    alert("PACÔMETRO: É OBRIGATÓRIO ENVIAR OS DOIS ARQUIVOS (BASE E CHECKER GOV).");
                    setUploading(false); setProgress(null);
                    return;
                }
                const text1 = await selectedFile.text();
                const text2 = await selectedFile2.text();
                
                const baseParsed = parseFileContent(text1, 'cpf');
                const checkerParsed = parseFileContent(text2, 'checker_gov');
                
                const baseCpfs = baseParsed.leads.map(l => l.cpf);
                const approvedMatches = checkerParsed.checkerMatches;
                const approvedCpfs = new Set(approvedMatches.map(m => m.cpf));

                if (baseCpfs.length === 0) {
                    alert("SINAL VAZIO: A LISTA BASE NÃO POSSUI CPFs VÁLIDOS.");
                    setUploading(false); setProgress(null);
                    return;
                }

                if (approvedMatches.length === 0) {
                    alert("PACÔMETRO ZERO: CHECKER FORMAT NOT DETECTED NO ARQUIVO 2.");
                    setUploading(false); setProgress(null);
                    return;
                }

                const badCpfs = baseCpfs.filter(c => !approvedCpfs.has(c));
                let badCount = 0;
                
                if (badCpfs.length > 0) {
                    setProgress({ phase: 'Marcando CPFs faltantes como ruim...', current: 0, total: badCpfs.length });
                    for (let i = 0; i < badCpfs.length; i += BATCH_SIZE) {
                        const batch = badCpfs.slice(i, i + BATCH_SIZE);
                        const { error } = await supabase.from('leads').update({ status: 'ruim' }).in('cpf', batch);
                        if (!error) badCount += batch.length;
                    }
                }

                let updatedCount = 0, alreadyHadCount = 0, notFoundCount = 0, noPhonesCount = 0;
                
                for (let i = 0; i < approvedMatches.length; i++) {
                    setProgress({ phase: 'Processando Checker GOV Aprovados...', current: i + 1, total: approvedMatches.length });
                    const item = approvedMatches[i];
                    
                    const { data: leadData } = await supabase.from('leads').select('id, cpf, phones, status, num_gov').eq('cpf', item.cpf).maybeSingle();
                    
                    if (!leadData) { notFoundCount++; continue; }
                    if (leadData.num_gov) { alreadyHadCount++; continue; }
                    
                    const phones = Array.isArray(leadData.phones) ? leadData.phones : [];
                    
                    if (phones.length === 0) {
                        if (leadData.status === 'incompleto') {
                            noPhonesCount++;
                            continue;
                        }
                        noPhonesCount++;
                        continue;
                    }
                    
                    const cleanPhoneInput = item.phone.replace(/\D/g, '');
                    const govPhone = phones.find((p: string) => {
                        const cleanP = p.replace(/\D/g, '');
                        return cleanP === cleanPhoneInput || cleanP.endsWith(cleanPhoneInput.slice(-8));
                    });

                    if (govPhone) {
                        const updateData: any = { num_gov: govPhone };
                        if (['incompleto', 'consultado', 'processando', 'ruim'].includes(leadData.status)) updateData.status = 'concluido';
                        await supabase.from('leads').update(updateData).eq('id', leadData.id);
                        updatedCount++;
                    } else {
                        if (leadData.status === 'incompleto') {
                            noPhonesCount++;
                            continue;
                        }
                        if (!['concluido', 'arquivado', 'pago', 'atribuido'].includes(leadData.status)) {
                            await supabase.from('leads').update({ status: 'ruim' }).eq('id', leadData.id);
                            badCount++;
                        }
                    }
                }
                setResults({ totalFile: baseCpfs.length, duplicatesInFile: 0, newAdded: notFoundCount, alreadyInDb: alreadyHadCount, errors: noPhonesCount, updated: updatedCount, bad: badCount, invalidLines: 0 });
                setSelectedFile(null); setSelectedFile2(null); setUploading(false); setProgress(null);
                return;
            }

            const text = await selectedFile.text();
            const lines = text.split('\n');
            const totalLines = lines.filter(l => l.trim()).length;
            const { leads, govMatches } = parseFileContent(text);
            const duplicatesInFile = totalLines - leads.length - (mode === 'gov' ? (totalLines - govMatches.length) : 0);

            if (mode === 'gov') {
                if (govMatches.length === 0) {
                    alert("PACÔMETRO ZERO: CPF-XX FORM NOT DETECTED");
                    setUploading(false); setProgress(null);
                    return;
                }
                let updatedCount = 0, badCount = 0, alreadyHadCount = 0, notFoundCount = 0, noPhonesCount = 0;
                
                for (let i = 0; i < govMatches.length; i++) {
                    setProgress({ phase: 'Processando GOV...', current: i + 1, total: govMatches.length });
                    const item = govMatches[i];
                    
                    const { data: leadData } = await supabase.from('leads').select('id, cpf, phones, status, num_gov').eq('cpf', item.cpf).maybeSingle();
                    
                    if (!leadData) { notFoundCount++; continue; }
                    if (leadData.num_gov) { alreadyHadCount++; continue; }
                    
                    const phones = Array.isArray(leadData.phones) ? leadData.phones : [];
                    const isFullPhone = item.lastTwo.length >= 10;
                    
                    if (isFullPhone) {
                        const fullPhone = item.lastTwo;
                        // Evitar duplicatas na array de telefones
                        const cleanPhones = phones.map((p: string) => p.replace(/\D/g, ''));
                        const newPhones = cleanPhones.includes(fullPhone) ? phones : [...phones, fullPhone];
                        
                        const updateData: any = { 
                            num_gov: fullPhone,
                            phones: newPhones
                        };
                        const shouldUpdateStatus = ['incompleto', 'consultado', 'processando', 'ruim'].includes(leadData.status);
                        if (shouldUpdateStatus) updateData.status = 'concluido';
                        
                        await supabase.from('leads').update(updateData).eq('id', leadData.id);
                        updatedCount++;
                    } else {
                        // Busca pelo final (2 dígitos)
                        if (phones.length === 0) {
                            // Se o lead ainda nem foi consultado, não marcar como ruim - ele precisa ser enriquecido primeiro
                            if (leadData.status === 'incompleto') {
                                noPhonesCount++;
                                continue;
                            }
                            noPhonesCount++;
                            continue;
                        }
                        
                        const govPhone = phones.find((p: string) => {
                            const cleanP = p.replace(/\D/g, '');
                            return cleanP.endsWith(item.lastTwo);
                        });

                        if (govPhone) {
                            const updateData: any = { num_gov: govPhone };
                            if (['incompleto', 'consultado', 'processando', 'ruim'].includes(leadData.status)) updateData.status = 'concluido';
                            await supabase.from('leads').update(updateData).eq('id', leadData.id);
                            updatedCount++;
                        } else {
                            // NUNCA marcar como 'ruim' leads que ainda não foram consultados
                            // Leads 'incompleto' precisam ser enriquecidos primeiro antes de julgar
                            if (leadData.status === 'incompleto') {
                                // Sem consulta ainda, pular - não é ficha ruim, apenas pendente
                                noPhonesCount++;
                                continue;
                            }
                            // Só marca como ruim leads que JÁ foram consultados e não batem
                            if (!['concluido', 'arquivado', 'pago', 'atribuido'].includes(leadData.status)) {
                                await supabase.from('leads').update({ status: 'ruim' }).eq('id', leadData.id);
                                badCount++;
                            }
                        }
                    }
                }
                setResults({ totalFile: govMatches.length, duplicatesInFile: 0, newAdded: notFoundCount, alreadyInDb: alreadyHadCount, errors: noPhonesCount, updated: updatedCount, bad: badCount, invalidLines: totalLines - govMatches.length });
                setSelectedFile(null); setUploading(false); setProgress(null);
                return;
            }

            if (mode === 'rejected') {
                if (leads.length === 0) { alert("SIGNAL FAILURE: NO CPFS FOUND"); setUploading(false); setProgress(null); return; }
                const cpfs = leads.map(l => l.cpf);
                let updated = 0, errCount = 0;
                for (let i = 0; i < cpfs.length; i += BATCH_SIZE) {
                    const batch = cpfs.slice(i, i + BATCH_SIZE);
                    setProgress({ phase: 'Marcando recusados...', current: Math.min(i + BATCH_SIZE, cpfs.length), total: cpfs.length });
                    const { error } = await supabase.from('leads').update({ status: 'ruim' }).in('cpf', batch);
                    if (error) errCount += batch.length; else updated += batch.length;
                }
                setResults({ totalFile: leads.length, duplicatesInFile: 0, newAdded: 0, alreadyInDb: 0, errors: errCount, updated });
                setSelectedFile(null); setUploading(false); setProgress(null);
                return;
            }

            // Modos CPF e Bot
            if (leads.length === 0) { alert("SIGNAL FAILURE: NO VALID LEADS"); setUploading(false); setProgress(null); return; }

            // Fase 1: Verificar CPFs existentes em batches
            setProgress({ phase: 'Verificando duplicatas no banco...', current: 0, total: leads.length });
            const existingCpfs = new Set<string>();
            const allCpfs = leads.map(l => l.cpf);

            for (let i = 0; i < allCpfs.length; i += BATCH_SIZE) {
                const batch = allCpfs.slice(i, i + BATCH_SIZE);
                setProgress({ phase: 'Verificando duplicatas no banco...', current: Math.min(i + BATCH_SIZE, allCpfs.length), total: allCpfs.length });
                const { data, error } = await supabase.from('leads').select('cpf').in('cpf', batch);
                if (error) { console.error('Erro ao verificar batch:', error.message); }
                if (data) data.forEach(d => existingCpfs.add(d.cpf));
            }

            const onlyNew = leads.filter(l => !existingCpfs.has(l.cpf));

            // Fase 2: Inserir novos leads em batches
            let insertedCount = 0, errorCount = 0;
            if (onlyNew.length > 0) {
                setProgress({ phase: 'Inserindo novos leads...', current: 0, total: onlyNew.length });
                for (let i = 0; i < onlyNew.length; i += BATCH_SIZE) {
                    const batch = onlyNew.slice(i, i + BATCH_SIZE);
                    setProgress({ phase: 'Inserindo novos leads...', current: Math.min(i + BATCH_SIZE, onlyNew.length), total: onlyNew.length });
                    const { error } = await supabase.from('leads').insert(batch);
                    if (error) { console.error('Erro ao inserir batch:', error.message); errorCount += batch.length; }
                    else { insertedCount += batch.length; }
                }
            }

            const invalidLines = totalLines - leads.length - duplicatesInFile;
            setResults({ totalFile: totalLines, duplicatesInFile: Math.max(0, duplicatesInFile), newAdded: insertedCount, alreadyInDb: existingCpfs.size, errors: errorCount, invalidLines: Math.max(0, invalidLines) });
            setSelectedFile(null);
        } catch (err: any) {
            console.error('Upload error:', err);
            alert(`CORE ERROR: ${err?.message || 'Erro desconhecido'}`);
        } finally {
            setUploading(false);
            setProgress(null);
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
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em] leading-none mb-3 italic">Signal Sync Complete</p>
                        <div className="text-sm font-black text-white italic tracking-tighter flex flex-col items-end gap-1">
                            {mode === 'gov' || mode === 'checker_gov' ? (
                                <div className="space-y-1 flex flex-col items-end">
                                    <span className="text-emerald-500 text-lg">🚀 {results.updated} GOV VIRTUALIZED</span>
                                    <span className="text-rose-500">🚫 {results.bad} MARCADOS COMO RUIM</span>
                                    {(results.newAdded || 0) > 0 && (
                                        <span className="text-amber-500">⚠️ {results.newAdded} CPFs NÃO ENCONTRADOS NO BANCO</span>
                                    )}
                                    {(results.errors || 0) > 0 && (
                                        <span className="text-orange-500">📵 {results.errors} SEM TELEFONES CADASTRADOS</span>
                                    )}
                                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">
                                        {results.alreadyInDb} JÁ POSSUÍAM NÚMERO GOV
                                    </span>
                                </div>
                            ) : mode === 'rejected' ? (
                                <span className="text-lg">🚫 {results.updated} MARCADOS COMO RUIM</span>
                            ) : (
                                <div className="space-y-1 flex flex-col items-end">
                                    <span className="text-emerald-500 text-lg">✅ {results.newAdded} NOVOS ADICIONADOS</span>
                                    <span className="text-amber-500">⚠️ {results.alreadyInDb} JÁ EXISTIAM NO BANCO</span>
                                    {results.duplicatesInFile > 0 && (
                                        <span className="text-zinc-500">📋 {results.duplicatesInFile} DUPLICATAS NO ARQUIVO</span>
                                    )}
                                    {(results.invalidLines || 0) > 0 && (
                                        <span className="text-zinc-600">🚫 {results.invalidLines} LINHAS INVÁLIDAS</span>
                                    )}
                                    {results.errors > 0 && (
                                        <span className="text-rose-500">❌ {results.errors} ERROS DE INSERÇÃO</span>
                                    )}
                                    <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-none mt-2">
                                        TOTAL NO ARQUIVO: {results.totalFile} LINHAS
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mode Selectors - Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { id: 'cpf', icon: FileType, title: 'Modo 1', desc: 'Lista CPF', color: 'text-amber-500' },
                    { id: 'bot', icon: Upload, title: 'Modo 2', desc: 'Extrator Bot', color: 'text-primary' },
                    { id: 'gov', icon: UserCheck, title: 'Modo 3', desc: 'Núms GOV', color: 'text-emerald-500' },
                    { id: 'rejected', icon: AlertCircle, title: 'Modo 4', desc: 'Marcar Ruins', color: 'text-destructive' },
                    { id: 'checker_gov', icon: CheckCircle2, title: 'Modo 5', desc: 'Checker GOV TXT', color: 'text-cyan-400' }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setMode(item.id as any)}
                        className={cn(
                            "glass p-6 md:p-8 rounded-[36px] border-2 transition-all text-left relative overflow-hidden group/card card-hover",
                            mode === item.id ? "bg-primary/5 border-primary shadow-[0_0_40px_rgba(138,5,190,0.1)]" : "bg-card border-white/5 opacity-40 hover:opacity-100"
                        )}
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-2xl rounded-full" />
                        <div className={cn("p-4 rounded-[20px] bg-black/40 border border-white/5 w-fit mb-6 transition-transform group-hover/card:scale-110 duration-500 shadow-2xl", item.color)}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter leading-none mb-1">{item.title}</h3>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none mt-2">{item.desc}</p>
                    </button>
                ))}
            </div>

            {/* Upload Zone */}
            <div className={cn("grid gap-6", mode === 'checker_gov' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                <div
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={cn(
                        "w-full aspect-[2/0.7] border-2 border-dashed rounded-[64px] flex flex-col items-center justify-center space-y-8 transition-all relative overflow-hidden group shadow-2xl",
                        dragActive ? "border-primary bg-primary/10" : "border-white/5 bg-secondary/20",
                        selectedFile ? "border-emerald-500/40 bg-emerald-500/5 cursor-default" : "cursor-pointer hover:border-primary/50",
                        mode === 'checker_gov' ? "aspect-auto py-12" : ""
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
                                <p className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                                    {mode === 'checker_gov' ? "Lista Base" : "Deploy Central Signal Log"}
                                </p>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] italic opacity-60">
                                    {mode === 'checker_gov' ? "ARQUIVO 1: .TXT COM TODOS OS CPFS" : "CLIQUE OU ARRASTE O ARQUIVO .TXT PARA O RADAR"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-10 w-full max-w-xl animate-in zoom-in-95 duration-500 px-10 relative z-10">
                            <div className="glass p-8 rounded-[36px] border border-emerald-500/20 w-full flex items-center gap-6 relative group/file shadow-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                    <FileText className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">
                                        {mode === 'checker_gov' ? "Base (Arquivo 1)" : "Arquivo Preparado"}
                                    </p>
                                    <p className="text-lg font-black italic tracking-tighter truncate leading-none">{selectedFile.name}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                    className="w-12 h-12 rounded-2xl bg-secondary hover:bg-destructive/10 hover:text-destructive transition-all flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {mode !== 'checker_gov' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                    disabled={uploading}
                                    className="w-full bg-primary text-white font-black py-7 rounded-[32px] shadow-[0_20px_60px_rgba(138,5,190,0.3)] flex flex-col items-center justify-center gap-2 disabled:opacity-70 active:scale-95 transition-all text-xl italic tracking-tighter border-b-4 border-black/20 group/upload"
                                >
                                    <div className="flex items-center gap-4">
                                        {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 fill-white group-upload:rotate-12 transition-transform" />}
                                        {uploading ? (progress?.phase || "SINCRONIZANDO...") : "DEPLOY SIGNALS TO CLOUD"}
                                    </div>
                                    {uploading && progress && progress.total > 0 && (
                                        <div className="w-full max-w-xs space-y-1">
                                            <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-white/80 rounded-full transition-all duration-300" 
                                                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} 
                                                />
                                            </div>
                                            <p className="text-[10px] font-bold tracking-widest opacity-70">
                                                {progress.current}/{progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                                            </p>
                                        </div>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* AREA 2 (Apenas Modo Checker Gov) */}
                {mode === 'checker_gov' && (
                    <div
                        onClick={() => !selectedFile2 && fileInput2Ref.current?.click()}
                        onDragOver={handleDrag2}
                        onDrop={handleDrop2}
                        className={cn(
                            "w-full border-2 border-dashed rounded-[64px] flex flex-col items-center justify-center space-y-8 transition-all relative overflow-hidden group shadow-2xl py-12",
                            dragActive2 ? "border-cyan-400 bg-cyan-400/10" : "border-white/5 bg-secondary/20",
                            selectedFile2 ? "border-emerald-500/40 bg-emerald-500/5 cursor-default" : "cursor-pointer hover:border-cyan-400/50"
                        )}
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                        <input ref={fileInput2Ref} type="file" accept=".txt" onChange={handleFileChange2} className="hidden" />

                        {!selectedFile2 ? (
                            <div className="text-center space-y-6 relative z-10">
                                <div className="w-24 h-24 bg-black/40 rounded-[32px] border border-white/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-700 shadow-2xl relative">
                                    <CloudIcon className="w-10 h-10 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
                                    <div className="absolute inset-0 bg-cyan-400/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-3xl font-black uppercase italic tracking-tighter leading-none">Checker (Aprovados)</p>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] italic opacity-60">ARQUIVO 2: O CHECKER.TXT COM APROVADOS</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-10 w-full max-w-xl animate-in zoom-in-95 duration-500 px-10 relative z-10">
                                <div className="glass p-8 rounded-[36px] border border-emerald-500/20 w-full flex items-center gap-6 relative group/file shadow-2xl">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                        <FileText className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1 italic">Checker (Arquivo 2)</p>
                                        <p className="text-lg font-black italic tracking-tighter truncate leading-none">{selectedFile2.name}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedFile2(null); }}
                                        className="w-12 h-12 rounded-2xl bg-secondary hover:bg-destructive/10 hover:text-destructive transition-all flex items-center justify-center"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {mode === 'checker_gov' && selectedFile && selectedFile2 && (
                <div className="flex justify-center animate-in slide-in-from-bottom-5 duration-700">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                        disabled={uploading}
                        className="w-full max-w-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black py-7 rounded-[32px] shadow-[0_20px_60px_rgba(34,211,238,0.3)] flex flex-col items-center justify-center gap-2 disabled:opacity-70 active:scale-95 transition-all text-xl italic tracking-tighter border-b-4 border-black/20 group/upload mx-auto"
                    >
                        <div className="flex items-center gap-4">
                            {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 fill-black group-hover/upload:rotate-12 transition-transform" />}
                            {uploading ? (progress?.phase || "SINCRONIZANDO CHECKER...") : "EXECUTAR CRUZAMENTO E LIMPEZA"}
                        </div>
                        {uploading && progress && progress.total > 0 && (
                            <div className="w-full max-w-xs space-y-1 mt-2">
                                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-white/80 rounded-full transition-all duration-300" 
                                        style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} 
                                    />
                                </div>
                                <p className="text-[10px] font-bold tracking-widest opacity-80 text-black/70">
                                    {progress.current}/{progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                                </p>
                            </div>
                        )}
                    </button>
                </div>
            )}

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
