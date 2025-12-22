'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container, Row, Col, Card, Button, Spinner, Form, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopbarMobile from '../components/TopbarMobile';
import Footer from '../components/Footer';
import { reservationService, type Reservation } from '../services/reservationService';
import { activityService, type Activity } from '../services/activityService';

const getSelectionKey = (email: string, propertyId: number) =>
  `eco_activities_${email}_${propertyId}`;

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const reservations = await reservationService.getReservationsForUser(user.email);
        const today = new Date();

        const candidates = reservations.filter((r) => {
          if (r.status === 'cancelled' || r.status === 'rejected') return false;
          const end = new Date(r.endDate);
          return end.getTime() >= today.getTime();
        });

        candidates.sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

        const current = candidates[0] || null;
        setReservation(current);

        if (current) {
          const acts = await activityService.getActivitiesByProperty(current.propertyId);
          setActivities(acts);

          if (typeof window !== 'undefined') {
            const key = getSelectionKey(user.email, current.propertyId);
            const raw = window.localStorage.getItem(key);
            if (raw) {
              try {
                const ids: string[] = JSON.parse(raw);
                setSelectedIds(ids.map(String));
              } catch {
                // ignore parse error
              }
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.email]);

  const toggleActivity = (id?: string) => {
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(String(id))
        ? prev.filter((x) => x !== String(id))
        : [...prev, String(id)]
    );
  };

  const handleSave = async () => {
    if (!user?.email || !reservation) return;
    setSaving(true);
    try {
      if (typeof window !== 'undefined') {
        const key = getSelectionKey(user.email, reservation.propertyId);
        window.localStorage.setItem(key, JSON.stringify(selectedIds));
      }
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (!user) {
      return (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center">
            <h5 className="fw-bold mb-2">Inicia sesión para ver actividades</h5>
            <p className="text-muted mb-3">
              Debes iniciar sesión y tener una reserva activa para acceder a las
              actividades de un hotel.
            </p>
            <Button as={Link as any} href="/auth/login" className="btn-cosmetic-primary">
              Iniciar sesión
            </Button>
          </Card.Body>
        </Card>
      );
    }

    if (!reservation) {
      return (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center">
            <h5 className="fw-bold mb-2">Aún no tienes una reserva activa</h5>
            <p className="text-muted mb-3">
              Para ver y seleccionar actividades, primero reserva un hospedaje en
              EcoReserva.
            </p>
            <Button as={Link as any} href="/reservar" className="btn-cosmetic-primary">
              Reservar un hospedaje
            </Button>
          </Card.Body>
        </Card>
      );
    }

    if (activities.length === 0) {
      return (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center">
            <h5 className="fw-bold mb-2">Este hospedaje aún no tiene actividades</h5>
            <p className="text-muted mb-0">
              Cuando el administrador agregue actividades para este hotel, podrás
              verlas aquí.
            </p>
          </Card.Body>
        </Card>
      );
    }

    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);

    return (
      <>
        <Card className="shadow-sm border-0 mb-3">
          <Card.Body>
            <h5 className="fw-bold mb-1">Actividades para tu estancia</h5>
            <div className="small text-muted mb-1">
              Reserva del {start.toLocaleDateString()} al {end.toLocaleDateString()}
            </div>
            <p className="text-muted mb-0">
              Elige las actividades que te gustaría realizar durante tu estancia en este
              hotel. Esto no confirma el pago, pero te ayuda a planificar tu viaje.
            </p>
          </Card.Body>
        </Card>

        <Row className="g-3">
          {activities.map((act) => {
            const checked = act.id && selectedIds.includes(String(act.id));
            return (
              <Col key={act.id} xs={12} md={6} lg={4}>
                <Card className={`h-100 border-0 shadow-sm ${checked ? 'border border-success' : ''}`}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="fw-bold mb-1">{act.name}</h5>
                        {act.type && (
                          <Badge bg="primary" className="small">
                            {act.type}
                          </Badge>
                        )}
                      </div>
                      <Form.Check
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleActivity(act.id)}
                      />
                    </div>
                    {act.description && (
                      <p className="text-muted small mb-3">{act.description}</p>
                    )}
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">
                        {act.price > 0 ? `$${act.price.toFixed(2)} por persona` : 'Sin costo extra'}
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        <div className="d-flex justify-content-end mt-3">
          <Button
            variant="success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar selección'}
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <TopbarMobile />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main
          className="flex-grow-1 w-100"
          style={{ backgroundColor: 'var(--cosmetic-secondary)' }}
        >
          <Container className="py-4">
            <h1 className="fw-bold mb-3">Actividades</h1>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : (
              renderContent()
            )}
          </Container>
        </main>
      </div>
      <Footer />
    </div>
  );
}
