import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { token, modulo, consulta } = await request.json();

        if (!token || !modulo || !consulta) {
            return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
        }

        const url = `https://completa.workbuscas.com/api?token=${token}&modulo=${modulo}&consulta=${consulta}`;
        console.log(`[DEBUG ENRICH] Consultando: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: 'Erro na API Externa', details: errorText }, { status: response.status });
        }

        const data = await response.json();
        
        // Return the FULL raw response so we can see the exact structure
        return NextResponse.json({
            raw_response: data,
            keys_level_0: Object.keys(data || {}),
            typeof_data: typeof data,
        });

    } catch (error: any) {
        console.error('[DEBUG ERROR]', error);
        return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
    }
}
