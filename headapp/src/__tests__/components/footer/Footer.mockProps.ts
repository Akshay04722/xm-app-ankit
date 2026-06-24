import { mockPage } from '../../mocks/mockPage';

export const mockFooterPropsDefault = {
  rendering: {
    componentName: 'Footer',
    dataSource: '/sitecore/content/akshayxmc/home/data/navigation/footer',
    uid: 'footer-default-uid',
  },
  params: {
    styles: 'footer-styles',
    RenderingIdentifier: 'footer-test-id',
  },
  fields: {
    LogoImage: {
      value: {
        src: '/assets/logo.png',
        alt: 'Furniro Logo',
        width: 50,
        height: 32,
      },
    },
    FooterNavigationLinks: [
      {
        id: 'footer-nav-link-1',
        fields: {
          link: {
            value: {
              href: '/',
              title: 'Home',
            },
          },
          label: {
            value: 'Home',
          },
        },
      },
      {
        id: 'footer-nav-link-2',
        fields: {
          link: {
            value: {
              href: '/shop',
              title: 'Shop',
            },
          },
          label: {
            value: 'Shop',
          },
        },
      },
    ],
    SocialLinks: [
      {
        id: 'social-link-1',
        fields: {
          link: {
            value: {
              href: 'https://facebook.com/furniro',
              title: 'Facebook',
            },
          },
          label: {
            value: 'Facebook',
          },
        },
      },
      {
        id: 'social-link-2',
        fields: {
          link: {
            value: {
              href: 'https://instagram.com/furniro',
              title: 'Instagram',
            },
          },
          label: {
            value: 'Instagram',
          },
        },
      },
    ],
    CopyrightText: {
      value: '2023 furino. All rights reserved',
    },
  },
  page: mockPage,
};

export const mockFooterPropsMinimal = {
  rendering: {
    componentName: 'Footer',
    dataSource: '',
    uid: 'footer-minimal-uid',
  },
  params: {},
  fields: {},
  page: mockPage,
};
