export const BACKEND_URL = "https://bridge-backend-black.vercel.app/api/v1";

export const PAGES = {
  HOME: "/",
  NOTIFICATIONS: "/notifications",
  REGISTER_BUSINESS: "/register/business",
  REGISTER_INVESTOR: "/register/investor",
  DASHBOARD_INVESTOR: "/dashboard/investor",
  DASHBOARD_INVESTOR_PORTFOLIO: "/dashboard/investor/portfolio",
  DASHBOARD_BUSINESS: "/dashboard/business",
  DASHBOARD_BUSINESS_PAYMENTS: "/dashboard/business/payments",
  DASHBOARD_BUSINESS_CREATE_LISTING: "/dashboard/business/create-listing",
  LISTINGS_ID: "/listings/$id",
  BUSINESS_ID: "/business/$id",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

export const SECTORS = [
  "Agriculture",
  "Retail",
  "Technology",
  "Logistics",
  "Healthcare",
  "Manufacturing",
  "Services",
  "Real Estate",
];
