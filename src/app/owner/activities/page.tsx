'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import TopbarMobile from '../../components/TopbarMobile';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/adminContext';
import { activityService, Activity } from '../../services/activityService';
import { inventoryService, type ProductInventory } from '../../services/inventoryService';
import { hotelService } from '../../services/hotelService';

interface NewActivityForm {
  propertyId: number | '';
  name: string;
  description: string;
  price: number;
  type: string;
}

const DEFAULT_FORM: NewActivityForm = {
  propertyId: '',
  name: '',
  description: '',
  price: 0,
  type: 'Aventura',
};

export default function OwnerActivitiesPage() {
  const { user } = useAuth();
  const { isOwner, isAdmin } = useRole();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [properties, setProperties] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<NewActivityForm>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email && (isOwner || isAdmin)) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.email, isOwner, isAdmin]);

  const loadData = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      if (isOwner) {
        const [props, acts] = await Promise.all([
          inventoryService.getProductsByOwner(user.email),
          activityService.getActivitiesByHost(user.email),
        ]);
        setProperties(props);
        setActivities(acts);
      } else if (isAdmin) {
        const hotels = await hotelService.getAllHotels();
        // Reutilizamos el tipo ProductInventory para el selector
        const props: ProductInventory[] = hotels.map((h) => ({
          productId: h.id,
          name: h.name,
          description: h.description,
          price: h.price,
          stock: 1,
          category: h.type,
          ownerEmail: h.ownerEmail,
          status: h.status,
        }));
        setProperties(props);

        const allActivities: Activity[] = [];
        for (const hotel of hotels) {
          try {
            const acts = await activityService.getActivitiesByProperty(hotel.id);
            allActivities.push(...acts);
          } catch (err) {
            console.error('Error cargando actividades para hotel', hotel.id, err);
          }
        }
        setActivities(allActivities);
      }
    } catch (err) {
      console.error('Error cargando actividades', err);
      setMessage({ type: 'error', text: 'No se pudieron cargar tus actividades.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!user?.email || !form.propertyId) return;

    try {
      setSaving(true);
      await activityService.createOrUpdateActivity({
        id: editingId || undefined,
        hostEmail: user.email.toLowerCase(),
        propertyId: Number(form.propertyId),
        name: form.name,
        description: form.description,
        price: form.price,
        type: form.type,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      setMessage({ type: 'success', text: editingId ? 'Actividad actualizada correctamente.' : 'Actividad guardada correctamente.' });
      setForm(DEFAULT_FORM);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      console.error('Error guardando actividad', err);
      setMessage({ type: 'error', text: err?.message || 'No se pudo guardar la actividad.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingId(activity.id || null);
    setForm({
      propertyId: activity.propertyId,
      name: activity.name,
      description: activity.description || '',
      price: activity.price,
      type: activity.type || 'Aventura',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      setDeletingId(id);
      await activityService.deleteActivity(id);
      await loadData();
    } catch (err) {
      console.error('Error eliminando actividad', err);
      setMessage({ type: 'error', text: 'No se pudo eliminar la actividad.' });
    } finally {
      setDeletingId(null);
    }
  };

  if (!user || (!isOwner && !isAdmin)) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          Debes iniciar sesión como <strong>anfitrión</strong> o <strong>administrador</strong> para gestionar actividades.
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
                <h1 className="fw-bold mb-1">Actividades rurales</h1>
                <p className="text-muted mb-0">Crea y administra actividades asociadas a tus hospedajes (senderismo, pesca, etc.).</p>
              </div>
            </div>

            {message && (
              <Alert variant={message.type === 'success' ? 'success' : 'danger'} onClose={() => setMessage(null)} dismissible>
                {message.text}
              </Alert>
            )}

            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-light fw-semibold">
                {editingId ? 'Editar actividad' : 'Crear nueva actividad'}
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group controlId="propertyId">
                        <Form.Label>Hospedaje asociado</Form.Label>
                        <Form.Select
                          value={form.propertyId}
                          onChange={(e) => setForm((prev) => ({ ...prev, propertyId: e.target.value ? Number(e.target.value) : '' }))}
                          required
                        >
                          <option value="">Selecciona un hospedaje</option>
                          {properties.map((p) => (
                            <option key={p.productId} value={p.productId}>
                              #{p.productId} - {p.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="name">
                        <Form.Label>Nombre de la actividad</Form.Label>
                        <Form.Control
                          required
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Ej: Caminata ecológica"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="price">
                        <Form.Label>Precio por persona (USD)</Form.Label>
                        <Form.Control
                          required
                          type="number"
                          min={0}
                          step={1}
                          value={form.price}
                          onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="g-3 mt-1">
                    <Col md={4}>
                      <Form.Group controlId="type">
                        <Form.Label>Tipo de actividad</Form.Label>
                        <Form.Select
                          value={form.type}
                          onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="Aventura">Aventura</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Ecológica">Ecológica</option>
                          <option value="Gastronómica">Gastronómica</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group controlId="description">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Duración, nivel de dificultad, qué incluye, recomendaciones"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex gap-2 justify-content-end mt-3">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setForm(DEFAULT_FORM);
                        setEditingId(null);
                      }}
                      disabled={saving}
                    >
                      {editingId ? 'Cancelar edición' : 'Limpiar'}
                    </Button>
                    <Button type="submit" className="btn-cosmetic-primary" disabled={saving}>
                      {saving ? 'Guardando...' : editingId ? 'Actualizar actividad' : 'Guardar actividad'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
              <Card.Header className="bg-light fw-semibold d-flex justify-content-between align-items-center">
                <span>Mis actividades</span>
                <Badge bg="secondary">{activities.length} en total</Badge>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center text-muted py-4">Aún no has creado actividades.</div>
                ) : (
                  <Row className="g-3">
                    {activities.map((activity) => (
                      <Col md={6} lg={4} key={activity.id}>
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h5 className="fw-bold mb-1">{activity.name}</h5>
                                <div className="text-muted small">Hospedaje #{activity.propertyId}</div>
                              </div>
                              <Badge bg={activity.isActive ? 'success' : 'secondary'}>
                                {activity.isActive ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                            <div className="d-flex gap-3 mb-2 align-items-center">
                              <Badge bg="info">${activity.price} / persona</Badge>
                              {activity.type && <Badge bg="primary">{activity.type}</Badge>}
                            </div>
                            <p className="text-muted small mb-3">
                              {activity.description || 'Sin descripción'}
                            </p>
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleEdit(activity)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                disabled={deletingId === activity.id}
                                onClick={() => handleDelete(activity.id)}
                              >
                                {deletingId === activity.id ? 'Eliminando...' : 'Eliminar'}
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
          </Container>
        </main>
      </div>
    </div>
  );
}
