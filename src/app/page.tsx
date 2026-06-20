'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  QrCode, 
  Menu as MenuIcon, 
  ShoppingCart, 
  CheckCircle, 
  XCircle,
  Star,
  ArrowRight,
  MessageCircle,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 md:px-16 py-4 bg-[#FDF8F3] border-b border-[#E8E2DA] shadow-[0px_10px_30px_rgba(58,50,45,0.05)]">
        <div className="flex items-center gap-2">
          <span className="font-display text-headline-md font-bold text-primary">Menux</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <Link href="#features" className="text-primary font-semibold hover:text-primary/80 transition-colors pb-1">
            Découvrir
          </Link>
          <Link href="/pricing" className="text-primary font-semibold hover:text-[#C9A07E] transition-colors pb-1">
            Tarifs
          </Link>
        </div>
        <Button asChild className="bg-primary text-on-primary hover:opacity-90">
          <Link href="/login">Voir une démo</Link>
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="w-full px-6 sm:px-8 lg:px-12 pt-40 pb-32 overflow-hidden">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-16">
            {/* Text Content */}
            <div className="w-full min-w-0" style={{ maxWidth: '48rem' }}>
              <h1 className="font-display text-display-xl text-primary leading-tight" style={{ maxWidth: '56rem' }}>
                Le menu digital <br/>
                <span className="italic font-normal">nouvelle génération.</span>
              </h1>
              <p className="mt-6 w-full whitespace-normal break-normal text-lg md:text-xl leading-8 text-on-surface-variant" style={{ maxWidth: '48rem', overflowWrap: 'normal' }}>
                QR menus and table ordering designed for modern cafés and restaurants. 
                L&apos;élégance du papier, la puissance du digital.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Button asChild size="lg" className="bg-primary text-on-primary luxury-shadow hover:opacity-90">
                  <Link href="/login?signup=true">Get Started Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-outline hover:bg-surface-container-low">
                  <Link href="/r/demo">Voir une démo</Link>
                </Button>
              </div>
            </div>
            
            {/* Image Content */}
            <div className="w-full min-w-[360px] relative mt-12 lg:mt-0">
              <div className="rounded-xl overflow-hidden luxury-shadow relative aspect-square bg-surface-container">
                <Image
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=800&fit=crop"
                  alt="Premium café interior"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Mobile Mockup */}
                <div className="absolute -bottom-10 right-8 w-48 h-96 bg-primary rounded-[2.5rem] border-[6px] border-primary-container luxury-shadow hidden lg:block overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=800&fit=crop"
                    alt="Menu app on phone"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Comparison */}
      <section className="bg-surface-container-low py-32 px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-headline-md text-primary mb-4">
              Redéfinissez l&apos;expérience client
            </h2>
            <p className="font-body-md text-on-surface-variant">
              L&apos;efficacité opérationnelle sans compromis sur le prestige.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="bg-white p-12 rounded-lg border border-outline-variant flex flex-col gap-6">
              <span className="font-label-sm text-error uppercase tracking-widest">Avant Menux</span>
              <h3 className="font-display text-title-sm text-primary">Le chaos invisible</h3>
              <ul className="flex flex-col gap-4">
                {[
                  'Temps d\'attente prolongé pour la carte',
                  'Menus papier usés ou obsolètes',
                  'Erreurs de saisie et oublis de commande'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-on-surface-variant">
                    <XCircle className="w-5 h-5 text-error shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* After */}
            <div className="bg-primary text-on-primary p-12 rounded-lg luxury-shadow flex flex-col gap-6">
              <span className="font-label-sm text-secondary-fixed uppercase tracking-widest">Avec Menux</span>
              <h3 className="font-display text-title-sm text-surface-container-lowest">La fluidité absolue</h3>
              <ul className="flex flex-col gap-4">
                {[
                  'Accès instantané via QR Code élégant',
                  'Mise à jour des stocks en temps réel',
                  'Augmentation du panier moyen de 25%'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-primary-fixed">
                    <CheckCircle className="w-5 h-5 text-secondary-fixed shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-8 md:px-16 max-w-7xl mx-auto">
        <h2 className="font-display text-headline-md text-primary mb-16">
          Simplicité. Rapidité. Prestige.
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <QrCode className="w-8 h-8" />,
              title: '1. Scan QR',
              description: 'Un scan discret avec le smartphone. Pas d\'application à télécharger, juste une immersion immédiate.'
            },
            {
              icon: <MenuIcon className="w-8 h-8" />,
              title: '2. Choix fluide',
              description: 'Naviguez à travers un menu interactif haute définition, magnifiant chaque ingrédient et boisson.'
            },
            {
              icon: <ShoppingCart className="w-8 h-8" />,
              title: '3. Commande',
              description: 'Envoyez la commande directement en cuisine. Payez à table ou au comptoir en un instant.'
            }
          ].map((step, i) => (
            <div 
              key={i} 
              className="group bg-white p-10 rounded-lg border border-surface-container-high luxury-shadow flex flex-col gap-6 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
                {step.icon}
              </div>
              <div>
                <h3 className="font-display text-title-sm text-primary mb-4">{step.title}</h3>
                <p className="text-on-surface-variant">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="bg-primary py-32 px-8 md:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-16">
          <div className="text-center text-on-primary max-w-2xl">
            <h2 className="font-display text-headline-md mb-6">
              Un pilotage en toute sérénité.
            </h2>
            <p className="font-body-md text-primary-fixed opacity-80">
              Le tableau de bord Menux Pro offre une vue cristalline de votre salle. 
              Gérez vos tables d&apos;un simple geste.
            </p>
          </div>
          
          <div className="w-full bg-surface-container-lowest rounded-xl p-8 luxury-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <span className="font-display text-title-sm text-primary">Caisse / Dashboard</span>
                <div className="flex gap-2">
                  <span className="px-4 py-1 bg-secondary-container text-on-secondary-container text-label-sm rounded-full">
                    En direct
                  </span>
                </div>
              </div>
              <div className="text-primary font-display text-title-sm">14:32</div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: 'T-01', items: 3, total: '42,50 €', active: true },
                { name: 'T-02', active: false },
                { name: 'T-03', items: 1, total: '8,00 €', active: true },
                { name: 'T-04', active: false },
                { name: 'T-05', active: false },
                { name: 'T-06', items: 5, total: '112,00 €', active: true },
              ].map((table, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-lg p-4 flex flex-col justify-between ${
                    table.active 
                      ? 'bg-white border-2 border-secondary-fixed-dim luxury-shadow' 
                      : 'bg-surface-container-low border border-outline-variant'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-bold text-lg ${table.active ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {table.name}
                    </span>
                    {table.active && <span className="w-3 h-3 bg-secondary rounded-full" />}
                  </div>
                  {table.active ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-label-sm text-on-surface-variant">{table.items} Articles</span>
                      <span className="font-bold text-primary">{table.total}</span>
                    </div>
                  ) : (
                    <span className="text-label-sm text-outline italic">Libre</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 px-8 md:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-headline-md text-primary mb-4">
            Une solution sur mesure
          </h2>
          <p className="font-body-md text-on-surface-variant">
            S&apos;intègre parfaitement avec votre caisse existante.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* FREE Plan */}
          <div className="bg-white p-8 rounded-lg border border-surface-container-high luxury-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-display text-title-sm text-primary">FREE</h3>
                <p className="text-on-surface-variant text-xs mt-1">Menu digital standard.</p>
              </div>
              <span className="text-primary font-bold text-2xl">
                0 DT<span className="text-label-sm text-outline font-normal">/mois</span>
              </span>
            </div>
            <ul className="flex flex-col gap-4 mb-8 flex-grow text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C9A07E] shrink-0" />
                <span>Menu QR digital (consultation)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C9A07E] shrink-0" />
                <span>Jusqu'à 8 articles</span>
              </li>
              <li className="flex items-center gap-2 text-outline opacity-50">
                <XCircle className="w-4 h-4 text-outline shrink-0" />
                <span className="line-through">Sans filigrane</span>
              </li>
            </ul>
            <Button asChild variant="outline" className="w-full rounded-full mt-auto">
              <Link href="/login?signup=true">Commencer</Link>
            </Button>
          </div>
          
          {/* PRO Plan */}
          <div className="bg-primary text-on-primary p-8 rounded-lg luxury-shadow flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-secondary text-on-secondary text-[9px] px-3 py-1 rounded-full uppercase font-bold tracking-widest">
              Populaire
            </div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-display text-title-sm text-surface-container-lowest">PRO</h3>
                <p className="text-primary-fixed opacity-70 text-xs mt-1">Commandes à table en direct.</p>
              </div>
              <span className="text-secondary-fixed font-bold text-2xl">
                19 DT<span className="text-primary-fixed text-label-sm opacity-60 font-normal">/mois</span>
              </span>
            </div>
            <ul className="flex flex-col gap-4 mb-8 flex-grow text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary-fixed shrink-0" />
                <span>Articles & tables illimités</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary-fixed shrink-0" />
                <span>Sans filigrane Menux</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary-fixed shrink-0" />
                <span>Commandes à table en temps réel</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary-fixed shrink-0" />
                <span>Tableau de caisse direct</span>
              </li>
            </ul>
            <Button asChild className="w-full bg-secondary text-white rounded-full hover:opacity-90 mt-auto">
              <a href="https://wa.me/21656110674?text=Je%20voudrais%20le%20plan%20PRO%20MenuxPro">Activer PRO</a>
            </Button>
          </div>

          {/* MAX Plan */}
          <div className="bg-white p-8 rounded-lg border border-surface-container-high luxury-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-display text-title-sm text-primary">MAX</h3>
                <p className="text-on-surface-variant text-xs mt-1">White label & sur-mesure.</p>
              </div>
              <span className="text-primary font-bold text-2xl">
                49 DT<span className="text-label-sm text-outline font-normal">/mois</span>
              </span>
            </div>
            <ul className="flex flex-col gap-4 mb-8 flex-grow text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C9A07E] shrink-0" />
                <span>Tout le plan PRO inclus</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C9A07E] shrink-0" />
                <span>White label (sans marque Menux)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C9A07E] shrink-0" />
                <span>CSS custom & page couverture</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#C9A07E] shrink-0" />
                <span>Support prioritaire WhatsApp</span>
              </li>
            </ul>
            <Button asChild variant="outline" className="w-full rounded-full mt-auto">
              <a href="mailto:contact@menuxpro.com?subject=Demande%20Plan%20MAX%20MenuxPro">Contacter</a>
            </Button>
          </div>
        </div>
        
        {/* Testimonials Section */}
        <div className="my-24 border-t border-b border-outline-variant/30 py-24 bg-surface-container-low/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-headline-md text-primary mb-4">
                Ce que disent nos clients
              </h2>
              <p className="font-body-md text-on-surface-variant max-w-lg mx-auto">
                Découvrez comment MenuxPro simplifie la vie des cafés et salons de thé partout en Tunisie.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl border border-outline-variant/60 luxury-shadow flex flex-col justify-between">
                <p className="text-on-surface-variant italic font-light mb-6 text-sm">
                  "Nos clients commandent plus rapidement et le caissier stresse beaucoup moins. La rotation des tables a augmenté de manière significative."
                </p>
                <div>
                  <div className="font-semibold text-primary text-sm">Café El Menzah</div>
                  <div className="text-xs text-[#C9A07E]">Tunis</div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-outline-variant/60 luxury-shadow flex flex-col justify-between">
                <p className="text-on-surface-variant italic font-light mb-6 text-sm">
                  "Simple à installer en 10 minutes, parfait pour le rush du weekend. Le menu est magnifique sur mobile."
                </p>
                <div>
                  <div className="font-semibold text-primary text-sm">Salon de Thé Jasmina</div>
                  <div className="text-xs text-[#C9A07E]">Sfax</div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-outline-variant/60 luxury-shadow flex flex-col justify-between">
                <p className="text-on-surface-variant italic font-light mb-6 text-sm">
                  "Le QR code par table a complètement transformé nos opérations. Zéro erreur de commande et gain de temps incroyable pour nos serveurs."
                </p>
                <div>
                  <div className="font-semibold text-primary text-sm">Terrasse Bab Souika</div>
                  <div className="text-xs text-[#C9A07E]">Tunis</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-on-surface-variant italic">
          Note: Works with your existing caisse.
        </p>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-8 md:px-16 max-w-7xl mx-auto text-center">
        <div className="bg-surface-container-lowest p-16 rounded-xl luxury-shadow flex flex-col items-center gap-8">
          <h2 className="font-display text-headline-md text-primary">
            Transformez votre service avec Menux.
          </h2>
          <p className="font-body-lg text-on-surface-variant max-w-xl">
            Rejoignez les établissements les plus prestigieux qui font confiance à Menux 
            pour leur expérience digitale.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-primary text-on-primary rounded-full hover:opacity-90">
              <Link href="/login?signup=true">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-outline rounded-full">
              <Link href="/r/demo">Voir une démo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-8 md:px-16 max-w-7xl mx-auto bg-surface-container-low">
        <div className="text-center mb-12">
          <h2 className="font-display text-headline-md text-primary mb-4">
            Contactez-nous
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Notre équipe est disponible pour répondre à toutes vos questions.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* WhatsApp Contact */}
          <a 
            href="https://wa.me/21656110674" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group bg-white p-8 rounded-lg border border-surface-container-high luxury-shadow flex flex-col items-center gap-4 hover:-translate-y-1 transition-transform duration-300"
          >
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white">
              <MessageCircle className="w-7 h-7" />
            </div>
            <h3 className="font-display text-title-sm text-primary">WhatsApp</h3>
            <p className="text-on-surface-variant text-center">+216 56110674</p>
            <span className="text-secondary font-semibold group-hover:underline">Envoyer un message →</span>
          </a>
          
          {/* Email Contact */}
          <a 
            href="mailto:contact@menuxpro.com" 
            className="group bg-white p-8 rounded-lg border border-surface-container-high luxury-shadow flex flex-col items-center gap-4 hover:-translate-y-1 transition-transform duration-300"
          >
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-on-primary">
              <Mail className="w-7 h-7" />
            </div>
            <h3 className="font-display text-title-sm text-primary">Email</h3>
            <p className="text-on-surface-variant text-center">contact@menuxpro.com</p>
            <span className="text-secondary font-semibold group-hover:underline">Envoyer un email →</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto w-full px-8 md:px-16 py-16 flex flex-col md:flex-row justify-between items-start gap-8 max-w-7xl mx-auto bg-surface-container rounded-t-lg">
        <div className="flex flex-col gap-6 max-w-xs">
          <span className="font-display text-title-sm font-bold text-primary">Menux</span>
          <p className="font-body-md text-on-surface-variant">
            © {currentYear} Menux. L&apos;excellence opérationnelle pour la restauration.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-16">
          <div className="flex flex-col gap-4">
            <h4 className="font-label-sm text-primary uppercase tracking-widest mb-2">Navigation</h4>
            <Link href="#" className="text-on-surface-variant hover:text-secondary transition-colors">
              Produit
            </Link>
            <Link href="#" className="text-on-surface-variant hover:text-secondary transition-colors">
              Tarifs
            </Link>
            <Link href="#" className="text-on-surface-variant hover:text-secondary transition-colors">
              Contact
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-label-sm text-primary uppercase tracking-widest mb-2">Légal</h4>
            <Link href="#" className="text-on-surface-variant hover:text-secondary transition-colors">
              Mentions Légales
            </Link>
            <Link href="#" className="text-on-surface-variant hover:text-secondary transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/21656110674"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300"
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
