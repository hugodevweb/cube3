import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { venteApi, type Order } from '../api/vente';

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'var(--gold)',
  confirmed: '#4caf50',
  cancelled: 'var(--bone-dim)',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    venteApi
      .getOrders()
      .then(setOrders)
      .catch(() => setError('Impossible de charger vos commandes.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: 'var(--ink)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <h1 className="display-lg">Mes commandes</h1>
          <div className="section-rule" aria-hidden="true" />
        </div>

        {loading && <p style={stateMsg}>Chargement…</p>}
        {error && <p style={{ ...stateMsg, color: 'var(--blood-bright)' }}>{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ ...stateMsg, padding: 0, marginBottom: '1.5rem' }}>
              Vous n'avez pas encore passé de commande.
            </p>
            <Link to="/catalogue" className="btn-primary">Découvrir la boutique</Link>
          </div>
        )}

        {orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => (
              <div key={order.id} style={orderCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-dim)', marginBottom: '0.25rem' }}>
                      Commande #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--bone-dim)' }}>
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: STATUS_COLORS[order.status], border: `1px solid ${STATUS_COLORS[order.status]}`, padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--bone-dim)' }}>
                      <span>{item.quantity}× Produit</span>
                      <span>{(Number(item.unitPrice) * item.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--ash-mid)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)' }}>
                    {Number(order.total).toFixed(2)} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const stateMsg: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  color: 'var(--bone-dim)',
  padding: '3rem 0',
  textAlign: 'center',
};

const orderCard: React.CSSProperties = {
  background: 'var(--ink-light)',
  border: '1px solid var(--ash-mid)',
  borderRadius: 'var(--radius)',
  padding: '1.5rem',
};
