import algoliasearch from "algoliasearch";
import { pathToFileURL } from "node:url";
import path from "node:path";
import process from "node:process";

const appId = process.env.ALGOLIA_APP_ID || process.env.VITE_ALGOLIA_APP_ID;
const adminKey = process.env.ALGOLIA_ADMIN_API_KEY;
const indexName =
  process.env.ALGOLIA_INDEX || process.env.VITE_ALGOLIA_INDEX || "products";

if (!appId || !adminKey) {
  console.error("Missing ALGOLIA_APP_ID or ALGOLIA_ADMIN_API_KEY.");
  process.exit(1);
}

const client = algoliasearch(appId, adminKey);
const index = client.initIndex(indexName);

const filePath = path.resolve(process.cwd(), "src/data/products.js");
const mod = await import(pathToFileURL(filePath).href);
const products = mod.products || [];

const records = products.map((p) => ({
  objectID: String(p.id ?? p.objectID ?? Math.random()),
  name: p.name,
  description: p.description,
  category: p.category,
  price: p.price,
  image: p.image,
  inStock: p.inStock,
}));

await index.saveObjects(records);
console.log(`Uploaded ${records.length} products to ${indexName}`);

