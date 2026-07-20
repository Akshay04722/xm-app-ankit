import { getRequestConfig, GetRequestConfigParams } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import client from 'src/lib/sitecore-client';

export default getRequestConfig(async ({ requestLocale }: GetRequestConfigParams) => {
  const requested = await requestLocale;
  const [parsedSite, parsedLocale] = requested?.split('_') || [];
  const locale = hasLocale(routing.locales, parsedLocale) ? parsedLocale : routing.defaultLocale;

  const defaultSite = process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME || 'akshayxmc';
  const site = parsedSite || defaultSite;

  let dictionary = {};
  try {
    dictionary = await client.getDictionary({
      locale,
      site,
    });
  } catch (err) {
    console.error(`Failed to fetch Sitecore dictionary for site ${site}:`, err);
  }

  const messages: Record<string, object> = {};
  messages[site] = dictionary;
  if (site !== defaultSite) {
    messages[defaultSite] = dictionary;
  }

  return {
    locale,
    messages,
  };
});
