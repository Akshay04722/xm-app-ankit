// Client-safe component map for App Router

import { BYOCClientWrapper, NextjsContentSdkComponent, FEaaSClientWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

import * as UnifiedSearch from 'src/components/unifiedSearch/UnifiedSearch';
import * as SignIn from 'src/components/sign-in/SignIn';
import * as ShopProductsList from 'src/components/shop-products-list/ShopProductsList';
import * as SearchResults from 'src/components/searchResults/SearchResults';
import * as Register from 'src/components/register/Register';
import * as ProfileForm from 'src/components/profile/ProfileForm';
import * as ProfileCompletionDialog from 'src/components/profile/ProfileCompletionDialog';
import * as Profile from 'src/components/profile/Profile';
import * as AddressDialog from 'src/components/profile/AddressDialog';
import * as ProductDetails from 'src/components/product-details/ProductDetails';
import * as OurProducts from 'src/components/our-products/OurProducts';
import * as OrdersList from 'src/components/OrdersList/OrdersList';
import * as Navigation from 'src/components/navigation/Navigation';
import * as Inspirations from 'src/components/inspirations/Inspirations';
import * as Header from 'src/components/header/Header';
import * as Footer from 'src/components/footer/Footer';
import * as ContentBlock from 'src/components/content-block/ContentBlock';
import * as ContactUs from 'src/components/contact-us/ContactUs';
import * as CloudSdkBootstrap from 'src/components/CloudSdkBootstrap/CloudSdkBootstrap';
import * as CheckoutSuccess from 'src/components/CheckoutSuccess/CheckoutSuccess';
import * as CheckoutForm from 'src/components/CheckoutForm/CheckoutForm';
import * as CheckoutError from 'src/components/CheckoutError/CheckoutError';
import * as CDPProvider from 'src/components/cdp/CDPProvider';
import * as CartDrawer from 'src/components/cart-drawer/CartDrawer';
import * as Cart from 'src/components/cart/Cart';
import * as BlogDetail from 'src/components/blog-detail/BlogDetail';
import * as Blog from 'src/components/blog/Blog';
import * as AdminDashboard from 'src/components/admin-dashboard/AdminDashboard';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCClientWrapper],
  ['FEaaSWrapper', FEaaSClientWrapper],
  ['Form', Form],
  ['UnifiedSearch', { ...UnifiedSearch }],
  ['SignIn', { ...SignIn }],
  ['ShopProductsList', { ...ShopProductsList }],
  ['SearchResults', { ...SearchResults }],
  ['Register', { ...Register }],
  ['ProfileForm', { ...ProfileForm }],
  ['ProfileCompletionDialog', { ...ProfileCompletionDialog }],
  ['Profile', { ...Profile }],
  ['AddressDialog', { ...AddressDialog }],
  ['ProductDetails', { ...ProductDetails }],
  ['OurProducts', { ...OurProducts }],
  ['OrdersList', { ...OrdersList }],
  ['Navigation', { ...Navigation }],
  ['Inspirations', { ...Inspirations }],
  ['Header', { ...Header }],
  ['Footer', { ...Footer }],
  ['ContentBlock', { ...ContentBlock }],
  ['ContactUs', { ...ContactUs }],
  ['CloudSdkBootstrap', { ...CloudSdkBootstrap }],
  ['CheckoutSuccess', { ...CheckoutSuccess }],
  ['CheckoutForm', { ...CheckoutForm }],
  ['CheckoutError', { ...CheckoutError }],
  ['CDPProvider', { ...CDPProvider }],
  ['CartDrawer', { ...CartDrawer }],
  ['Cart', { ...Cart }],
  ['BlogDetail', { ...BlogDetail }],
  ['Blog', { ...Blog }],
  ['AdminDashboard', { ...AdminDashboard }],
]);

export default componentMap;
