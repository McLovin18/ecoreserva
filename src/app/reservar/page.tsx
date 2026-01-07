'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container, Row, Col, Card, Button, Badge, Spinner, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopbarMobile from '../components/TopbarMobile';
import Footer from '../components/Footer';
import { inventoryService, type ProductInventory } from '../services/inventoryService';
import { departmentService, type Department } from '../services/departmentService';

export default function ReservarPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentsByHotel, setDepartmentsByHotel] = useState<Record<number, Department[]>>({});
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await inventoryService.getAvailableProducts();
      setProducts(data);
      setLoading(false);

      // Cargar departamentos aprobados por hotel para mostrar al turista
      try {
        setLoadingDepartments(true);
        const map: Record<number, Department[]> = {};
        await Promise.all(
          data.map(async (p) => {
            const hotelId = p.productId;
            if (!hotelId) return;
            try {
              const deps = await departmentService.getApprovedByHotel(hotelId);
              if (deps.length > 0) {
                map[hotelId] = deps;
              }
            } catch (err) {
              console.error('Error cargando departamentos para hotel', hotelId, err);
            }
          })
        );
        setDepartmentsByHotel(map);
      } finally {
        setLoadingDepartments(false);
      }
    };
    load();
  }, []);

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term)
    );
  });

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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
        <div>
          <h1 className="fw-bold mb-1">Reservar hospedaje</h1>
          <p className="text-muted mb-0">
            Explora los departamentos disponibles y realiza una nueva reserva. El precio se basa
            siempre en la tarifa por noche que definió cada anfitrión para su departamento.
          </p>
        </div>
        <Form.Control
          placeholder="Buscar por nombre o ubicación"
          style={{ maxWidth: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!user && (
        <div className="alert alert-warning">
          Debes iniciar sesión para completar una reserva. Puedes explorar los hospedajes
          y luego iniciar sesión para continuar.
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-inbox fs-1" />
          <p className="mt-2 mb-0">No hay hospedajes disponibles por ahora.</p>
        </div>
      ) : (
        <Row className="g-3">
          {filtered.map((p) => (
            <Col key={p.productId} xs={12} md={6} lg={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold mb-1">{p.name}</h5>
                    </div>
                    <Badge bg={p.stock > 0 ? 'success' : 'secondary'}>
                      {p.stock > 0 ? `${p.stock} disponibles` : 'Sin stock'}
                    </Badge>
                  </div>
                  {p.description && (
                    <p className="text-muted small mb-3">
                      {p.description.length > 120
                        ? p.description.slice(0, 120) + '...'
                        : p.description}
                    </p>
                  )}
                  {loadingDepartments && (
                    <p className="text-muted small mb-1">Cargando departamentos...</p>
                  )}
                  {!loadingDepartments && departmentsByHotel[p.productId] && departmentsByHotel[p.productId].length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted d-block mb-1">
                        Departamentos en este hospedaje (tarifa por noche definida por el anfitrión):
                      </small>
                      <div className="d-flex flex-wrap gap-1">
                        {departmentsByHotel[p.productId].map((d) => (
                          <Badge key={d.id} bg="info" className="text-wrap">
                            {d.name} · ${d.price}/noche
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <small className="text-muted me-2">
                      Selecciona un departamento para ver su precio por noche.
                    </small>
                    <Button
                      as={Link as any}
                      href={`/products/${p.productId}`}
                      size="sm"
                      className="btn-cosmetic-primary"
                      disabled={p.stock <= 0}
                    >
                      Reservar
                    </Button>
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
