
import { createClient } from '@supabase/supabase-js'

async function checkLeads() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('--- INSPECIONANDO LEADS SEM GOV ---')

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .limit(5)

    if (error) {
        console.error('Erro:', error)
        return
    }

    leads?.forEach(l => {
        console.log(`CPF: ${l.cpf} | Status: ${l.status}`)
        console.log(`Campos detectados:`, Object.keys(l))
        console.log(`Conteúdo do campo 'phones':`, l.phones)
        console.log(`Conteúdo do campo 'phone':`, l.phone)
        console.log('---')
    })
}

checkLeads()
