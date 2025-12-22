'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner, Form } from 'react-bootstrap';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopbarMobile from '../components/TopbarMobile';
import Footer from '../components/Footer';
import { Reservation, ReservationStatus, reservationService } from '../services/reservationService';

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
  pending_admin: 'Pendiente aprobación',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  checked_in: 'Check-in realizado',
  checked_out: 'Check-out realizado',
  completed: 'Completada'
};

export default function MyReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editGuests, setEditGuests] = useState<number | ''>('');

  useEffect(() => {
    if (user?.email) {
      loadReservations();
    } else {
      setLoading(false);
    }
  }, [user?.email]);

  const loadReservations = async () => {
    if (!user?.email) return;
    setLoading(true);
    const data = await reservationService.getReservationsForUser(user.email);
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setReservations(data);
    setLoading(false);
  };

  const handleCancel = async (reservationId: string) => {
    try {
      setUpdating(reservationId);
      await reservationService.updateReservationStatus(reservationId, 'cancelled');
      await loadReservations();
    } finally {
      setUpdating(null);
    }
  };

  const startEdit = (reservation: Reservation) => {
    setEditingId(reservation.id || null);
    setEditStartDate(reservation.startDate.split('T')[0]);
    setEditEndDate(reservation.endDate.split('T')[0]);
    setEditGuests(reservation.guests ?? '');
  };

  const handleSaveEdit = async (reservationId: string) => {
    if (!editStartDate || !editEndDate) return;
    try {
      setUpdating(reservationId);
      await reservationService.updateReservationDates(
        reservationId,
        new Date(editStartDate).toISOString(),
        new Date(editEndDate).toISOString(),
        typeof editGuests === 'number' ? editGuests : undefined
      );
      setEditingId(null);
      await loadReservations();
    } catch (err) {
      console.error('Error actualizando reserva', err);
    } finally {
      setUpdating(null);
    }
  };

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <h2>Debes iniciar sesión para ver tus reservas</h2>
        <Link href="/auth/login" passHref>
          <Button className="mt-3" variant="dark">Iniciar sesión</Button>
        </Link>
      </Container>
    );
  }

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
      <h1 className="fw-bold text-center mb-4">Mis Reservas</h1>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-calendar-x fs-1" />
          <h5 className="fw-bold mb-2">No tienes reservas aún</h5>
          <Button as={Link as any} href="/reservar" className="mt-3 btn-cosmetic-primary">
            Reservar un hospedaje
          </Button>
        </div>
      ) : (
        <Row className="g-3 justify-content-center">
          {reservations.map((reservation) => (
            <Col xs={12} md={10} lg={8} key={reservation.id}>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold mb-1">{reservation.propertyName}</h5>
                      <div className="small text-muted">Reserva #{reservation.id?.slice(-6)}</div>
                    </div>
                    <Badge bg={statusVariant[reservation.status] as any}>
                      {statusLabel[reservation.status]}
                    </Badge>
                  </div>
                  <div className="small mb-1">
                    <strong>Fechas:</strong>{' '}
                    {new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}
                  </div>
                  <div className="small mb-1">
                    <strong>Total:</strong> ${reservation.total.toFixed(2)}
                  </div>
                  {reservation.paymentMethod && (
                    <div className="small mb-1">
                      <strong>Método de pago:</strong> {reservation.paymentMethod} ({reservation.paymentStatus || 'pendiente'})
                    </div>
                  )}
                  {reservation.notes && (
                    <div className="small text-muted">{reservation.notes}</div>
                  )}
                  <div className="mt-3 d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    {(reservation.status === 'pending_admin' || reservation.status === 'approved') && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={updating === reservation.id}
                        onClick={() => handleCancel(reservation.id!)}
                      >
                        Cancelar reserva
                      </Button>
                    )}
                    {reservation.status === 'pending_admin' && (
                      <>
                        {editingId === reservation.id ? (
                          <div className="d-flex flex-column flex-md-row gap-2 align-items-end w-100 justify-content-end">
                            <Form.Control
                              type="date"
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              style={{ maxWidth: 150 }}
                            />
                            <Form.Control
                              type="date"
                              value={editEndDate}
                              onChange={(e) => setEditEndDate(e.target.value)}
                              style={{ maxWidth: 150 }}
                            />
                            <Form.Control
                              type="number"
                              min={1}
                              value={editGuests}
                              onChange={(e) => setEditGuests(e.target.value ? Number(e.target.value) : '')}
                              style={{ maxWidth: 100 }}
                              placeholder="Personas"
                            />
                            <Button
                              variant="outline-success"
                              size="sm"
                              disabled={updating === reservation.id}
                              onClick={() => handleSaveEdit(reservation.id!)}
                            >
                              Guardar cambios
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => startEdit(reservation)}
                          >
                            Editar fechas/personas
                          </Button>
                        )}
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
