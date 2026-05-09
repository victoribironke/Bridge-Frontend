// Centralized mock data for Bridge MVP. Replace with API calls in Phase 2.

export type Tier = "Tier 1" | "Tier 2" | "Tier 3";
export type Standing = "Seed" | "Sprout" | "Established" | "Anchor";
export type Sector =
  | "Retail"
  | "Food & Beverage"
  | "Agriculture"
  | "Logistics"
  | "Fashion"
  | "Tech Services"
  | "Health"
  | "Education";

export const SECTORS: Sector[] = [
  "Retail",
  "Food & Beverage",
  "Agriculture",
  "Logistics",
  "Fashion",
  "Tech Services",
  "Health",
  "Education",
];

export const platformStats = {
  businessesFunded: 1284,
  capitalDeployed: 3_420_000_000, // ₦
  averageReturnPct: 18.4,
  averageRepaymentMonths: 9.2,
};

export type ListingCard = {
  id: string;
  business: string;
  sector: Sector;
  tier: Tier;
  standing: Standing;
  targetReturnPct: number;
  capitalRequested: number;
  revenueSharePct: number;
  excerpt: string;
};

export const listingCards: ListingCard[] = [
  {
    id: "lst_001",
    business: "Mama Nkechi Foods",
    sector: "Food & Beverage",
    tier: "Tier 2",
    standing: "Established",
    targetReturnPct: 22,
    capitalRequested: 4_500_000,
    revenueSharePct: 12,
    excerpt:
      "A neighbourhood kitchen in Yaba feeding 400 lunches a day. Capital expands a second location with proven unit economics.",
  },
  {
    id: "lst_002",
    business: "Adekunle Logistics",
    sector: "Logistics",
    tier: "Tier 1",
    standing: "Sprout",
    targetReturnPct: 17,
    capitalRequested: 2_000_000,
    revenueSharePct: 9,
    excerpt:
      "Last-mile delivery operator in Ibadan with 18 months of consistent inflows. Capital funds two additional vans.",
  },
  {
    id: "lst_003",
    business: "Zara Threads",
    sector: "Fashion",
    tier: "Tier 2",
    standing: "Established",
    targetReturnPct: 24,
    capitalRequested: 3_200_000,
    revenueSharePct: 14,
    excerpt:
      "Ready-to-wear brand with a tight repeat-customer base. Capital funds a bulk fabric purchase ahead of festive season.",
  },
  {
    id: "lst_004",
    business: "Greenfield Produce",
    sector: "Agriculture",
    tier: "Tier 1",
    standing: "Seed",
    targetReturnPct: 15,
    capitalRequested: 1_500_000,
    revenueSharePct: 8,
    excerpt:
      "Smallholder aggregator buying tomatoes from 30 farmers in Jos. Capital pre-funds the next harvest cycle.",
  },
  {
    id: "lst_005",
    business: "Kano Tech Repairs",
    sector: "Tech Services",
    tier: "Tier 2",
    standing: "Established",
    targetReturnPct: 20,
    capitalRequested: 2_800_000,
    revenueSharePct: 11,
    excerpt:
      "Phone repair chain with three branches. Capital funds inventory of replacement parts to cut turnaround time.",
  },
  {
    id: "lst_006",
    business: "Bola's Provisions",
    sector: "Retail",
    tier: "Tier 1",
    standing: "Sprout",
    targetReturnPct: 16,
    capitalRequested: 1_800_000,
    revenueSharePct: 9,
    excerpt:
      "Family-run mini-mart in Surulere with steady inflows. Capital expands shelf depth on fast-moving SKUs.",
  },
  {
    id: "lst_007",
    business: "Apex Tutors",
    sector: "Education",
    tier: "Tier 3",
    standing: "Anchor",
    targetReturnPct: 19,
    capitalRequested: 6_000_000,
    revenueSharePct: 10,
    excerpt:
      "After-school tutoring network across four LGAs. Capital onboards 12 more teachers ahead of the new term.",
  },
  {
    id: "lst_008",
    business: "Coastal Catch",
    sector: "Food & Beverage",
    tier: "Tier 2",
    standing: "Established",
    targetReturnPct: 21,
    capitalRequested: 3_500_000,
    revenueSharePct: 12,
    excerpt:
      "Direct-to-restaurant seafood supplier in Lagos. Capital funds a refrigerated truck to widen the route.",
  },
];

export type ListingDetail = ListingCard & {
  totalReturnNaira: number;
  totalReturnPct: number;
  targetMonths: number;
  maxMonths: 24;
  minimumInvestment: number;
  committed: number;
  investorsCount: number;
  narrative: string[];
  flaggedNotes: string[];
  tranches: {
    label: string;
    amount: number;
    condition: string;
    released: boolean;
  }[];
  trustSignals: {
    label: string;
    status: "pass" | "flag";
    detail?: string;
  }[];
  rating: {
    overallStanding: Standing;
    score: number;
    components: { label: string; contribution: number }[];
  };
};

export const listingDetails: Record<string, ListingDetail> = {
  lst_001: {
    ...listingCards[0],
    totalReturnNaira: 990_000,
    totalReturnPct: 22,
    targetMonths: 10,
    maxMonths: 24,
    minimumInvestment: 25_000,
    committed: 2_900_000,
    investorsCount: 47,
    narrative: [
      "Mama Nkechi Foods began in 2019 as a single kitchen on Herbert Macaulay Way feeding workers in the Yaba tech corridor. What started as 40 lunches a day has grown, with discipline rather than hype, into a steady 400-meal operation that the team prepares between 5am and 11am each weekday.",
      "Inflows over the last 18 months show a clear pattern. Average monthly revenue sits at ₦3.4M, with a tight band of variation tied to school terms and public holidays. The team takes Sundays off and the data reflects that, which is a healthy signal of an honestly reported business rather than smoothed numbers.",
      "Capital from this raise funds the build-out of a second kitchen in Sabo, three kilometres from the original location. The use of funds is concrete: ₦1.8M for kitchen equipment, ₦1.2M for a six-month lease deposit, ₦900K for inventory ramp, and ₦600K for two additional cooks during the launch period.",
      "Risk signals are limited. The owner has a clean BVN history and the linked Moniepoint account matches the stated revenue within 4%. One flagged item: a three-week gap in inflows during August 2024 which the founder explained as a kitchen renovation period. The explanation was confirmed by two of the three customer references.",
    ],
    flaggedNotes: [
      "Three-week inflow gap in August 2024 — explained as a planned kitchen renovation. Cross-referenced with two customer references who confirmed the closure window.",
    ],
    tranches: [
      {
        label: "Tranche 1",
        amount: 2_250_000,
        condition: "Released on full funding — equipment purchase",
        released: false,
      },
      {
        label: "Tranche 2",
        amount: 1_350_000,
        condition: "Released after lease signed — fit-out",
        released: false,
      },
      {
        label: "Tranche 3",
        amount: 900_000,
        condition: "Released after first week of operations — inventory top-up",
        released: false,
      },
    ],
    trustSignals: [
      { label: "BVN verified", status: "pass" },
      {
        label: "Bank account linked",
        status: "pass",
        detail: "Moniepoint • 18 months history",
      },
      {
        label: "Income history",
        status: "pass",
        detail: "Apr 2023 – Oct 2024",
      },
      {
        label: "Customer references",
        status: "pass",
        detail: "3 of 3 confirmed",
      },
      { label: "CAC registration", status: "pass", detail: "RC-2089441" },
    ],
    rating: {
      overallStanding: "Established",
      score: 742,
      components: [
        { label: "Repayment speed", contribution: 180 },
        { label: "Repayment consistency", contribution: 165 },
        { label: "Transaction volume", contribution: 140 },
        { label: "Revenue consistency", contribution: 135 },
        { label: "CAC bonus", contribution: 60 },
        { label: "Communication behaviour", contribution: 62 },
      ],
    },
  },
};

// Provide a default detail fallback for other ids
export const getListingDetail = (id: string): ListingDetail => {
  if (listingDetails[id]) return listingDetails[id];
  const card = listingCards.find((c) => c.id === id) ?? listingCards[0];
  return {
    ...card,
    totalReturnNaira: Math.round(card.capitalRequested * (card.targetReturnPct / 100)),
    totalReturnPct: card.targetReturnPct,
    targetMonths: 9,
    maxMonths: 24,
    minimumInvestment: 25_000,
    committed: Math.round(card.capitalRequested * 0.42),
    investorsCount: 23,
    narrative: [
      `${card.business} operates in the ${card.sector.toLowerCase()} sector with a track record visible in linked bank inflows. The team has built the business through repeated, modest reinvestment rather than outside capital.`,
      "Inflows are steady with a seasonal pattern that matches the sector. Capital from this raise has a clear, narrow purpose tied directly to revenue expansion within the next two quarters.",
      "Risk signals are within normal range. References were contacted and confirmed the relationship. The AI flagged no inconsistencies between stated revenue and the linked account.",
    ],
    flaggedNotes: [],
    tranches: [
      {
        label: "Tranche 1",
        amount: Math.round(card.capitalRequested * 0.5),
        condition: "Released on full funding",
        released: false,
      },
      {
        label: "Tranche 2",
        amount: Math.round(card.capitalRequested * 0.3),
        condition: "Released after milestone 1",
        released: false,
      },
      {
        label: "Tranche 3",
        amount: Math.round(card.capitalRequested * 0.2),
        condition: "Released after milestone 2",
        released: false,
      },
    ],
    trustSignals: [
      { label: "BVN verified", status: "pass" },
      {
        label: "Bank account linked",
        status: "pass",
        detail: "12 months history",
      },
      {
        label: "Income history",
        status: "pass",
        detail: "Oct 2023 – Oct 2024",
      },
      {
        label: "Customer references",
        status: "pass",
        detail: "2 of 3 confirmed",
      },
      { label: "CAC registration", status: "pass" },
    ],
    rating: {
      overallStanding: card.standing,
      score:
        card.standing === "Anchor"
          ? 820
          : card.standing === "Established"
            ? 720
            : card.standing === "Sprout"
              ? 610
              : 500,
      components: [
        { label: "Repayment speed", contribution: 160 },
        { label: "Repayment consistency", contribution: 150 },
        { label: "Transaction volume", contribution: 130 },
        { label: "Revenue consistency", contribution: 125 },
        { label: "CAC bonus", contribution: 50 },
        { label: "Communication behaviour", contribution: 55 },
      ],
    },
  };
};

// Investor mocks
export const investorSummary = {
  totalDeployed: 1_250_000,
  totalReturns: 184_000,
  activeDeals: 4,
  defaultPoolBalance: 50_000,
};

export const investorActivity = [
  {
    id: "a1",
    title: "Sweep received",
    detail: "₦12,400 from Mama Nkechi Foods",
    ts: "2 hours ago",
  },
  {
    id: "a2",
    title: "Deal completed",
    detail: "Adekunle Logistics — final sweep",
    ts: "Yesterday",
  },
  {
    id: "a3",
    title: "New matched listing",
    detail: "Coastal Catch matches your preferences",
    ts: "2 days ago",
  },
  {
    id: "a4",
    title: "Sweep received",
    detail: "₦9,100 from Zara Threads",
    ts: "4 days ago",
  },
  {
    id: "a5",
    title: "Bridge Rating change",
    detail: "Apex Tutors moved to Anchor",
    ts: "1 week ago",
  },
];

export const investorWallet = {
  squadBalance: 320_000,
  defaultPoolBalance: 50_000,
};

export const investorDeals = {
  active: [
    {
      id: "d1",
      business: "Mama Nkechi Foods",
      invested: 200_000,
      totalReturn: 244_000,
      received: 96_000,
      standing: "Established" as Standing,
      projectedCompletion: "Aug 2025",
      sweeps: [
        { date: "2025-04-01", amount: 12_400 },
        { date: "2025-03-15", amount: 11_900 },
        { date: "2025-03-01", amount: 12_100 },
      ],
      tranches: [
        { label: "Tranche 1", released: true },
        { label: "Tranche 2", released: true },
        { label: "Tranche 3", released: false },
      ],
    },
    {
      id: "d2",
      business: "Coastal Catch",
      invested: 150_000,
      totalReturn: 181_500,
      received: 28_000,
      standing: "Established" as Standing,
      projectedCompletion: "Nov 2025",
      sweeps: [
        { date: "2025-04-02", amount: 9_500 },
        { date: "2025-03-19", amount: 9_200 },
      ],
      tranches: [
        { label: "Tranche 1", released: true },
        { label: "Tranche 2", released: false },
        { label: "Tranche 3", released: false },
      ],
    },
  ],
  completed: [
    {
      id: "c1",
      business: "Adekunle Logistics",
      invested: 100_000,
      returned: 117_000,
      returnPct: 17,
      durationMonths: 8,
    },
    {
      id: "c2",
      business: "Bola's Provisions",
      invested: 80_000,
      returned: 92_800,
      returnPct: 16,
      durationMonths: 9,
    },
  ],
  defaulted: [
    {
      id: "df1",
      business: "Lagos Print Studio",
      invested: 75_000,
      recovered: 52_500,
      netLoss: 22_500,
    },
  ],
};

// Business mocks
export const businessProfile = {
  name: "Mama Nkechi Foods",
  rating: {
    standing: "Established" as Standing,
    score: 742,
    rangeMin: 700,
    rangeMax: 799,
    nextStanding: "Anchor",
    needed: "Maintain on-time sweeps for 3 more months to reach Anchor.",
  },
  tier: {
    current: "Tier 2" as Tier,
    nextRequirement: "Reach Anchor standing to unlock Tier 3.",
  },
  squadAccount: "8842910554",
  squadBank: "Squad Microfinance Bank",
  paymentLink: "https://pay.bridge.ng/mama-nkechi-foods",
};

export const businessActiveListing = {
  id: "lst_001",
  title: "Second kitchen — Sabo expansion",
  capitalRequested: 4_500_000,
  funded: 2_900_000,
  investors: 47,
  tranches: [
    {
      label: "Tranche 1",
      amount: 2_250_000,
      released: false,
      condition: "On full funding",
    },
    {
      label: "Tranche 2",
      amount: 1_350_000,
      released: false,
      condition: "On lease signed",
    },
    {
      label: "Tranche 3",
      amount: 900_000,
      released: false,
      condition: "After first week of operations",
    },
  ],
};

export const businessStats = {
  totalRaised: 7_200_000,
  totalSwept: 4_180_000,
  completedDeals: 2,
};

export const businessActivity = [
  {
    id: "ba1",
    title: "Sweep payment sent",
    detail: "₦42,300 to 47 investors",
    ts: "Today",
  },
  {
    id: "ba2",
    title: "Tranche 2 released",
    detail: "₦1.35M disbursed for fit-out",
    ts: "3 days ago",
  },
  {
    id: "ba3",
    title: "Bridge Rating change",
    detail: "Score moved from 728 to 742",
    ts: "1 week ago",
  },
  {
    id: "ba4",
    title: "Sweep payment sent",
    detail: "₦39,900 to 47 investors",
    ts: "1 week ago",
  },
  {
    id: "ba5",
    title: "Tier upgrade unlocked",
    detail: "Tier 1 → Tier 2",
    ts: "3 weeks ago",
  },
];

export const businessPayments = [
  {
    id: "p1",
    date: "2025-04-12",
    incoming: 84_000,
    sweep: 10_080,
    net: 73_920,
    applied: true,
  },
  {
    id: "p2",
    date: "2025-04-11",
    incoming: 51_500,
    sweep: 6_180,
    net: 45_320,
    applied: true,
  },
  {
    id: "p3",
    date: "2025-04-10",
    incoming: 122_000,
    sweep: 14_640,
    net: 107_360,
    applied: true,
  },
  {
    id: "p4",
    date: "2025-04-10",
    incoming: 38_000,
    sweep: 4_560,
    net: 33_440,
    applied: true,
  },
  {
    id: "p5",
    date: "2025-04-09",
    incoming: 67_400,
    sweep: 8_088,
    net: 59_312,
    applied: true,
  },
  {
    id: "p6",
    date: "2025-04-08",
    incoming: 95_200,
    sweep: 11_424,
    net: 83_776,
    applied: true,
  },
  {
    id: "p7",
    date: "2025-04-07",
    incoming: 41_900,
    sweep: 5_028,
    net: 36_872,
    applied: true,
  },
  {
    id: "p8",
    date: "2025-04-06",
    incoming: 73_000,
    sweep: 8_760,
    net: 64_240,
    applied: true,
  },
  {
    id: "p9",
    date: "2025-04-05",
    incoming: 58_500,
    sweep: 0,
    net: 58_500,
    applied: false,
  },
  {
    id: "p10",
    date: "2025-04-04",
    incoming: 110_000,
    sweep: 13_200,
    net: 96_800,
    applied: true,
  },
];

export const businessSweepSummary = {
  totalSwept: 4_180_000,
  totalRemaining: 1_320_000,
  currentSweepPct: 12,
};

// Notifications
export type Notification = {
  id: string;
  title: string;
  detail: string;
  ts: string;
  unread: boolean;
};

export const investorNotifications: Notification[] = [
  {
    id: "n1",
    title: "Sweep payment received",
    detail: "₦12,400 from Mama Nkechi Foods",
    ts: "2h ago",
    unread: true,
  },
  {
    id: "n2",
    title: "New matched listing",
    detail: "Coastal Catch matches your preferences",
    ts: "1d ago",
    unread: true,
  },
  {
    id: "n3",
    title: "Deal completed",
    detail: "Adekunle Logistics paid out fully",
    ts: "2d ago",
    unread: false,
  },
  {
    id: "n4",
    title: "Bridge Rating change",
    detail: "Apex Tutors moved to Anchor",
    ts: "5d ago",
    unread: false,
  },
  {
    id: "n5",
    title: "Early warning alert",
    detail: "Lagos Print Studio missed a sweep window",
    ts: "1w ago",
    unread: false,
  },
  {
    id: "n6",
    title: "Deal approaching 24-month cap",
    detail: "Greenfield Produce has 2 months remaining",
    ts: "2w ago",
    unread: false,
  },
];

export const businessNotifications: Notification[] = [
  {
    id: "bn1",
    title: "Sweep payment confirmed",
    detail: "₦42,300 distributed to investors",
    ts: "3h ago",
    unread: true,
  },
  {
    id: "bn2",
    title: "Tranche released",
    detail: "Tranche 2 — ₦1.35M for fit-out",
    ts: "3d ago",
    unread: false,
  },
  {
    id: "bn3",
    title: "Bridge Rating change",
    detail: "Score moved from 728 to 742",
    ts: "1w ago",
    unread: false,
  },
  {
    id: "bn4",
    title: "Listing fully funded",
    detail: "Sabo expansion reached target",
    ts: "2w ago",
    unread: false,
  },
  {
    id: "bn5",
    title: "Tier upgrade unlocked",
    detail: "You are now Tier 2",
    ts: "3w ago",
    unread: false,
  },
];

// Mock APIs
export const mockBvnVerify = (): Promise<{ name: string }> => {
  return new Promise((resolve) => setTimeout(() => resolve({ name: "Adebayo Okonkwo" }), 1500));
};

export const mockBankConnect = (): Promise<{
  accountName: string;
  range: string;
  averageInflow: number;
}> => {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          accountName: "Adebayo Okonkwo",
          range: "Apr 2023 – Oct 2024",
          averageInflow: 3_240_000,
        }),
      1500,
    ),
  );
};

export const mockSquadAccount = (): string => {
  return "8842910554";
};

export const calculateDealTerms = (capital: number) => {
  const revenueSharePct = Math.min(15, Math.max(7, Math.round((capital / 500_000) * 1.2)));
  const totalReturnPct = revenueSharePct + 6;
  const totalReturnNaira = Math.round(capital * (totalReturnPct / 100)) + capital;
  const targetMonths = Math.min(18, Math.max(6, Math.round(capital / 350_000)));
  const monthlySweep = Math.round(totalReturnNaira / targetMonths);
  return {
    revenueSharePct,
    totalReturnPct,
    totalReturnNaira,
    targetMonths,
    monthlySweep,
    tranches: [
      {
        label: "Tranche 1",
        amount: Math.round(capital * 0.5),
        condition: "Released on full funding",
      },
      {
        label: "Tranche 2",
        amount: Math.round(capital * 0.3),
        condition: "Released after milestone 1",
      },
      {
        label: "Tranche 3",
        amount: Math.round(capital * 0.2),
        condition: "Released after milestone 2",
      },
    ],
  };
};

export const formatNaira = (n: number): string => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
};

export const formatNairaFull = (n: number): string => {
  return `₦${n.toLocaleString()}`;
};
