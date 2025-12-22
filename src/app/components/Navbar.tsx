"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../context/adminContext";

const NavbarComponent = () => {
  const { user, logout } = useAuth();
  const { isAdmin, isOwner } = useRole();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <Navbar
      id="main-navbar"
      expand="lg"
      className="py-2 shadow-sm bg-cosmetic-secondary position-sticky top-0"
      style={{ zIndex: 1030 }}
    >
      <Container className="navbar-container d-flex align-items-center">
        <Navbar.Brand as={Link} href="/" className="d-flex flex-column justify-content-center">
          <span className="fw-bold" style={{ fontSize: "1.8rem", letterSpacing: "0.06em" }}>
            EcoReserva
          </span>
          <small className="text-muted" style={{ fontSize: "0.8rem", letterSpacing: "0.18em" }}>
            RESERVAS DE ALOJAMIENTOS
          </small>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="ms-4">
          <Nav className="align-items-center gap-1">
            {!user && (
              <Nav.Link as={Link} href="/" className="fw-medium">
                Inicio
              </Nav.Link>
            )}

            {user && (
              <Nav.Link as={Link} href="/myReservations" className="fw-medium">
                Mis reservas
              </Nav.Link>
            )}

            {isOwner && (
              <Nav.Link as={Link} href="/owner/properties" className="fw-medium">
                Mis hospedajes
              </Nav.Link>
            )}

            {isAdmin && (
              <Nav.Link as={Link} href="/admin/reservations" className="fw-medium">
                Panel administrador
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>

        <div className="d-flex align-items-center gap-2 ms-auto">
          {user ? (
            <>
              <Nav.Link as={Link} href="/profile">
                Mi perfil
              </Nav.Link>
              <Nav.Link onClick={handleLogout}>Cerrar sesión</Nav.Link>
            </>
          ) : (
            <>
              <Button
                as={Link}
                href="/auth/login"
                size="sm"
                className="px-3 btn-outline-cosmetic-accent"
              >
                Iniciar sesión
              </Button>
              <Button
                as={Link}
                href="/auth/register"
                variant="primary"
                size="sm"
                className="px-3 fw-semibold"
              >
                Crear cuenta
              </Button>
            </>
          )}
        </div>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;