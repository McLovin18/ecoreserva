'use client';

import { apiFetch } from '../utils/apiClient';

export interface ProductInventory {
  productId: number;
  name: string;
  stock: number;
  price: number;
  images: string[]; // Array de URLs de imágenes
  category?: string;
  isActive: boolean; // Controlado automáticamente por stock
  lastUpdated: string;
  description?: string;
  details?: string[]; // Detalles del producto
  ownerEmail?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

class InventoryService {
  private collectionName = 'inventory';

  // ✅ Obtener stock de un producto específico
  async getProductStock(productId: number): Promise<number> {
    try {
      const product = await this.getProductById(productId);
      return product?.stock || 0;
    } catch (error) {
      console.error('Error obteniendo stock:', error);
      return 0;
    }
  }

  // ✅ Verificar si un producto está disponible (automático basado en stock)
  async isProductAvailable(productId: number, requestedQuantity: number = 1): Promise<boolean> {
    try {
      const product = await this.getProductById(productId);
      if (!product) return false;
      if (product.status === 'rejected') return false;
      if (product.status && product.status !== 'approved') return false;
      return product.stock >= requestedQuantity;
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      return false;
    }
  }

  // ✅ Reducir stock cuando se hace una compra
  async reduceStock(productId: number, quantity: number): Promise<boolean> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error(`El producto ${productId} no está registrado en el inventario`);
      }

      if (product.stock < quantity) {
        throw new Error(`Stock insuficiente para "${product.name}". Stock disponible: ${product.stock}, cantidad solicitada: ${quantity}`);
      }

      await apiFetch(`/api/hospedajes/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ delta: -quantity }),
      });

      return true;
    } catch (error) {
      console.error('❌ Error reduciendo stock:', error);
      throw error; // Re-lanzar el error para que el sistema de compras lo maneje
    }
  }

  // ✅ Agregar stock (para admin) - actualiza isActive automáticamente
  async addStock(productId: number, quantity: number): Promise<boolean> {
    try {
      await apiFetch(`/api/hospedajes/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ delta: quantity }),
      });
      return true;
    } catch (error) {
      console.error('Error agregando stock:', error);
      return false;
    }
  }

  // ✅ Crear o actualizar producto en inventario (para admin)
  async createOrUpdateProduct(productData: Omit<ProductInventory, 'lastUpdated' | 'isActive'>): Promise<boolean> {
    try {
      await apiFetch('/api/hospedajes', {
        method: 'POST',
        body: JSON.stringify({
          name: productData.name,
          price: productData.price,
          stock: productData.stock,
          description: productData.description,
          category: productData.category,
        }),
      });
      return true;
    } catch (error) {
      console.error('Error creando/actualizando producto:', error);
      return false;
    }
  }

  // ✅ Obtener productos disponibles por categoría
  async getProductsByCategory(category: string): Promise<ProductInventory[]> {
    try {
      const all = await this.getAvailableProducts();
      return all.filter((p) => p.category === category);
    } catch (error) {
      console.error(`Error obteniendo productos de categoría "${category}":`, error);
      return [];
    }
  }

  // ✅ Obtener solo productos disponibles (para clientes) - basado en stock
  async getAvailableProducts(): Promise<ProductInventory[]> {
    try {
      const rows = await apiFetch<any[]>('/api/hospedajes', { method: 'GET' });
      const products: ProductInventory[] = rows.map((row) => {
        const productId = row.productId ?? row.id ?? row.id_hospedaje;

        // Solo mapeamos estados que coinciden con el inventario clásico
        let status: ProductInventory['status'];
        if (row.status === 'pending' || row.status === 'approved' || row.status === 'rejected') {
          status = row.status;
        }

        return {
          productId,
          name: row.name ?? row.nombre ?? 'Hospedaje sin nombre',
          stock: typeof row.stock === 'number' ? row.stock : 1,
          price: Number(row.price ?? row.precio_base ?? 0),
          images: [],
          category: 'Cabaña',
          isActive:
            typeof row.isActive === 'boolean'
              ? row.isActive
              : row.estado === 'Activo' || row.status === 'Activo',
          lastUpdated: new Date().toISOString(),
          description: row.description ?? row.descripcion,
          status,
        };
      });

      // Para hospedajes, basta con que estén activos
      return products
        .filter((p) => p.isActive)
        .sort((a, b) => a.productId - b.productId);
    } catch (error) {
      console.error('Error obteniendo productos disponibles:', error);
      return [];
    }
  }

  // ✅ Eliminar producto completamente (para admin)
  async deleteProduct(productId: number): Promise<boolean> {
    try {
      await apiFetch(`/api/hospedajes/${productId}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      return false;
    }
  }

  // ✅ Obtener todos los productos del inventario (para admin)
  async getAllProducts(): Promise<ProductInventory[]> {
    try {
      return this.getAvailableProducts();
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      return [];
    }
  }

  // ✅ Obtener producto específico por ID
  async getProductById(productId: number): Promise<ProductInventory | null> {
    try {
      const rows = await apiFetch<any[]>(`/api/hospedajes`, { method: 'GET' });
      const row = rows.find(
        (r) => r.productId === productId || r.id === productId || r.id_hospedaje === productId,
      );
      if (!row) return null;

      let status: ProductInventory['status'];
      if (row.status === 'pending' || row.status === 'approved' || row.status === 'rejected') {
        status = row.status;
      }

      return {
        productId: row.productId ?? row.id ?? row.id_hospedaje,
        name: row.name ?? row.nombre ?? 'Hospedaje sin nombre',
        stock: typeof row.stock === 'number' ? row.stock : 1,
        price: Number(row.price ?? row.precio_base ?? 0),
        images: [],
        category: 'Cabaña',
        isActive:
          typeof row.isActive === 'boolean'
            ? row.isActive
            : row.estado === 'Activo' || row.status === 'Activo',
        lastUpdated: new Date().toISOString(),
        description: row.description ?? row.descripcion,
        status,
      };
    } catch (error) {
      console.error('Error obteniendo producto por ID:', error);
      return null;
    }
  }

  // ✅ Obtener propiedades por propietario
  async getProductsByOwner(ownerEmail: string): Promise<ProductInventory[]> {
    if (!ownerEmail) return [];

    try {
      const rows = await apiFetch<any[]>('/api/hospedajes/owner/me', { method: 'GET' });
      const products: ProductInventory[] = rows.map((row) => ({
        productId: row.productId ?? row.id ?? row.id_hospedaje,
        name: row.name ?? row.nombre,
        stock: typeof row.stock === 'number' ? row.stock : 1,
        price: Number(row.price ?? row.precio_base ?? 0),
        images: [],
        category: 'Cabaña',
        isActive: typeof row.isActive === 'boolean' ? row.isActive : row.estado === 'Activo',
        lastUpdated: new Date().toISOString(),
        description: row.description ?? row.descripcion,
        status: row.status ?? row.estado,
      }));

      return products.sort((a, b) => a.productId - b.productId);
    } catch (error) {
      console.error('Error obteniendo propiedades del dueño:', error);
      return [];
    }
  }

  // ✅ Actualizar estatus de aprobación
  async updateProductStatus(productId: number, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
    try {
      await apiFetch(`/api/hospedajes/${productId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return true;
    } catch (error) {
      console.error('Error actualizando estatus de propiedad:', error);
      return false;
    }
  }

  // ✅ Procesar compra y reducir stock de múltiples productos
  async processOrder(items: { productId: number; quantity: number }[]): Promise<boolean> {
    const processedItems: { productId: number; quantity: number }[] = [];
    
    try {
      // Verificar stock de todos los productos primero
      for (const item of items) {
        const available = await this.isProductAvailable(item.productId, item.quantity);
        if (!available) {
          const productStock = await this.getProductStock(item.productId);
          throw new Error(`Stock insuficiente para producto ${item.productId}. Stock disponible: ${productStock}, cantidad solicitada: ${item.quantity}`);
        }
      }
      
      // Si todo está disponible, reducir stock uno por uno
      for (const item of items) {
        try {
          await this.reduceStock(item.productId, item.quantity);
          processedItems.push(item);
        } catch (error) {
          console.error(`❌ Error reduciendo stock para producto ${item.productId}:`, error);
          
          // Revertir cambios si algo falla a mitad del proceso
          for (const processedItem of processedItems) {
            try {
              await this.addStock(processedItem.productId, processedItem.quantity);
              console.log(`↩️ Stock revertido para producto ${processedItem.productId}: ${processedItem.quantity} unidades`);
            } catch (revertError) {
              console.error(`❌ Error revirtiendo stock para producto ${processedItem.productId}:`, revertError);
            }
          }
          
          throw error;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error procesando orden:', error);
      throw error; // Re-lanzar para que purchaseService lo maneje
    }
  }
}

export const inventoryService = new InventoryService();
