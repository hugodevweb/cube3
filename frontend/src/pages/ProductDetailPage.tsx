import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { venteApi, type Product } from '../api/vente';
import { useCart } from '../context/CartContext';

const TYPE_ICONS: Record<string, string> = {
  film: '🎬',
  bd: '📚',
  goodie: '🎭',
};

const TYPE_LABELS: Record<string, string> = {
  film: 'Film',
  bd: 'BD',
  goodie: 'Goodie',
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    venteApi
      .getProduct(id)
      .then(setProduct)
      .catch(() => setError('Produit introuvable.'))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd() {
    if (!product) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: 'var(--ink)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <nav style={breadcrumb} aria-label="Fil d'Ariane">
          <Link to="/catalogue" style={crumbLink}>Boutique</Link>
          <span style={{ color: 'var(--bone-dim)', margin: '0 0.5rem' }}>›</span>
          <span style={{ color: 'var(--bone-dim)' }}>{product?.name ?? '…'}</span>
        </nav>

        {loading && <p style={stateMsg}>Chargement…</p>}
        {error && <p style={{ ...stateMsg, color: 'var(--blood-bright)' }}>{error}</p>}

        {product && (
          <div style={layout}>
            <div style={imageBox} aria-hidden="true">
              <span style={{ fontSize: '6rem' }}>{TYPE_ICONS[product.type]}</span>
            </div>

            <div style={info}>
              <span style={badge}>{TYPE_LABELS[product.type]}</span>
              <h1 style={title}>{product.name}</h1>

              {product.description && (
                <p style={description}>{product.description}</p>
              )}

              <div style={priceRow}>
                <span style={price}>{Number(product.price).toFixed(2)} €</span>
                <span style={{ color: product.stock > 0 ? 'var(--gold)' : 'var(--bone-dim)', fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {product.stock > 0 ? `${product.stock} en stock` : 'Épuisé'}
                </span>
              </div>

              {product.stock > 0 && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
                  <div style={qtyControl}>
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      style={qtyBtn}
                      aria-label="Diminuer"
                    >−</button>
                    <span style={{ minWidth: '2rem', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      style={qtyBtn}
                      aria-label="Augmenter"
                    >+</button>
                  </div>
                  <button className="btn-primary" onClick={handleAdd} style={{ flex: 1 }}>
                    {added ? '✓ Ajouté au panier' : 'Ajouter au panier'}
                  </button>
                </div>
              )}

              <Link to="/cart" style={{ display: 'block', marginTop: '1rem', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-dim)', textDecoration: 'none' }}>
                Voir le panier →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const breadcrumb: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'var(--font-display)',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '2.5rem',
};

const crumbLink: React.CSSProperties = {
  color: 'var(--gold)',
  textDecoration: 'none',
};

const layout: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '3rem',
  alignItems: 'start',
};

const imageBox: React.CSSProperties = {
  background: 'var(--ash)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius)',
  aspectRatio: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const info: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const badge: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.6rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--blood-bright)',
};

const title: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.8rem',
  letterSpacing: '0.04em',
  color: 'var(--bone)',
  lineHeight: 1.2,
};

const description: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  color: 'var(--bone-dim)',
  lineHeight: 1.7,
};

const priceRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '1rem',
  marginTop: '0.5rem',
};

const price: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.8rem',
  color: 'var(--gold)',
  letterSpacing: '0.04em',
};

const qtyControl: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius-sm)',
  padding: '0.25rem 0.5rem',
};

const qtyBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bone)',
  cursor: 'pointer',
  fontSize: '1.1rem',
  lineHeight: 1,
  padding: '0.2rem 0.5rem',
};

const stateMsg: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--bone-dim)',
  padding: '3rem 0',
  textAlign: 'center',
};
