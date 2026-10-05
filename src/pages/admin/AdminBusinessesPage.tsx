import React, { useEffect, useState } from 'react';
import * as adminApi from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Business, PaginatedResponse } from '../../types';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminBusinessesPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toggling, setToggling] = useState<number | null>(null);
  const limit = 10;

  useEffect(() => {
    loadBusinesses();
  }, [page]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const res: PaginatedResponse<Business> = await adminApi.getBusinesses(page, limit);
      setBusinesses(res.data);
      setTotalPages(res.totalPages);
    } catch {
      showToast('Error al cargar negocios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    setToggling(id);
    try {
      const updated = await adminApi.toggleBusiness(id);
      setBusinesses((prev) =>
        prev.map((b) => (b.id === id ? updated : b))
      );
      showToast(
        `Negocio ${updated.isActive ? 'activado' : 'desactivado'} exitosamente`,
        'success'
      );
    } catch {
      showToast('Error al cambiar estado del negocio', 'error');
    } finally {
      setToggling(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: '#1a1a2e',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
    },
    th: {
      textAlign: 'left',
      padding: '1rem',
      backgroundColor: '#fdf2f8',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#1a1a2e',
      borderBottom: '1px solid #f3e8ff',
    },
    td: {
      padding: '1rem',
      fontSize: '0.9rem',
      color: '#374151',
      borderBottom: '1px solid #f3f4f6',
    },
    badgeActive: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: '#d1fae5',
      color: '#065f46',
    },
    badgeInactive: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    pagination: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '1.5rem',
    },
    pageBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    pageBtnDisabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
    pageInfo: {
      fontSize: '0.9rem',
      color: '#6b7280',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6b7280',
    },
  };

  if (loading && businesses.length === 0) return <LoadingSpinner />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gestión de Negocios</h1>
        <Building2 size={28} color="#e91e8c" />
      </div>

      {businesses.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No hay negocios registrados.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Dueño</th>
                  <th style={styles.th}>Teléfono</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Fecha Creación</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => (
                  <tr key={biz.id}>
                    <td style={styles.td}>{biz.name}</td>
                    <td style={styles.td}>{(biz as any).owner?.name ?? '—'}</td>
                    <td style={styles.td}>{biz.phone || '—'}</td>
                    <td style={styles.td}>
                      <span
                        style={
                          biz.isActive ? styles.badgeActive : styles.badgeInactive
                        }
                      >
                        {biz.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(biz.createdAt as string)}</td>
                    <td style={styles.td}>
                      <Button
                        size="sm"
                        variant={biz.isActive ? 'danger' : 'primary'}
                        disabled={toggling === biz.id}
                        onClick={() => handleToggle(biz.id)}
                      >
                        {toggling === biz.id
                          ? '...'
                          : biz.isActive
                          ? 'Desactivar'
                          : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <button
              style={{
                ...styles.pageBtn,
                ...(page <= 1 ? styles.pageBtnDisabled : {}),
              }}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={18} color="#1a1a2e" />
            </button>
            <span style={styles.pageInfo}>
              Página {page} de {totalPages}
            </span>
            <button
              style={{
                ...styles.pageBtn,
                ...(page >= totalPages ? styles.pageBtnDisabled : {}),
              }}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={18} color="#1a1a2e" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminBusinessesPage;
