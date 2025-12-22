'use client';

// Servicio legacy de compras basado en Firestore.
// En EcoReserva (reservas de hospedaje) ya no se usa flujo de compras,
// así que todas las funciones aquí quedan como no operativas y SIN Firebase.

// Definición de tipos
export interface PurchaseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Purchase {
  id?: string;
  purchaseId?: string;
  userId: string;
  date: string;
  items: PurchaseItem[];
  total: number;
}

export interface DailyOrder {
  id: string;
  userId: string;
  userName?: string; // Opcional para compatibilidad con pedidos existentes
  userEmail?: string; // Opcional: email del usuario
  date: string;
  guestCheckout?: boolean; // ✅ agregado
  items: PurchaseItem[];
  total: number;
  orderTime: string;
}

export interface DailyOrdersDocument {
  date: string; // YYYY-MM-DD
  dateFormatted: string;
  orders: DailyOrder[];
  totalOrdersCount: number;
  totalDayAmount: number;
  createdAt: string;
  lastUpdated: string;
}

// Colección de compras en Firestore (ahora como subcolección por usuario)
// const PURCHASES_COLLECTION = 'purchases';

/**
 * Valida los datos de una compra antes de guardarla
 */
function validatePurchase(purchase: Omit<Purchase, 'id'>) {
  if (!purchase.userId || typeof purchase.userId !== 'string') {
    throw new Error('El userId es requerido y debe ser un string.');
  }
  if (!Array.isArray(purchase.items) || purchase.items.length === 0) {
    throw new Error('La compra debe tener al menos un producto.');
  }
  purchase.items.forEach((item, idx) => {
    if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number' || !item.image) {
      throw new Error(`El producto en la posición ${idx} no es válido.`);
    }
  });
  if (typeof purchase.total !== 'number' || purchase.total < 0) {
    throw new Error('El total debe ser un número mayor o igual a 0.');
  }
}

/**
 * Guarda una nueva compra en Firestore en la subcolección del usuario
 * Y también intenta guardarla en la colección diaria de pedidos para fácil visualización (opcional)
 */


export const savePurchase = async (
  purchase: Omit<Purchase, 'id'>,
  userName?: string,
  userEmail?: string
): Promise<string> => {
  // En el nuevo modelo de reservas (SQL Server) no se registra compras.
  // Si alguna parte del front llama a esto, devolvemos un error claro.
  validatePurchase(purchase);
  throw new Error('El flujo de compras con Firestore ha sido deshabilitado. Usa reservas de hospedaje.');
};





/**
 * Obtiene todas las compras de un usuario desde la subcolección
 */
export const getUserPurchases = async (userId: string): Promise<Purchase[]> => {
  console.warn('getUserPurchases llamado en modo legacy. Retornando arreglo vacío.');
  return [];
};

/**
 * Elimina todas las compras de un usuario
 */
export const clearUserPurchases = async (userId: string): Promise<void> => {
  console.warn('clearUserPurchases llamado en modo legacy. No realiza ninguna acción.');
};

/**
 * Función de compatibilidad para migrar compras de localStorage a Firestore
 */
// (Eliminada: ahora solo se usa Firestore para compras)

// --- FAVORITOS FIRESTORE ---

/**
 * Agrega un producto a favoritos del usuario en Firestore
 */
export const addFavourite = async (userId: string, product: {
  id: string | number;
  name: string;
  price: number;
  image: string;
  description?: string;
}) => {
  console.warn('addFavourite (Firestore) deshabilitado en modo SQL. Usa favoritos locales.');
};


export const removeFavourite = async (userId: string, productId: string | number) => {
  console.warn('removeFavourite (Firestore) deshabilitado en modo SQL.');
};

export const getUserFavourites = async (userId: string) => {
  console.warn('getUserFavourites (Firestore) deshabilitado en modo SQL.');
  return [];
};

// --- COMENTARIOS DE PRODUCTO EN FIRESTORE ---

/**
 * Agrega un comentario a un producto en Firestore
 */
export const addProductComment = async (
  productId: string | number,
  comment: { 
    name: string; 
    text: string; 
    date: string; 
    rating: number; 
    replies: any[],
    photoURL?: string
  }
) => {
  console.warn('addProductComment (Firestore) deshabilitado en modo SQL.');
  return;
};




/**
 * Obtiene todos los comentarios de un producto desde Firestore, ordenados por fecha descendente
 */
export const getProductComments = async (productId: string | number) => {
  console.warn('getProductComments (Firestore) deshabilitado en modo SQL.');
  return [];
};

export const updateProductRating = async (productId: string | number, averageRating: number) => {
  console.warn('updateProductRating (Firestore) deshabilitado en modo SQL.');
};


export const addReplyToComment = async (
  productId: string | number,
  commentId: string,
  reply: { name: string; text: string; date: string }
): Promise<boolean> => {
  console.warn('addReplyToComment (Firestore) deshabilitado en modo SQL.');
  return false;
};

// --- FUNCIONES PARA GESTIÓN DIARIA DE PEDIDOS ---

/**
 * Obtiene todos los pedidos de un día específico
 */
export const getDailyOrders = async (date: string): Promise<DailyOrdersDocument | null> => {
  console.warn('getDailyOrders (Firestore) deshabilitado en modo SQL.');
  return null;
};

/**
 * Obtiene todos los días que tienen pedidos, ordenados por fecha descendente
 */
export const getAllOrderDays = async (): Promise<DailyOrdersDocument[]> => {
  console.warn('getAllOrderDays (Firestore) deshabilitado en modo SQL.');
  return [];
};

/**
 * Obtiene estadísticas de pedidos por rango de fechas
 */
export const getOrdersStatistics = async (startDate: string, endDate: string) => {
  console.warn('getOrdersStatistics (Firestore) deshabilitado en modo SQL.');
  return {
    totalDays: 0,
    totalOrders: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    averageOrdersPerDay: 0,
    days: [] as DailyOrdersDocument[]
  };
};

/**
 * Obtiene los pedidos de hoy
 */
export const getTodayOrders = async (): Promise<DailyOrdersDocument | null> => {
  const today = new Date().toISOString().split('T')[0];
  return getDailyOrders(today);
};



export const getUserDisplayInfo = (user: any) => {
  if (!user) return { userName: undefined, userEmail: undefined };
  
  // Prioridad: displayName > email (parte antes del @) > undefined
  let userName: string | undefined = undefined;
  if (user.displayName) {
    userName = user.displayName;
  } else if (user.email) {
    userName = user.email.split('@')[0];
  }
  
  return {
    userName,
    userEmail: user.email || undefined
  };
};

