
import { createClient } from '@supabase/supabase-js'

async function analyzeLeads() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('--- ANALISANDO LEADS ---')

    // 1. Verificar leads com dono mas status de "disponível"
    const { data: misalignedLeads, error: err1 } = await supabase
        .from('leads')
        .select('id, cpf, status, owner_id')
        .not('owner_id', 'is', null)
        .in('status', ['incompleto', 'consultado', 'concluido', 'processando'])

    if (err1) console.error('Erro 1:', err1)
    else {
        console.log(`Fichas com dono mas status errado (aparecendo na aba Fichas): ${misalignedLeads?.length || 0}`)
        misalignedLeads?.slice(0, 5).forEach(l => console.log(`CPF: ${l.cpf} | Status Atual: ${l.status} | Dono ID: ${l.owner_id}`))
    }

    // 2. Verificar duplicatas (agora que sabemos que podem existir formatos diferentes)
    const { data: allLeads, error: err2 } = await supabase
        .from('leads')
        .select('cpf')

    if (err2) console.error('Erro 2:', err2)
    else {
        const cleanCounts: Record<string, number> = {}
        allLeads?.forEach(l => {
            const clean = l.cpf.replace(/\D/g, '')
            cleanCounts[clean] = (cleanCounts[clean] || 0) + 1
        })

        const duplicates = Object.entries(cleanCounts).filter(([_, count]) => count > 1)
        console.log(`\nDuplicatas (mesmo CPF com formatos diferentes): ${duplicates.length}`)
        duplicates.slice(0, 5).forEach(([cpf, count]) => console.log(`CPF: ${cpf} | Ocorrências: ${count}`))
    }
}

analyzeLeads()
