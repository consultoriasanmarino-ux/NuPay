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

    // Find all leads that have an owner_id but status is NOT 'atribuido' or 'arquivado'
    // These were corrupted by the normalize function
    const { data: corruptedLeads, error: fetchError } = await supabase
        .from('leads')
        .select('id, owner_id, status')
        .not('owner_id', 'is', null)
        .eq('status', 'concluido')

    if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!corruptedLeads || corruptedLeads.length === 0) {
        return NextResponse.json({ message: 'No corrupted leads found. All good!', fixed: 0 })
    }

    // Fix them: set status back to 'atribuido'
    const ids = corruptedLeads.map(l => l.id)
    const { error: updateError } = await supabase
        .from('leads')
        .update({ status: 'atribuido' })
        .in('id', ids)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
        message: `Fixed ${corruptedLeads.length} leads. Status restored to 'atribuido'.`,
        fixed: corruptedLeads.length,
        ids: ids
    })
}
