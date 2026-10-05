import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as businessesApi from '../api/businesses';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Business } from '../types';

const PAGE_SIZE = 9;

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const response = await businessesApi.getAll(page, PAGE_SIZE);
        setBusinesses(response.data);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error('Error fetching businesses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, [page]);

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdf2f8', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            color: '#1a1a2e',
            textAlign: 'center',
            marginBottom: '40px',
            fontWeight: 700,
          }}
        >
          Explorar Negocios
        </h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {businesses.map((business) => (
                <Card
                  key={business.id}
                  onClick={() => navigate(`/negocio/${business.id}`)}
                  style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    border: '1px solid transparent',
                  }}
                >
                  <h3 style={{ fontSize: '1.3rem', color: '#1a1a2e', margin: '0 0 8px 0' }}>
                    {business.name}
                  </h3>
                  {business.description && (
                    <p style={{ color: '#555', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                      {truncateText(business.description, 100)}
                    </p>
                  )}
                  {business.address && (
                    <p style={{ color: '#777', margin: '0 0 6px 0', fontSize: '0.9rem' }}>
                      📍 {business.address}
                    </p>
                  )}
                  {business.phone && (
                    <p style={{ color: '#777', margin: 0, fontSize: '0.9rem' }}>
                      📞 {business.phone}
                    </p>
                  )}
                </Card>
              ))}
            </div>

            {businesses.length === 0 && (
              <p style={{ textAlign: 'center', color: '#777', fontSize: '1.1rem' }}>
                No se encontraron negocios.
              </p>
            )}

            {/* Pagination */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginTop: '40px',
              }}
            >
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  backgroundColor: page === 1 ? '#ccc' : '#9c27b0',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Anterior
              </Button>
              <span style={{ color: '#1a1a2e', fontWeight: 600 }}>
                Página {page} de {totalPages}
              </span>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  backgroundColor: page === totalPages ? '#ccc' : '#9c27b0',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
