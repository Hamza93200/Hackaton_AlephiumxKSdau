import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  Menu,
  Lock,
  Target,
  Repeat,
  Eye,
  Coins,
} from 'lucide-react';

import HeroIntro from '../components/hero/HeroIntro';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { SEOHead } from '../components/SEOHead';
import { StructuredData } from '../components/StructuredData';

interface HomePageProps {
  onNavigateContact: () => void;
  onNavigateLogin: () => void;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  userEmail?: string;
  onNavigateDashboard?: () => void;
  onNavigateAdminDashboard?: () => void;
  onLogout?: () => void;
}

export function HomePage({ 
  onNavigateContact, 
  onNavigateLogin,
  isAuthenticated = false,
  isAdmin = false,
  userEmail = '',
  onNavigateDashboard,
  onNavigateAdminDashboard,
  onLogout,
}: HomePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const titleOpacity = useTransform(heroProgress, [0, 0.35, 0.7], [1, 1, 0.85]);
  const titleY = useTransform(heroProgress, [0, 0.6], [0, -8]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleContactClick = () => {
    setMobileMenuOpen(false);
    onNavigateContact();
  };

  return (
    <>
      <SEOHead
        title="Aleph QIS - Institutional Quantitative Investment Strategies for Digital Assets"
        description="Aleph QIS provides institutional-grade quantitative investment strategies for digital assets. Sophisticated algorithmic trading, risk management, and portfolio optimization for TradFi and Web3 organizations."
        keywords="quantitative investment, digital assets, cryptocurrency trading, institutional crypto, algorithmic trading, bitcoin investment, ethereum trading, DeFi strategies, crypto hedge fund, quantitative strategies, institutional digital assets, crypto portfolio management"
        canonical={typeof window !== 'undefined' ? window.location.origin : undefined}
        noindex={false}
      />
      <StructuredData type="organization" />
      <StructuredData type="website" />
      <StructuredData type="financialService" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            className="flex items-center gap-2 text-left"
            onClick={scrollToTop}
            aria-label="Go to homepage"
          >
            <Logo className="text-primary" />
          </button>

          <div className="hidden items-center gap-10 md:flex">
            <button
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
              onClick={() => scrollToSection('services')}
            >
              Services
            </button>
            <button
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
              onClick={() => scrollToSection('about')}
            >
              Who We Serve
            </button>
            <button
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
              onClick={handleContactClick}
            >
              Contact
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground hidden lg:inline">
                  {userEmail}
                </span>
                <Button 
                  size="sm" 
                  className="bg-foreground hover:bg-foreground/90"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (isAdmin) {
                      onNavigateAdminDashboard?.();
                    } else {
                      onNavigateDashboard?.();
                    }
                  }}
                >
                  <span className="gradient-blue-purple inline-flex items-center">
                    {isAdmin ? 'Admin' : 'Dashboard'}
                  </span>
                </Button>
                <button
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout?.();
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Button 
                size="sm" 
                className="bg-foreground hover:bg-foreground/90"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateLogin();
                }}
              >
                <span className="gradient-blue-purple inline-flex items-center">Login</span>
              </Button>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen((prev) => !prev)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-border bg-white px-6 pb-6"
          >
            <div className="flex flex-col gap-4 pt-4">
              <button className="text-left text-sm text-muted-foreground hover:text-primary" onClick={() => scrollToSection('services')}>
                Services
              </button>
              <button className="text-left text-sm text-muted-foreground hover:text-primary" onClick={() => scrollToSection('about')}>
                Who We Serve
              </button>
              <button className="text-left text-sm text-muted-foreground hover:text-primary" onClick={handleContactClick}>
                Contact
              </button>
              {isAuthenticated ? (
                <div className="flex flex-col gap-3 pt-2 border-t border-border mt-2">
                  <div className="text-xs text-muted-foreground">
                    Signed in as: {userEmail}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-foreground hover:bg-foreground/90"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (isAdmin) {
                        onNavigateAdminDashboard?.();
                      } else {
                        onNavigateDashboard?.();
                      }
                    }}
                  >
                    <span className="gradient-blue-purple inline-flex items-center">
                      {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
                    </span>
                  </Button>
                  <button 
                    className="text-sm text-muted-foreground hover:text-primary text-center"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout?.();
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  className="bg-foreground hover:bg-foreground/90"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateLogin();
                  }}
                >
                  <span className="gradient-blue-purple inline-flex items-center">Login</span>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero with animated canvas */}
      <section
        id="top"
        ref={heroRef}
        className="relative flex items-center justify-center overflow-hidden px-6 pt-24 pb-32 bg-background"
        style={{ minHeight: '100vh' }}
      >
        <HeroIntro progress={heroProgress} className="z-0" />
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '40px' }}>
          <motion.div
            style={{ opacity: titleOpacity, y: titleY }}
            className="relative z-10 mx-auto max-w-5xl text-center"
          >
            <h1 className="text-4xl leading-tight md:text-5xl text-foreground" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
              Quantitative Investment
              <br />
              Strategies for <span className="gradient-blue-purple">Digital Assets</span>
            </h1>
            <div className="mt-8 flex items-center justify-center">
              <Button size="default" onClick={() => scrollToSection('services')} className="group px-6 py-5 bg-foreground hover:bg-foreground/90">
                <span className="gradient-blue-purple inline-flex items-center">Get Started</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 text-primary" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="relative overflow-hidden">
        {/* Services */}
        <section id="services" className="relative bg-background pt-16 pb-32 px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-12">
            <div className="mx-auto max-w-3xl text-center">
              <motion.h2
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                viewport={{ once: false, margin: '0px' }}
                className="text-3xl md:text-4xl gradient-blue-purple"
                style={{ fontWeight: 600, letterSpacing: '-0.02em' }}
              >
                Our Services
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: false, margin: '-120px' }}
                className="mt-5 text-base text-muted-foreground"
              >
                We combine systematic strategies with operational tooling, so your team can deploy capital with confidence from day one.
              </motion.p>
            </div>

            <div className="space-y-2 mt-8">
              {[
                {
                  title: 'Quantitative Strategies',
                  description: 'Tail hedging and Investment systematic strategies meeting client needs and technical excellence. We provide rigorous backtests and quantitative analysis of our strategies',
                },
                {
                  title: 'Risk & Governance',
                  description: 'Audited custody, segregated accounts, and on-chain visibility with rigorous risk frameworks.',
                },
                {
                  title: 'Tokenized Infrastructure',
                  description: 'Compliant wrappers that automate issuance, NAV publication, reporting, and investor operations.',
                },
              ].map((service, index) => {
                const serviceRef = useRef<HTMLDivElement>(null);
                const { scrollYProgress } = useScroll({
                  target: serviceRef,
                  offset: ['start 0.65', 'start 0.35'],
                });

                return (
                  <div key={service.title} ref={serviceRef} className="relative">
                    <motion.div
                      className="relative overflow-hidden border-l-2 bg-white transition-colors duration-300"
                      style={{
                        borderLeftColor: useTransform(
                          scrollYProgress,
                          [0, 0.5, 1],
                          ['rgba(209, 213, 219, 1)', 'rgba(65, 105, 225, 0.5)', 'rgba(139, 92, 246, 0.8)']
                        ),
                      }}
                    >
                      <motion.div
                        style={{
                          minHeight: useTransform(scrollYProgress, (value) => {
                            const heightValue = 64 + (value * 100);
                            return `${heightValue}px`;
                          }),
                        }}
                        className="px-6 py-5"
                      >
                        {/* Title - always visible */}
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              opacity: useTransform(scrollYProgress, [0, 0.3], [0.3, 1]),
                              scale: useTransform(scrollYProgress, [0, 0.5], [0.5, 1]),
                              background: 'linear-gradient(135deg, #4169e1 0%, #8b5cf6 100%)',
                            }}
                          />
                          <h3 className="text-lg" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                            {service.title}
                          </h3>
                        </div>

                        {/* Description - revealed on scroll */}
                        <motion.div
                          style={{
                            opacity: useTransform(scrollYProgress, [0.2, 0.6], [0, 1]),
                            maxHeight: useTransform(scrollYProgress, (value) => {
                              return value > 0.3 ? '500px' : '0px';
                            }),
                          }}
                          className="overflow-hidden transition-all duration-300"
                        >
                          <p className="text-sm leading-relaxed text-muted-foreground mt-3 pl-5">
                            {service.description}
                          </p>
                        </motion.div>
                      </motion.div>

                      {/* Bottom border indicator */}
                      <motion.div
                        style={{
                          scaleX: useTransform(scrollYProgress, [0.4, 1], [0, 1]),
                          opacity: useTransform(scrollYProgress, [0.4, 0.6], [0, 1]),
                        }}
                        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-primary to-purple-600 origin-left"
                      />
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Approach */}
        <section id="approach" className="relative pt-24 pb-44 px-6 bg-gradient-to-b from-white to-background">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              viewport={{ once: false, margin: '0px' }}
              className="text-center mb-32"
            >
              <h2 className="text-3xl md:text-4xl mb-5 gradient-blue-purple" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                Our Approach
              </h2>
              <p className="text-base text-muted-foreground max-w-3xl mx-auto">
                Aleph QIS combines systematic research with tokenized infrastructure to deliver institutional-grade strategies in a fully compliant wrapper.
              </p>
            </motion.div>

            <div className="space-y-32">
              {[
                {
                  icon: Lock,
                  title: 'Institutional access to digital strategies',
                  line1: 'Aleph QIS makes sophisticated digital asset strategies accessible through a single, compliant infrastructure.',
                  line2: 'Institutions can invest in crypto as easily as in traditional markets without building new systems.',
                },
                {
                  icon: Target,
                  title: 'Simple exposure, engineered outcomes',
                  line1: 'Each Aleph QIS product delivers targeted exposure, growth, yield, or protection,',
                  line2: 'built from quantitative research and structured for predictable performance.',
                },
                {
                  icon: Coins,
                  title: 'Tokenized investment infrastructure',
                  line1: 'Our strategies are delivered as on-chain tokens representing daily net asset values,',
                  line2: 'bringing real-time transparency, auditability, and efficiency to institutional investing.',
                },
                {
                  icon: Repeat,
                  title: 'Seamless operations, full control',
                  line1: 'Investors subscribe and redeem directly at net asset value,',
                  line2: 'while we handle execution, custody, and reporting behind the scenes.',
                },
                {
                  icon: Eye,
                  title: 'Transparency you can trust',
                  line1: 'Daily valuations, strategy data, and performance metrics are published on-chain,',
                  line2: 'combining the openness of blockchain with institutional-grade governance.',
                },
              ].map((item, index) => {
                const isEven = index % 2 === 0;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: false, margin: '-100px' }}
                    className="relative"
                  >
                    <div className={`grid md:grid-cols-2 gap-20 items-center ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                      <motion.div
                        initial={{ opacity: 0, x: isEven ? -80 : 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                        viewport={{ once: false, margin: '-100px' }}
                        className={`${!isEven ? 'md:order-2' : ''} ${isEven ? 'md:pl-8' : 'md:pr-8'}`}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="flex-shrink-0 w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center">
                            <item.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                        </div>
                        <h3 className="text-xl md:text-2xl mb-4" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{item.line1}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.line2}</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: isEven ? 80 : -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                        viewport={{ once: false, margin: '-100px' }}
                        className={`relative h-[350px] ${!isEven ? 'md:order-1' : ''}`}
                      >
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="relative w-full max-w-sm aspect-square">
                            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-4 p-8">
                              {[...Array(16)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  whileInView={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.6, delay: i * 0.025 }}
                                  viewport={{ once: false }}
                                  className="border border-primary/20 rounded-xl bg-primary/5"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="relative bg-background px-6 pt-20 pb-32" id="about">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              viewport={{ once: true, margin: '0px' }}
              className="mx-auto max-w-3xl text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl gradient-blue-purple" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                Who We Serve
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                A single platform connecting allocators with institutional digital asset strategies.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* TradFi Investors Column */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true, margin: '-100px' }}
                className="space-y-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-gradient-to-br from-primary/5 to-purple-600/5 border border-primary/20 rounded-2xl p-8 relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-600/10"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="relative z-10">
                    <h3 className="text-2xl gradient-blue-purple mb-3" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                      TradFi Investors
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Traditional financial institutions seeking institutional-grade digital asset exposure through compliant, battle-tested infrastructure.
                    </p>
                  </div>
                </motion.div>

                <div className="space-y-4">
                  {[
                    {
                      title: 'Institutional Investors',
                      description: 'Access tailored quantitative strategies through seamless infrastructure with institutional-grade risk management and compliance.',
                    },
                    {
                      title: 'Family Offices',
                      description: 'Achieve sophisticated crypto exposure with full transparency, risk control, and dedicated support for family office requirements.',
                    },
                    {
                      title: 'Funds & Asset Managers',
                      description: 'White-label our indices or integrate them into existing portfolios with seamless execution and daily reporting.',
                    },
                    {
                      title: 'High Net Worth Individuals',
                      description: 'Institutional-grade strategies designed for sophisticated investors with comprehensive risk management and performance monitoring.',
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true, margin: '-50px' }}
                      whileHover={{ 
                        x: 8,
                        boxShadow: "0 10px 30px -10px rgba(65, 105, 225, 0.2)",
                      }}
                      className="bg-white border border-border rounded-xl p-6 cursor-pointer relative group"
                    >
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-purple-600 rounded-l-xl"
                        initial={{ scaleY: 0 }}
                        whileHover={{ scaleY: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="relative z-10">
                        <motion.h4 
                          className="text-lg gradient-blue-purple mb-2 flex items-center gap-2" 
                          style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
                        >
                          <motion.span
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.2, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            className="inline-block"
                          >
                            •
                          </motion.span>
                          {item.title}
                        </motion.h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Web3 Users Column */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                viewport={{ once: true, margin: '-100px' }}
                className="space-y-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-gradient-to-br from-purple-600/5 to-primary/5 border border-purple-600/20 rounded-2xl p-8 relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-primary/10"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="relative z-10">
                    <h3 className="text-2xl gradient-blue-purple mb-3" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                      Web3 Users
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Crypto-native users and organizations seeking sophisticated quantitative strategies accessible directly through their wallets.
                    </p>
                  </div>
                </motion.div>

                <div className="space-y-4">
                  {[
                    {
                      title: 'Crypto Corporates',
                      description: 'Deploy treasury capital efficiently with instant, compliant access to institutional-grade strategies and on-chain transparency.',
                    },
                    {
                      title: 'Web3 High Net Worth',
                      description: 'Access sophisticated strategies directly through your crypto wallet with full transparency and daily NAV updates.',
                    },
                    {
                      title: 'DAOs & Protocols',
                      description: 'Manage treasury assets with institutional-grade quantitative strategies, on-chain transparency, and governance compatibility.',
                    },
                    {
                      title: 'Crypto Platforms & Exchanges',
                      description: 'Offer digital asset investment products to your users with white-label solutions and seamless API integration.',
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true, margin: '-50px' }}
                      whileHover={{ 
                        x: -8,
                        boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.2)",
                      }}
                      className="bg-white border border-border rounded-xl p-6 cursor-pointer relative group"
                    >
                      <motion.div
                        className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-primary rounded-r-xl"
                        initial={{ scaleY: 0 }}
                        whileHover={{ scaleY: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="relative z-10">
                        <motion.h4 
                          className="text-lg gradient-blue-purple mb-2 flex items-center gap-2" 
                          style={{ fontWeight: 600, letterSpacing: '-0.01em' }}
                        >
                          <motion.span
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.2, rotate: -5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            className="inline-block"
                          >
                            •
                          </motion.span>
                          {item.title}
                        </motion.h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="relative bg-background border-t border-border pt-20 pb-16 px-6">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              viewport={{ once: true, margin: '0px' }}
              className="text-center"
            >
              <h3 className="text-lg mb-4 gradient-blue-purple" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                Important Information
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Investment in digital assets and quantitative strategies involves substantial risk and is not suitable for all investors. 
                  Past performance is not indicative of future results. The value of investments can go down as well as up, and you may lose 
                  some or all of your invested capital.
                </p>
                <p>
                  Digital asset markets are highly volatile and subject to regulatory, technological, and market risks. BitQIS strategies 
                  may use leverage, derivatives, and complex trading techniques that can amplify both gains and losses. Before investing, 
                  carefully consider your financial situation, investment objectives, and risk tolerance.
                </p>
                <p>
                  This website does not constitute an offer to sell or a solicitation of an offer to buy any securities or investment products. 
                  All information provided is for informational purposes only and should not be construed as investment advice. Please consult 
                  with qualified financial, legal, and tax advisors before making any investment decisions.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer / Watermark */}
        <section className="relative overflow-hidden bg-white pt-20 pb-32 md:pt-24 md:pb-48">
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            {/* Footer intro */}
            <div className="mb-8 text-center">
              <p className="text-base text-muted-foreground" style={{ fontWeight: 500, letterSpacing: '-0.01em' }}>
                Infrastructure that powers institutional crypto programs
              </p>
            </div>

            {/* Copyright + links */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground mb-16">
              <p>Copyright © 2025 BitQIS</p>
              <div className="flex items-center gap-6">
                <button className="hover:text-primary transition-colors">Terms and Conditions</button>
                <button className="hover:text-primary transition-colors">Privacy Policy</button>
                <button className="hover:text-primary transition-colors">MSA</button>
              </div>
            </div>
          </div>

          {/* Large watermark fade */}
          <div className="pointer-events-none select-none absolute bottom-0 left-0 right-0 flex items-end justify-center pb-8">
            <div
              style={{ fontSize: '18vw', fontWeight: 800, opacity: 0.025, letterSpacing: '-0.03em', lineHeight: 1 }}
            >
              <span className="text-foreground">Bit</span><span className="text-primary">QIS</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
