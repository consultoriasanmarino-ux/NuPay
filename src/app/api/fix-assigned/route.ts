import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
    const { secret } = await request.json()

    // Simple security check
    if (secret !== 'fix-assigned-171033') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 1. REPARAR STATUS: Encontrar fichas com dono, mas status de "disponível"
    const { data: misalignedLeads, error: fetchError } = await supabase
        .from('leads')
        .select('id, owner_id, status')
        .not('owner_id', 'is', null)
        .in('status', ['incompleto', 'consultado', 'concluido', 'processando'])

    if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let fixedCount = 0
    if (misalignedLeads && misalignedLeads.length > 0) {
        const ids = misalignedLeads.map(l => l.id)
        const { error: updateError } = await supabase
            .from('leads')
            .update({ status: 'atribuido' })
            .in('id', ids)

        if (!updateError) fixedCount = ids.length
    }

    // 2. DETECTAR DUPLICATAS (Formatos diferentes e Zeros à esquerda)
    const { data: allLeads } = await supabase.from('leads').select('id, cpf, created_at').order('created_at', { ascending: false })
    
    let deletedDuplicates = 0
    if (allLeads) {
        const seen = new Map()
        const toDelete: string[] = []
        
        for (const lead of allLeads) {
            // Limpa tudo: remove pontos, traços, espaços e garante 11 dígitos com zeros à esquerda
            const cleanCpf = lead.cpf.replace(/\D/g, '').trim().padStart(11, '0')
            
            if (seen.has(cleanCpf)) {
                toDelete.push(lead.id)
            } else {
                seen.set(cleanCpf, lead.id)
                // Aproveita para normalizar o CPF no banco se ele estiver bagunçado
                if (lead.cpf !== cleanCpf) {
                    await supabase.from('leads').update({ cpf: cleanCpf }).eq('id', lead.id)
                }
            }
        }

        if (toDelete.length > 0) {
            const { error: delError } = await supabase.from('leads').delete().in('id', toDelete)
            if (!delError) deletedDuplicates = toDelete.length
        }
    }

    return NextResponse.json({
        message: 'Reparação concluída.',
        fichas_restauradas_para_ligador: fixedCount,
        duplicatas_de_formatacao_removidas: deletedDuplicates
    })
}
