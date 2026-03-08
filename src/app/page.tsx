'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PhoneCall,
  MapPin,
  CreditCard,
  TrendingUp,
  Calendar,
  User,
  Smartphone,
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LigadorDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'pendentes' | 'finalizadas'>('pendentes')
  const [authorized, setAuthorized] = useState(false)

  // Dados de Fichas (AGORA ZERADOS POR PADRÃO)
  const [leadsAtribuidos, setLeadsAtribuidos] = useState<any[]>([])

  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem('nupay_ligador_user')
    if (!user) {
      router.push('/login')
    } else {
      setAuthorized(true)
    }
  }, [router])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-grid">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Protegendo sua Conexão...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-2xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-black text-white italic shadow-lg shadow-primary/20 rotate-12">N</div>
          <h1 className="font-black text-xl tracking-tighter hidden sm:block">Nu-Pay</h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="relative group cursor-pointer p-2 rounded-xl hover:bg-secondary/50 transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-ping" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex items-center gap-4 group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black tracking-tight">{localStorage.getItem('nupay_ligador_user') || 'Ligador'}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center justify-end gap-1.5 pt-0.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                DIsponível
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('nupay_ligador_user')
                router.push('/login')
              }}
              className="p-3 rounded-xl bg-secondary/50 border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all active:scale-95"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10 space-y-10">

        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter">Terminal de Atendimento</h2>
            <p className="text-muted-foreground font-medium">Você tem <span className="text-primary font-black underline decoration-primary/30 underline-offset-4">{leadsAtribuidos.length} fichas</span> aguardando ação.</p>
          </div>

          <div className="flex p-1.5 bg-secondary/50 backdrop-blur-md rounded-2xl border border-border">
            <button
              onClick={() => setActiveTab('pendentes')}
              className={cn(
                "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'pendentes' ? "bg-card shadow-2xl text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pendentes
            </button>
            <button
              onClick={() => setActiveTab('finalizadas')}
              className={cn(
                "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'finalizadas' ? "bg-card shadow-2xl text-foreground ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Finalizadas
            </button>
          </div>
        </section>

        {/* Empty State for Leads (ZERO DATA) */}
        {leadsAtribuidos.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-[40px] p-20 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center relative">
              <PhoneCall className="w-10 h-10 text-muted-foreground opacity-30" />
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
            </div>
            <div className="space-y-2 max-w-xs">
              <h3 className="text-xl font-bold">Tudo em dia!</h3>
              <p className="text-sm text-muted-foreground font-medium">Nenhum lead pendente no momento. Fique atento às notificações do Admin.</p>
            </div>
            <button
              className="bg-secondary hover:bg-accent border border-border text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all active:scale-95"
            >
              Recarregar Painel
            </button>
          </div>
        ) : (
          /* Card Grid would go here (same as before but now responsive to data length) */
          null
        )}
      </main>

      {/* Floating Action Menu */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 p-2 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[30px] shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="flex items-center gap-3 px-6 py-2 border-r border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Sistema Operacional</span>
        </div>
        <button className="w-14 h-14 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-110 active:scale-90 transition-all flex items-center justify-center group">
          <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  )
}
