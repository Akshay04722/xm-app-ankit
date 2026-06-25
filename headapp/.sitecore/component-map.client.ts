// Client-safe component map for App Router

import { BYOCClientWrapper, NextjsContentSdkComponent, FEaaSClientWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

import * as OurProducts from 'src/components/our-products/OurProducts';
import * as Navigation from 'src/components/navigation/Navigation';
import * as Inspirations from 'src/components/inspirations/Inspirations';
import * as ContentBlock from 'src/components/content-block/ContentBlock';
import * as BrowseTheRange from 'src/components/browse-the-range/BrowseTheRange';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCClientWrapper],
  ['FEaaSWrapper', FEaaSClientWrapper],
  ['Form', Form],
  ['OurProducts', { ...OurProducts }],
  ['Navigation', { ...Navigation }],
  ['Inspirations', { ...Inspirations }],
  ['ContentBlock', { ...ContentBlock }],
  ['BrowseTheRange', { ...BrowseTheRange }],
]);

export default componentMap;
