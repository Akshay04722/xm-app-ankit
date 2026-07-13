import { triggerPublish } from '../src/lib/sitecoreAuthoringClient';

async function main() {
  // Publish the Shop page
  const shopPageId = "{39788A65-8560-4FC4-8D41-F9194EA8308F}";
  console.log(`Publishing Shop page ${shopPageId}...`);
  const r1 = await triggerPublish(shopPageId);
  console.log(`Shop page publish: ${r1 ? "SUCCESS" : "FAILED"}`);

  // Publish the Products folder (datasource) with all children
  const productsFolderId = "{E3F73934-97B6-4BDE-A31D-3F3FBF6495C4}";
  console.log(`Publishing Products folder ${productsFolderId}...`);
  const r2 = await triggerPublish(productsFolderId);
  console.log(`Products folder publish: ${r2 ? "SUCCESS" : "FAILED"}`);
}

main().catch(console.error);
