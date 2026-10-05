import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as businessesApi from '../api/businesses';
import * as onboardingApi from '../api/onboarding';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import type {
  ImportResult,
  OnboardingState,
  UpdateOnboardingDto,
} from '../types';
import {
  CheckCircle2,
  Circle,
  Download,
  FileUp,
  Rocket,
} from 'lucide-react';

// Keep in sync with backend CRM_IMPORT_MAX_ROWS default.
const IMPORT_MAX_ROWS = 1000;
const CSV_TEMPLATE =
  'name,phone,email,notes,tags\n' +
  'Ana López,5512345678,ana@example.com,Cliente frecuente,VIP;Corte\n' +
  'Juan Pérez,5598765432,juan@example.com,,Barba\n';

type ChecklistKey = keyof UpdateOnboardingDto;

const CHECKLIST: {
  key: ChecklistKey;
  label: string;
  description: string;
  path: string;
}[] = [
  {
    key: 'profileCompleted',
    label: 'Completa el perfil del negocio',
    description: 'Nombre, dirección, teléfono e imagen.',
    path: '/mi-negocio',
  },
  {
    key: 'servicesConfigured',
    label: 'Configura tus servicios',
    description: 'Define servicios, precios y duración.',
    path: '/servicios',
  },
  {
    key: 'scheduleConfigured',
    label: 'Define tus horarios',
    description: 'Establece los días y horas de atención.',
    path: '/horarios',
  },
  {
    key: 'staffConfigured',
    label: 'Agrega tu staff',
    description: 'Registra a los miembros de tu equipo.',
    path: '/staff',
  },
  {
    key: 'policiesConfigured',
    label: 'Define políticas de anticipo y cancelación',
    description: 'Configura anticipos y cargos por cancelación.',
    path: '/politicas',
  },
  {
    key: 'clientsImported',
    label: 'Importa tus clientes',
    description: 'Carga tu base de clientes desde un CSV.',
    path: '/clientes',
  },
  {
    key: 'remindersReviewed',
    label: 'Revisa los recordatorios',
    description: 'Configura recordatorios por WhatsApp.',
    path: '/recordatorios',
  },
];

const OnboardingPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [fileName, setFileName] = useState('');
  const [csvText, setCsvText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const init = useCallback(async () => {
    try {
      const businesses = await businessesApi.getMine();
      if (businesses.length > 0) {
        const bid = businesses[0].id;
        setBusinessId(bid);
        setState(await onboardingApi.getState(bid));
      }
    } catch (error) {
      console.error('Error loading onboarding:', error);
      showToast('No se pudo cargar el onboarding', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void init();
  }, [init]);

  const toggle = async (key: ChecklistKey, value: boolean) => {
    if (!businessId) return;
    try {
      const dto: UpdateOnboardingDto = { [key]: value };
      const updated = await onboardingApi.updateState(businessId, dto);
      setState(updated);
    } catch {
      showToast('No se pudo actualizar el paso', 'error');
    }
  };

  const onFileSelected = (file: File) => {
    if (file.size > 1_000_000) {
      setFileName('');
      setCsvText('');
      showToast('El archivo excede el límite de 1 MB', 'warning');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => showToast('No se pudo leer el archivo', 'error');
    reader.readAsText(file);
  };

  const runImport = async () => {
    if (!businessId || !csvText.trim()) {
      showToast('Selecciona un archivo CSV primero', 'warning');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const response = await onboardingApi.importClients(businessId, {
        content: csvText,
        hasHeader,
      });
      setImportResult(response.import);
      setState(response.onboarding);
      showToast(
        `Importación completada: ${response.import.created} creados`,
        'success',
      );
    } catch (error) {
      console.error('Error importing clients:', error);
      showToast('Error al importar. Revisa el formato del CSV.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-clientes.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  if (!businessId || !state) {
    return (
      <div style={styles.container}>
        <Card>
          <div style={styles.emptyState}>
            <Rocket size={48} color="#e91e8c" />
            <p style={styles.emptyText}>
              No tienes un negocio registrado todavía.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const completedCount = CHECKLIST.filter((c) => state[c.key]).length;
  const progress = Math.round((completedCount / CHECKLIST.length) * 100);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Primeros pasos</h1>
        <p style={styles.subtitle}>
          Completa la configuración para aprovechar tu agenda al máximo.
        </p>
      </div>

      {/* Progress */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>
            Progreso: {completedCount} de {CHECKLIST.length}
          </span>
          <span style={styles.progressPct}>{progress}%</span>
        </div>
        <div
          style={styles.progressTrack}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        {state.status === 'COMPLETED' && (
          <p style={styles.completedNote}>
            🎉 ¡Onboarding completado! Tu negocio está listo.
          </p>
        )}
      </Card>

      {/* Checklist */}
      <div style={styles.list}>
        {CHECKLIST.map((item) => {
          const done = Boolean(state[item.key]);
          return (
            <Card key={item.key}>
              <div style={styles.checkItem}>
                <button
                  style={styles.checkToggle}
                  onClick={() => toggle(item.key, !done)}
                  aria-label={
                    done ? `Marcar "${item.label}" como pendiente` : `Marcar "${item.label}" como hecho`
                  }
                  aria-pressed={done}
                >
                  {done ? (
                    <CheckCircle2 size={24} color="#10b981" />
                  ) : (
                    <Circle size={24} color="#d1d5db" />
                  )}
                </button>
                <div style={styles.checkBody}>
                  <span
                    style={{
                      ...styles.checkLabel,
                      textDecoration: done ? 'line-through' : 'none',
                      color: done ? '#9ca3af' : '#1a1a2e',
                    }}
                  >
                    {item.label}
                  </span>
                  <span style={styles.checkDesc}>{item.description}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(item.path)}
                >
                  Ir
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* CSV Import */}
      <Card style={{ marginTop: '1.5rem' }}>
        <h2 style={styles.sectionTitle}>Importar clientes desde CSV</h2>
        <ul style={styles.instructions}>
          <li>
            Columnas admitidas: <code>name</code>, <code>phone</code>,{' '}
            <code>email</code>, <code>notes</code>, <code>tags</code>.
          </li>
          <li>
            Separa varias etiquetas con <code>;</code> o <code>|</code> (ej.{' '}
            <code>VIP;Corte</code>).
          </li>
          <li>Máximo {IMPORT_MAX_ROWS} filas por importación.</li>
          <li>
            Los duplicados (por teléfono o email) se omiten automáticamente. No
            se crean cuentas de usuario.
          </li>
        </ul>

        <div style={styles.importActions}>
          <Button variant="secondary" onClick={downloadTemplate}>
            <Download size={16} /> Descargar plantilla
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelected(file);
            }}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <FileUp size={16} /> Seleccionar archivo
          </Button>
          {fileName && <span style={styles.fileName}>{fileName}</span>}
        </div>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
          />
          El archivo incluye fila de encabezados
        </label>

        {csvText && (
          <div style={styles.importActions}>
            <Button onClick={runImport} disabled={importing}>
              {importing ? 'Importando…' : 'Importar clientes'}
            </Button>
          </div>
        )}

        {importResult && (
          <div style={styles.resultBox}>
            <h3 style={styles.resultTitle}>Resultado de la importación</h3>
            <div style={styles.resultGrid}>
              <ResultStat label="Filas" value={importResult.totalRows} />
              <ResultStat label="Creados" value={importResult.created} />
              <ResultStat
                label="Dup. en archivo"
                value={importResult.duplicatesInFile}
              />
              <ResultStat
                label="Dup. en BD"
                value={importResult.duplicatesInDb}
              />
              <ResultStat label="Inválidos" value={importResult.invalid} />
              <ResultStat
                label="Etiquetas nuevas"
                value={importResult.tagsCreated}
              />
            </div>
            {importResult.errors.length > 0 && (
              <div style={styles.errorList}>
                {importResult.errors.slice(0, 10).map((err, i) => (
                  <p key={i} style={styles.errorItem}>
                    Fila {err.row}: {err.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

const ResultStat: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div style={styles.resultStat}>
    <span style={styles.resultStatValue}>{value}</span>
    <span style={styles.resultStatLabel}>{label}</span>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '820px', margin: '0 auto' },
  header: { marginBottom: '1.25rem' },
  title: { fontSize: '2rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: '#6b7280', marginTop: '0.2rem' },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  progressLabel: { fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' },
  progressPct: { fontSize: '0.9rem', fontWeight: 700, color: '#e91e8c' },
  progressTrack: {
    height: '10px',
    background: '#f3d4e6',
    borderRadius: '20px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
    borderRadius: '20px',
    transition: 'width 0.3s ease',
  },
  completedNote: {
    marginTop: '0.75rem',
    fontSize: '0.9rem',
    color: '#065f46',
    fontWeight: 600,
  },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  checkItem: { display: 'flex', alignItems: 'center', gap: '1rem' },
  checkToggle: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    flexShrink: 0,
  },
  checkBody: { display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 },
  checkLabel: { fontSize: '0.98rem', fontWeight: 600 },
  checkDesc: { fontSize: '0.82rem', color: '#6b7280' },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '0.75rem',
  },
  instructions: {
    listStyle: 'disc',
    paddingLeft: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    color: '#374151',
    fontSize: '0.86rem',
    marginBottom: '1rem',
  },
  importActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
  },
  fileName: { fontSize: '0.85rem', color: '#6b7280' },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.88rem',
    color: '#1a1a2e',
    marginBottom: '0.75rem',
  },
  resultBox: {
    marginTop: '1rem',
    padding: '1rem',
    background: '#fdf2f8',
    borderRadius: '12px',
  },
  resultTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '0.75rem',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
    gap: '0.6rem',
  },
  resultStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#fff',
    borderRadius: '10px',
    padding: '0.6rem 0.4rem',
  },
  resultStatValue: { fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e' },
  resultStatLabel: { fontSize: '0.72rem', color: '#6b7280', textAlign: 'center' },
  errorList: {
    marginTop: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  errorItem: { fontSize: '0.8rem', color: '#991b1b' },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '3rem 1rem',
  },
  emptyText: { fontSize: '0.95rem', color: '#6b7280', margin: 0 },
};

export default OnboardingPage;
