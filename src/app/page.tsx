"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card } from "react-bootstrap";
import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import Footer from "./components/Footer";

export default function Home() {
  const { user, userData } = useAuth();
  const role = userData?.role;
  const router = useRouter();

  const Hero = () => (
    <section className="py-5 bg-light">
      <Container>
        <Row className="align-items-center g-4">
          <Col md={7}>
            <h1 className="fw-bold mb-3" style={{ fontSize: "2.5rem" }}>
              EcoReserva: hospédate en departamentos únicos
            </h1>
            <p className="lead text-muted mb-4">
              Reserva alojamientos ecológicos y administra tus propiedades desde un panel
              moderno, seguro y totalmente integrado con nuestro backend en SQL Server.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link href="/myReservations" className="btn btn-success">
                Ver mis reservas
              </Link>
              <Link href="/owner/properties" className="btn btn-outline-success">
                Soy anfitrión
              </Link>
            </div>
          </Col>
          <Col md={5}>
            <Card className="shadow border-0">
              <Card.Body>
                <h5 className="fw-bold mb-3">Tu panel de reservas</h5>
                <p className="text-muted mb-3">
                  Gestiona reservas, calendarios y actividades de cada hospedaje desde un
                  solo lugar.
                </p>
                <ul className="mb-0 text-muted">
                  <li>Reservas centralizadas y estados claros</li>
                  <li>Panel para administradores y anfitriones</li>
                  <li>Pagos registrados en el backend Node + SQL</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );

  const Shortcuts = () => (
    <section className="py-4">
      <Container>
        <Row className="g-3">
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <h5 className="fw-bold mb-2">Turistas</h5>
                <p className="text-muted mb-3">
                  Explora tus próximas estancias y revisa el historial de reservas.
                </p>
                <Link href="/myReservations" className="btn btn-sm btn-success">
                  Mis reservas
                </Link>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <h5 className="fw-bold mb-2">Anfitriones</h5>
                <p className="text-muted mb-3">
                  Publica departamentos, ajusta disponibilidad y controla tus reservas.
                </p>
                <div className="d-flex flex-column gap-2">
                  <Link
                    href="/owner/properties"
                    className="btn btn-sm btn-outline-success"
                  >
                    Mis propiedades
                  </Link>
                  <Link
                    href="/owner/reservations"
                    className="btn btn-sm btn-outline-secondary"
                  >
                    Reservas de mis propiedades
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <h5 className="fw-bold mb-2">Administración</h5>
                <p className="text-muted mb-3">
                  Supervisa todas las reservas y aprueba nuevos hospedajes.
                </p>
                <div className="d-flex flex-column gap-2">
                  <Link
                    href="/admin/reservations"
                    className="btn btn-sm btn-outline-dark"
                  >
                    Panel de reservas
                  </Link>
                  <Link
                    href="/admin/inventory"
                    className="btn btn-sm btn-outline-secondary"
                  >
                    Propiedades registradas
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );

  const LayoutPublic = () => (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "var(--cosmetic-secondary)" }}
    >
      <Hero />
      <Shortcuts />
      <Footer />
    </div>
  );

  useEffect(() => {
    if (!user) return;

    if (role === "admin") {
      router.replace("/admin/reservations");
      return;
    }

    if (role === "owner") {
      router.replace("/owner/properties");
      return;
    }

    // Turista / cliente: comenzar por el panel de inicio
    router.replace("/inicio");
  }, [user, role, router]);

  if (user) {
    return (
      <div
        className="d-flex flex-column min-vh-100 justify-content-center align-items-center"
        style={{ backgroundColor: "var(--cosmetic-secondary)" }}
      >
        <p className="text-muted mb-0">Redirigiendo a tu panel de reservas...</p>
      </div>
    );
  }

  return <LayoutPublic />;
}
