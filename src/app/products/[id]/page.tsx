                                  "use client"; 
                                  import { useEffect, useState } from "react";
                                  import { useParams, useRouter } from "next/navigation";
                                  import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge } from "react-bootstrap";
                                  import { useAuth } from "../../context/AuthContext";
                                  import Sidebar from "../../components/Sidebar";
                                  import TopbarMobile from "../../components/TopbarMobile";
                                  import Footer from "../../components/Footer";
                                  import { inventoryService, type ProductInventory } from "../../services/inventoryService";
                                  import { departmentService, type Department } from "../../services/departmentService";
                                  import { reservationService } from "../../services/reservationService";

                                  const LodgingDetailPage = () => {
                                    const params = useParams<{ id: string }>();
                                    const router = useRouter();
                                    const { user } = useAuth();

                                    const hotelId = Number(params?.id);

                                    const [hotel, setHotel] = useState<ProductInventory | null>(null);
                                    const [departments, setDepartments] = useState<Department[]>([]);
                                    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
                                    const [loading, setLoading] = useState(true);
                                    const [error, setError] = useState<string | null>(null);
                                    const [creating, setCreating] = useState(false);
                                    const [checkInDate, setCheckInDate] = useState("");
                                    const [checkOutDate, setCheckOutDate] = useState("");
                                    const [guests, setGuests] = useState(1);
                                    const [paymentMethod, setPaymentMethod] = useState<"Efectivo" | "Transferencia" | "Tarjeta">("Efectivo");

                                    useEffect(() => {
                                      const load = async () => {
                                        if (!hotelId || Number.isNaN(hotelId)) {
                                          setError("Hospedaje no válido.");
                                          setLoading(false);
                                          return;
                                        }

                                        try {
                                          setLoading(true);

                                          const product = await inventoryService.getProductById(hotelId);
                                          if (!product) {
                                            setError("No se encontró el hospedaje solicitado.");
                                          } else {
                                            setHotel(product);
                                          }

                                          try {
                                            const deps = await departmentService.getApprovedByHotel(hotelId);
                                            setDepartments(deps);
                                          } catch (depErr) {
                                            console.error("Error cargando departamentos para el hospedaje", depErr);
                                          }
                                        } catch (err) {
                                          console.error("Error cargando hospedaje", err);
                                          setError("Error al cargar la información del hospedaje.");
                                        } finally {
                                          setLoading(false);
                                        }
                                      };

                                      load();
                                    }, [hotelId]);

                                    const handleReserve = async () => {
                                      setError(null);

                                      if (!user) {
                                        setError("Debes iniciar sesión para reservar un hospedaje.");
                                        return;
                                      }
                                      if (!hotel) {
                                        setError("No se pudo cargar la información del hospedaje.");
                                        return;
                                      }

                                      if (!checkInDate || !checkOutDate) {
                                        setError("Debes seleccionar fechas de ingreso y salida.");
                                        return;
                                      }

                                      const start = new Date(checkInDate);
                                      const end = new Date(checkOutDate);

                                      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
                                        setError("El rango de fechas no es válido.");
                                        return;
                                      }

                                      if (guests <= 0) {
                                        setError("El número de personas debe ser mayor a cero.");
                                        return;
                                      }

                                      let selectedDepartment: Department | undefined;
                                      if (departments.length > 0) {
                                        if (!selectedDepartmentId) {
                                          setError("Debes seleccionar un departamento.");
                                          return;
                                        }

                                        selectedDepartment = departments.find((dep) => {
                                          const depId = (dep as any).id ?? (dep as any).id_departamento ?? (dep as any).departmentId;
                                          return String(depId) === selectedDepartmentId;
                                        });

                                        if (!selectedDepartment) {
                                          setError("El departamento seleccionado no es válido.");
                                          return;
                                        }
                                      }

                                      const depName = selectedDepartment
                                        ? (selectedDepartment as any).name ?? (selectedDepartment as any).nombre ?? "Departamento"
                                        : null;
                                      const depPriceRaw = selectedDepartment
                                        ? (selectedDepartment as any).pricePerNight ?? (selectedDepartment as any).price ?? 0
                                        : 0;

                                      // El total de la reserva debe basarse siempre
                                      // en el precio definido por el owner en el departamento.
                                      const total = Number(depPriceRaw);

                                      if (!selectedDepartment || !total || isNaN(total)) {
                                        setError("Debes seleccionar un departamento válido con precio definido por el anfitrión.");
                                        return;
                                      }

                                      const propertyName = selectedDepartment && depName
                                        ? `${hotel.name} – ${depName}`
                                        : hotel.name;

                                      const ownerEmail = (hotel as any).ownerEmail ?? "";

                                      try {
                                        setCreating(true);

                                        await reservationService.createReservation({
                                          propertyId: hotel.productId,
                                          propertyName,
                                          ownerEmail,
                                          userEmail: user.email,
                                          userName: user.displayName || user.email?.split("@")[0] || "Cliente",
                                          total,
                                          startDate: start.toISOString(),
                                          endDate: end.toISOString(),
                                          guests,
                                          paymentMethod,
                                          notes: selectedDepartment && depName ? `Departamento reservado: ${depName}` : "",
                                        });

                                        router.push("/myReservations");
                                      } catch (err) {
                                        console.error("Error creando reserva", err);
                                        setError("No se pudo crear la reserva. Intenta nuevamente.");
                                      } finally {
                                        setCreating(false);
                                      }
                                    };

                                    return (
                                      <div className="d-flex" style={{ minHeight: "100vh" }}>
                                        <Sidebar />
                                        <div className="flex-grow-1 d-flex flex-column">
                                          <TopbarMobile />

                                          <main className="flex-grow-1 py-4" style={{ backgroundColor: "#f5f5f5" }}>
                                            <Container>
                                              {loading && (
                                                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                                                  <Spinner animation="border" role="status" className="me-2" />
                                                  <span>Cargando hospedaje...</span>
                                                </div>
                                              )}

                                              {!loading && error && (
                                                <Alert variant="danger" className="mt-3">
                                                  {error}
                                                </Alert>
                                              )}

                                              {!loading && !error && hotel && (
                                                <Row className="g-4 mt-1">
                                                  <Col md={7}>
                                                    <Card className="shadow-sm border-0 mb-3">
                                                      <Card.Body>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                          <div>
                                                            <h3 className="mb-1">{hotel.name}</h3>
                                                            <div className="text-muted small">Categoría: {hotel.category}</div>
                                                          </div>
                                                            {/* <Badge bg="success">${hotel.price.toFixed(2)} / noche</Badge> */}
                                                        </div>
                                                        {hotel.description && (
                                                          <p className="mb-0 text-muted">{hotel.description}</p>
                                                        )}
                                                      </Card.Body>
                                                    </Card>

                                                    <Card className="shadow-sm border-0">
                                                        <Card.Body>
                                                        <h5 className="mb-1">Departamentos disponibles</h5>
                                                        <p className="text-muted small mb-3">
                                                          El precio por noche de la reserva corresponde al departamento seleccionado,
                                                          según la tarifa definida por el anfitrión.
                                                        </p>

                                                        {departments.length === 0 && (
                                                          <p className="text-muted mb-0">
                                                            Aún no hay departamentos aprobados para este hospedaje.
                                                          </p>
                                                        )}

                                                        {departments.length > 0 && (
                                                          <div className="d-flex flex-column gap-2">
                                                            {departments.map((dep) => {
                                                              const depId = (dep as any).id ?? (dep as any).id_departamento ?? (dep as any).departmentId;
                                                              const depNameLocal = (dep as any).name ?? (dep as any).nombre ?? "Departamento";
                                                              const depPriceLocal = (dep as any).pricePerNight ?? (dep as any).price ?? 0;

                                                              return (
                                                                <Card
                                                                  key={String(depId)}
                                                                  className={`border rounded-3 px-3 py-2 ${
                                                                    selectedDepartmentId === String(depId)
                                                                      ? "border-primary bg-light"
                                                                      : "border-light"
                                                                  }`}
                                                                  role="button"
                                                                  onClick={() => setSelectedDepartmentId(String(depId))}
                                                                >
                                                                  <div className="d-flex justify-content-between align-items-center">
                                                                    <div>
                                                                      <div className="fw-semibold">{depNameLocal}</div>
                                                                      {(dep as any).description && (
                                                                        <div className="small text-muted">{(dep as any).description}</div>
                                                                      )}
                                                                    </div>
                                                                    <div className="text-end">
                                                                      <div className="fw-bold">${Number(depPriceLocal).toFixed(2)}</div>
                                                                      <div className="small text-muted">por noche</div>
                                                                    </div>
                                                                  </div>
                                                                </Card>
                                                              );
                                                            })}
                                                          </div>
                                                        )}
                                                      </Card.Body>
                                                    </Card>
                                                  </Col>

                                                  <Col md={5}>
                                                    <Card className="shadow-sm border-0">
                                                      <Card.Body>
                                                        <h5 className="mb-3">Confirmar reserva</h5>

                                                        {error && (
                                                          <Alert variant="danger">{error}</Alert>
                                                        )}

                                                        <Form className="d-flex flex-column gap-3">
                                                          <Row>
                                                            <Col xs={6}>
                                                              <Form.Group controlId="checkInDate">
                                                                <Form.Label>Fecha de ingreso</Form.Label>
                                                                <Form.Control
                                                                  type="date"
                                                                  value={checkInDate}
                                                                  onChange={(e) => setCheckInDate(e.target.value)}
                                                                />
                                                              </Form.Group>
                                                            </Col>
                                                            <Col xs={6}>
                                                              <Form.Group controlId="checkOutDate">
                                                                <Form.Label>Fecha de salida</Form.Label>
                                                                <Form.Control
                                                                  type="date"
                                                                  value={checkOutDate}
                                                                  onChange={(e) => setCheckOutDate(e.target.value)}
                                                                />
                                                              </Form.Group>
                                                            </Col>
                                                          </Row>

                                                          <Form.Group controlId="guests">
                                                            <Form.Label>Huéspedes</Form.Label>
                                                            <Form.Control
                                                              type="number"
                                                              min={1}
                                                              value={guests}
                                                              onChange={(e) => setGuests(Number(e.target.value) || 1)}
                                                            />
                                                          </Form.Group>

                                                          <Form.Group controlId="paymentMethod">
                                                            <Form.Label>Método de pago</Form.Label>
                                                            <Form.Select
                                                              value={paymentMethod}
                                                              onChange={(e) =>
                                                                setPaymentMethod(e.target.value as "Efectivo" | "Transferencia" | "Tarjeta")
                                                              }
                                                            >
                                                              <option value="Efectivo">Efectivo</option>
                                                              <option value="Transferencia">Transferencia bancaria</option>
                                                              <option value="Tarjeta">Tarjeta de crédito/débito</option>
                                                            </Form.Select>
                                                          </Form.Group>

                                                          <div className="d-grid mt-2">
                                                            <Button
                                                              variant="primary"
                                                              size="lg"
                                                              onClick={handleReserve}
                                                              disabled={creating || loading}
                                                            >
                                                              {creating ? "Creando reserva..." : "Confirmar reserva"}
                                                            </Button>
                                                          </div>
                                                        </Form>
                                                      </Card.Body>
                                                    </Card>
                                                  </Col>
                                                </Row>
                                              )}
                                            </Container>
                                          </main>

                                          <Footer />
                                        </div>
                                      </div>
                                    );
                                  };

                                  export default LodgingDetailPage;