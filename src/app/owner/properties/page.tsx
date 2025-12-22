'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import TopbarMobile from '../../components/TopbarMobile';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/adminContext';
import { ProductInventory, inventoryService } from '../../services/inventoryService';
import { Department, departmentService } from '../../services/departmentService';

interface NewPropertyForm {
  hotelId: number | '';
  name: string;
  price: number; // nightly rate
  stock: number; // available units
  description: string;
  category: string;
}

const DEFAULT_FORM: NewPropertyForm = {
  hotelId: '',
  name: '',
  price: 0,
  stock: 1,
  description: '',
  category: 'departamentos'
};

export default function OwnerPropertiesPage() {
  const { user } = useAuth();
  const { isOwner } = useRole();
  const [hotels, setHotels] = useState<ProductInventory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<NewPropertyForm>(DEFAULT_FORM);

  const canCreate = useMemo(
    () => !!user?.email && isOwner && hotels.length > 0,
    [user?.email, isOwner, hotels.length]
  );

  useEffect(() => {
    if (user?.email && isOwner) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.email, isOwner]);

  const loadData = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      // Cargar siempre los hoteles del anfitrión
      const ownerHotels = await inventoryService.getProductsByOwner(user.email);
      setHotels(ownerHotels);

      // Intentar cargar departamentos, pero si falla no bloqueamos la pantalla
      try {
        const ownerDepartments = await departmentService.getDepartmentsForOwner();
        setDepartments(ownerDepartments);
      } catch (err) {
        console.error('Error cargando departamentos', err);
        // Mostramos sólo un mensaje suave si ya hay hoteles
        setMessage((prev) =>
          prev ?? { type: 'error', text: 'No se pudieron cargar tus departamentos, pero puedes crear nuevos.' }
        );
      }
    } catch (err) {
      console.error('Error cargando hoteles/departamentos', err);
      setMessage({ type: 'error', text: 'No se pudieron cargar tus hoteles. Intenta de nuevo más tarde.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!user?.email || !form.hotelId) return;

    try {
      setSaving(true);
      await departmentService.createDepartment({
        hotelId: Number(form.hotelId),
        name: form.name,
        price: form.price,
        description: form.description,
        capacity: form.stock,
      });

      setMessage({ type: 'success', text: 'Departamento creado y enviado a revisión del administrador.' });
      setForm(DEFAULT_FORM);
      await loadData();
    } catch (err: any) {
      console.error('Error creando propiedad', err);
      setMessage({ type: 'error', text: err?.message || 'No se pudo crear la propiedad' });
    } finally {
      setSaving(false);
    }
  };

  const renderStatus = (status?: string) => {
    switch (status) {
      case 'Pendiente':
        return <Badge bg="warning" text="dark">Pendiente aprobación admin</Badge>;
      case 'Aprobado':
        return <Badge bg="success">Aprobado</Badge>;
      case 'Rechazado':
        return <Badge bg="danger">Rechazado</Badge>;
      default:
        return <Badge bg="secondary">—</Badge>;
    }
  };

  if (!user || !isOwner) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          Debes iniciar sesión como <strong>dueño de departamentos</strong> para acceder.
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
                <h1 className="fw-bold mb-1">Mis departamentos</h1>
                <p className="text-muted mb-0">Crea y administra tus departamentos. Tus turistas podrán reservarlos y tú gestionarás esas reservas.</p>
              </div>
            </div>

            {message && (
              <Alert variant={message.type === 'success' ? 'success' : 'danger'} onClose={() => setMessage(null)} dismissible>
                {message.text}
              </Alert>
            )}

            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-light fw-semibold">Crear nuevo departamento</Card.Header>
              <Card.Body>
                {hotels.length === 0 ? (
                  <Alert variant="info" className="mb-0">
                    Aún no tienes hoteles asignados por el administrador. Cuando el administrador cree un hotel
                    a tu nombre, podrás registrar aquí tus departamentos.
                  </Alert>
                ) : (
                  <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="hotelId">
                        <Form.Label>Hotel al que pertenece</Form.Label>
                        <Form.Select
                          required
                          value={form.hotelId}
                          onChange={(e) => setForm((prev) => ({ ...prev, hotelId: e.target.value ? Number(e.target.value) : '' }))}
                        >
                          <option value="">Selecciona un hotel</option>
                          {hotels.map((h) => (
                            <option key={h.productId} value={h.productId}>
                              #{h.productId} - {h.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="name">
                        <Form.Label>Nombre del departamento</Form.Label>
                        <Form.Control
                          required
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Ej: Suite frente al mar"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group controlId="price">
                        <Form.Label>Tarifa por noche (USD)</Form.Label>
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
                    <Col md={3}>
                      <Form.Group controlId="stock">
                        <Form.Label>Capacidad (personas / unidades)</Form.Label>
                        <Form.Control
                          required
                          type="number"
                          min={1}
                          step={1}
                          value={form.stock}
                          onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="g-3 mt-1">
                    <Col md={6}>
                      <Form.Group controlId="category">
                        <Form.Label>Categoría</Form.Label>
                        <Form.Select
                          value={form.category}
                          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                        >
                          <option value="departamentos">Departamento</option>
                          <option value="suite">Suite</option>
                          <option value="studio">Studio</option>
                          <option value="habitacion">Habitación</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="description">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Amenidades, reglas de la casa, política de cancelación"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2 justify-content-end mt-3">
                    <Button variant="outline-secondary" onClick={() => setForm(DEFAULT_FORM)} disabled={saving}>
                      Limpiar
                    </Button>
                    <Button type="submit" className="btn-cosmetic-primary" disabled={!canCreate || saving}>
                      {saving ? 'Guardando...' : 'Crear departamento'}
                    </Button>
                  </div>
                  </Form>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
              <Card.Header className="bg-light fw-semibold d-flex justify-content-between align-items-center">
                <span>Mis departamentos</span>
                <Badge bg="secondary">{departments.length} en total</Badge>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : departments.length === 0 ? (
                  <div className="text-center text-muted py-4">Aún no has creado departamentos para tus hoteles.</div>
                ) : (
                  <Row className="g-3">
                    {departments.map((department) => (
                      <Col md={6} lg={4} key={department.id}>
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h5 className="fw-bold mb-1">{department.name}</h5>
                                <div className="text-muted small">Hotel: {department.hotelName} (#{department.hotelId})</div>
                              </div>
                              {renderStatus(department.status)}
                            </div>
                            <div className="d-flex gap-3 mb-2 align-items-center">
                              <Badge bg="info">${department.price} / noche</Badge>
                              {department.capacity != null && (
                                <Badge bg={department.capacity > 0 ? 'success' : 'danger'}>
                                  Capacidad {department.capacity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted small mb-0">
                              {department.description || 'Sin descripción'}
                            </p>
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
