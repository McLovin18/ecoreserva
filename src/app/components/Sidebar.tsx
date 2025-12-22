'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/adminContext';
import { usePathname } from 'next/navigation';

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

const Sidebar = () => {
  const { user } = useAuth();
  const { isAdmin, isOwner, isClient } = useRole();
  const pathname = usePathname();

  if (!user) return null;

  let menuItems: MenuItem[] = [];

  // Navegación principal según rol
  if (isAdmin) {
    menuItems = [
      { name: 'Reservas (admin)', path: '/admin/reservations', icon: 'bi-calendar-check' },
      { name: 'Hospedajes', path: '/admin/inventory', icon: 'bi-building' },
    ];
  } else if (isOwner) {
    menuItems = [
      { name: 'Mis Departamentos', path: '/owner/properties', icon: 'bi-building' },
      { name: 'Reservas', path: '/owner/reservations', icon: 'bi-calendar2-check' },
      { name: 'Actividades', path: '/owner/activities', icon: 'bi-tree' },
    ];
  } else if (isClient) {
    menuItems = [
      { name: 'Inicio', path: '/inicio', icon: 'bi-house-door' },
      { name: 'Reservar', path: '/reservar', icon: 'bi-search' },
      { name: 'Mis reservas', path: '/myReservations', icon: 'bi-calendar2-heart' },
      { name: 'Actividades', path: '/actividades', icon: 'bi-tree' },
    ];
  }

  // Perfil disponible para todos los roles
  menuItems.push({ name: 'Perfil', path: '/profile', icon: 'bi-person' });

  return (
    <>
      {/* Sidebar vertical para pantallas grandes - dentro del layout flex */}
      <aside className="sidebar-desktop d-none d-lg-flex flex-column flex-shrink-0 p-3 shadow-sm" style={{ width: '220px', minHeight: '100vh', backgroundColor: "var(--cosmetic-secondary)", borderRight: '2px solid var(--cosmetic-primary)' }}>
        <ul className="nav nav-pills flex-column mb-auto">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item mb-2">
              <Link 
                href={item.path} 
                className={`nav-link d-flex align-items-center gap-2 ${pathname === item.path || (item.path.startsWith('/profile') && pathname.startsWith('/profile')) ? '' : ''}`}
                style={{ 
                  borderRadius: '0.5rem', 
                  fontWeight: 500,
                  backgroundColor: pathname === item.path || (item.path.startsWith('/profile') && pathname.startsWith('/profile')) ? 'var(--cosmetic-primary)' : 'transparent',
                  color: pathname === item.path || (item.path.startsWith('/profile') && pathname.startsWith('/profile')) ? 'white' : 'var(--cosmetic-tertiary)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!(pathname === item.path || (item.path.startsWith('/profile') && pathname.startsWith('/profile')))) {
                    e.currentTarget.style.backgroundColor = 'var(--cosmetic-secondary)';
                    e.currentTarget.style.color = 'var(--cosmetic-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(pathname === item.path || (item.path.startsWith('/profile') && pathname.startsWith('/profile')))) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--cosmetic-tertiary)';
                  }
                }}
              >
                <i className={`bi ${item.icon} fs-5`}></i>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;