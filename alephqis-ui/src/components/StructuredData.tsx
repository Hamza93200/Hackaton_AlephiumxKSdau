import { useEffect } from 'react';

interface StructuredDataProps {
  type: 'organization' | 'website' | 'financialService' | 'contactPage' | 'breadcrumb' | 'faq';
  data?: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    let schema: any = {};

    switch (type) {
      case 'organization':
        schema = {
          '@context': 'https://schema.org',
          '@type': 'FinancialService',
          name: 'Aleph QIS',
          alternateName: 'Aleph QIS Quantitative Investment Strategies',
          legalName: 'Aleph QIS',
          description: 'Institutional-grade quantitative investment firm specializing in digital asset strategies and algorithmic trading.',
          url: window.location.origin,
          logo: {
            '@type': 'ImageObject',
            url: `${window.location.origin}/logo.png`,
            width: '600',
            height: '60',
          },
          image: {
            '@type': 'ImageObject',
            url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=630&fit=crop',
            width: '1200',
            height: '630',
          },
          sameAs: [
            'https://twitter.com/alephqis',
            'https://linkedin.com/company/alephqis',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: 'contact@alephqis.com',
            availableLanguage: ['English', 'French'],
            areaServed: 'Worldwide',
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: '10 Rue de la Paix',
            addressLocality: 'Paris',
            addressRegion: 'Île-de-France',
            postalCode: '75002',
            addressCountry: 'FR',
          },
          serviceType: [
            'Quantitative Investment Management',
            'Digital Asset Trading',
            'Algorithmic Trading Strategies',
            'Institutional Cryptocurrency Investment',
          ],
          areaServed: {
            '@type': 'Place',
            name: 'Worldwide',
          },
          knowsAbout: [
            'Quantitative Finance',
            'Digital Assets',
            'Cryptocurrency',
            'Algorithmic Trading',
            'Risk Management',
            'Portfolio Optimization',
            'Blockchain Technology',
            'DeFi',
          ],
          slogan: 'Quantitative Investment Strategies for Digital Assets',
        };
        break;

      case 'website':
        schema = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Aleph QIS',
          url: window.location.origin,
          description: 'Quantitative investment strategies for digital assets. Institutional-grade trading solutions for TradFi and Web3.',
          publisher: {
            '@type': 'Organization',
            name: 'BitQIS',
            logo: {
              '@type': 'ImageObject',
              url: `${window.location.origin}/logo.png`,
            },
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}?s={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        };
        break;

      case 'financialService':
        schema = {
          '@context': 'https://schema.org',
          '@type': 'Service',
          serviceType: 'Quantitative Investment Management',
          provider: {
            '@type': 'FinancialService',
            name: 'BitQIS',
          },
          description: 'Sophisticated quantitative investment strategies for digital assets, including algorithmic trading, risk management, and portfolio optimization.',
          areaServed: 'Worldwide',
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Investment Services',
            itemListElement: [
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: 'Quantitative Trading Strategies',
                  description: 'Data-driven algorithmic trading strategies for digital assets',
                },
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: 'Portfolio Management',
                  description: 'Institutional-grade portfolio management and risk optimization',
                },
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: 'Market Making',
                  description: 'Liquidity provision and market making services',
                },
              },
            ],
          },
        };
        break;

      case 'contactPage':
        schema = {
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact BitQIS',
          description: 'Get in touch with BitQIS for institutional-grade digital asset investment strategies.',
          url: `${window.location.origin}/contact`,
          mainEntity: {
            '@type': 'Organization',
            name: 'BitQIS',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              email: 'contact@bitqis.com',
            },
          },
        };
        break;

      case 'breadcrumb':
        schema = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data?.items || [],
        };
        break;

      case 'faq':
        schema = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data?.questions || [],
        };
        break;
    }

    // Create or update script tag
    const scriptId = `structured-data-${type}`;
    let scriptTag = document.getElementById(scriptId);

    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    scriptTag.textContent = JSON.stringify(schema);

    return () => {
      // Cleanup on unmount
      const tag = document.getElementById(scriptId);
      if (tag) {
        tag.remove();
      }
    };
  }, [type, data]);

  return null;
}
