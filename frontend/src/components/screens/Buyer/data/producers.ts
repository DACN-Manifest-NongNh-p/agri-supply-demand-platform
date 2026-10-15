// Track record of each producer on the platform, built from past orders. Buyers use it to judge
// whether a batch will arrive as declared, next to the match score.

export type ProducerReview = {
  buyer: string;
  rating: number;
  /** Days before today. */
  daysAgo: number;
  text: string;
};

export type ProducerProfile = {
  name: string;
  /** Business registration checked by a Farmora coordinator. */
  verified: boolean;
  certifications: string[];
  memberSince: number;
  /** Average buyer rating out of 5. */
  rating: number;
  ratingCount: number;
  completedOrders: number;
  /** Share of deliveries that arrived inside the agreed window. */
  onTimeRate: number;
  /** Kilograms delivered against kilograms confirmed. */
  fulfilmentRate: number;
  /** Share of batches whose grade was confirmed on arrival. */
  gradeAccuracy: number;
  /** Median time to confirm or decline a hold. */
  responseHours: number;
  /** Problems reported on this producer's batches in the last 90 days. */
  recentIssues: number;
  reviews: ProducerReview[];
};

const PROFILES: ProducerProfile[] = [
  {
    name: "Hoa Phat Dragon Fruit Cooperative",
    verified: true,
    certifications: ["VietGAP", "GlobalGAP"],
    memberSince: 2021,
    rating: 4.8,
    ratingCount: 126,
    completedOrders: 214,
    onTimeRate: 96,
    fulfilmentRate: 98,
    gradeAccuracy: 95,
    responseHours: 2,
    recentIssues: 0,
    reviews: [
      { buyer: "FreshWay Markets", rating: 5, daysAgo: 6, text: "Crates packed exactly as declared, fruit firm and cold on arrival." },
      { buyer: "Saigon Fresh DC", rating: 5, daysAgo: 19, text: "Confirmed our hold within the hour and shipped a day early." },
    ],
  },
  {
    name: "Thuan Nam Mango Growers",
    verified: true,
    certifications: ["VietGAP"],
    memberSince: 2022,
    rating: 4.6,
    ratingCount: 84,
    completedOrders: 131,
    onTimeRate: 92,
    fulfilmentRate: 97,
    gradeAccuracy: 91,
    responseHours: 3,
    recentIssues: 1,
    reviews: [
      { buyer: "Mekong Mart", rating: 5, daysAgo: 4, text: "Good sweetness and ripeness, ready for the shelf in two days." },
      { buyer: "FreshWay Markets", rating: 4, daysAgo: 23, text: "About 3% of the fruit was grade B instead of A; credited without argument." },
    ],
  },
  {
    name: "Ham Kiem Green Farm",
    verified: true,
    certifications: ["VietGAP"],
    memberSince: 2023,
    rating: 4.4,
    ratingCount: 37,
    completedOrders: 52,
    onTimeRate: 90,
    fulfilmentRate: 95,
    gradeAccuracy: 92,
    responseHours: 5,
    recentIssues: 0,
    reviews: [
      { buyer: "Saigon Fresh DC", rating: 4, daysAgo: 12, text: "Arrived a few hours late but the quality was what they promised." },
    ],
  },
  {
    name: "Green Hills Farm",
    verified: false,
    certifications: [],
    memberSince: 2025,
    rating: 4.1,
    ratingCount: 9,
    completedOrders: 11,
    onTimeRate: 82,
    fulfilmentRate: 91,
    gradeAccuracy: 85,
    responseHours: 9,
    recentIssues: 1,
    reviews: [
      { buyer: "Mekong Mart", rating: 4, daysAgo: 30, text: "Fair price for processing grade. Count was 40 kg short." },
    ],
  },
  {
    name: "Muong Man Pomelo Cooperative",
    verified: true,
    certifications: ["VietGAP"],
    memberSince: 2021,
    rating: 4.5,
    ratingCount: 98,
    completedOrders: 167,
    onTimeRate: 93,
    fulfilmentRate: 94,
    gradeAccuracy: 96,
    responseHours: 3,
    recentIssues: 1,
    reviews: [
      { buyer: "FreshWay Markets", rating: 5, daysAgo: 9, text: "Told us about the storm damage early so we could re-plan." },
      { buyer: "Saigon Fresh DC", rating: 4, daysAgo: 27, text: "Thick-skinned, juicy fruit; labels on every crate." },
    ],
  },
  {
    name: "Bac Binh Citrus Farm",
    verified: true,
    certifications: [],
    memberSince: 2024,
    rating: 4.3,
    ratingCount: 21,
    completedOrders: 29,
    onTimeRate: 89,
    fulfilmentRate: 96,
    gradeAccuracy: 90,
    responseHours: 6,
    recentIssues: 0,
    reviews: [
      { buyer: "Mekong Mart", rating: 4, daysAgo: 15, text: "Solid grade B pomelo, consistent size." },
    ],
  },
  {
    name: "Lam Ha Avocado Cooperative",
    verified: true,
    certifications: ["VietGAP", "Organic (in conversion)"],
    memberSince: 2022,
    rating: 4.7,
    ratingCount: 63,
    completedOrders: 102,
    onTimeRate: 95,
    fulfilmentRate: 99,
    gradeAccuracy: 94,
    responseHours: 2,
    recentIssues: 0,
    reviews: [
      { buyer: "Saigon Fresh DC", rating: 5, daysAgo: 3, text: "Booth 7 at the right firmness; ripening chart included." },
    ],
  },
];

export function producerProfile(name: string): ProducerProfile | undefined {
  return PROFILES.find((profile) => profile.name === name);
}
