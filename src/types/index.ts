export type CategoryType = 'all' | 'snacks' | 'cosmetics' | 'collectibles' | 'luxury' | 'pharmacy';

export type CountryCode = 'all' | 'japan' | 'korea' | 'usa' | 'thailand' | 'france';

export interface MenuItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  originCountry: string;
  originCity: string;
  countryCode: CountryCode;
  shopperName: string;
  shopperFlight: string;
  priceIdr: number;
  originalPriceForeign: string;
  marginPercent: number;
  weightKg: number;
  slotsTotal: number;
  slotsBooked: number;
  status: 'Available' | 'Limited Space' | 'In-Flight' | 'Sold Out';
  imageUrl: string; // Drive ID or URL
  rating: number;
  reviewsCount: number;
  description: string;
  verifiedBadge?: string;
  storeReceiptRequired?: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export type PaymentMethodId = 'qris' | 'transfer' | 'cash';

export interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  courierType: 'paxel' | 'jne_yes' | 'instant';
  specialInstructions: string;
  paymentMethod: PaymentMethodId;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  itemsSummary: string;
  itemsDetail: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  travelerFee: number;
  customsBuffer: number;
  courierFee: number;
  discount: number;
  grandTotal: number;
  paymentMethod: string;
  status: 'Pending Purchase' | 'Proof Uploaded' | 'In-Transit' | 'Customs Cleared' | 'Courier Dispatched' | 'Delivered' | 'Cancelled';
  assignedTraveler: string;
  flightCode: string;
  proofImageUrl?: string;
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  lifetimeSpent: number;
  trustScore: number;
  tier: 'Diamond VIP' | 'Gold' | 'Silver' | 'Member';
}

export interface DepartureHub {
  id: string;
  city: string;
  countryCode: string;
  flag: string;
  flightDate: string;
  capacityLeftKg: number;
  shoppersCount: number;
  flightCode: string;
}
