import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { products, categories } from '../data/products';
import ProductCard from '../components/ProductCard';
import { useApp } from '../state/AppContext';

export default function Products() {
  const { reducedMotion, t } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const { category } = useParams();
  const navigate = useNavigate();
  const LAST_CATEGORY_KEY = 'pf_last_category';
  const initialized = useRef(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating);
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!category) {
      try {
        const stored = JSON.parse(localStorage.getItem(LAST_CATEGORY_KEY) || '"All"');
        if (stored && stored !== 'All') {
          setSelectedCategory(stored);
          navigate(`/products/category/${encodeURIComponent(stored)}`, { replace: true });
        }
      } catch {}
    }
  }, [category, navigate]);

  useEffect(() => {
    if (category) {
      const decoded = decodeURIComponent(category);
      if (selectedCategory !== decoded) setSelectedCategory(decoded);
      try { localStorage.setItem(LAST_CATEGORY_KEY, JSON.stringify(decoded)); } catch {}
    } else {
      try { localStorage.setItem(LAST_CATEGORY_KEY, JSON.stringify(selectedCategory)); } catch {}
    }
  }, [category, selectedCategory]);

  React.useEffect(() => {
    const origin = window.location.origin;
    const pagePath = category ? `/products/category/${encodeURIComponent(category)}` : "/products";
    const pageUrl = origin + pagePath;
    const upsertJsonLd = (id, data) => {
      let el = document.head.querySelector(`script[type="application/ld+json"]#${id}`);
      if (!el) {
        el = document.createElement("script");
        el.type = "application/ld+json";
        el.id = id;
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    };
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": t("products_heading"),
      "itemListElement": sortedProducts.slice(0, 8).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: pageUrl + "#product-" + p.id,
        name: p.name
      }))
    };
    const graph = [
      itemList,
      ...sortedProducts.slice(0, 8).map((p) => ({
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": pageUrl + "#product-" + p.id,
        "name": p.name,
        "image": p.image,
        "description": p.description,
        "category": p.category,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": p.rating,
          "reviewCount": p.reviews
        },
        "offers": {
          "@type": "Offer",
          "price": p.price,
          "priceCurrency": "USD",
          "availability": p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "url": pageUrl + "#product-" + p.id
        }
      }))
    ];
    const json = { "@graph": graph };
    upsertJsonLd("ld-products", json);
  }, [sortedProducts, t, category]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('products_heading')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('products_subtitle')}
          </p>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Search Bar */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_products_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap gap-4 items-center justify-between md:justify-end">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  try { localStorage.setItem(LAST_CATEGORY_KEY, JSON.stringify(category)); } catch {}
                  if (category === 'All') {
                    navigate('/products', { replace: true });
                    toast.success('Cleared category filter');
                  } else {
                    navigate(`/products/category/${encodeURIComponent(category)}`, { replace: true });
                    toast.success(`Category set to ${category}`);
                  }
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
            {selectedCategory !== 'All' && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  try { localStorage.setItem(LAST_CATEGORY_KEY, JSON.stringify('All')); } catch {}
                  navigate('/products', { replace: true });
                  toast.success('Cleared category filter');
                }}
                className="ml-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                aria-label="Clear category"
              >
                Clear category
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[140px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <motion.div 
        layout={!reducedMotion}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence>
          {sortedProducts.map((product) => (
            <motion.div
              layout={!reducedMotion}
              key={product.id}
              initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* No Products Found */}
      {sortedProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 text-lg">
            No products found matching your criteria.
          </div>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchTerm('');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
