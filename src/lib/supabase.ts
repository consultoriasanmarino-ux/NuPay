import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Lead = {
    id: string
    status: 'incompleto' | 'processando' | 'consultado' | 'concluido' | 'atribuido' | 'arquivado' | 'ruim'
    cpf: string
    full_name?: string
    birth_date?: string
    age?: number
    phones: string[]
    score?: number
    income?: number
    state?: string
    city?: string
    num_gov?: string
    card_bin?: string
    card_expiry?: string
    owner_id?: string
    created_at: string
}
