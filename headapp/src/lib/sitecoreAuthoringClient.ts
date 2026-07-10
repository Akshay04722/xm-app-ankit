// lib/sitecoreAuthoringClient.ts
import { getSitecoreAuthToken } from './sitecoreAuthoringAuth';

const SITECORE_API_HOST =
  process.env.SITECORE_API_HOST ||
  'https://xmc-sourceved1d977-ankitxmclou91bb-devf710.sitecorecloud.io';

const AUTHORING_ENDPOINT = `${SITECORE_API_HOST}/sitecore/api/authoring/graphql/v1`;

export async function graphqlRequest(query: string, variables: Record<string, any>) {
  const token = await getSitecoreAuthToken();

  const response = await fetch(AUTHORING_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
   console.log("graphqlRequest", result);
  if (!response.ok || result.errors) {
    throw new Error(`Sitecore GraphQL error: ${JSON.stringify(result.errors || result)}`);
  }

  return result.data;
}

// --- Get item ID by path ---
export async function getSitecoreItemIdByPath(path: string): Promise<string | null> {
  const query = `
    query GetItem($path: String!) {
      item(where: { database: "master", path: $path }) {
        itemId
      }
    }
  `;
  try {
    const data = await graphqlRequest(query, { path });
    return data.item?.itemId || null;
  } catch (err) {
    console.error(`Error finding item by path ${path}:`, err);
    return null;
  }
}

// --- Get children of an item as a name -> itemId lookup map ---
// Formats a raw GraphQL itemId (e.g. "29306ff1ba864c428902a94fb0fda5d8")
// into Sitecore's expected braced, uppercase GUID format:
// "{29306FF1-BA86-4C42-8902-A94FB0FDA5D8}"
export function formatSitecoreGuid(rawId: string): string {
  const clean = rawId.replace(/[{}-]/g, '').toUpperCase();
  if (clean.length !== 32) return rawId; // fallback, don't break on unexpected input
  return `{${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(
    16,
    20
  )}-${clean.slice(20)}}`;
}

// --- Get children of an item as a value -> itemId lookup map ---
// Indexes by item name, display name, AND every own-field value
// (e.g. Size's "Value" field, Color/Category/Tag's "Name" field),
// since the field content is what actually matters for matching,
// not necessarily the Sitecore item name.
export async function fetchLookupMap(parentPath: string): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  const query = `
    query GetChildrenWithFields($path: String!) {
      item(where: { database: "master", path: $path }) {
        children {
          nodes {
            itemId
            name
            displayName
            fields(ownFields: true, excludeStandardFields: true) {
              nodes {
                name
                value
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await graphqlRequest(query, { path: parentPath });
    const children = data.item?.children?.nodes || [];

    for (const child of children) {
      const guid = formatSitecoreGuid(child.itemId);

      if (child.name) {
        map[child.name.toLowerCase().trim()] = guid;
      }
      if (child.displayName) {
        map[child.displayName.toLowerCase().trim()] = guid;
      }

      const fieldNodes = child.fields?.nodes || [];
      for (const field of fieldNodes) {
        if (field.value && field.value.trim()) {
          map[field.value.toLowerCase().trim()] = guid;
        }
      }
    }

    console.log(`Lookup map for ${parentPath}:`, map);
  } catch (err) {
    console.error(`Error loading lookup map for ${parentPath}:`, err);
  }

  return map;
}

// --- Create a new item ---
// Escapes a string for safe inclusion inside a GraphQL string literal
function escapeGraphQLString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// Builds an inline `fields: [{ name: "...", value: "..." }]` block.
// Returns an empty string if there are no fields (argument omitted entirely).
function buildInlineFieldsArg(fields: Record<string, string>): string {
  const entries = Object.entries(fields);
  if (entries.length === 0) return '';

  const fieldItems = entries
    .map(
      ([name, value]) =>
        `{ name: "${escapeGraphQLString(name)}", value: "${escapeGraphQLString(value)}" }`
    )
    .join('\n        ');

  return `fields: [\n        ${fieldItems}\n      ]`;
}

// --- Create a new item ---
export async function createSitecoreItem(
  parentPath: string,
  name: string,
  templateId: string,
  fields: Record<string, string> = {}
): Promise<string | null> {
  const parentId = await getSitecoreItemIdByPath(parentPath);
  if (!parentId) {
    console.error(`Parent path not found for item creation: ${parentPath}`);
    return null;
  }

  const fieldsArg = buildInlineFieldsArg(fields);

  const mutation = `
    mutation CreateItem($name: String!, $templateId: ID!, $parent: ID!) {
      createItem(input: {
        name: $name
        templateId: $templateId
        parent: $parent
        language: "en"
        ${fieldsArg}
      }) {
        item {
          itemId
          name
          path
        }
      }
    }
  `;

  try {
    const data = await graphqlRequest(mutation, {
      name,
      templateId,
      parent: parentId,
    });
    return data.createItem?.item?.itemId || null;
  } catch (err) {
    console.error(`Error creating item ${name} under ${parentPath}:`, err);
    return null;
  }
}

// --- Update fields on an existing item ---
// --- Update fields on an existing item ---
export async function updateSitecoreItem(
  itemId: string,
  fields: Record<string, string>
): Promise<boolean> {
  const fieldsArg = buildInlineFieldsArg(fields);

  // If there's nothing to update, skip the call entirely
  if (!fieldsArg) {
    return true;
  }

  const mutation = `
    mutation UpdateItem($itemId: ID!) {
      updateItem(input: {
        itemId: $itemId
        language: "en"
        ${fieldsArg}
      }) {
        item {
          itemId
        }
      }
    }
  `;

  try {
    const data = await graphqlRequest(mutation, { itemId });
    return !!data.updateItem?.item?.itemId;
  } catch (err) {
    console.error(`Error updating item ${itemId}:`, err);
    return false;
  }
}
// --- Trigger publish for an item and its descendants ---
// NOTE: publishItem's exact input shape can differ slightly by XM Cloud version.
// Before relying on this in production, confirm the input fields via your
// GraphQL IDE at https://<your-host>/sitecore/api/authoring/graphql/ide/
// (open the DOCS panel and look up "publishItem").
// --- Trigger publish for an item and its descendants ---
export async function triggerPublish(rootItemId: string): Promise<boolean> {
  const mutation = `
    mutation PublishItem($rootItemIds: [ID!]!) {
      publishItem(input: {
        sourceDatabase: "master"
        targetDatabases: ["experienceedge"]
        rootItemIds: $rootItemIds
        publishSubItems: true
        publishRelatedItems: false
        publishItemMode: FULL
        languages: ["en"]
        displayName: "Product sync publish"
      }) {
        operationId
      }
    }
  `;

  try {
    const data = await graphqlRequest(mutation, { rootItemIds: [rootItemId] });
    const operationId = data.publishItem?.operationId;
    if (operationId) {
      console.log(`Publish triggered. Operation ID: ${operationId}`);
    }
    return !!operationId;
  } catch (err) {
    console.error(`Error publishing item ${rootItemId}:`, err);
    return false;
  }
}