export type AffiliationItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  priceLabel?: string;
  originalPriceLabel?: string;
  rating?: number;
  reviewCount?: number;
  durationLabel?: string;
  imageUrl?: string;
  provider: string;
  ctaUrl?: string;
};

export const affiliationItems: AffiliationItem[] = [
  {
    id: "booking-milan-stay",
    title: "Boutique Stay in Milan",
    subtitle: "Milan, Italy",
    category: "Stay",
    priceLabel: "From €149",
    rating: 4.7,
    reviewCount: 1240,
    durationLabel: "2 nights",
    imageUrl:
      "https://images.unsplash.com/photo-1743410976738-180b1f15f339?fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    provider: "Booking.com",
    ctaUrl: "https://www.booking.com",
  },
  {
    id: "expedia-lake-como",
    title: "Lake Como Day Escape",
    subtitle: "Lake Como, Italy",
    category: "Experience",
    priceLabel: "From €89",
    rating: 4.6,
    reviewCount: 830,
    durationLabel: "8h",
    imageUrl:
      "https://images.unsplash.com/photo-1562055441-b15a5c6a2f4f?fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=60&w=3000",
    provider: "Expedia",
    ctaUrl: "https://www.expedia.com",
  },
  {
    id: "omio-florence-trip",
    title: "High-Speed Trip to Florence",
    subtitle: "Florence, Italy",
    category: "City Transfer",
    priceLabel: "From €29",
    rating: 4.5,
    reviewCount: 410,
    durationLabel: "1h 40m",
    imageUrl:
      "https://images.unsplash.com/photo-1768213021804-3914aceac32c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    provider: "Omio",
    ctaUrl: "https://www.omio.com",
  },
  {
    id: "gotogate-barcelona",
    title: "Weekend Flight to Barcelona",
    subtitle: "Barcelona, Spain",
    category: "Flight",
    priceLabel: "From €79",
    rating: 4.4,
    reviewCount: 620,
    durationLabel: "2h",
    imageUrl:
      "https://images.unsplash.com/photo-1758471206484-0eaa2568320c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    provider: "GotoGate",
    ctaUrl: "https://www.gotogate.com",
  },
  {
    id: "booking-amalfi",
    title: "Seaside Resort in Amalfi",
    subtitle: "Amalfi Coast, Italy",
    category: "Stay",
    priceLabel: "From €189",
    rating: 4.8,
    reviewCount: 1540,
    durationLabel: "3 nights",
    imageUrl:
      "https://images.unsplash.com/photo-1764586118555-6166ff75e6ec?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    provider: "Booking.com",
    ctaUrl: "https://www.booking.com",
  },
  {
    id: "expedia-rome-food",
    title: "Rome Food & Wine Walk",
    subtitle: "Rome, Italy",
    category: "Experience",
    priceLabel: "From €59",
    rating: 4.7,
    reviewCount: 980,
    durationLabel: "3h",
    imageUrl:
      "https://images.unsplash.com/photo-1759843541048-95dcad7bb44a?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    provider: "Expedia",
    ctaUrl: "https://www.expedia.com",
  },
  {
    id: "omio-verona-train",
    title: "Scenic Train to Verona",
    subtitle: "Verona, Italy",
    category: "City Transfer",
    priceLabel: "From €24",
    rating: 4.5,
    reviewCount: 520,
    durationLabel: "1h 20m",
    imageUrl:
      "https://images.unsplash.com/photo-1768213021804-3914aceac32c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    provider: "Omio",
    ctaUrl: "https://www.omio.com",
  },
  {
    id: "gotogate-palermo",
    title: "Island Hop to Palermo",
    subtitle: "Palermo, Italy",
    category: "Flight",
    priceLabel: "From €69",
    rating: 4.3,
    reviewCount: 390,
    durationLabel: "1h 15m",
    imageUrl:
      "https://images.unsplash.com/photo-1661152077422-74ae9fbb60b9?fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=60&w=3000",
    provider: "GotoGate",
    ctaUrl: "https://www.gotogate.com",
  },
];
