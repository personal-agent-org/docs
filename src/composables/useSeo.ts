import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useMeta } from 'quasar';
import { useRoute } from 'vue-router';
import logoUrl from '../../docs/assets/mark.svg?url';

const origin = 'https://personal-agent.org';

function canonicalPath(path: string): string {
  return path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`;
}

export function useSeo(options: {
  title: MaybeRefOrGetter<string>;
  description: MaybeRefOrGetter<string>;
  localized?: boolean;
  structuredData?: Record<string, unknown>[];
}) {
  const route = useRoute();
  const canonical = computed(() => `${origin}${canonicalPath(route.path)}`);
  const englishPath = computed(() => route.path.replace(/^\/de(?=\/|$)/, '') || '/');
  const germanPath = computed(() => `/de${englishPath.value === '/' ? '' : englishPath.value}`);

  useMeta(() => {
    const title = toValue(options.title);
    const description = toValue(options.description);
    const locale = route.path === '/de' || route.path.startsWith('/de/') ? 'de' : 'en';
    const link: Record<string, Record<string, string>> = {
      canonical: { rel: 'canonical', href: canonical.value },
    };
    if (options.localized) {
      link.alternateEn = {
        rel: 'alternate',
        hreflang: 'en',
        href: `${origin}${canonicalPath(englishPath.value)}`,
      };
      link.alternateDe = {
        rel: 'alternate',
        hreflang: 'de',
        href: `${origin}${canonicalPath(germanPath.value)}`,
      };
      link.alternateDefault = {
        rel: 'alternate',
        hreflang: 'x-default',
        href: `${origin}${canonicalPath(englishPath.value)}`,
      };
    }
    return {
      title,
      htmlAttr: { lang: locale, dir: 'ltr' },
      meta: {
        description: { name: 'description', content: description },
        ogTitle: { property: 'og:title', content: title },
        ogDescription: { property: 'og:description', content: description },
        ogUrl: { property: 'og:url', content: canonical.value },
        ogLocale: { property: 'og:locale', content: locale === 'de' ? 'de_DE' : 'en_US' },
        ogImage: { property: 'og:image', content: `${origin}${logoUrl}` },
        twitterCard: { name: 'twitter:card', content: 'summary' },
        twitterTitle: { name: 'twitter:title', content: title },
        twitterDescription: { name: 'twitter:description', content: description },
        twitterImage: { name: 'twitter:image', content: `${origin}${logoUrl}` },
      },
      link,
      script: options.structuredData
        ? Object.fromEntries(
            options.structuredData.map((data, index) => [
              `structuredData${index}`,
              { type: 'application/ld+json', innerHTML: JSON.stringify(data) },
            ]),
          )
        : {},
    };
  });
}
