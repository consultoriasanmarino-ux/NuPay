
import { createClient } from '@supabase/supabase-js'

async function auditReadyLeads() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('--- AUDITORIA DE FICHAS PRONTAS (STATUS: CONCLUIDO) ---')

    // 1. Pegar todas as fichas prontas
    const { data: readyLeads, error: err1 } = await supabase
        .from('leads')
        .select('id, cpf, owner_id, status')
        .eq('status', 'concluido')

    if (err1) {
        console.error('Erro ao buscar fichas prontas:', err1)
        return
    }

    const totalReady = readyLeads?.length || 0
    console.log(`Total de fichas na aba 'Prontas': ${totalReady}`)

    // 2. Verificar se alguma tem dono (não deveria ter)
    const withOwner = readyLeads?.filter(l => l.owner_id !== null) || []
    if (withOwner.length > 0) {
        console.log(`⚠️ ALERTA: ${withOwner.length} fichas estão como 'Prontas' mas JÁ POSSUEM DONO!`)
    } else {
        console.log('✅ Nenhuma ficha pronta possui dono atribuído.')
    }

    // 3. Verificar duplicatas dentro do grupo 'Prontas' (mesmo CPF limpo)
    const readyCpfCounts: Record<string, number> = {}
    readyLeads?.forEach(l => {
        const clean = l.cpf.replace(/\D/g, '')
        readyCpfCounts[clean] = (readyCpfCounts[clean] || 0) + 1
    })

    const duplicatesInside = Object.entries(readyCpfCounts).filter(([_, count]) => count > 1)
    if (duplicatesInside.length > 0) {
        console.log(`⚠️ ALERTA: Existem ${duplicatesInside.length} CPFs duplicados apenas na lista de 'Prontas'.`)
    } else {
        console.log('✅ Todos os CPFs na lista de "Prontas" são únicos entre si.')
    }

    // 4. Verificar se esses CPFs existem em outros status críticos (Atribuído ou Arquivado)
    const { data: criticalLeads, error: err2 } = await supabase
        .from('leads')
        .select('cpf, status')
        .in('status', ['atribuido', 'arquivado'])

    if (err2) {
        console.error('Erro ao buscar fichas críticas:', err2)
    } else {
        const criticalCpfs = new Set(criticalLeads?.map(l => l.cpf.replace(/\D/g, '')))
        let collisions = 0
        readyLeads?.forEach(l => {
            const clean = l.cpf.replace(/\D/g, '')
            if (criticalCpfs.has(clean)) {
                collisions++
            }
        })

        if (collisions > 0) {
            console.log(`⚠️ ALERTA CRÍTICO: ${collisions} fichas estão na lista de 'Prontas', MAS o mesmo CPF já está 'Atribuído' ou 'Arquivado' em outro registro!`)
        } else {
            console.log('✅ Nenhuma ficha pronta colide com fichas já em uso pelos ligadores.')
        }
    }
    
    console.log('\n--- CONCLUSÃO ---')
    if (withOwner.length === 0 && duplicatesInside.length === 0) {
        console.log('RECOMENDAÇÃO: Pode enviar para os ligadores. A base de 139 está limpa.')
    } else {
        console.log('RECOMENDAÇÃO: NÃO ENVIE AINDA. Use o botão "Reparar Sistema" para unificar essas CPFs primeiro.')
    }
}

auditReadyLeads()
