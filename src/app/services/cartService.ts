'use client';

// Servicio de carrito legacy. En EcoReserva (reservas de hospedaje)
// solo mantenemos el modo invitado en localStorage y deshabilitamos
// completamente la persistencia en Firebase/Firestore.

import { inventoryService } from './inventoryService';

// Reactivo interno del CartService
type Listener = (items: CartItem[]) => void;

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  userId?: string;
  dateAdded?: string;
}

export interface CartData {
  userId: string;
  items: CartItem[];
  lastUpdated: string;
  totalItems: number;
  totalPrice: number;
}

class CartService {
  private readonly COLLECTION_NAME = 'carts';
  private readonly CART_GUEST_KEY = 'cartItems_guest';

  // Estado reactivo interno
  private listeners: Listener[] = [];

  /* ================================================================
      🔹 LISTENER SYSTEM REACTIVO
  =================================================================*/
  subscribe(callback: Listener, userId?: string) {
    this.listeners.push(callback);

    // Estado inicial correcto según usuario
    if (userId) {
      this.getUserCart(userId).then(items => callback(items));
    } else {
      callback(this.getGuestCart());
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }


  


  // 🔄 Compatibilidad con versiones previas
  subscribeToCartChanges(callback: Listener) {
    return this.subscribe(callback);
  }

  getGuestTotalItems(): number {
    const cart = this.getGuestCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }


  private emit(items?: CartItem[]) {
    if (items) {
      this.listeners.forEach(cb => cb(items));
    } else {
      // Si no hay items → modo invitado
      const guest = this.getGuestCart();
      this.listeners.forEach(cb => cb(guest));
    }
  }

  /* ================================================================
      🔹 CARRITO INVITADO
  =================================================================*/
  private getGuestCart(): CartItem[] {
    return JSON.parse(localStorage.getItem(this.CART_GUEST_KEY) || '[]');
  }

  private saveGuestCart(items: CartItem[]) {
    localStorage.setItem(this.CART_GUEST_KEY, JSON.stringify(items));

    // Emitir cambios al sistema reactivo
    this.emit(items);

    // Evento global (para actualizar el ícono)
    window.dispatchEvent(new Event("cart-updated"));
  }

  /* ================================================================
      🔹 GET USER CART
  =================================================================*/
  async getUserCart(userId: string): Promise<CartItem[]> {
    if (!userId) return this.getGuestCart();
    console.warn('getUserCart en modo SQL solo soporta carrito invitado (localStorage).');
    return [];
  }



  /* ================================================================
      🔹 ADD TO CART
  =================================================================*/

  async addToCart(
    userId: string,
    item: Omit<CartItem, 'userId' | 'dateAdded'>
  ): Promise<boolean> {

    /* ======================================
          🟣 MODO INVITADO (sin login)
    ====================================== */
    if (!userId) {
      const guestItems = this.getGuestCart();
      const index = guestItems.findIndex(i => i.id === item.id);

      if (index !== -1) {
        guestItems[index].quantity += item.quantity;
      } else {
        guestItems.push({
          ...item,
          dateAdded: new Date().toISOString()
        });
      }

      this.saveGuestCart(guestItems);


      return true;
    }


    

    // 🟢 MODO LOGUEADO (deshabilitado: antes usaba Firebase)
    console.warn('addToCart con usuario logueado está deshabilitado (Firestore removido).');
    return false;
  }


  /* ================================================================
    🔹 CLEAR CART
================================================================*/
  async clearCart(userId?: string): Promise<boolean> {
    // Invitado
    if (!userId) {
      localStorage.removeItem(this.CART_GUEST_KEY);
      this.emit([]);
      window.dispatchEvent(new Event("cart-updated"));
      return true;
    }

    // Logueado (deshabilitado)
    console.warn('clearCart para usuario logueado deshabilitado (Firestore removido).');
    return false;
  }



  

  /* ================================================================
      🔹 UPDATE QUANTITY
  =================================================================*/
  async updateCartItemQuantity(userId: string, itemId: number, qty: number): Promise<boolean> {

    /* Invitado */
    if (!userId) {
      const items = this.getGuestCart();
      const index = items.findIndex(i => i.id === itemId);

      if (index === -1) return false;

      if (qty <= 0) items.splice(index, 1);
      else items[index].quantity = qty;

      this.saveGuestCart(items);
      return true;
    }

    // Logueado (deshabilitado)
    console.warn('updateCartItemQuantity para usuario logueado deshabilitado (Firestore removido).');
    return false;
  }


  /* ================================================================
      🔹 REMOVE ITEM
  =================================================================*/
  async removeFromCart(userId: string, itemId: number): Promise<boolean> {

    /* Invitado */
    if (!userId) {
      const items = this.getGuestCart().filter(i => i.id !== itemId);
      this.saveGuestCart(items);
      return true;
    }

    // Logueado (deshabilitado)
    console.warn('removeFromCart para usuario logueado deshabilitado (Firestore removido).');
    return false;
  }

  /* ================================================================
      🔹 MIGRATE LOCAL → FIREBASE
  =================================================================*/
  async migrateFromLocalStorage(userId: string): Promise<boolean> {
    console.warn('migrateFromLocalStorage deshabilitado (ya no se usa carrito en Firestore).');
    return false;
  }
}

export const cartService = new CartService();
