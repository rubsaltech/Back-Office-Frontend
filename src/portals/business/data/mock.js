// Mock data for the Business Portal UI (stand-in until the Spring Boot API exists).

export const stores = [
  { id: 1, name: 'Rubsal Store 1', isMain: true },
  { id: 2, name: 'Rubsal Store 2', isMain: false },
  { id: 3, name: 'Rubsal Store 3', isMain: false },
]

export const currentUser = {
  name: 'Okasha Sipra',
  email: 'sipraokasha@gmail.com',
  role: 'Owner',
}

export const dashboardStats = {
  totalItems: 36000,
  activeItems: 195,
  itemsSold: 265,
  itemsSoldDone: 0,
  totalEmployees: 2500,
  todaysSale: 0,
}

export const topSellingProducts = [
  { name: 'Product 1', sold: 62000, cap: 100000 },
  { name: 'Product 2', sold: 71000, cap: 100000 },
  { name: 'Product 3', sold: 18000, cap: 100000 },
  { name: 'Product 4', sold: 42000, cap: 100000 },
  { name: 'Product 5', sold: 39000, cap: 100000 },
  { name: 'Product 6', sold: 68000, cap: 100000 },
  { name: 'Product 7', sold: 12000, cap: 100000 },
]

export const salesTrend = [
  { day: 'Mon', a: 24000, b: 20000, c: 18000 },
  { day: 'Tue', a: 42000, b: 30000, c: 26000 },
  { day: 'Wed', a: 18000, b: 24000, c: 30000 },
  { day: 'Thu', a: 30000, b: 48000, c: 40000 },
  { day: 'Fri', a: 58000, b: 40000, c: 52000 },
  { day: 'Sat', a: 40000, b: 30000, c: 34000 },
  { day: 'Sun', a: 22000, b: 26000, c: 30000 },
]

export const employeesOverview = Array.from({ length: 6 }).map((_, i) => ({
  id: '25312152',
  name: 'Michel Gerdes',
  email: 'michelgredes@gmail.com',
  sales: 5956,
  tips: 5956,
  avatar: '',
  key: i,
}))

export const categories = [
  { id: 1, name: 'Starters', products: 24, status: 'Active' },
  { id: 2, name: 'Mains', products: 41, status: 'Active' },
  { id: 3, name: 'Soft Drinks', products: 18, status: 'Active' },
  { id: 4, name: 'Hot Beverages', products: 12, status: 'Active' },
  { id: 5, name: 'Wines', products: 30, status: 'Active' },
  { id: 6, name: 'Cocktails', products: 22, status: 'Inactive' },
  { id: 7, name: 'Desserts', products: 15, status: 'Active' },
  { id: 8, name: 'Specials', products: 9, status: 'Active' },
]

export const products = Array.from({ length: 14 }).map((_, i) => ({
  id: 1000 + i,
  name: ['Vodka', 'Bloody Caesar', 'Screech', 'Shochu', 'Soju', 'Petite Salads', 'Tequila'][i % 7],
  sku: `SKU-${2340 + i}`,
  barcode: `890${100000 + i}`,
  category: categories[i % categories.length].name,
  price: 8 + (i % 5) * 2,
  qty: 40 + i * 3,
  tax: 1.04,
  status: i % 4 === 0 ? 'Inactive' : 'Active',
}))

export const inventoryItems = products.map((p) => ({
  id: p.id,
  name: p.name,
  available: p.qty,
  price: p.price,
  sold: (p.id % 30) + 5,
  total: p.qty + 30,
}))

export const employees = Array.from({ length: 10 }).map((_, i) => ({
  id: `2531215${i}`,
  name: ['Michel Gerdes', 'Joe Smith', 'Sara Lee', 'Ali Raza', 'Nina Patel'][i % 5],
  email: 'michelgredes@gmail.com',
  role: ['Manager', 'Clerk', 'Kitchen'][i % 3],
  store: 'Rubsal Store 1',
  sales: 5956,
  tips: 5956,
  status: i % 5 === 0 ? 'Inactive' : 'Active',
}))

export const roles = [
  { id: 1, type: 'Manager', description: 'Full access to store operations', createdAt: '2024-01-27' },
  { id: 2, type: 'Clerk', description: 'Can take and manage orders', createdAt: '2024-01-27' },
  { id: 3, type: 'Kitchen', description: 'Views and updates kitchen tickets', createdAt: '2024-01-27' },
]

export const permissions = Array.from({ length: 16 }).map((_, i) => ({
  id: i + 1,
  canDo: i % 2 === 0 ? 'permission.delete' : 'permission.edit',
  description: i % 2 === 0 ? 'Can delete permission' : 'Can edit details of permission',
  createdAt: '2024-01-27',
}))

export const floors = [
  { id: 1, name: 'Ground Floor', tables: 19 },
  { id: 2, name: '1st Floor', tables: 14 },
  { id: 3, name: '2nd Floor', tables: 10 },
  { id: 4, name: '3rd Floor', tables: 8 },
]

export const tables = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  name: `T${i + 1}`,
  floor: floors[i % floors.length].name,
  seats: [2, 4, 6, 8][i % 4],
  status: i % 3 === 0 ? 'Occupied' : 'Free',
}))
