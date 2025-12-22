'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Alert } from 'react-bootstrap';
import { apiFetch } from '../../utils/apiClient';

const VerifyEmail = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const email = searchParams.get('email');

  const handleResend = async () => {
    if (!email) {
      setError('No pudimos identificar tu correo. Vuelve a registrarte o inicia sesión.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ correo: email.toLowerCase() }),
      });

      setMessage('Se ha reenviado el correo de verificación. Revisa también tu carpeta de spam.');
    } catch (err) {
      console.error('Error al reenviar verificación', err);
      setError('No se pudo reenviar el correo de verificación. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <main className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Card className="p-4 shadow border-0 w-100" style={{ maxWidth: 400 }}>
        <h3 className="fw-bold text-center mb-3">Verifica tu correo</h3>
        <p className="text-center">
          Te enviamos un correo de verificación para activar tu cuenta de EcoReserva.
          {' '}Confirma tu correo para poder gestionar tus reservas y hospedajes.
        </p>

        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Button
          variant="dark"
          className="w-100 mb-3"
          onClick={handleResend}
          disabled={loading}
        >
          {loading ? 'Reenviando...' : 'Reenviar correo'}
        </Button>

        <Button variant="success" className="w-100" onClick={goToLogin}>
          Ya verifiqué, iniciar sesión
        </Button>
      </Card>
    </main>
  );
};

export default VerifyEmail;
