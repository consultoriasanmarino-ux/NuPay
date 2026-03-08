'use client'

import { useState } from 'react'
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
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LigadorDashboard() {
  const [activeTab, setActiveTab] = useState<'pendentes' | 'finalizadas'>('pendentes')

  const leadsAtribuidos = [
    {
      id: 1,
      nome: 'Francisco Wanderley Luiz',
      cpf: '321.654.987-00',
      idade: 59,
      data_nasc: '13/10/1965',
      renda: 4200.50,
      score: 742,
      num_gov: '9845-X',
      e_com: 'Servidor Público',
      telefones: ['(47) 99122-4455', '(47) 3344-5566'],
      cidade: 'Rio do Sul',
      estado: 'SC'
    },
    {
      id: 2,
      nome: 'Sueli Aparecida Ferreira',
      cpf: '987.654.321-11',
      idade: 45,
      data_nasc: '25/05/1979',
      renda: 2800.00,
      score: 512,
      num_gov: '1223-A',
      e_com: 'Aposentada',
      telefones: ['(11) 98765-4321'],
      cidade: 'São Paulo',
      estado: 'SP'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-white italic">N</div>
          <h1 className="font-bold tracking-tight">Painel do Ligador</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          </div>
          <div className="h-8 w-[1px] bg-border" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold">João Ligador</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Disponível</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-8">

        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black mt-2">Suas Fichas do Dia</h2>
            <p className="text-muted-foreground">Você tem <span className="text-primary font-bold">2 novos leads</span> para processar hoje.</p>
          </div>

          <div className="flex p-1 bg-secondary rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('pendentes')}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === 'pendentes' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pendentes
            </button>
            <button
              onClick={() => setActiveTab('finalizadas')}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === 'finalizadas' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Finalizadas
            </button>
          </div>
        </section>

        {/* Lead Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          {leadsAtribuidos.map((lead) => (
            <div key={lead.id} className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-2xl shadow-black/20 hover:border-primary/40 transition-all flex flex-col space-y-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8">

              {/* Card Header: Personal Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">{lead.nome}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-muted-foreground/80 bg-secondary px-2 py-0.5 rounded uppercase tracking-tighter">
                        CPF: {lead.cpf}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {lead.idade} anos
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-muted-foreground uppercase opacity-50 mb-1">Score</div>
                  <div className={cn(
                    "text-lg font-black",
                    lead.score > 700 ? "text-emerald-500" : "text-yellow-500"
                  )}>
                    {lead.score}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase">Nascimento</span>
                  </div>
                  <p className="text-sm font-bold">{lead.data_nasc}</p>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase">Renda Estimada</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-500">
                    {lead.renda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase">Localização</span>
                  </div>
                  <p className="text-sm font-bold">{lead.cidade}, {lead.estado}</p>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase">Número GOV</span>
                  </div>
                  <p className="text-sm font-bold text-primary">{lead.num_gov}</p>
                </div>
              </div>

              {/* Phone List */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-muted-foreground uppercase px-1">Contatos Celulares</p>
                <div className="flex flex-wrap gap-2">
                  {lead.telefones.map((tel, idx) => (
                    <button key={idx} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all group overflow-hidden relative">
                      <Smartphone className="w-4 h-4 shrink-0 transition-transform group-active:scale-90" />
                      <span className="text-sm font-bold">{tel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Actions */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all active:scale-95 group">
                  <CheckCircle2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  PAGO / SUCESSO
                </button>
                <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-secondary border border-border text-muted-foreground font-black text-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all active:scale-95">
                  <XCircle className="w-5 h-5" />
                  NEGOU / RECUSA
                </button>
              </div>

              <button className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary transition-all text-muted-foreground">
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* Decoration */}
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Menu for Ligadores */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-card/80 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl z-[60]">
        <button className="p-4 rounded-xl bg-primary text-white shadow-xl shadow-primary/30 hover:scale-110 transition-all">
          <PhoneCall className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
