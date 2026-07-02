// Below are built-in components that are available in the app, it's recommended to keep them as is

import { BYOCServerWrapper, NextjsContentSdkComponent, FEaaSServerWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in components
import * as UnifiedSearch from 'src/components/unifiedSearch/UnifiedSearch';
import * as Title from 'src/components/title/Title';
import * as StructuredData from 'src/components/structured-data/StructuredData';
import * as ShopBanner from 'src/components/shop-banner/ShopBanner';
import * as ShareSetup from 'src/components/share-setup/ShareSetup';
import * as SearchResults from 'src/components/searchResults/SearchResults';
import * as RowSplitter from 'src/components/row-splitter/RowSplitter';
import * as RichText from 'src/components/rich-text/RichText';
import * as Promo from 'src/components/promo/Promo';
import * as PartialDesignDynamicPlaceholder from 'src/components/partial-design-dynamic-placeholder/PartialDesignDynamicPlaceholder';
import * as PageContent from 'src/components/page-content/PageContent';
import * as OurProducts from 'src/components/our-products/OurProducts';
import * as Navigation from 'src/components/navigation/Navigation';
import * as LinkList from 'src/components/link-list/LinkList';
import * as Inspirations from 'src/components/inspirations/Inspirations';
import * as Image from 'src/components/image/Image';
import * as HeroPromo from 'src/components/hero-promo/HeroPromo';
import * as Header from 'src/components/header/Header';
import * as Footer from 'src/components/footer/Footer';
import * as ContentBlock from 'src/components/content-block/ContentBlock';
import * as Container from 'src/components/container/Container';
import * as ColumnSplitter from 'src/components/column-splitter/ColumnSplitter';
import * as CloudSdkBootstrap from 'src/components/CloudSdkBootstrap/CloudSdkBootstrap';
import * as CDPProvider from 'src/components/cdp/CDPProvider';
import * as BrowseTheRange from 'src/components/browse-the-range/BrowseTheRange';
import * as BlogDetail from 'src/components/blog-detail/BlogDetail';
import * as Blog from 'src/components/blog/Blog';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', { ...Form, componentType: 'client' }],
  ['UnifiedSearch', { ...UnifiedSearch, componentType: 'client' }],
  ['Title', { ...Title }],
  ['StructuredData', { ...StructuredData }],
  ['ShopBanner', { ...ShopBanner }],
  ['ShareSetup', { ...ShareSetup }],
  ['SearchResults', { ...SearchResults, componentType: 'client' }],
  ['RowSplitter', { ...RowSplitter }],
  ['RichText', { ...RichText }],
  ['Promo', { ...Promo }],
  ['PartialDesignDynamicPlaceholder', { ...PartialDesignDynamicPlaceholder }],
  ['PageContent', { ...PageContent }],
  ['OurProducts', { ...OurProducts, componentType: 'client' }],
  ['Navigation', { ...Navigation, componentType: 'client' }],
  ['LinkList', { ...LinkList }],
  ['Inspirations', { ...Inspirations, componentType: 'client' }],
  ['Image', { ...Image }],
  ['HeroPromo', { ...HeroPromo }],
  ['Header', { ...Header }],
  ['Footer', { ...Footer, componentType: 'client' }],
  ['ContentBlock', { ...ContentBlock, componentType: 'client' }],
  ['Container', { ...Container }],
  ['ColumnSplitter', { ...ColumnSplitter }],
  ['CloudSdkBootstrap', { ...CloudSdkBootstrap, componentType: 'client' }],
  ['CDPProvider', { ...CDPProvider, componentType: 'client' }],
  ['BrowseTheRange', { ...BrowseTheRange }],
  ['BlogDetail', { ...BlogDetail, componentType: 'client' }],
  ['Blog', { ...Blog, componentType: 'client' }],
]);

export default componentMap;
