export interface ImageData {
  url: string;
  width?: number;
  height?: number;
  alt: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string | ImageData;
  type?: string;
  url?: string;
  siteName?: string;
  locale?: string;
  twitterHandle?: string;
  robots?: string;
  canonical?: string;
  structuredData?: object;
}

export const DEFAULT_SEO: Required<Pick<SEOData, 'title' | 'description' | 'siteName' | 'locale' | 'robots' | 'type' | 'url'>> &
  Pick<SEOData, 'keywords' | 'twitterHandle' | 'image'> = {
  title: 'Rotaract Club of Lilongwe Create Lasting Impact',
  description: 'Empowering young leaders and transforming communities in Lilongwe, Malawi. Join the Rotaract Club of Lilongwe in service, fellowship, and positive change.',
  keywords: [
    'Rotaract', 'Rotaract Club', 'Lilongwe', 'Malawi', 'Rotary International',
    'Youth Leadership', 'Community Service', 'Volunteer', 'Non-profit', 'District 9210',
    'Service Projects', 'Professional Development', 'International Service', 'Club Service', 'Community Development'
  ],
  image: {
    url: '/og-image.jpg?v=20260828',
    width: 1200,
    height: 630,
    alt: 'Rotaract Club of Lilongwe logo - Create Lasting Impact'
  },
  type: 'website',
  siteName: 'Rotaract Club of Lilongwe',
  locale: 'en_MW',
  twitterHandle: '@rotaractlilongwe',
  robots: 'index, follow',
  url: 'https://rotaractlilongwe.com/',
};

/**
 * Validates and normalizes a title/description pair for search engines.
 * - Title: truncated to 60 chars.
 * - Description: kept 150-160 chars (truncated if longer, warns if shorter).
 */
function validateSEO(title: string, description: string): { title: string; description: string } {
  let safeTitle = title;
  let safeDescription = description;

  if (!safeTitle || safeTitle.trim().length === 0) {
    console.warn('SEO warning: page title is empty, using default.');
    safeTitle = DEFAULT_SEO.title;
  } else if (safeTitle.length > 60) {
    safeTitle = safeTitle.substring(0, 57).trimEnd() + '...';
  }

  if (!safeDescription || safeDescription.trim().length === 0) {
    console.warn('SEO warning: page description is empty, using default.');
    safeDescription = DEFAULT_SEO.description;
  } else if (safeDescription.length > 160) {
    safeDescription = safeDescription.substring(0, 157).trimEnd() + '...';
  } else if (safeDescription.length < 150) {
    console.warn(`SEO warning: description is ${safeDescription.length} chars (<150 recommended).`);
  }

  return { title: safeTitle, description: safeDescription };
}

export function getOGImage(image: string | ImageData | undefined): ImageData {
  if (typeof image === 'string') {
    const fallback = DEFAULT_SEO.image as ImageData;
    return { url: image, width: fallback.width, height: fallback.height, alt: fallback.alt };
  }

  if (image && typeof image === 'object') {
    const width = image.width ?? (DEFAULT_SEO.image as ImageData).width;
    const height = image.height ?? (DEFAULT_SEO.image as ImageData).height;
    if (!width || !height) {
      console.warn('SEO warning: Open Graph image is missing width/height dimensions.');
    }
    return {
      url: image.url,
      width,
      height,
      alt: image.alt || (DEFAULT_SEO.image as ImageData).alt
    };
  }

  return DEFAULT_SEO.image as ImageData;
}

export function generateSEO(data: Partial<SEOData> = {}): SEOData {
  const merged: SEOData = { ...DEFAULT_SEO, ...data };

  const { title, description } = validateSEO(merged.title, merged.description);

  return {
    ...merged,
    title,
    description,
  };
}

export function generateStructuredData(seo: SEOData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seo.siteName,
    alternateName: 'Rotaract Lilongwe',
    description: seo.description,
    url: seo.url || 'https://rotaractlilongwe.com/',
    logo: typeof seo.image === 'string' ? seo.image : seo.image?.url,
    foundingDate: '2015-02-13',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Lilongwe',
      addressCountry: 'MW',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'lilongwerotaract@outlook.com',
      contactType: 'Customer Service',
    },
    sameAs: [
      'https://www.instagram.com/rotaractlilongwe/',
      'https://www.facebook.com/rotaractlilongwe',
      'https://x.com/RACLilongwe',
      'https://www.linkedin.com/company/rotaract-club-of-lilongwe/',
    ],
    memberOf: {
      '@type': 'Organization',
      name: 'Rotary International',
      url: 'https://www.rotary.org',
    },
  };
}

export function generateProjectStructuredData(project: {
  name: string;
  description: string;
  image?: string;
  date?: string;
  status?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Project',
    name: project.name,
    description: project.description,
    image: project.image,
    startDate: project.date,
    organizer: {
      '@type': 'Organization',
      name: 'Rotaract Club of Lilongwe',
    },
    eventStatus: project.status === 'Ongoing' ? 'EventScheduled' : 'EventCompleted',
  };
}

export function generateEventStructuredData(event: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  image?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate || event.startDate,
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Lilongwe',
        addressCountry: 'MW',
      },
    },
    image: event.image,
    organizer: {
      '@type': 'Organization',
      name: 'Rotaract Club of Lilongwe',
    },
  };
}

export function generateWebPageStructuredData(options: {
  title: string;
  description: string;
  url: string;
  isAccessibleForFree?: boolean;
  inLanguage?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': options.title,
    'description': options.description,
    'url': options.url,
    'isAccessibleForFree': options.isAccessibleForFree ?? true,
    'inLanguage': options.inLanguage ?? 'en-MW',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': options.url
    }
  };
}

export function generateBreadcrumbStructuredData(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      'item': item.url,
    })),
  };
}