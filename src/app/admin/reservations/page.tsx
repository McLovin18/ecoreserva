'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import TopbarMobile from '../../components/TopbarMobile';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/adminContext';
import { Reservation, ReservationStatus, reservationService } from '../../services/reservationService';
import { departmentService } from '../../services/departmentService';

const statusVariant: Record<ReservationStatus, string> = {
  pending_admin: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'secondary',
  checked_in: 'info',
  checked_out: 'primary',
  completed: 'success'
};

const statusLabel: Record<ReservationStatus, string> = {
  pending_admin: 'Pendiente confirmación anfitrión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  checked_in: 'Check-in realizado',
  checked_out: 'Check-out realizado',
  completed: 'Completada'
};

export default function AdminReservationsPage() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingDepartments, setPendingDepartments] = useState<any[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [updatingDepartmentId, setUpdatingDepartmentId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }
    loadReservations();
    loadPendingDepartments();
  }, [user, isAdmin]);

  const loadReservations = async () => {
    setLoading(true);
    const data = await reservationService.getAllReservations();
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setReservations(data);
    setLoading(false);
  };

  const loadPendingDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const data = await departmentService.getPendingForAdmin();
      setPendingDepartments(data);
    } catch (err) {
      console.error('Error cargando departamentos pendientes', err);
      setPendingDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleDepartmentDecision = async (id: number, decision: 'Aprobado' | 'Rechazado') => {
    try {
      setUpdatingDepartmentId(id);
      await departmentService.updateDepartmentStatus(id, decision);
      await loadPendingDepartments();
    } finally {
      setUpdatingDepartmentId(null);
    }
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

  if (roleLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3 text-muted">Verificando permisos...</p>
      </Container>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          <h4>Acceso denegado</h4>
          <p>No tienes permisos para ver la gestión de reservas.</p>
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
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-light fw-semibold d-flex justify-content-between align-items-center">
                <span>Departamentos pendientes de aprobación</span>
                <Badge bg="secondary">{pendingDepartments.length}</Badge>
              </Card.Header>
              <Card.Body>
                {loadingDepartments ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : pendingDepartments.length === 0 ? (
                  <div className="text-muted small">No hay departamentos nuevos en revisión.</div>
                ) : (
                  <Row className="g-3">
                    {pendingDepartments.map((d) => (
                      <Col md={6} key={d.id}>
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h5 className="fw-bold mb-1">{d.name}</h5>
                                <div className="small text-muted">Hotel: {d.hotelName} (#{d.hotelId})</div>
                                <div className="small text-muted">Anfitrión: {d.ownerEmail}</div>
                              </div>
                              <Badge bg="warning" text="dark">Pendiente</Badge>
                            </div>
                            <div className="d-flex gap-3 mb-2 align-items-center small">
                              <span><strong>Tarifa:</strong> ${d.price} / noche</span>
                              {d.capacity != null && <span><strong>Capacidad:</strong> {d.capacity}</span>}
                            </div>
                            <p className="text-muted small mb-2">{d.description || 'Sin descripción'}</p>
                            <div className="d-flex gap-2 flex-wrap mt-1">
                              <Button
                                size="sm"
                                variant="success"
                                disabled={updatingDepartmentId === d.id}
                                onClick={() => handleDepartmentDecision(d.id, 'Aprobado')}
                              >
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={updatingDepartmentId === d.id}
                                onClick={() => handleDepartmentDecision(d.id, 'Rechazado')}
                              >
                                Rechazar
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
              <div>
                <h1 className="fw-bold mb-1">Reservas de la plataforma</h1>
                <p className="text-muted mb-0">Visualiza y monitorea las reservas realizadas. La confirmación la gestiona cada anfitrión.</p>
              </div>
              <Badge bg="secondary">{reservations.length} reservas</Badge>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : reservations.length === 0 ? (
              <Alert variant="info" className="text-center">
                No hay reservas registradas todavía.
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
                            <div className="small text-muted">Dueño: {reservation.ownerEmail}</div>
                          </div>
                          <Badge bg={statusVariant[reservation.status] as any}>
                            {statusLabel[reservation.status]}
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
                        </div>
                        <div className="d-flex gap-2 flex-wrap mt-2">
                          {reservation.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={updating === reservation.id}
                              onClick={() => handleStatusChange(reservation.id!, 'cancelled')}
                            >
                              Cancelar
                            </Button>
                          )}
                          {reservation.paymentStatus === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline-success"
                                disabled={updating === reservation.id}
                                onClick={async () => {
                                  if (!reservation.id) return;
                                  setUpdating(reservation.id);
                                  await fetch(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000' + `/api/reservas/${reservation.id}/payment-status`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('token') || ''}` : '',
                                    },
                                    body: JSON.stringify({ paymentStatus: 'confirmed' }),
                                  });
                                  await loadReservations();
                                  setUpdating(null);
                                }}
                              >
                                Marcar pago confirmado
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                disabled={updating === reservation.id}
                                onClick={async () => {
                                  if (!reservation.id) return;
                                  setUpdating(reservation.id);
                                  await fetch(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000' + `/api/reservas/${reservation.id}/payment-status`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('token') || ''}` : '',
                                    },
                                    body: JSON.stringify({ paymentStatus: 'cancelled' }),
                                  });
                                  await loadReservations();
                                  setUpdating(null);
                                }}
                              >
                                Marcar pago cancelado
                              </Button>
                            </>
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
      <Footer />
    </div>
  );
}
