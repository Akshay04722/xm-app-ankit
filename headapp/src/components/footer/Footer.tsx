'use client';
import { useTranslations } from "next-intl";
import React, { JSX } from 'react';
import { ComponentProps } from 'lib/component-props';

type FooterProps = ComponentProps & {
  fields?: Record<string, unknown>;
};

export const Default = (props: FooterProps): JSX.Element => {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  const { params } = props;
  const styles = `footer ${params?.styles || ''}`.trim();
  const id = params?.RenderingIdentifier;

  return (
    <footer className={styles} id={id}>
      <div className="footer__inner">
        {/* Top section: 4 columns */}
        <div className="footer__columns">
          {/* Column 1: Brand + Address */}
          <div className="footer__col footer__col--brand">
            <a href="/" className="footer__brand-name" aria-label={t('Footer-FuniroHome')}>
              {t('Footer-Funiro')}
            </a>
            <address className="footer__address">
              {t('Footer-400UniversityDriveSuite')}
              <br />
              {t('Footer-Fl33134Usa')}
            </address>
          </div>

          {/* Column 2: Links */}
          <div className="footer__col">
            <h3 className="footer__col-heading">{t('Footer-Links')}</h3>
            <nav className="footer__col-links" aria-label={t('Footer-FooterLinks')}>
              <a href="/" className="footer__col-link">
                {t('Global-Home')}
              </a>
              <a href="/shop" className="footer__col-link">
                {t('Footer-Shop')}
              </a>
              <a href="/about" className="footer__col-link">
                {t('Footer-About')}
              </a>
              <a href="/contact" className="footer__col-link">
                {t('Global-Contact')}
              </a>
            </nav>
          </div>

          {/* Column 3: Help */}
          <div className="footer__col">
            <h3 className="footer__col-heading">{t('Footer-Help')}</h3>
            <nav className="footer__col-links" aria-label={t('Footer-HelpLinks')}>
              <a href="/payment-options" className="footer__col-link">
                {t('Footer-PaymentOptions')}
              </a>
              <a href="/returns" className="footer__col-link">
                {t('Footer-Returns')}
              </a>
              <a href="/privacy-policies" className="footer__col-link">
                {t('Footer-PrivacyPolicies')}
              </a>
            </nav>
          </div>

          {/* Column 4: Newsletter */}
          <div className="footer__col">
            <h3 className="footer__col-heading">{t('Footer-Newsletter')}</h3>
            <form onSubmit={(e) => e.preventDefault()} className="footer__newsletter">
              <div className="footer__newsletter-field">
                <input
                  type="email"
                  placeholder={t('Footer-EnterYourEmailAddress')}
                  className="footer__newsletter-input"
                  aria-label={t('Footer-EmailAddressForNewsletter')}
                />
                <button type="submit" className="footer__newsletter-btn" aria-label={t('Footer-Subscribe')}>
                  {t('Footer-Subscribe')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom: divider + copyright */}
        <div className="footer__bottom">
          <div className="footer__divider" />
          <p className="footer__copyright">{t('Footer-2023FurinoAllRights')}</p>
        </div>
      </div>
    </footer>
  );
};
