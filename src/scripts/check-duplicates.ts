
import { createClient } from '@supabase/supabase-js'

async function checkDuplicates() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: leads, error } = await supabase
        .from('leads')
        .select('cpf')

    if (error) {
        console.error('Error fetching leads:', error)
        return
    }

    const counts: Record<string, number> = {}
    leads.forEach(l => {
        counts[l.cpf] = (counts[l.cpf] || 0) + 1
    })

    const duplicates = Object.entries(counts).filter(([cpf, count]) => count > 1)
    
    if (duplicates.length === 0) {
        console.log('No duplicates found by CPF.')
    } else {
        console.log(`Found ${duplicates.length} CPFs with duplicates:`)
        duplicates.slice(0, 10).forEach(([cpf, count]) => {
            console.log(`${cpf}: ${count} entries`)
        })
    }
}

checkDuplicates()
