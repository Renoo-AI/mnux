'use client';

import Link from 'next/link';
import { Check, X, ArrowLeft, Coffee, MessageCircle } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'FREE',
      price: '0',
      description: 'Pour démarrer et tester la plateforme gratuitement.',
      features: [
        { name: 'Menu QR digital', included: true },
        { name: 'Jusqu\'à 8 articles', included: true },
        { name: 'Slug aléatoire (/free-xxxxxx)', included: true },
        { name: 'Filigrane MenuxPro visible', included: true },
        { name: 'Menu consultation seulement', included: true },
        { name: 'Commandes à table en temps réel', included: false },
        { name: 'Personnalisation des couleurs & logo', included: false },
        { name: 'Support prioritaire WhatsApp', included: false },
      ],
      ctaText: 'Commencer gratuitement',
      ctaLink: '/login?signup=true',
      isPopular: false,
      style: 'border border-[#EFE4D8] bg-white text-[#3A322D]',
      buttonStyle: 'bg-transparent border border-[#3A322D] text-[#3A322D] hover:bg-[#3A322D]/5',
    },
    {
      name: 'PRO',
      price: '19',
      description: 'L\'expérience complète pour les cafés et restaurants.',
      features: [
        { name: 'Menu QR digital', included: true },
        { name: 'Articles illimités', included: true },
        { name: 'Slug personnalisé (/mon-cafe)', included: true },
        { name: 'Sans filigrane MenuxPro', included: true },
        { name: 'Commandes à table en temps réel', included: true },
        { name: 'Tableau de caisse & PINs staff', included: true },
        { name: 'Personnalisation des couleurs & logo', included: true },
        { name: 'Logs d\'activité complets', included: true },
      ],
      ctaText: 'Essayer PRO',
      ctaLink: 'https://wa.me/21656110674?text=Je%20voudrais%20le%20plan%20PRO%20MenuxPro',
      isPopular: true,
      style: 'border-2 border-[#C9A07E] bg-white text-[#3A322D] shadow-xl relative scale-105 z-10',
      buttonStyle: 'bg-[#C9A07E] text-white hover:bg-[#b08b6b]',
    },
    {
      name: 'MAX',
      price: '49',
      description: 'Pour les grands établissements exigeant du sur-mesure.',
      features: [
        { name: 'Tout le plan PRO inclus', included: true },
        { name: 'White label (sans aucune marque Menux)', included: true },
        { name: 'CSS personnalisé & Image de couverture', included: true },
        { name: 'Support prioritaire WhatsApp', included: true },
        { name: 'OG image & favicon personnalisées', included: true },
        { name: 'Multi-langue avancé', included: true },
        { name: 'Accès API & intégrations', included: true },
        { name: 'Accompagnement configuration', included: true },
      ],
      ctaText: 'Contacter l\'équipe',
      ctaLink: 'mailto:contact@menuxpro.com?subject=Demande%20Plan%20MAX%20MenuxPro',
      isPopular: false,
      style: 'bg-[#3A322D] text-[#FCFBF9] shadow-lg',
      buttonStyle: 'bg-[#FCFBF9] text-[#3A322D] hover:bg-[#EFE4D8]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#3A322D] font-sans selection:bg-[#C9A07E]/20 selection:text-[#3A322D]">
      {/* Navigation */}
      <header className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-[#EFE4D8]">
        <Link href="/" className="flex items-center gap-2 font-medium hover:text-[#C9A07E] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-[#3A322D] flex items-center justify-center font-serif text-sm font-semibold">
            M
          </div>
          <span className="font-serif font-bold text-lg tracking-wide">MenuxPro</span>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          Des tarifs simples, adaptés à votre rythme
        </h1>
        <p className="text-lg text-[#5A4A3D]/80 max-w-2xl mx-auto font-light leading-relaxed">
          Modernisez votre café ou restaurant tunisien. Améliorez le service client et augmentez la rotation des tables en quelques minutes.
        </p>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-4px] ${plan.style}`}
            >
              <div>
                {plan.isPopular && (
                  <span className="absolute top-0 right-1/2 translate-y-[-50%] translate-x-[50%] bg-[#C9A07E] text-white text-[11px] font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full shadow-md">
                    Le plus populaire ⭐
                  </span>
                )}
                
                <div className="mb-6">
                  <h3 className="font-serif text-2xl font-bold tracking-wide">{plan.name}</h3>
                  <p className={`text-sm mt-2 font-light ${plan.name === 'MAX' ? 'text-[#FCFBF9]/70' : 'text-[#5A4A3D]/70'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline mb-8">
                  <span className="font-serif text-5xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-xl font-medium ml-1">DT</span>
                  <span className={`text-sm ml-2 font-light ${plan.name === 'MAX' ? 'text-[#FCFBF9]/60' : 'text-[#5A4A3D]/60'}`}>
                    / mois
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-[#C9A07E] shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'opacity-90' : 'opacity-40 line-through'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.ctaLink}
                className={`w-full py-3.5 rounded-xl text-center font-medium transition-all duration-200 active:scale-[0.98] ${plan.buttonStyle}`}
              >
                {plan.ctaText}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Included Section */}
      <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#EFE4D8] text-center">
        <h4 className="font-serif text-xl font-bold mb-4">Inclus dans tous les plans</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[#5A4A3D]/80">
          <div className="p-4">
            <span className="font-semibold block text-[#3A322D] mb-1">Sécurité de niveau bancaire</span>
            Vos données de commande et d'accès sont cryptées et protégées 24/7.
          </div>
          <div className="p-4">
            <span className="font-semibold block text-[#3A322D] mb-1">Mises à jour gratuites</span>
            Profitez de toutes les nouvelles fonctionnalités et améliorations du système sans frais.
          </div>
          <div className="p-4">
            <span className="font-semibold block text-[#3A322D] mb-1">Support par e-mail</span>
            Une équipe dédiée répond à vos questions sous 24 heures ouvrées.
          </div>
        </div>
      </section>

      {/* WhatsApp Help */}
      <section className="bg-[#EFE4D8]/30 py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <Coffee className="w-8 h-8 mx-auto text-[#C9A07E] mb-4" />
          <h3 className="font-serif text-2xl font-bold mb-3">Besoin d'aide pour choisir ?</h3>
          <p className="text-[#5A4A3D] mb-6 font-light">
            Contactez notre équipe par WhatsApp pour poser vos questions, demander une démo gratuite ou personnaliser votre plan.
          </p>
          <a
            href="https://wa.me/21656110674?text=Bonjour%20MenuxPro!%20Je%20souhaite%20en%20savoir%20plus%20sur%20les%20tarifs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-6 py-3.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Discuter sur WhatsApp</span>
          </a>
        </div>
      </section>
    </div>
  );
}
