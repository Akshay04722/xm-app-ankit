// Below are built-in components that are available in the app, it's recommended to keep them as is

import { BYOCServerWrapper, NextjsContentSdkComponent, FEaaSServerWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in components
import * as UnifiedSearch from 'src/components/unifiedSearch/UnifiedSearch';
import * as Title from 'src/components/title/Title';
import * as StructuredData from 'src/components/structured-data/StructuredData';
import * as SignIn from 'src/components/sign-in/SignIn';
import * as ShopProductsList from 'src/components/shop-products-list/ShopProductsList';
import * as ShopBanner from 'src/components/shop-banner/ShopBanner';
import * as ShareSetup from 'src/components/share-setup/ShareSetup';
import * as SearchResults from 'src/components/searchResults/SearchResults';
import * as RowSplitter from 'src/components/row-splitter/RowSplitter';
import * as RoomVisualizer from 'src/components/room-visualizer/RoomVisualizer';
import * as RichText from 'src/components/rich-text/RichText';
import * as Register from 'src/components/register/Register';
import * as RecentlyViewedCdp from 'src/components/recently-viewed-cdp/RecentlyViewedCdp';
import * as Promo from 'src/components/promo/Promo';
import * as ProfileInfoCard from 'src/components/profile/ProfileInfoCard';
import * as ProfileHeader from 'src/components/profile/ProfileHeader';
import * as ProfileForm from 'src/components/profile/ProfileForm';
import * as ProfileCompletionDialog from 'src/components/profile/ProfileCompletionDialog';
import * as Profile from 'src/components/profile/Profile';
import * as EmptyAddress from 'src/components/profile/EmptyAddress';
import * as AddressList from 'src/components/profile/AddressList';
import * as AddressDialog from 'src/components/profile/AddressDialog';
import * as AddressCard from 'src/components/profile/AddressCard';
import * as ProductDetails from 'src/components/product-details/ProductDetails';
import * as PartialDesignDynamicPlaceholder from 'src/components/partial-design-dynamic-placeholder/PartialDesignDynamicPlaceholder';
import * as PageContent from 'src/components/page-content/PageContent';
import * as OurProducts from 'src/components/our-products/OurProducts';
import * as OrdersList from 'src/components/OrdersList/OrdersList';
import * as Navigation from 'src/components/navigation/Navigation';
import * as LinkList from 'src/components/link-list/LinkList';
import * as Inspirations from 'src/components/inspirations/Inspirations';
import * as Image from 'src/components/image/Image';
import * as HeroPromo from 'src/components/hero-promo/HeroPromo';
import * as Header from 'src/components/header/Header';
import * as Footer from 'src/components/footer/Footer';
import * as ContentBlock from 'src/components/content-block/ContentBlock';
import * as Container from 'src/components/container/Container';
import * as ContactUs from 'src/components/contact-us/ContactUs';
import * as ColumnSplitter from 'src/components/column-splitter/ColumnSplitter';
import * as CloudSdkBootstrap from 'src/components/CloudSdkBootstrap/CloudSdkBootstrap';
import * as CheckoutSuccess from 'src/components/CheckoutSuccess/CheckoutSuccess';
import * as CheckoutForm from 'src/components/CheckoutForm/CheckoutForm';
import * as CheckoutError from 'src/components/CheckoutError/CheckoutError';
import * as Chatbot from 'src/components/chatbot/Chatbot';
import * as CDPProvider from 'src/components/cdp/CDPProvider';
import * as CartDrawer from 'src/components/cart-drawer/CartDrawer';
import * as Cart from 'src/components/cart/Cart';
import * as BrowseTheRange from 'src/components/browse-the-range/BrowseTheRange';
import * as BlogDetail from 'src/components/blog-detail/BlogDetail';
import * as Blog from 'src/components/blog/Blog';
import * as AdminDashboard from 'src/components/admin-dashboard/AdminDashboard';
import * as AboutUs from 'src/components/about-us/AboutUs';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', { ...Form, componentType: 'client' }],
  ['UnifiedSearch', { ...UnifiedSearch, componentType: 'client' }],
  ['Title', { ...Title }],
  ['StructuredData', { ...StructuredData }],
  ['SignIn', { ...SignIn, componentType: 'client' }],
  ['ShopProductsList', { ...ShopProductsList, componentType: 'client' }],
  ['ShopBanner', { ...ShopBanner }],
  ['ShareSetup', { ...ShareSetup }],
  ['SearchResults', { ...SearchResults, componentType: 'client' }],
  ['RowSplitter', { ...RowSplitter }],
  ['RoomVisualizer', { ...RoomVisualizer, componentType: 'client' }],
  ['RichText', { ...RichText }],
  ['Register', { ...Register, componentType: 'client' }],
  ['RecentlyViewedCdp', { ...RecentlyViewedCdp, componentType: 'client' }],
  ['Promo', { ...Promo }],
  ['ProfileInfoCard', { ...ProfileInfoCard }],
  ['ProfileHeader', { ...ProfileHeader }],
  ['ProfileForm', { ...ProfileForm, componentType: 'client' }],
  ['ProfileCompletionDialog', { ...ProfileCompletionDialog, componentType: 'client' }],
  ['Profile', { ...Profile, componentType: 'client' }],
  ['EmptyAddress', { ...EmptyAddress }],
  ['AddressList', { ...AddressList }],
  ['AddressDialog', { ...AddressDialog, componentType: 'client' }],
  ['AddressCard', { ...AddressCard }],
  ['ProductDetails', { ...ProductDetails, componentType: 'client' }],
  ['PartialDesignDynamicPlaceholder', { ...PartialDesignDynamicPlaceholder }],
  ['PageContent', { ...PageContent }],
  ['OurProducts', { ...OurProducts, componentType: 'client' }],
  ['OrdersList', { ...OrdersList, componentType: 'client' }],
  ['Navigation', { ...Navigation, componentType: 'client' }],
  ['LinkList', { ...LinkList }],
  ['Inspirations', { ...Inspirations, componentType: 'client' }],
  ['Image', { ...Image }],
  ['HeroPromo', { ...HeroPromo }],
  ['Header', { ...Header, componentType: 'client' }],
  ['Footer', { ...Footer, componentType: 'client' }],
  ['ContentBlock', { ...ContentBlock, componentType: 'client' }],
  ['Container', { ...Container }],
  ['ContactUs', { ...ContactUs, componentType: 'client' }],
  ['ColumnSplitter', { ...ColumnSplitter }],
  ['CloudSdkBootstrap', { ...CloudSdkBootstrap, componentType: 'client' }],
  ['CheckoutSuccess', { ...CheckoutSuccess, componentType: 'client' }],
  ['CheckoutForm', { ...CheckoutForm, componentType: 'client' }],
  ['CheckoutError', { ...CheckoutError, componentType: 'client' }],
  ['Chatbot', { ...Chatbot, componentType: 'client' }],
  ['CDPProvider', { ...CDPProvider, componentType: 'client' }],
  ['CartDrawer', { ...CartDrawer, componentType: 'client' }],
  ['Cart', { ...Cart, componentType: 'client' }],
  ['BrowseTheRange', { ...BrowseTheRange }],
  ['BlogDetail', { ...BlogDetail, componentType: 'client' }],
  ['Blog', { ...Blog, componentType: 'client' }],
  ['AdminDashboard', { ...AdminDashboard, componentType: 'client' }],
  ['AboutUs', { ...AboutUs, componentType: 'client' }],
]);

export default componentMap;
