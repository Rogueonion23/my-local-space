import Dexie, { type EntityTable } from 'dexie';

// Database entity types
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
}

export interface Order {
  id?: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface CartItem {
  id?: number;
  productId: number;
  quantity: number;
}

// Database class
class StoreDatabase extends Dexie {
  products!: EntityTable<Product, 'id'>;
  orders!: EntityTable<Order, 'id'>;
  cart!: EntityTable<CartItem, 'id'>;

  constructor() {
    super('MagasinDB');
    
    this.version(1).stores({
      products: 'id, name, category, price',
      orders: '++id, status, createdAt',
      cart: '++id, productId'
    });
  }
}

export const db = new StoreDatabase();

// Initialize products from JSON if empty
export async function initializeDatabase() {
  const productCount = await db.products.count();
  
  if (productCount === 0) {
    const productsData = await import('@/data/products.json');
    await db.products.bulkAdd(productsData.default);
    console.log('Database initialized with products');
  }
}

// Product operations
export const productOperations = {
  getAll: () => db.products.toArray(),
  getById: (id: number) => db.products.get(id),
  getByCategory: (category: string) => db.products.where('category').equals(category).toArray(),
  search: (query: string) => db.products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  ).toArray(),
};

// Order operations
export const orderOperations = {
  create: (order: Omit<Order, 'id'>) => db.orders.add(order),
  getAll: () => db.orders.orderBy('createdAt').reverse().toArray(),
  getById: (id: number) => db.orders.get(id),
  updateStatus: (id: number, status: Order['status']) => 
    db.orders.update(id, { status, updatedAt: new Date() }),
};

// Cart operations (persistent cart)
export const cartOperations = {
  getAll: () => db.cart.toArray(),
  add: (productId: number, quantity: number = 1) => db.cart.add({ productId, quantity }),
  update: (id: number, quantity: number) => db.cart.update(id, { quantity }),
  remove: (id: number) => db.cart.delete(id),
  clear: () => db.cart.clear(),
  getByProductId: (productId: number) => db.cart.where('productId').equals(productId).first(),
};
