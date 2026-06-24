import React, { JSX } from 'react';
import { ComponentProps } from 'lib/component-props';

type FooterProps = ComponentProps & {
  fields?: Record<string, unknown>;
};

export const Default = (props: FooterProps): JSX.Element => {
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
            <a href="/" className="footer__brand-name" aria-label="Funiro home">
              Funiro.
            </a>
            <address className="footer__address">
              400 University Drive Suite 200 Coral Gables,
              <br />
              FL 33134 USA
            </address>
          </div>

          {/* Column 2: Links */}
          <div className="footer__col">
            <h3 className="footer__col-heading">Links</h3>
            <nav className="footer__col-links" aria-label="Footer links">
              <a href="/" className="footer__col-link">
                Home
              </a>
              <a href="/shop" className="footer__col-link">
                Shop
              </a>
              <a href="/about" className="footer__col-link">
                About
              </a>
              <a href="/contact" className="footer__col-link">
                Contact
              </a>
            </nav>
          </div>

          {/* Column 3: Help */}
          <div className="footer__col">
            <h3 className="footer__col-heading">Help</h3>
            <nav className="footer__col-links" aria-label="Help links">
              <a href="/payment-options" className="footer__col-link">
                Payment Options
              </a>
              <a href="/returns" className="footer__col-link">
                Returns
              </a>
              <a href="/privacy-policies" className="footer__col-link">
                Privacy Policies
              </a>
            </nav>
          </div>

          {/* Column 4: Newsletter */}
          <div className="footer__col">
            <h3 className="footer__col-heading">Newsletter</h3>
            <div className="footer__newsletter">
              <div className="footer__newsletter-field">
                <input
                  type="email"
                  placeholder="Enter Your Email Address"
                  className="footer__newsletter-input"
                  aria-label="Email address for newsletter"
                />
                <button type="submit" className="footer__newsletter-btn" aria-label="Subscribe">
                  SUBSCRIBE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: divider + copyright */}
        <div className="footer__bottom">
          <div className="footer__divider" />
          <p className="footer__copyright">2023 furino. All rights reverved</p>
        </div>
      </div>
    </footer>
  );
};
