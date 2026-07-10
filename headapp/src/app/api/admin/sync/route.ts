import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import {
  getSitecoreItemIdByPath,
  fetchLookupMap,
  createSitecoreItem,
  updateSitecoreItem,
  triggerPublish,
} from '@/lib/sitecoreAuthoringClient';

// Default fallback template ID for Product in Sitecore (user can override via env)
const PRODUCT_TEMPLATE_ID =
  process.env.SITECORE_PRODUCT_TEMPLATE_ID || '{7D33D96A-F36D-4DF9-9091-88DD28A680D5}';
const FOLDER_TEMPLATE_ID = '{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}'; // Standard Sitecore Folder template

// Resolve parent site root path (where Data folder lives)
function getSitePath(siteName: string) {
  const normalized = (siteName || '').toLowerCase().trim();
  const knownSites = ['ankitxmc', 'akshayxmc', 'krunalxmc'];
  const targetSite = knownSites.includes(normalized)
    ? normalized
    : (process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME || 'akshayxmc').toLowerCase().trim();

  if (targetSite === 'ankitxmc') return '/sitecore/content/Ankit/ankitxmc';
  if (targetSite === 'akshayxmc') return '/sitecore/content/akshay/akshayxmc';
  if (targetSite === 'krunalxmc') return '/sitecore/content/krunal/krunalxmc';
  return '/sitecore/content/akshay/akshayxmc'; // fallback
}

// Resolve the root page (Home page node) path where pages/folders are created
function getHomePagePath(siteName: string) {
  const normalized = (siteName || '').toLowerCase().trim();
  const knownSites = ['ankitxmc', 'akshayxmc', 'krunalxmc'];
  const targetSite = knownSites.includes(normalized)
    ? normalized
    : (process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME || 'akshayxmc').toLowerCase().trim();

  if (targetSite === 'ankitxmc') return '/sitecore/content/Ankit/ankitxmc/Home';
  if (targetSite === 'akshayxmc') return '/sitecore/content/akshay/akshayxmc/Shop'; // akshayxmc uses Shop instead of Home
  if (targetSite === 'krunalxmc') return '/sitecore/content/krunal/krunalxmc/Home';
  return '/sitecore/content/akshay/akshayxmc/Shop'; // fallback
}

// Helper to authenticate admin users (Firebase side, unrelated to Sitecore auth)
async function authenticateAdmin(req: NextRequest) {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK is not initialized.');
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header.');
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await adminAuth.verifyIdToken(token);

  const isAdmin = decodedToken.isAdmin === true || decodedToken.role === 'admin';
  if (!isAdmin) {
    throw new Error('Access Denied: Only users with admin privileges can perform this action.');
  }

  return decodedToken;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin
    await authenticateAdmin(req);

    // Get siteName from query parameters (default to akshayxmc or default site)
    const { searchParams } = new URL(req.url);
    const rawSiteName = searchParams.get('site') || '';
    const siteName = rawSiteName || process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME || 'akshayxmc';

    // Resolve dynamic paths
    const sitePath = getSitePath(siteName);
    const homePagePath = getHomePagePath(siteName);
    const productsFolderPath = `${homePagePath}/Products`;

    // 2. Fetch products from Firestore
    const db = getFirestore();
    const productsSnapshot = await db.collection('products').get();

    if (productsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No products found in Firestore to sync.',
        results: [],
      });
    }

    // 3. Ensure the parent "Products" folder exists in Sitecore under the root home page/Shop
    let productsFolderId = await getSitecoreItemIdByPath(productsFolderPath);
    if (!productsFolderId) {
      console.log(`Creating parent Products folder under ${homePagePath}...`);
      productsFolderId = await createSitecoreItem(homePagePath, 'Products', FOLDER_TEMPLATE_ID);
      if (!productsFolderId) {
        throw new Error(`Failed to create parent Products folder in Sitecore at ${productsFolderPath}`);
      }
    }

    // 4. Fetch selection/relation lookup maps from Sitecore
    const sizesMap = await fetchLookupMap(`${sitePath}/Data/Sizes`);
    const colorsMap = await fetchLookupMap(`${sitePath}/Data/Colors`);
    const categoriesMap = await fetchLookupMap(`${sitePath}/Data/Categories`);
    const tagsMap = await fetchLookupMap(`${sitePath}/Data/Tags`);


    const syncResults = [];

    // 5. Upsert each product to Sitecore
    for (const doc of productsSnapshot.docs) {
      const product = doc.data();
      const sku = product.sku;
      if (!sku) continue;

      const itemName = sku.replace(/[^a-zA-Z0-9]/g, ''); // Sanitized item name

      // Resolve Multilists and Drop-link references to Sitecore Item GUIDs
      const rawSizes = Array.isArray(product.sizes)
        ? product.sizes
        : product.sizes
          ? String(product.sizes).split(',').map((s: string) => s.trim())
          : [];
      const sizeGuids = rawSizes.map((s: string) => sizesMap[s.toLowerCase().trim()]).filter(Boolean);
      const AvailableSizes = sizeGuids.join('|');

      const rawColors = Array.isArray(product.colors)
        ? product.colors
        : product.colors
        ? String(product.colors).split(',').map((c: string) => c.trim())
        : [];
      const colorGuids = rawColors.map((c: string) => colorsMap[c.toLowerCase().trim()]).filter(Boolean);
      const AvailableColors = colorGuids.join('|');

      const categoryGuid = product.category
        ? categoriesMap[product.category.toLowerCase().trim()]
        : '';
      const Category = categoryGuid || '';

      const rawTags = Array.isArray(product.tags)
        ? product.tags
        : product.tags
        ? String(product.tags).split(',').map((t: string) => t.trim())
        : [];
      const tagGuids = rawTags.map((t: string) => tagsMap[t.toLowerCase().trim()]).filter(Boolean);
      const Tags = tagGuids.join('|');
      const rawGalleryImages = Array.isArray(product.galleryImages)
        ? product.galleryImages
        : product.galleryImageUrls
          ? product.galleryImageUrls
          : product.galleryImages
            ? String(product.galleryImages).split(',').map((g: string) => g.trim())
            : [];
      const GalleryImages = rawGalleryImages.filter(Boolean).join('|');

      console.log('AvailableSizes',AvailableSizes);
      console.log('AvailableColors',AvailableColors);
      console.log('Category',Category);
      console.log('Tags',Tags);
      console.log('GalleryImages', GalleryImages);

      const sitecorePayload = {
        Title: product.title || '',
        SKU: sku,
        ShortDescription: product.shortDescription || '',
        LongDescription: product.longDescription || '',
        AdditionalInformation: product.additionalInformation || '',
        Price: String(product.price || 0),
        DiscountPrice: String(product.discountPrice || 0),
        IsNew: product.isNew ? '1' : '0',
        MainImage: product.mainImageUrl || '',
        GalleryImages,
        AvailableSizes,
        AvailableColors,
        Category,
        Tags,
      };

      // Check if product item already exists under Products folder
      const productItemPath = `${productsFolderPath}/${itemName}`;
      const existingItemId = await getSitecoreItemIdByPath(productItemPath);

      let success = false;
      let action = '';

      if (existingItemId) {
        // Update existing item
        action = 'update';
        success = await updateSitecoreItem(existingItemId, sitecorePayload);
      } else {
        // Create new item
        action = 'create';
        const newId = await createSitecoreItem(
          productsFolderPath,
          itemName,
          PRODUCT_TEMPLATE_ID,
          sitecorePayload
        );
        success = !!newId;
      }

      syncResults.push({
        sku,
        itemName,
        action,
        status: success ? 'Success' : 'Failed',
      });
    }

    // 6. Trigger publishing pipeline to Experience Edge
    await triggerPublish(productsFolderId);

    return NextResponse.json({
      success: true,
      message: `Completed Firestore to Sitecore synchronization for site: ${siteName}.`,
      results: syncResults,
    });
  } catch (error: any) {
    console.error('POST /api/admin/sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error during synchronization' },
      { status: 400 }
    );
  }
}