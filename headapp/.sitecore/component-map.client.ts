// Client-safe component map for App Router

import { BYOCClientWrapper, NextjsContentSdkComponent, FEaaSClientWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

import * as UnifiedSearch from 'src/components/unifiedSearch/UnifiedSearch';
import * as SearchResults from 'src/components/searchResults/SearchResults';
import * as OurProducts from 'src/components/our-products/OurProducts';
import * as Navigation from 'src/components/navigation/Navigation';
import * as Inspirations from 'src/components/inspirations/Inspirations';
import * as Footer from 'src/components/footer/Footer';
import * as ContentBlock from 'src/components/content-block/ContentBlock';
import * as CloudSdkBootstrap from 'src/components/CloudSdkBootstrap/CloudSdkBootstrap';
import * as Blog from 'src/components/blog/Blog';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCClientWrapper],
  ['FEaaSWrapper', FEaaSClientWrapper],
  ['Form', Form],
  ['UnifiedSearch', { ...UnifiedSearch }],
  ['SearchResults', { ...SearchResults }],
  ['OurProducts', { ...OurProducts }],
  ['Navigation', { ...Navigation }],
  ['Inspirations', { ...Inspirations }],
  ['Footer', { ...Footer }],
  ['ContentBlock', { ...ContentBlock }],
  ['CloudSdkBootstrap', { ...CloudSdkBootstrap }],
  ['Blog', { ...Blog }],
]);

export default componentMap;
