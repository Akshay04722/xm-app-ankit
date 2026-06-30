// Client-safe component map for App Router

import { BYOCClientWrapper, NextjsContentSdkComponent, FEaaSClientWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

import * as OurProducts from 'src/components/our-products/OurProducts';
import * as Navigation from 'src/components/navigation/Navigation';
import * as Inspirations from 'src/components/inspirations/Inspirations';
import * as ContentBlock from 'src/components/content-block/ContentBlock';
import * as CloudSdkBootstrap from 'src/components/CloudSdkBootstrap/CloudSdkBootstrap';
import * as Blog from 'src/components/blog/Blog';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCClientWrapper],
  ['FEaaSWrapper', FEaaSClientWrapper],
  ['Form', Form],
  ['OurProducts', { ...OurProducts }],
  ['Navigation', { ...Navigation }],
  ['Inspirations', { ...Inspirations }],
  ['ContentBlock', { ...ContentBlock }],
  ['CloudSdkBootstrap', { ...CloudSdkBootstrap }],
  ['Blog', { ...Blog }],
]);

export default componentMap;
