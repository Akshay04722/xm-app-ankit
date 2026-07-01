import { init } from "@sitecore/engage";

let engage: any = null;

export async function getEngage() {
  if (engage) {
    return engage;
  }

  // Add this
  const cookieDomain =
    window.location.hostname === "localhost"
      ? "localhost"
      : `.${window.location.hostname}`;

  engage = await init({
    clientKey: process.env.NEXT_PUBLIC_CDP_CLIENT_KEY!,
    targetURL: process.env.NEXT_PUBLIC_CDP_TARGET_URL!,
    pointOfSale: process.env.NEXT_PUBLIC_CDP_POINT_OF_SALE!,
    cookieDomain, // Use the variable here
    cookieExpiryDays: 365,
    forceServerCookieMode: false,
    includeUTMParameters: true,
  });

  console.log("Browser ID:", engage.getBrowserId());
  console.log("Guest ID:", engage.getGuestId?.());

  return engage;
}