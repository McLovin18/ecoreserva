'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/adminContext';
import { usePathname } from 'next/navigation';

const TopbarMobile = () => {
  const { user } = useAuth();
  const { isAdmin, isOwner } = useRole();
  const pathname = usePathname();

  if (!user) return null;

  // ✅ Menú base para todos los usuarios (turista: flujo de reservas)
    const baseMenuItems = [
      { name: 'Inicio', path: '/inicio', icon: 'bi-house' },
      { name: 'Reservar', path: '/reservar', icon: 'bi-search' },
      { name: 'Mis reservas', path: '/myReservations', icon: 'bi-calendar2-heart' },
      { name: 'Actividades', path: '/actividades', icon: 'bi-calendar2-check' },
      { name: 'Perfil', path: '/profile', icon: 'bi-person' },
    ];

  // ✅ Menú de administración - fila principal
  const adminMainItems = [
    { name: 'Admin', path: '/admin/reservations', icon: 'bi-shield-check' }
  ];

  // ✅ Menú de administración - fila secundaria
  const adminAdvancedItems = [
    { name: 'Hospedajes', path: '/admin/inventory', icon: 'bi-building' },
    { name: 'Crear blogs', path: '/admin/crear-blogs', icon: 'bi-pencil-square' }
  ];

  // ✅ Construir menús según el rol del usuario
  let mainMenuItems = [...baseMenuItems];
  let secondaryMenuItems: typeof baseMenuItems = [];

  if (isOwner) {
    mainMenuItems = [
      ...baseMenuItems,
      { name: 'Mis hospedajes', path: '/owner/properties', icon: 'bi-building' },
      { name: 'Reservas anfitrión', path: '/owner/reservations', icon: 'bi-calendar2-check' },
    ];
  }

  if (isAdmin) {
    mainMenuItems = [...baseMenuItems, ...adminMainItems];
    secondaryMenuItems = adminAdvancedItems;
  }

  // Función para determinar si un link está activo
  const isActiveLink = (itemPath: string) => {
    if (itemPath === '/') {
      return pathname === '/';
    }

    return pathname.startsWith(itemPath);
  };

  // Componente para renderizar una fila de navegación
  const renderNavRow = (items: typeof baseMenuItems, className = '') => (
    <ul className={`nav nav-pills d-flex justify-content-around mb-0 ${className}`}>
      {items.map((item) => (
        <li key={item.path} className="nav-item flex-fill">
          <Link 
            href={item.path} 
            className={`nav-link d-flex flex-column align-items-center gap-1 p-2 text-center ${
              isActiveLink(item.path) ? 'active' : 'text-dark'
            }`}
            style={{ 
              borderRadius: '0.75rem', 
              fontWeight: isActiveLink(item.path) ? 600 : 500,
              fontSize: '0.75rem',
              minHeight: '60px',
              backgroundColor: isActiveLink(item.path) ? 'var(--cosmetic-primary)' : 'transparent',
              color: isActiveLink(item.path) ? 'white' : 'var(--cosmetic-tertiary)',
              transition: 'all 0.2s ease'
            }}
          >
            <i 
              className={`bi ${item.icon}`} 
              style={{ 
                fontSize: '1.1rem',
                color: isActiveLink(item.path) ? 'white' : 'var(--cosmetic-tertiary)'
              }}
            ></i>
            <span 
              className="small" 
              style={{ 
                fontSize: '0.7rem',
                color: isActiveLink(item.path) ? 'white' : 'var(--cosmetic-tertiary)'
              }}
            >
              {item.name}
            </span>
            
            {isActiveLink(item.path) && (
              <div 
                className="position-absolute rounded-circle bg-white"
                style={{
                  width: '4px',
                  height: '4px',
                  bottom: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
              />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <nav
      id="topbar-mobile"
      className="topbar-mobile d-lg-none bg-white shadow-sm border-bottom position-sticky"
      style={{
        borderColor: 'var(--cosmetic-primary)',
        zIndex: 1020,
        top: 'var(--navbar-height, 0px)', // 🔥 Usa la variable CSS
        transition: 'top 0.1s ease-out' // 🔥 Transición suave
      }}
    >
      <div className="container-fluid px-2 py-2">
        {/* Fila principal de navegación */}
        {renderNavRow(mainMenuItems)}
        
        {/* Fila secundaria solo para administradores */}
        {isAdmin && secondaryMenuItems.length > 0 && (
          <div className="mt-2 pt-2 border-top" style={{ borderColor: 'var(--cosmetic-primary)' }}>
            {renderNavRow(secondaryMenuItems, 'admin-secondary')}
          </div>
        )}
      </div>
      
      {/* Estilos CSS específicos */}
      <style jsx>{`
        .topbar-mobile .nav-link:hover {
          background-color: var(--cosmetic-secondary) !important;
          transform: translateY(-1px);
          color: var(--cosmetic-primary) !important;
        }

        .topbar-mobile .nav-link.active {
          background-color: var(--cosmetic-primary) !important;
          color: white !important;
        }

        .topbar-mobile .nav-link {
          transition: all 0.2s ease;
        }

        .topbar-mobile .admin-secondary .nav-link {
          min-height: 55px;
          font-size: 0.7rem;
        }

        .topbar-mobile .admin-secondary .nav-link i {
          font-size: 1rem;
        }

        .topbar-mobile .admin-secondary .nav-link span {
          font-size: 0.65rem;
        }

        @media (max-width: 576px) {
          .topbar-mobile .nav-link {
            padding: 0.4rem 0.2rem !important;
            font-size: 0.65rem !important;
            min-height: 55px;
          }
          
          .topbar-mobile .nav-link i {
            font-size: 1rem !important;
          }
          
          .topbar-mobile .nav-link span {
            font-size: 0.6rem !important;
          }

          .topbar-mobile .admin-secondary .nav-link {
            min-height: 50px;
            padding: 0.3rem 0.1rem !important;
          }

          .topbar-mobile .admin-secondary .nav-link i {
            font-size: 0.9rem !important;
          }

          .topbar-mobile .admin-secondary .nav-link span {
            font-size: 0.55rem !important;
          }
        }

        @media (min-width: 577px) and (max-width: 991px) {
          .topbar-mobile .nav-link {
            padding: 0.5rem !important;
            min-height: 65px;
          }
          
          .topbar-mobile .nav-link i {
            font-size: 1.2rem !important;
          }

          .topbar-mobile .admin-secondary .nav-link {
            min-height: 60px;
          }
        }
      `}</style>
    </nav>
  );
};

export default TopbarMobile;