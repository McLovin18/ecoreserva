'use client';

import React from 'react';
import { Button } from 'react-bootstrap';

interface WhatsAppButtonProps {
  cartItems: any[];
  total: number;
  deliveryLocation: any;
  disabled?: boolean;
}

export default function WhatsAppButton({ cartItems, total, deliveryLocation, disabled }: WhatsAppButtonProps) {
  // 🔥 CONFIGURACIÓN: Tu número de WhatsApp 

  const WHATSAPP_NUMBER = "593987275333"; 
  
  const generateWhatsAppMessage = () => {
    let message = "¡Hola! Me interesa hacer una *reserva de departamento* desde tu sitio web:\n\n";
    
    // Agregar departamentos seleccionados
    message += "*DEPARTAMENTOS SELECCIONADOS:*\n";
    cartItems.forEach((item, index) => {
      message += `${index + 1}. *${item.name || item.title || 'Departamento'}*\n`;
      if (item.selectedSize) message += `    Talla: ${item.selectedSize}\n`;
      if (item.selectedColor) message += `    Color: ${item.selectedColor}\n`;
      message += `    Cantidad: ${item.quantity}\n`;
      message += `    Precio: $${item.price.toFixed(2)}\n\n`;
    });
    
    // Agregar total
    message += ` *TOTAL ESTIMADO DE LA RESERVA: $${total.toFixed(2)}*\n\n`;
    
    // Agregar información de ubicación/contacto del huésped
    if (deliveryLocation) {
      message += "📍 *DATOS DE UBICACIÓN DEL HUÉSPED:*\n";
      message += `🏙️ Ciudad: ${deliveryLocation.city}\n`;
      message += `📍 Sector / zona: ${deliveryLocation.zone}\n`;
      if (deliveryLocation.phone) {
        message += `📞 Teléfono: ${deliveryLocation.phone}\n`;
      }
      if (deliveryLocation.address) {
        message += `🏠 Referencia del departamento: ${deliveryLocation.address}\n`;
      }
      message += "\n";
    }
    
    message += "¿Podrías confirmarme la *disponibilidad* de estos departamentos y los métodos de pago para la reserva? 😊\n\n";
    message += "Prefiero coordinar la reserva y el pago directamente contigo. ¡Gracias! 🙌";
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    if (disabled || cartItems.length === 0) return;
    
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    
    // Abrir WhatsApp en una nueva ventana
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div>
      <Button
        onClick={handleWhatsAppClick}
        disabled={disabled || cartItems.length === 0}
        className="w-100 py-3 mb-2"
        style={{
          backgroundColor: '#25D366',
          borderColor: '#25D366',
          fontSize: '1.1rem',
          fontWeight: 'bold'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '#128C7E';
            e.currentTarget.style.borderColor = '#128C7E';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '#25D366';
            e.currentTarget.style.borderColor = '#25D366';
          }
        }}
      >
        <i className="bi bi-whatsapp me-2" style={{ fontSize: '1.2rem' }}></i>
        Reservar por WhatsApp
      </Button>
      
      <div className="text-center mb-3">
        <small className="text-muted">
          <i className="bi bi-info-circle me-1"></i>
          Proceso personalizado con atención directa
        </small>
      </div>
    </div>
  );
}
