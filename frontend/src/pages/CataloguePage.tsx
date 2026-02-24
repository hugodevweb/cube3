import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { venteApi, type Product, type ProductType } from '../api/vente';
import { useCart } from '../context/CartContext';

const TYPE_LABELS: Record<ProductType, string> = {
  film: 'Film',
  bd: 'BD',
  goodie: 'Goodie',
};

const TYPE_ICONS: Record<ProductType, string> = {
  film: '🎬',
  bd: '📚',
  goodie: '🎭',
};

export default function CataloguePage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProductType | ''>('');
  const [added, setAdded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    venteApi
      .getProducts({
        search: search || undefined,
        type: typeFilter || undefined,
      })
      .then(setProducts)
      .catch(() => setError('Impossible de charger les produits.'))
      .finally(() => setLoading(false));
  }, [search, typeFilter]);

  function handleAdd(product: Product) {
    addToCart(product);
    setAdded((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product.id]: false })), 1500);
  }

  return (
    <div className="section" style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <div className="container">
        <div className="section-header">
          <h1 className="display-lg">Boutique</h1>
          <div className="section-rule" aria-hidden="true" />
        </div>

        {/* Filters */}
        <div style={filterBar}>
          <input
            type="search"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInput}
            aria-label="Rechercher un produit"
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={typeFilter === '' ? 'btn-sm' : 'btn-outline-sm'}
              onClick={() => setTypeFilter('')}
            >
              Tout
            </button>
            {(['film', 'bd', 'goodie'] as ProductType[]).map((t) => (
              <button
                key={t}
                className={typeFilter === t ? 'btn-sm' : 'btn-outline-sm'}
                onClick={() => setTypeFilter(t)}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {loading && <p style={stateMsg}>Chargement…</p>}
        {error && <p style={{ ...stateMsg, color: 'var(--blood-bright)' }}>{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p style={stateMsg}>Aucun produit trouvé.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="boutique-grid" style={{ padding: 0, marginTop: '2rem' }}>
            {products.map((product, i) => (
              <article
                key={product.id}
                className={`product-card animate-in animate-in-${Math.min(i + 1, 6)}`}
                aria-label={product.name}
              >
                <Link to={`/catalogue/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="product-image-placeholder" aria-hidden="true">
                    <span style={{ fontSize: '4rem' }}>
                      {TYPE_ICONS[product.type]}
                    </span>
                  </div>
                  <div className="product-image-overlay" aria-hidden="true" />
                </Link>
                <span className="product-badge">{TYPE_LABELS[product.type]}</span>
                {product.stock === 0 && (
                  <span
                    className="product-badge"
                    style={{ top: '3rem', background: 'var(--ash-mid)', color: 'var(--bone-dim)' }}
                  >
                    Épuisé
                  </span>
                )}
                <div className="product-body">
                  <h3 className="product-title">
                    <Link to={`/catalogue/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {product.name}
                    </Link>
                  </h3>
                  {product.description && (
                    <p className="product-meta body-sm" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </p>
                  )}
                  <div className="product-footer">
                    <span className="product-price">{Number(product.price).toFixed(2)} €</span>
                    <button
                      className="btn-sm"
                      type="button"
                      style={{ width: 'auto', padding: '0.5rem 1rem' }}
                      disabled={product.stock === 0}
                      onClick={() => handleAdd(product)}
                    >
                      {added[product.id] ? '✓ Ajouté' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const filterBar: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: '1rem',
};

const searchInput: React.CSSProperties = {
  background: 'var(--ash)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--bone)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  padding: '0.55rem 0.85rem',
  outline: 'none',
  minWidth: '220px',
};

const stateMsg: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--bone-dim)',
  padding: '3rem 0',
  textAlign: 'center',
};
