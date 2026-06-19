'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, ArrowRight, ArrowLeft, Check, CheckCircle2, QrCode, ClipboardList } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Step 1 State
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantType, setRestaurantType] = useState('Café');
  const [restaurantCity, setRestaurantCity] = useState('');

  // Step 2 State
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO' | 'MAX'>('PRO');

  // Step 3 State
  const [tableName, setTableName] = useState('T-01');
  const [tableError, setTableError] = useState('');

  const handleTableChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    setTableName(uppercaseVal);
    
    // Validation: only A-Z, 0-9 and hyphen
    const pattern = /^[A-Z0-9-]*$/;
    if (!pattern.test(uppercaseVal)) {
      setTableError('Caractères autorisés: A-Z, 0-9, et -');
    } else if (uppercaseVal.length > 10) {
      setTableError('Longueur max: 10 caractères');
    } else {
      setTableError('');
    }
  };

  const getSlug = () => {
    if (!restaurantName) return 'mon-cafe';
    return restaurantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
      .replace(/(^-|-$)+/g, ''); // Trim leading/trailing hyphens
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const steps = [
    { num: 1, label: 'Établissement' },
    { num: 2, label: 'Plan' },
    { num: 3, label: 'Première Table' },
    { num: 4, label: 'Prêt !' },
  ];

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#3A322D] flex flex-col justify-between font-sans selection:bg-[#C9A07E]/20 selection:text-[#3A322D]">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-[#EFE4D8]/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-[#3A322D] flex items-center justify-center font-serif text-sm font-semibold">
            M
          </div>
          <span className="font-serif font-bold text-lg tracking-wide">MenuxPro</span>
        </div>
        <div className="text-xs text-[#5A4A3D]/60">Assistant d'onboarding</div>
      </header>

      {/* Main Wizard Area */}
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-[#EFE4D8] shadow-luxury-soft p-8 md:p-10 transition-all duration-300">
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-10 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#EFE4D8] z-0" />
            <div 
              className="absolute top-1/2 left-0 h-[1.5px] bg-[#C9A07E] z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center z-10">
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 ${
                    step >= s.num 
                      ? 'bg-[#C9A07E] border-[#C9A07E] text-white' 
                      : 'bg-white border-[#EFE4D8] text-[#5A4A3D]/40'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-[10px] mt-2 font-medium tracking-wide transition-all ${
                  step >= s.num ? 'text-[#3A322D]' : 'text-[#5A4A3D]/40'
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1: Restaurant Info */}
          {step === 1 && (
            <div className="space-y-6 animate-scale-in">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold">Parlez-nous de votre établissement</h2>
                <p className="text-sm text-[#5A4A3D]/70 font-light">
                  Ces informations serviront à générer votre menu digital et personnaliser votre profil.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium tracking-wider uppercase text-[#3A322D]/70">
                    Nom de l'établissement *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Le Petit Café, Zina Coffee..."
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#EFE4D8] bg-[#FCFBF9] text-[#3A322D] placeholder-[#5A4A3D]/40 focus:outline-none focus:border-[#C9A07E] focus:ring-1 focus:ring-[#C9A07E] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium tracking-wider uppercase text-[#3A322D]/70">
                    Type d'établissement
                  </label>
                  <select
                    value={restaurantType}
                    onChange={(e) => setRestaurantType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#EFE4D8] bg-[#FCFBF9] text-[#3A322D] focus:outline-none focus:border-[#C9A07E] focus:ring-1 focus:ring-[#C9A07E] transition-all"
                  >
                    <option value="Café">Café / Salon de thé</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Fast food">Fast Food / Pizzeria</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium tracking-wider uppercase text-[#3A322D]/70">
                    Ville / Région
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Tunis, Sousse, Oued Ellil..."
                    value={restaurantCity}
                    onChange={(e) => setRestaurantCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#EFE4D8] bg-[#FCFBF9] text-[#3A322D] placeholder-[#5A4A3D]/40 focus:outline-none focus:border-[#C9A07E] focus:ring-1 focus:ring-[#C9A07E] transition-all"
                  />
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!restaurantName.trim()}
                className="w-full mt-6 bg-[#3A322D] hover:bg-[#2A221D] text-white disabled:opacity-40 disabled:pointer-events-none py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Choose Plan */}
          {step === 2 && (
            <div className="space-y-6 animate-scale-in">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold">Choisissez votre plan d'activation</h2>
                <p className="text-sm text-[#5A4A3D]/70 font-light">
                  Activez les fonctionnalités clés. Vous pouvez modifier votre formule à tout moment.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'FREE', title: 'Plan FREE', price: '0 DT/mois', desc: 'Menu digital standard, max 8 articles, filigrane.' },
                  { id: 'PRO', title: 'Plan PRO', price: '19 DT/mois', desc: 'Commandes à table, articles illimités, logo, sans filigrane.', isPopular: true },
                  { id: 'MAX', title: 'Plan MAX', price: '49 DT/mois', desc: 'White label complet, CSS sur-mesure, support prioritaire.' },
                ].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id as 'FREE' | 'PRO' | 'MAX')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between hover:border-[#C9A07E]/60 ${
                      selectedPlan === p.id 
                        ? 'border-[#C9A07E] bg-[#C9A07E]/5 ring-1 ring-[#C9A07E]' 
                        : 'border-[#EFE4D8] bg-[#FCFBF9]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-semibold flex items-center gap-2">
                        <span>{p.title}</span>
                        {p.isPopular && (
                          <span className="bg-[#C9A07E] text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Recommandé
                          </span>
                        )}
                      </div>
                      <span className="font-serif font-bold text-sm text-[#C9A07E]">{p.price}</span>
                    </div>
                    <p className="text-xs text-[#5A4A3D]/70 font-light mt-1">{p.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={prevStep}
                  className="flex-1 border border-[#EFE4D8] text-[#3A322D] hover:bg-[#3A322D]/5 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 bg-[#3A322D] hover:bg-[#2A221D] text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: First Table */}
          {step === 3 && (
            <div className="space-y-6 animate-scale-in">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold">Configurez votre première table</h2>
                <p className="text-sm text-[#5A4A3D]/70 font-light">
                  Chaque table dispose d'un identifiant et d'un QR code unique pour commander.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium tracking-wider uppercase text-[#3A322D]/70">
                    Identifiant de table (ex: T-01, Terrasse-5)
                  </label>
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => handleTableChange(e.target.value)}
                    placeholder="T-01"
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-xl border bg-[#FCFBF9] text-[#3A322D] focus:outline-none focus:ring-1 transition-all ${
                      tableError 
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400' 
                        : 'border-[#EFE4D8] focus:border-[#C9A07E] focus:ring-[#C9A07E]'
                    }`}
                  />
                  {tableError && <p className="text-xs text-red-500 mt-1">{tableError}</p>}
                </div>

                {/* Preview URL Pill */}
                <div className="p-4 rounded-2xl bg-[#FCFBF9] border border-[#EFE4D8] space-y-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#5A4A3D]/60 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Aperçu du lien QR table</span>
                  </div>
                  <div className="font-mono text-xs text-[#C9A07E] break-all">
                    https://menux.tn/r/{getSlug()}/t/{tableName || 'T-01'}
                  </div>
                  <p className="text-[10px] text-[#5A4A3D]/50 font-light leading-relaxed">
                    Le QR code à imprimer pour cette table sera généré automatiquement une fois l'onboarding terminé.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={prevStep}
                  className="flex-1 border border-[#EFE4D8] text-[#3A322D] hover:bg-[#3A322D]/5 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>
                <button
                  onClick={nextStep}
                  disabled={!!tableError || !tableName.trim()}
                  className="flex-1 bg-[#3A322D] hover:bg-[#2A221D] text-white disabled:opacity-40 disabled:pointer-events-none py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Terminer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success / Done */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-scale-in">
              <div className="py-6">
                <CheckCircle2 className="w-16 h-16 text-[#C9A07E] mx-auto animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold">Votre établissement est configuré ! 🎉</h2>
                <p className="text-sm text-[#5A4A3D]/70 font-light max-w-sm mx-auto">
                  Bienvenue chez MenuxPro. Vos accès administrateur, votre première table, et votre menu démo ont été créés avec succès.
                </p>
              </div>

              <div className="space-y-3 pt-4 max-w-sm mx-auto">
                <Link
                  href="/dashboard/menu"
                  className="w-full bg-[#3A322D] hover:bg-[#2A221D] text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Configurer votre menu</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="w-full border border-[#3A322D] text-[#3A322D] hover:bg-[#3A322D]/5 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Voir le tableau de bord</span>
                </Link>

                <Link
                  href="/r/demo"
                  className="w-full bg-[#EFE4D8]/30 hover:bg-[#EFE4D8]/50 text-[#3A322D] py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Coffee className="w-4 h-4" />
                  <span>Voir la démo ZinaCoffee</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#5A4A3D]/40 border-t border-[#EFE4D8]/60">
        © 2026 MenuxPro. Fièrement propulsé pour la restauration moderne en Tunisie.
      </footer>
    </div>
  );
}
