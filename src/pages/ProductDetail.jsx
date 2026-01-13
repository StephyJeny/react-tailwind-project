import React from "react";
import { useParams } from "react-router-dom";

import { products } from "../data/products";
import { useApp } from "../state/AppContext";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart, t } = useApp();
  const product = products.find((p) => String(p.id) === String(id));

  React.useEffect(() => {
    if (!product) return;
    const upsertJsonLd = (sid, data) => {
      let el = document.head.querySelector(`script[type="application/ld+json"]#${sid}`);
      if (!el) {
        el = document.createElement("script");
        el.type = "application/ld+json";
        el.id = sid;
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    };
    const origin = window.location.origin;
    const url = origin + `/products/${product.id}`;
    const json = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": product.image,
      "description": product.description,
      "category": product.category,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviews
      },
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": "USD",
        "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": url
      }
    };
    upsertJsonLd("ld-product-detail", json);
  }, [product, t]);

  if (!product) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400">The requested product does not exist.</p>
      </div>
    );
  }

  const handleAdd = () => addToCart(product);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img src={product.image} alt={product.name} className="w-full h-auto object-cover" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
          <p className="text-gray-700 dark:text-gray-300">{product.description}</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">${product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
            )}
          </div>
          <div>
            <span className={`inline-block px-3 py-1 rounded text-sm ${product.inStock ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              product.inStock ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
