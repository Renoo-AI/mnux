'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { CreditCard, Check, X, ArrowUpRight, MessageCircle, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BillingPage() {
  const { session } = useStaffSession();
  
  // Simulated usage
  const [itemsUsed, setItemsUsed] = useState(4);
  const maxItemsFree = 8;
  const itemPercent = (itemsUsed / maxItemsFree) * 100;

  return (
    <DashboardLayout restaurantName={session?.restaurantName || 'MenuxPro'}>
      <TopAppBar title="Abonnement & Facturation" />
      
      <div className="flex-1 overflow-y-auto bg-[#FCFBF9] text-[#3A322D] p-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Main Plan Overview Header Card */}
          <div className="bg-white border border-[#EFE4D8] rounded-3xl p-8 shadow-luxury-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C9A07E]/10 rounded-full text-xs font-semibold text-[#C9A07E]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Formule Actuelle</span>
              </div>
              <h2 className="font-serif text-3xl font-bold tracking-tight">Plan FREE</h2>
              <p className="text-sm text-[#5A4A3D]/70 font-light max-w-md">
                Vous utilisez actuellement le plan gratuit. Mettez à niveau votre compte pour débloquer les commandes en temps réel et les articles illimités.
              </p>
            </div>
            
            <a
              href="https://wa.me/21656110674?text=Je%20souhaite%20passer%20mon%20cafe%20au%20plan%20PRO"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#C9A07E] hover:bg-[#b08b6b] text-white px-6 py-4 rounded-xl font-medium shadow-md transition-all active:scale-[0.98]"
            >
              <span>Passer au Plan PRO</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Usage Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Items limit usage */}
            <div className="bg-white border border-[#EFE4D8] rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[#3A322D]/80">Limite d'articles</span>
                <span className="font-semibold text-[#C9A07E]">{itemsUsed} / {maxItemsFree}</span>
              </div>
              
              <div className="w-full h-3 bg-[#EFE4D8]/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#C9A07E] rounded-full transition-all duration-500"
                  style={{ width: `${itemPercent}%` }}
                />
              </div>
              
              <p className="text-xs text-[#5A4A3D]/60 font-light leading-relaxed">
                Le plan FREE limite le catalogue à {maxItemsFree} articles maximum. Passez au plan PRO pour ajouter un nombre illimité d'articles.
              </p>
            </div>

            {/* Card 2: Quick Features Check */}
            <div className="bg-white border border-[#EFE4D8] rounded-3xl p-6 space-y-4">
              <h3 className="font-semibold text-sm text-[#3A322D]/80">Statut des fonctionnalités clés</h3>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#5A4A3D]/70">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Menu QR digital</span>
                </div>
                <div className="flex items-center gap-2 text-[#5A4A3D]/70 opacity-50">
                  <X className="w-4 h-4 text-red-400" />
                  <span>Sans filigrane</span>
                </div>
                <div className="flex items-center gap-2 text-[#5A4A3D]/70 opacity-50">
                  <X className="w-4 h-4 text-red-400" />
                  <span>Commandes à table</span>
                </div>
                <div className="flex items-center gap-2 text-[#5A4A3D]/70 opacity-50">
                  <X className="w-4 h-4 text-red-400" />
                  <span>Branding custom</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans Comparison Section */}
          <div className="bg-white border border-[#EFE4D8] rounded-3xl p-8 space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl font-bold">Comparez nos formules d'abonnement</h3>
              <p className="text-sm text-[#5A4A3D]/70 font-light">
                Choisissez l'abonnement qui correspond le mieux aux besoins de votre établissement.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#EFE4D8] text-[#3A322D]/60 text-xs tracking-wider uppercase font-semibold">
                    <th className="py-4 pr-4">Option / Service</th>
                    <th className="py-4 px-4 bg-[#FCFBF9]/40">FREE</th>
                    <th className="py-4 px-4 text-[#C9A07E]">PRO</th>
                    <th className="py-4 pl-4">MAX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE4D8]/40">
                  <tr>
                    <td className="py-4 pr-4 font-medium">Tarif Mensuel</td>
                    <td className="py-4 px-4 font-serif font-bold text-base">0 DT</td>
                    <td className="py-4 px-4 font-serif font-bold text-base text-[#C9A07E]">19 DT</td>
                    <td className="py-4 pl-4 font-serif font-bold text-base">49 DT</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4 text-[#5A4A3D]/80">Limite d'articles</td>
                    <td className="py-4 px-4 text-xs font-semibold">8 max</td>
                    <td className="py-4 px-4 text-xs font-semibold text-[#C9A07E]">Illimité</td>
                    <td className="py-4 pl-4 text-xs font-semibold">Illimité</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4 text-[#5A4A3D]/80">Commandes à table & Caisse</td>
                    <td className="py-4 px-4"><X className="w-4 h-4 text-red-400" /></td>
                    <td className="py-4 px-4"><Check className="w-4 h-4 text-green-500" /></td>
                    <td className="py-4 pl-4"><Check className="w-4 h-4 text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4 text-[#5A4A3D]/80">Favicon, Logo & Couleurs</td>
                    <td className="py-4 px-4"><X className="w-4 h-4 text-red-400" /></td>
                    <td className="py-4 px-4"><Check className="w-4 h-4 text-green-500" /></td>
                    <td className="py-4 pl-4"><Check className="w-4 h-4 text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4 text-[#5A4A3D]/80">Retrait du filigrane Menux</td>
                    <td className="py-4 px-4"><X className="w-4 h-4 text-red-400" /></td>
                    <td className="py-4 px-4"><Check className="w-4 h-4 text-green-500" /></td>
                    <td className="py-4 pl-4">White label complet</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4 text-[#5A4A3D]/80">CSS sur-mesure & Image de couverture</td>
                    <td className="py-4 px-4"><X className="w-4 h-4 text-red-400" /></td>
                    <td className="py-4 px-4"><X className="w-4 h-4 text-red-400" /></td>
                    <td className="py-4 pl-4"><Check className="w-4 h-4 text-green-500" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Contact Support Area */}
          <div className="bg-[#EFE4D8]/30 rounded-3xl p-8 text-center space-y-4">
            <h3 className="font-serif text-xl font-bold">Des questions sur nos abonnements ?</h3>
            <p className="text-sm text-[#5A4A3D] font-light max-w-md mx-auto">
              Notre équipe d'assistance tunisienne est disponible pour vous conseiller et vous accompagner dans l'installation de votre QR code.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
              <a
                href="https://wa.me/21656110674?text=Bonjour%20MenuxPro!%20Je%20souhaite%20plus%20d'informations%20sur%20les%20abonnements"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-5 py-3 rounded-full text-sm font-medium shadow-md transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Contacter sur WhatsApp</span>
              </a>
              <span className="text-xs text-[#5A4A3D]/50">ou par mail à</span>
              <a 
                href="mailto:contact@menuxpro.com" 
                className="text-sm font-semibold hover:underline text-[#3A322D]"
              >
                contact@menuxpro.com
              </a>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
