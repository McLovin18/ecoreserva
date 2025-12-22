"use client";

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Link from "next/link";


const Footer = () => (
  <footer 
    className="footer-cosmetic py-5 border-top mt-auto bg-inherit" 
    style={{ backgroundColor: "var(--cosmetic-secondary)" }}
  >
    <Container>
      <Row>
        <Col xs={12} md={4} className=" d-flex align-items-center justify-content-center flex-column text-center mb-4 mb-md-0">
          <h1 className="fw-bold mb-1 text-2xl">
            EcoReserva
          </h1>
          
          <p className="mt-3 mb-0" style={{ color: "var(--cosmetic-tertiary)" }}>
            EcoReserva es una plataforma para reservar departamentos y hospedajes
            de forma segura, sencilla y sostenible.
          </p>
        </Col>

        <Col xs={12} md={4} className="mb-4 mb-md-0">
          <div>
            <h5 className="fw-bold mb-3" style={{ color: "var(--cosmetic-accent)" }}>
              Enlaces útiles
            </h5>
            <ul className="list-unstyled mb-0">
              <li>
                <Link href="/" className="footer-link" style={{ color: "var(--cosmetic-tertiary)" }}>
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/myReservations"
                  className="footer-link"
                  style={{ color: "var(--cosmetic-tertiary)" }}
                >
                  Mis reservas
                </Link>
              </li>
              <li>
                <Link
                  href="/owner/properties"
                  className="footer-link"
                  style={{ color: "var(--cosmetic-tertiary)" }}
                >
                  Soy anfitrión
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/reservations"
                  className="footer-link"
                  style={{ color: "var(--cosmetic-tertiary)" }}
                >
                  Panel administrador
                </Link>
              </li>
            </ul>
          </div>
        </Col>

        <Col xs={12} md={4} className="d-flex align-items-center justify-content-center flex-column text-center">
          <h5 className="fw-bold mb-3" style={{ color: "var(--cosmetic-accent)" }}>
            Contáctanos
          </h5>
          <p className="mb-2" style={{ color: "var(--cosmetic-tertiary)" }}>
            ¿Tienes dudas sobre tus reservas o eres nuevo anfitrión?
          </p>
          <p className="mb-1" style={{ color: "var(--cosmetic-tertiary)" }}>
            Correo: soporte@ecoreserva.app
          </p>
        </Col>

      </Row>


      <hr className="my-4" style={{ borderColor: "var(--cosmetic-accent)" }} />

      <div className="text-center">
        <p className="small" style={{ color: "var(--cosmetic-tertiary)" }}>
          &copy; {new Date().getFullYear()} EcoReserva. Todos los derechos reservados.
        </p>
      </div>
    </Container>

    {/* Estilos del hover de links */}
    <style jsx>{`
      .footer-link {
        position: relative;
        text-decoration: none;
      }
      .footer-link::after {
        content: "";
        position: absolute;
        width: 0;
        height: 2px;
        background-color: var(--cosmetic-accent);
        left: 0;
        bottom: -2px;
        transition: width 0.3s;
      }
      .footer-link:hover::after {
        width: 100%;
      }
    `}</style>
  </footer>
);

export default Footer;

