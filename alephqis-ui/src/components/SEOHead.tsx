import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

export function SEOHead({
  title = 'Aleph QIS - Quantitative Investment Strategies for Digital Assets',
  description = 'Aleph QIS is a leading quantitative investment firm specializing in institutional-grade digital asset strategies. We provide sophisticated trading solutions for TradFi institutions and Web3 native organizations.',
  keywords = 'quantitative investment, digital assets, cryptocurrency trading, institutional crypto, algorithmic trading, bitcoin investment, ethereum trading, DeFi strategies, crypto hedge fund, quantitative strategies',
  ogType = 'website',
  ogImage = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=630&fit=crop',
  canonical,
  noindex = false,
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.content = content;
    };

    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'Aleph QIS');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    updateMetaTag('application-name', 'Aleph QIS');
    updateMetaTag('theme-color', '#4169e1');
    updateMetaTag('mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    updateMetaTag('apple-mobile-web-app-title', 'Aleph QIS');
    updateMetaTag('format-detection', 'telephone=no');
    updateMetaTag('geo.region', 'FR');
    updateMetaTag('geo.placename', 'France');
    updateMetaTag('language', 'English');
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:image:alt', 'Aleph QIS - Institutional Digital Asset Investment', true);
    updateMetaTag('og:site_name', 'Aleph QIS', true);
    updateMetaTag('og:locale', 'en_US', true);
    
    if (canonical) {
      updateMetaTag('og:url', canonical, true);
    }

    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    updateMetaTag('twitter:site', '@alephqis');
    updateMetaTag('twitter:creator', '@alephqis');
    updateMetaTag('twitter:image:alt', 'Aleph QIS - Quantitative Investment Strategies for Digital Assets');

    const robotsValue = noindex 
      ? 'noindex, nofollow' 
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    
    updateMetaTag('robots', robotsValue);

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    }

    const updateFavicon = (rel: string, href: string, sizes?: string, type?: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!element) {
        element = document.createElement('link');
        element.rel = rel;
        document.head.appendChild(element);
      }
      
      element.href = href;
      if (sizes) element.setAttribute('sizes', sizes);
      if (type) element.type = type;
    };

    updateFavicon('icon', '/public/favicon.svg', undefined, 'image/svg+xml');
    updateFavicon('icon', '/public/favicon-32x32.svg', '32x32', 'image/svg+xml');
    updateFavicon('icon', '/public/favicon-16x16.svg', '16x16', 'image/svg+xml');
    updateFavicon('shortcut icon', '/public/favicon.svg');
    updateFavicon('apple-touch-icon', '/public/apple-touch-icon.svg', '180x180');

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/public/manifest.json';
      document.head.appendChild(manifestLink);
    }

    document.documentElement.lang = 'en';
  }, [title, description, keywords, ogType, ogImage, canonical, noindex]);

  return null;
}
