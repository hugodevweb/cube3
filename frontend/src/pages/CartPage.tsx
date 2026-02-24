import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { venteApi } from '../api/vente';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  async function handlePlaceOrder() {
    setError('');
    setPlacing(true);
    try {
      await venteApi.createOrder(
        items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      );
      clearCart();
      navigate('/orders');
    } catch {
      setError('Une erreur est survenue lors de la commande. Veuillez réessayer.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: 'var(--ink)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <h1 className="display-lg">Panier</h1>
          <div className="section-rule" aria-hidden="true" />
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--bone-dim)', marginBottom: '1.5rem' }}>
              Votre panier est vide.
            </p>
            <Link to="/catalogue" className="btn-primary">
              Parcourir la boutique
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '2rem' }}>
              {items.map(({ product, quantity }) => (
                <div key={product.id} style={cartRow}>
                  <div style={{ flex: 1 }}>
                    <Link to={`/catalogue/${product.id}`} style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.05em', color: 'var(--bone)', textDecoration: 'none' }}>
                      {product.name}
                    </Link>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--bone-dim)', marginTop: '0.2rem' }}>
                      {Number(product.price).toFixed(2)} € / unité
                    </p>
                  </div>

                  <div style={qtyControl}>
                    <button onClick={() => updateQuantity(product.id, quantity - 1)} style={qtyBtn} aria-label="Diminuer">−</button>
                    <span style={{ minWidth: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.85rem' }}>{quantity}</span>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)} style={qtyBtn} aria-label="Augmenter">+</button>
                  </div>

                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--gold)', minWidth: '80px', textAlign: 'right' }}>
                    {(Number(product.price) * quantity).toFixed(2)} €
                  </span>

                  <button
                    onClick={() => removeFromCart(product.id)}
                    style={removeBtn}
                    aria-label={`Supprimer ${product.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={summary}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>
                  Total
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--gold)' }}>
                  {total.toFixed(2)} €
                </span>
              </div>

              {error && (
                <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--blood-bright)', marginBottom: '1rem' }}>
                  {error}
                </p>
              )}

              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? 'Traitement…' : 'Passer la commande'}
              </button>

              <Link
                to="/catalogue"
                style={{ display: 'block', marginTop: '1rem', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-dim)', textDecoration: 'none' }}
              >
                ← Continuer mes achats
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const cartRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  padding: '1.25rem 0',
  borderBottom: '1px solid var(--ash)',
};

const qtyControl: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius-sm)',
  padding: '0.2rem 0.4rem',
};

const qtyBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bone)',
  cursor: 'pointer',
  fontSize: '1rem',
  padding: '0.2rem 0.4rem',
  lineHeight: 1,
};

const removeBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bone-dim)',
  cursor: 'pointer',
  fontSize: '0.9rem',
  padding: '0.3rem',
};

const summary: React.CSSProperties = {
  background: 'var(--ink-light)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius)',
  padding: '2rem',
  marginTop: '1rem',
};
