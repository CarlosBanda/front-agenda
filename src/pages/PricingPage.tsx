import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as subscriptionsApi from '../api/subscriptions';
import * as businessesApi from '../api/businesses';
import type { Plan } from '../api/subscriptions';
import type { Business } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Check } from 'lucide-react';

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPlanId, setCheckoutPlanId] = useState<number | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null,
  );
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      showToast(
        'Pago recibido. Tu suscripción se activará al confirmar Stripe.',
        'success',
      );
    } else if (checkout === 'cancelled') {
      showToast('Checkout cancelado; no se realizó ningún cargo.', 'info');
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    if (user?.role !== 'BUSINESS') {
      setMyBusinesses([]);
      setSelectedBusinessId(null);
      return;
    }

    let cancelled = false;
    void businessesApi
      .getMine()
      .then((businesses) => {
        if (cancelled) return;
        setMyBusinesses(businesses);
        setSelectedBusinessId((current) => {
          if (businesses.length === 1) return businesses[0].id;
          return businesses.some((business) => business.id === current)
            ? current
            : null;
        });
      })
      .catch(() => {
        if (!cancelled) {
          showToast('No se pudieron cargar tus negocios.', 'error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.role, showToast]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await subscriptionsApi.getPlans();
        // Sort by sortOrder
        const sorted = data.sort((a, b) => a.sortOrder - b.sortOrder);
        setPlans(sorted);
      } catch {
        setError('No se pudieron cargar los planes. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const formatPrice = (plan: Plan): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: plan.currency,
      minimumFractionDigits: 2,
    }).format(Number(plan.price));
  };

  const formatBillingInterval = (plan: Plan): string => {
    return plan.billingInterval === 'YEAR' ? '/año' : '/mes';
  };

  const formatLimit = (value: number, label: string): string => {
    return value === 0 ? `Ilimitado ${label}` : `Hasta ${value} ${label}`;
  };

  const getRecommendedIndex = (plans: Plan[]): number => {
    if (plans.length <= 1) return -1;
    if (plans.length === 2) return 1;
    // Middle plan or sortOrder-based: second plan (index 1)
    return Math.floor(plans.length / 2);
  };

  const getBusinessId = async (): Promise<number | null> => {
    const businesses =
      myBusinesses.length > 0 ? myBusinesses : await businessesApi.getMine();
    if (businesses.length === 0) {
      showToast('Primero crea tu negocio para contratar un plan.', 'warning');
      navigate('/mi-negocio');
      return null;
    }
    const selected =
      selectedBusinessId ?? (businesses.length === 1 ? businesses[0].id : null);
    if (!selected) {
      showToast('Selecciona el negocio que contratará el plan.', 'warning');
      return null;
    }
    return selected;
  };

  const handleCTA = async (plan: Plan) => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (user.role !== 'BUSINESS') {
      showToast('Los planes de suscripción son para cuentas de negocio.', 'info');
      return;
    }

    setCheckoutPlanId(plan.id);
    try {
      const businessId = await getBusinessId();
      if (!businessId) return;
      const { url } = await subscriptionsApi.createCheckoutSession(
        businessId,
        plan.id,
      );
      window.location.assign(url);
    } catch {
      showToast(
        'No se pudo iniciar el pago. Si ya tienes suscripción, adminístrala en el portal.',
        'error',
      );
    } finally {
      setCheckoutPlanId(null);
    }
  };

  const handlePortal = async () => {
    if (user?.role !== 'BUSINESS') return;
    setPortalLoading(true);
    try {
      const businessId = await getBusinessId();
      if (!businessId) return;
      const { url } = await subscriptionsApi.createPortalSession(businessId);
      window.location.assign(url);
    } catch {
      showToast('Aún no hay una suscripción Stripe que administrar.', 'info');
    } finally {
      setPortalLoading(false);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#fdf2f8',
      padding: '3rem 1rem',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      textAlign: 'center',
      marginBottom: '3rem',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 800,
      background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '1.15rem',
      color: '#555',
      fontWeight: 400,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem',
      alignItems: 'stretch',
    },
    cardRecommended: {
      border: '3px solid transparent',
      borderImage: 'linear-gradient(135deg, #e91e8c, #9c27b0) 1',
      position: 'relative' as const,
      transform: 'scale(1.03)',
    },
    badge: {
      position: 'absolute' as const,
      top: '-14px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
      color: '#fff',
      padding: '0.3rem 1.2rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: 700,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap' as const,
    },
    planName: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#1a1a2e',
      marginBottom: '0.5rem',
      textAlign: 'center' as const,
    },
    priceContainer: {
      textAlign: 'center' as const,
      margin: '1rem 0',
    },
    price: {
      fontSize: '2.2rem',
      fontWeight: 800,
      color: '#1a1a2e',
    },
    priceLabel: {
      fontSize: '0.95rem',
      color: '#666',
      fontWeight: 400,
    },
    duration: {
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      color: '#888',
      marginBottom: '1.2rem',
    },
    description: {
      fontSize: '0.9rem',
      color: '#555',
      textAlign: 'center' as const,
      marginBottom: '1.2rem',
      lineHeight: 1.5,
    },
    divider: {
      height: '1px',
      backgroundColor: '#eee',
      margin: '1rem 0',
    },
    featureList: {
      listStyle: 'none',
      padding: 0,
      margin: '1rem 0',
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      marginBottom: '0.6rem',
      fontSize: '0.9rem',
      color: '#1a1a2e',
    },
    checkIcon: {
      color: '#e91e8c',
      flexShrink: 0,
    },
    limits: {
      margin: '1rem 0',
      padding: '0.8rem',
      backgroundColor: '#fdf2f8',
      borderRadius: '8px',
    },
    limitItem: {
      fontSize: '0.85rem',
      color: '#555',
      marginBottom: '0.3rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    ctaContainer: {
      marginTop: '1.5rem',
      textAlign: 'center' as const,
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '4rem 2rem',
      color: '#888',
      fontSize: '1.2rem',
    },
    errorState: {
      textAlign: 'center' as const,
      padding: '2rem',
      color: '#dc2626',
      fontSize: '1rem',
    },
    loggedInInfo: {
      textAlign: 'center' as const,
      fontSize: '0.85rem',
      color: '#888',
      marginTop: '0.5rem',
    },
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>Planes y Precios</h1>
          </div>
          <p style={styles.errorState}>{error}</p>
        </div>
      </div>
    );
  }

  const recommendedIndex = getRecommendedIndex(plans);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Planes y Precios</h1>
          <p style={styles.subtitle}>Elige el plan perfecto para tu negocio</p>
          {user?.role === 'BUSINESS' && (
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              {myBusinesses.length > 1 ? (
                <label style={{ color: '#374151', fontWeight: 600 }}>
                  Negocio:{' '}
                  <select
                    value={selectedBusinessId ?? ''}
                    onChange={(event) =>
                      setSelectedBusinessId(
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    style={{
                      marginLeft: '0.4rem',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                    }}
                  >
                    <option value="" disabled>
                      Selecciona un negocio
                    </option>
                    {myBusinesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : myBusinesses.length === 1 ? (
                <span style={{ color: '#4b5563' }}>
                  Negocio: <strong>{myBusinesses[0].name}</strong>
                </span>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => void handlePortal()}
                disabled={portalLoading}
              >
                {portalLoading
                  ? 'Abriendo portal...'
                  : 'Administrar suscripción'}
              </Button>
            </div>
          )}
        </div>

        {plans.length === 0 ? (
          <p style={styles.emptyState}>Próximamente disponible</p>
        ) : (
          <div style={styles.grid}>
            {plans.map((plan, index) => {
              const isRecommended = index === recommendedIndex;

              return (
                <div
                  key={plan.id}
                  style={{ position: 'relative', display: 'flex' }}
                >
                  {isRecommended && (
                    <div style={styles.badge}>Recomendado</div>
                  )}
                  <Card
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      ...(isRecommended
                        ? {
                            border: '3px solid transparent',
                            borderImage: 'linear-gradient(135deg, #e91e8c, #9c27b0) 1',
                            paddingTop: '2rem',
                          }
                        : {}),
                    }}
                  >
                    <h2 style={styles.planName}>{plan.name}</h2>

                    <div style={styles.priceContainer}>
                      <span style={styles.price}>{formatPrice(plan)}</span>
                      <span style={styles.priceLabel}>
                        {formatBillingInterval(plan)}
                      </span>
                    </div>

                    <p style={styles.duration}>
                      Facturación{' '}
                      {plan.billingInterval === 'YEAR' ? 'anual' : 'mensual'}
                    </p>

                    {plan.description && (
                      <p style={styles.description}>{plan.description}</p>
                    )}

                    <div style={styles.divider} />

                    {(plan.features ?? []).length > 0 && (
                      <ul style={styles.featureList}>
                        {(plan.features ?? []).map((feature, fIdx) => (
                          <li key={fIdx} style={styles.featureItem}>
                            <Check size={16} style={styles.checkIcon} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div style={styles.limits}>
                      <div style={styles.limitItem}>
                        <Check size={14} style={styles.checkIcon} />
                        <span>{formatLimit(plan.maxServices, 'servicios')}</span>
                      </div>
                      <div style={styles.limitItem}>
                        <Check size={14} style={styles.checkIcon} />
                        <span>{formatLimit(plan.maxStaff, 'staff')}</span>
                      </div>
                      <div style={styles.limitItem}>
                        <Check size={14} style={styles.checkIcon} />
                        <span>{formatLimit(plan.maxAppointmentsPerMonth, 'citas/mes')}</span>
                      </div>
                    </div>

                    <div style={{ flex: 1 }} />

                    <div style={styles.ctaContainer}>
                      <Button
                        variant={isRecommended ? 'primary' : 'secondary'}
                        fullWidth
                        disabled={checkoutPlanId !== null}
                        onClick={() => void handleCTA(plan)}
                      >
                        {checkoutPlanId === plan.id
                          ? 'Abriendo pago...'
                          : !user
                            ? 'Comenzar'
                            : user.role === 'BUSINESS'
                              ? 'Suscribirme'
                              : 'Plan para negocios'}
                      </Button>
                      {user?.role === 'CLIENT' && (
                        <p style={styles.loggedInInfo}>
                          Usa una cuenta de negocio para contratar un plan
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPage;
