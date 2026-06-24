import { mockPage } from '../../mocks/mockPage';

export const mockHeaderPropsDefault = {
  rendering: {
    componentName: 'Header',
    dataSource: '/sitecore/content/akshayxmc/home/data/navigation/header',
    uid: 'header-default-uid',
  },
  params: {
    styles: 'header-styles',
    RenderingIdentifier: 'header-test-id',
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
    NavigationLinks: [
      {
        id: 'nav-link-1',
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
        id: 'nav-link-2',
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
      {
        id: 'nav-link-3',
        fields: {
          link: {
            value: {
              href: '/about',
              title: 'About',
            },
          },
          label: {
            value: 'About',
          },
        },
      },
      {
        id: 'nav-link-4',
        fields: {
          link: {
            value: {
              href: '/contact',
              title: 'Contact',
            },
          },
          label: {
            value: 'Contact',
          },
        },
      },
    ],
    CtaLabel: {
      value: 'Subscribe',
    },
    CtaLink: {
      value: {
        href: '/subscribe',
        title: 'Subscribe',
      },
    },
  },
  page: mockPage,
};

export const mockHeaderPropsMinimal = {
  rendering: {
    componentName: 'Header',
    dataSource: '',
    uid: 'header-minimal-uid',
  },
  params: {},
  fields: {},
  page: mockPage,
};
