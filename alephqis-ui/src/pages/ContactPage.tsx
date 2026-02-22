import { motion } from 'motion/react';
import { ContactForm } from '../components/ContactForm';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { StructuredData } from '../components/StructuredData';

interface ContactPageProps {
  onNavigateHome: () => void;
}

export function ContactPage({ onNavigateHome }: ContactPageProps) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <SEOHead
        title="Contact Aleph QIS - Get in Touch with Our Investment Team"
        description="Contact Aleph QIS for institutional-grade digital asset investment strategies. Reach out to our quantitative investment team for TradFi and Web3 solutions."
        keywords="contact Aleph QIS, digital asset investment contact, institutional crypto contact, quantitative investment inquiry"
        canonical={typeof window !== 'undefined' ? `${window.location.origin}/contact` : undefined}
        noindex={false}
      />
      <StructuredData type="contactPage" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            className="flex items-center gap-2 text-left"
            onClick={onNavigateHome}
            aria-label="Go to homepage"
          >
            <Logo className="text-primary" />
          </button>

          <Button 
            size="sm" 
            variant="ghost"
            onClick={onNavigateHome}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Contact Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-32 pb-48 md:pt-40 md:pb-64 px-6 min-h-screen">
        <div className="relative z-10 mx-auto max-w-4xl mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl gradient-blue-purple mb-6" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ready to explore institutional-grade digital asset strategies? Reach out to our team and we'll get back to you shortly.
            </p>
          </motion.div>

          <ContactForm />
        </div>

        {/* Large watermark fade */}
        <div className="pointer-events-none select-none absolute bottom-0 left-0 right-0 flex items-end justify-center pb-16 md:pb-24">
          <div
            style={{ fontSize: '18vw', fontWeight: 800, opacity: 0.025, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            <span className="text-foreground">Aleph</span><span className="text-primary">QIS</span>
          </div>
        </div>
      </section>
    </div>
  );
}
