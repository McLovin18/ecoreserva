"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/adminContext";
import LoginRequired from "../components/LoginRequired";
import Sidebar from "../components/Sidebar";
import TopbarMobile from "../components/TopbarMobile";
import Footer from "../components/Footer";

const ProfilePage = () => {
  const { user, userData, logout, updateUserProfile } = useAuth();
  const { isAdmin, isOwner } = useRole();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName((user as any).nombre || user.displayName || "");
      setEmail(user.email || "");
    } else if (userData) {
      setName(userData.displayName || "");
      setEmail(userData.email);
    }
  }, [user, userData]);

  if (!user && !userData) {
    return <LoginRequired />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    try {
      await updateUserProfile(name);
      setSuccess("Perfil actualizado correctamente.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el perfil.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  const roleLabel = isAdmin ? "Administrador" : isOwner ? "Anfitrión" : "Turista";

  return (
    <div className="d-flex flex-column min-vh-100">
      <TopbarMobile />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main
          className="flex-grow-1 w-100"
          style={{ backgroundColor: "var(--cosmetic-secondary-100)" }}
        >
        <Container className="py-4">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <h3 className="fw-bold mb-2">Mi perfil en EcoReserva</h3>
                  <p className="text-muted mb-3">
                    Actualiza tus datos y accede rápidamente a tus reservas y paneles
                    de hospedaje.
                  </p>

                  <div className="mb-3">
                    <span className="me-2 text-muted">Rol actual:</span>
                    <Badge bg="success">{roleLabel}</Badge>
                  </div>

                  {success && <Alert variant="success">{success}</Alert>}
                  {error && <Alert variant="danger">{error}</Alert>}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre completo</Form.Label>
                      <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Correo electrónico</Form.Label>
                      <Form.Control type="email" value={email} disabled />
                    </Form.Group>

                    <div className="d-flex justify-content-between mt-3 flex-wrap gap-2">
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={handleLogout}
                      >
                        Cerrar sesión
                      </Button>
                      <Button type="submit" className="btn-cosmetic-primary">
                        Guardar cambios
                      </Button>
                    </div>
                  </Form>

                  <hr className="my-4" />

                  <h6 className="fw-bold mb-2">Accesos rápidos</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => router.push("/myReservations")}
                    >
                      Mis reservas
                    </Button>
                    {isOwner && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => router.push("/owner/properties")}
                      >
                        Mis hospedajes
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => router.push("/owner/reservations")}
                      >
                        Reservas de mis hospedajes
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="outline-dark"
                        size="sm"
                        onClick={() => router.push("/admin/reservations")}
                      >
                        Panel administrador
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;