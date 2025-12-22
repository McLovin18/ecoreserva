'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'client' | 'owner'>('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, complete todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await register(email, password, name, userType);
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`); // Página de verificación con email
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está en uso');
      } else {
        setError('Error al crear la cuenta. Inténtelo de nuevo.');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      router.push('/');
    } catch (error) {
      setError('Error al iniciar sesión con Google');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Card className="p-4 shadow border-0 w-100" style={{ maxWidth: 400 }}>
        <h2 className="fw-bold mb-4 text-center">Crear Cuenta</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-1" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-1" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-1" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirmar Contraseña</Form.Label>
            <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="rounded-1" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tipo de cuenta</Form.Label>
            <div className="d-flex gap-3">
              <Form.Check
                type="radio"
                id="tipo-turista"
                label="Turista"
                name="userType"
                checked={userType === 'client'}
                onChange={() => setUserType('client')}
              />
              <Form.Check
                type="radio"
                id="tipo-anfitrion"
                label="Anfitrión (dueño de hospedajes)"
                name="userType"
                checked={userType === 'owner'}
                onChange={() => setUserType('owner')}
              />
            </div>
          </Form.Group>
          {error && <Alert variant="danger">{error}</Alert>}
          <Button type="submit" variant="dark" className="w-100 rounded-1 mb-3" disabled={loading}>
            {loading ? 'Cargando...' : 'Crear Cuenta'}
          </Button>
          <Button type="button" variant="outline-dark" className="w-100 rounded-1 mb-3" onClick={handleGoogleLogin} disabled={loading}>
            <i className="bi bi-google me-2"></i> Registrarse con Google
          </Button>
          <div className="text-center">
            <Link href="/auth/login" className="text-dark">¿Ya tienes cuenta? Inicia sesión</Link>
          </div>
        </Form>
      </Card>
    </main>
  );
};

export default Register;
