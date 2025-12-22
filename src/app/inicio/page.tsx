'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container, Row, Col, Card, Button, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopbarMobile from '../components/TopbarMobile';
import Footer from '../components/Footer';
import { reservationService, type Reservation } from '../services/reservationService';
import { inventoryService, type ProductInventory } from '../services/inventoryService';
import { activityService, type Activity } from '../services/activityService';

const getSelectionKey = (email: string, propertyId: number) =>
  `eco_activities_${email}_${propertyId}`;

export default function InicioPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [property, setProperty] = useState<ProductInventory | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);

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
        setActiveReservation(current);

        if (current) {
          const [prop, acts] = await Promise.all([
            inventoryService.getProductById(current.propertyId),
            activityService.getActivitiesByProperty(current.propertyId),
          ]);

          setProperty(prop);
          setActivities(acts);

          if (typeof window !== 'undefined') {
            const key = getSelectionKey(user.email, current.propertyId);
            const raw = window.localStorage.getItem(key);
            if (raw) {
              try {
                const ids: string[] = JSON.parse(raw);
                const selected = acts.filter((a) => a.id && ids.includes(String(a.id)));
                setSelectedActivities(selected);
              } catch {
                // ignore parse errors
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

  const renderReservationCard = () => {
    if (!user) {
      return (
        <Card className="shadow-sm border-0 mb-3">
          <Card.Body className="text-center">
            <h5 className="fw-bold mb-2">Inicia sesión para comenzar</h5>
            <p className="text-muted mb-3">
              Crea una cuenta o inicia sesión para reservar hospedajes y acceder a
              actividades.
            </p>
            <Button as={Link as any} href="/auth/login" className="btn-cosmetic-primary">
              Iniciar sesión
            </Button>
          </Card.Body>
        </Card>
      );
    }

    if (!activeReservation) {
      return (
        <Card className="shadow-sm border-0 mb-3">
          <Card.Body className="text-center">
            <h5 className="fw-bold mb-2">Aún no has reservado un hospedaje</h5>
            <p className="text-muted mb-3">
              Para desbloquear actividades y servicios, primero realiza una reserva
              en EcoReserva.
            </p>
            <Button as={Link as any} href="/reservar" className="btn-cosmetic-primary">
              Reservar un hospedaje
            </Button>
          </Card.Body>
        </Card>
      );
    }

    const start = new Date(activeReservation.startDate);
    const end = new Date(activeReservation.endDate);
    const today = new Date();
    const diffMs = end.getTime() - today.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return (
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 className="fw-bold mb-1">
                Próxima reserva
                {property?.name ? ` en ${property.name}` : ''}
              </h5>
              <div className="small text-muted">
                Del {start.toLocaleDateString()} al {end.toLocaleDateString()}
              </div>
            </div>
            <Badge bg="success">Activa</Badge>
          </div>
          <div className="small mb-2">
            <strong>Personas:</strong> {activeReservation.guests || 1}
          </div>
          <div className="small mb-3">
            <strong>Finaliza en:</strong> {daysLeft} día{daysLeft === 1 ? '' : 's'}
          </div>
          <Button
            as={Link as any}
            href="/myReservations"
            variant="outline-secondary"
            size="sm"
          >
            Ver detalle de reserva
          </Button>
        </Card.Body>
      </Card>
    );
  };

  const renderActivitiesCard = () => {
    if (!user) return null;

    if (!activeReservation) {
      return (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center">
            <h5 className="fw-bold mb-2">Actividades bloqueadas</h5>
            <p className="text-muted mb-3">
              Reserva primero un hospedaje para ver y elegir actividades del hotel.
            </p>
            <Button as={Link as any} href="/reservar" className="btn-cosmetic-primary">
              Reservar ahora
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
            <p className="text-muted mb-3">
              Cuando el administrador o anfitrión agregue actividades, podrás verlas y
              seleccionarlas aquí.
            </p>
          </Card.Body>
        </Card>
      );
    }

    if (selectedActivities.length === 0) {
      return (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center">
            <h5 className="fw-bold mb-2">Aún no has elegido actividades</h5>
            <p className="text-muted mb-3">
              Explora las actividades disponibles en tu hospedaje y agrega las que te
              interesen a tu plan.
            </p>
            <Button as={Link as any} href="/actividades" className="btn-cosmetic-primary">
              Ver actividades disponibles
            </Button>
          </Card.Body>
        </Card>
      );
    }

    return (
      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold mb-0">Tus actividades</h5>
            <Badge bg="info">{selectedActivities.length} seleccionadas</Badge>
          </div>
          <ul className="mb-3">
            {selectedActivities.map((act) => (
              <li key={act.id} className="mb-1">
                <strong>{act.name}</strong>
                {act.price > 0 && (
                  <span className="text-muted small ms-2">
                    ${act.price.toFixed(2)} por persona
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Button
            as={Link as any}
            href="/actividades"
            variant="outline-secondary"
            size="sm"
          >
            Gestionar actividades
          </Button>
        </Card.Body>
      </Card>
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
            <Row className="g-3">
              <Col xs={12}>
                <h1 className="fw-bold mb-3">Inicio</h1>
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  renderReservationCard()
                )}
              </Col>
              <Col xs={12}>
                <h2 className="fw-bold mb-3" style={{ fontSize: '1.2rem' }}>
                  Actividades
                </h2>
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  renderActivitiesCard()
                )}
              </Col>
            </Row>
          </Container>
        </main>
      </div>
      <Footer />
    </div>
  );
}
