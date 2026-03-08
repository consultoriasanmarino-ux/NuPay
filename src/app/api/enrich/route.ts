import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { token, modulo, consulta } = await request.json();

        if (!token || !modulo || !consulta) {
            return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
        }

        const url = `https://completa.workbuscas.com/api?token=${token}&modulo=${modulo}&consulta=${consulta}`;

        console.log(`[PROXY API] Consultando: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            // Desabilitar cache para sempre pegar dado novo se necessário
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: 'Erro na API Externa', details: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('[PROXY ERROR]', error);
        return NextResponse.json({ error: 'Erro interno no Servidor', details: error.message }, { status: 500 });
    }
}
