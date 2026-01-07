"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useRole } from "../../context/adminContext";
import Sidebar from "../../components/Sidebar";
import TopbarMobile from "../../components/TopbarMobile";
import Footer from "../../components/Footer";
import { hotelService, type Hotel } from "../../services/hotelService";
import { activityService, type Activity } from "../../services/activityService";

// Protección simple para admins
const SimpleProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useRole();

  if (adminLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          <h4>Acceso denegado</h4>
          <p>No tienes permisos para acceder a este panel.</p>
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};

export default function AdminSpacesPage() {
  const { user } = useAuth();
  const { isAdmin } = useRole();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [activitiesByHotel, setActivitiesByHotel] = useState<Record<number, Activity[]>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<
    | { type: "success" | "error"; text: string }
    | null
  >(null);

  const [newHotel, setNewHotel] = useState({
    name: "",
    description: "",
    ownerEmail: "",
    location: "",
  });

  useEffect(() => {
    if (user && isAdmin) {
      loadHotels();
    }
  }, [user, isAdmin]);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const allHotels = await hotelService.getAllHotels();
      setHotels(allHotels);

      const activitiesMap: Record<number, Activity[]> = {};
      for (const hotel of allHotels) {
        try {
          const acts = await activityService.getActivitiesByProperty(hotel.id);
          activitiesMap[hotel.id] = acts;
        } catch (err) {
          console.error("Error cargando actividades para hotel", hotel.id, err);
        }
      }
      setActivitiesByHotel(activitiesMap);
    } catch (error) {
      console.error("Error cargando hoteles:", error);
      setMessage({ type: "error", text: "Error al cargar hoteles." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotel.name || !newHotel.ownerEmail || !newHotel.location) {
      setMessage({
        type: "error",
        text: "Nombre, ubicación y correo del anfitrión son obligatorios.",
      });
      return;
    }

    try {
      setCreating(true);
      const created = await hotelService.createHotel({
        name: newHotel.name,
        description: newHotel.description,
        ownerEmail: newHotel.ownerEmail,
        location: newHotel.location,
      });

      setHotels((prev) => [created, ...prev]);
      setMessage({ type: "success", text: "Hotel creado correctamente." });
      setNewHotel({ name: "", description: "", ownerEmail: "", location: "" });
    } catch (err: any) {
      console.error("Error creando hotel", err);
      const msg = err?.message || "No se pudo crear el hotel.";
      setMessage({ type: "error", text: msg });
    } finally {
      setCreating(false);
    }
  };

  const toggleHotelStatus = async (hotel: Hotel) => {
    try {
      const newStatus = hotel.isActive ? "Inactivo" : "Activo";
      await hotelService.updateHotelStatus(hotel.id, newStatus);
      setHotels((prev) =>
        prev.map((h) =>
          h.id === hotel.id ? { ...h, status: newStatus, isActive: !hotel.isActive } : h
        )
      );
    } catch (err) {
      console.error("Error actualizando estado del hotel", err);
      setMessage({ type: "error", text: "No se pudo actualizar el estado del hotel." });
    }
  };

  return (
    <SimpleProtectedRoute>
      <div className="d-flex flex-column min-vh-100">
        <TopbarMobile />
        <div className="d-flex flex-grow-1">
          <Sidebar />
          <main
            className="flex-grow-1 w-100"
            style={{ paddingTop: "1rem", backgroundColor: "var(--cosmetic-secondary)" }}
          >
            <Container fluid className="px-2 px-md-4 py-3">
              {/* Header */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                <div>
                  <h1 className="fw-bold text-dark mb-1">
                    <i className="bi bi-building me-2"></i>
                    Espacios y hoteles
                  </h1>
                  <p className="text-muted mb-0">
                    Crea hoteles virtuales, asígnales un anfitrión y visualiza sus actividades.
                  </p>
                </div>
              </div>

              {/* Mensaje de estado */}
              {message && (
                <Alert
                  variant={message.type === "success" ? "success" : "danger"}
                  dismissible
                  onClose={() => setMessage(null)}
                >
                  {message.text}
                </Alert>
              )}

              {/* Formulario para crear hotel */}
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Crear nuevo hotel</h5>
                  <Form onSubmit={handleCreateHotel} className="row g-3">
                    <Col xs={12} md={3}>
                      <Form.Label>Nombre del hotel</Form.Label>
                      <Form.Control
                        type="text"
                        value={newHotel.name}
                        onChange={(e) =>
                          setNewHotel((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Ej. Eco Lodge Las Montañas"
                        required
                      />
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Label>Ubicación (ciudad / zona)</Form.Label>
                      <Form.Control
                        type="text"
                        value={newHotel.location}
                        onChange={(e) =>
                          setNewHotel((prev) => ({ ...prev, location: e.target.value }))
                        }
                        placeholder="Ej. Pucón, Chile"
                        required
                      />
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Label>Correo del anfitrión</Form.Label>
                      <Form.Control
                        type="email"
                        value={newHotel.ownerEmail}
                        onChange={(e) =>
                          setNewHotel((prev) => ({ ...prev, ownerEmail: e.target.value }))
                        }
                        placeholder="anfitrion@ejemplo.com"
                        required
                      />
                    </Col>
                    <Col xs={12}>
                      <Form.Label>Descripción</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={newHotel.description}
                        onChange={(e) =>
                          setNewHotel((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Describe brevemente el concepto del hotel y su experiencia ecológica."
                      />
                    </Col>
                    <Col xs={12} className="d-flex justify-content-end">
                      <Button
                        type="submit"
                        className="btn-cosmetic-primary"
                        disabled={creating}
                      >
                        {creating ? "Creando..." : "Crear hotel"}
                      </Button>
                    </Col>
                  </Form>
                </Card.Body>
              </Card>

              {/* Lista de hoteles */}
              <Row className="g-3">
                {loading ? (
                  <Col xs={12} className="text-center py-5">
                    <Spinner animation="border" />
                  </Col>
                ) : hotels.length === 0 ? (
                  <Col xs={12} className="text-center py-5">
                    <p className="text-muted mb-0">
                      Aún no has creado ningún hotel. Comienza creando uno arriba.
                    </p>
                  </Col>
                ) : (
                  hotels.map((hotel) => {
                    const activities = activitiesByHotel[hotel.id] || [];
                    return (
                      <Col xs={12} md={6} lg={4} key={hotel.id}>
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h5 className="fw-bold mb-1">{hotel.name}</h5>
                                <div className="small text-muted">
                                  Anfitrión: {hotel.ownerEmail}
                                </div>
                                <div className="small text-muted">Tipo: {hotel.type}</div>
                              </div>
                              <Badge bg={hotel.isActive ? "success" : "secondary"}>
                                {hotel.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                            {hotel.description && (
                              <p className="text-muted small mb-2">{hotel.description}</p>
                            )}
                            <div className="small mb-2">
                              <strong>Actividades configuradas:</strong> {activities.length}
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <Button
                                variant={hotel.isActive ? "outline-secondary" : "outline-success"}
                                size="sm"
                                onClick={() => toggleHotelStatus(hotel)}
                              >
                                {hotel.isActive ? "Pausar hotel" : "Activar hotel"}
                              </Button>
                              <Button
                                as="a"
                                href={`/owner/activities?hotelId=${hotel.id}`}
                                size="sm"
                                variant="outline-primary"
                              >
                                Ver / crear actividades
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })
                )}
              </Row>
            </Container>
          </main>
        </div>
        <Footer />
      </div>
    </SimpleProtectedRoute>
  );
}