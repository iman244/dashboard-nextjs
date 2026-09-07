import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fa'],
  defaultLocale: 'fa',

  /**
   * Persian is the product's language, so it is what everyone arrives in.
   *
   * `defineRouting` detects the locale from the `Accept-Language` header by
   * default, and `defaultLocale` only applies once detection finds nothing.
   * Since almost every browser announces `en-US`, that meant a first visit to
   * `/` redirected to `/en` and `defaultLocale: 'fa'` never got a say —
   * a Persian clinic's staff were being handed the English UI by their
   * browser's shipping default.
   *
   * English stays one click away: the switcher navigates to an explicit
   * `/en/...` URL and the locale is read from the pathname, which detection
   * has no part in. The trade is that the choice is not remembered — someone
   * who switches to English and later opens the bare domain arrives in
   * Persian again, which is the intended bias.
   */
  localeDetection: false
});
