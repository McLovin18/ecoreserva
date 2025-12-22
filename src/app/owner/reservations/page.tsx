'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import TopbarMobile from '../../components/TopbarMobile';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/adminContext';
import { Reservation, ReservationStatus, reservationService } from '../../services/reservationService';

const statusLabel: Record<ReservationStatus, { label: string; variant: string }> = {
  pending_admin: { label: 'Pendiente confirmación anfitrión', variant: 'warning' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'danger' },
  cancelled: { label: 'Cancelada', variant: 'secondary' },
  checked_in: { label: 'Check-in realizado', variant: 'info' },
  checked_out: { label: 'Check-out realizado', variant: 'primary' },
  completed: { label: 'Completada', variant: 'success' }
};

export default function OwnerReservationsPage() {
  const { user } = useAuth();
  const { isOwner } = useRole();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email && isOwner) {
      loadReservations();
    } else {
      setLoading(false);
    }
  }, [user?.email, isOwner]);

  const loadReservations = async () => {
    if (!user?.email) return;
    setLoading(true);
    const data = await reservationService.getReservationsForOwner(user.email);
    // Ordenar más recientes primero
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setReservations(data);
    setLoading(false);
  };

  const handleStatusChange = async (reservationId: string, status: ReservationStatus) => {
    try {
      setUpdating(reservationId);
      await reservationService.updateReservationStatus(reservationId, status);
      await loadReservations();
    } finally {
      setUpdating(null);
    }
  };

  if (!user || !isOwner) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          Debes iniciar sesión como <strong>dueño de departamentos</strong> para ver tus reservas.
        </Alert>
      </Container>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <TopbarMobile />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1 w-100" style={{ backgroundColor: 'var(--cosmetic-secondary)' }}>
          <Container className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
              <div>
                <h1 className="fw-bold mb-1">Reservas de mis departamentos</h1>
                <p className="text-muted mb-0">Consulta y actualiza el estado de las reservas realizadas en tus propiedades.</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : reservations.length === 0 ? (
              <Alert variant="info" className="text-center">
                Aún no tienes reservas registradas.
              </Alert>
            ) : (
              <Row className="g-3">
                {reservations.map((reservation) => (
                  <Col md={6} key={reservation.id}>
                    <Card className="shadow-sm border-0 h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold mb-1">{reservation.propertyName}</h5>
                            <div className="small text-muted">Reserva #{reservation.id?.slice(-6)}</div>
                          </div>
                          <Badge bg={statusLabel[reservation.status].variant as any}>
                            {statusLabel[reservation.status].label}
                          </Badge>
                        </div>
                        <div className="small mb-2">
                          <div>
                            <strong>Cliente:</strong> {reservation.userName || reservation.userEmail}
                          </div>
                          <div>
                            <strong>Fechas:</strong> {new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Total:</strong> ${reservation.total.toFixed(2)}
                          </div>
                            {reservation.paymentMethod && (
                              <div>
                                <strong>Método de pago:</strong> {reservation.paymentMethod} ({reservation.paymentStatus || 'pendiente'})
                              </div>
                            )}
                          {reservation.notes && (
                            <div className="mt-1 text-muted">{reservation.notes}</div>
                          )}
                        </div>
                        <div className="d-flex gap-2 flex-wrap mt-2">
                            {reservation.status === 'pending_admin' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  disabled={updating === reservation.id}
                                  onClick={() => handleStatusChange(reservation.id!, 'approved')}
                                >
                                  Aceptar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  disabled={updating === reservation.id}
                                  onClick={() => handleStatusChange(reservation.id!, 'rejected')}
                                >
                                  Rechazar
                                </Button>
                              </>
                            )}
                          {reservation.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={updating === reservation.id}
                              onClick={() => handleStatusChange(reservation.id!, 'checked_in')}
                            >
                              Check-in
                            </Button>
                          )}
                          {reservation.status === 'checked_in' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={updating === reservation.id}
                              onClick={() => handleStatusChange(reservation.id!, 'checked_out')}
                            >
                              Check-out
                            </Button>
                          )}
                          {reservation.status === 'checked_out' && (
                            <Button
                              size="sm"
                              variant="success"
                              disabled={updating === reservation.id}
                              onClick={() => handleStatusChange(reservation.id!, 'completed')}
                            >
                              Marcar como completada
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Container>
        </main>
      </div>
    </div>
  );
}
