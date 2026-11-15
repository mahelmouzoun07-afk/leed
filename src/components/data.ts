// Placeholder brand: the original's name, logo, people and long copy are replaced
// by neutral sample content (layout and behaviour follow the original).
export const BRAND = "Prospra";
export const BRAND_LOWER = "prospra";

export type Testimonial = {
  quote: string;
  name: string;
  company: string;
  initials: string;
  color: string;
  href?: string;
  noName?: boolean;
};

const T = (
  quote: string,
  name: string,
  company: string,
  color: string,
  noName = false,
): Testimonial => ({
  quote,
  name,
  company,
  color,
  noName,
  initials: (noName ? company : name)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
});

export const ROWS: Testimonial[][] = [
  [
    T(
      "I had tried two other outreach tools and spent days on domains, DNS and warm-up. Here you type your web address and the setup happens for you… and the replies come from the actual decision makers, so trials convert really well.",
      "Daniel Morrow",
      "Ledgerline",
      "#0891b2",
    ),
    T(
      "School groups were always the hardest door to open for us. With this agent they are now the ones answering most often, and a few of them are already signing.",
      "Sophie Lindqvist",
      "Campus Pulse",
      "#b45309",
    ),
    T("We closed six deals that are already at an advanced stage.", "Tunde Adebayo", "Gatepass", "#7c3aed"),
    T(
      "I have led sales teams for years and I'm honestly impressed. It feels like having a whole team, on your own.",
      "Ethan Clarke",
      "Northvest",
      "#0284c7",
    ),
  ],
  [
    T(
      "I'm hooked on this platform. It's the simplest, clearest tool I have used for outreach. Exactly what I needed.",
      "Kofi Mensah",
      "StoryLoom",
      "#dc2626",
    ),
    T(
      "It books several demos a week on its own — I would happily spend more if that keeps going… and with very little guidance the leads are spot on. Other tools gave me the worst fits.",
      "Ryan Becker",
      "Menuboost",
      "#059669",
    ),
    T(
      "I got replies from the smallest plan, which surprised me. Two of them are already booked meetings.",
      "Nadia Haddad",
      "Brightforge",
      "#1d4ed8",
    ),
    T("It opened doors we would have spent months knocking on by hand.", "Amira Qureshi", "The Policy Desk", "#0369a1"),
  ],
  [
    T(
      "An agency got us zero responses. With this, people actually reply, and what took hours now takes me fifteen minutes a day.",
      "Claire Dubois",
      "Voxa Studio",
      "#7c3aed",
    ),
    T(
      "A CEO told me he was glad we had researched his company. The opening line it wrote landed perfectly.",
      "Vikram Rao",
      "Harbor Asia",
      "#0d9488",
    ),
    T("The product is on fire. Congrats!", "", "Lumen Jewellery", "#d97706", true),
    T(
      "Fully automated so far: emails went out, they said yes please, the agent replied with a booking link and they booked.",
      "Oliver Grant",
      "SafeAudit",
      "#4f46e5",
    ),
  ],
];

// Phone order: the three rows interleaved.
export const MOBILE_ORDER: Testimonial[] = [0, 1, 2, 3].flatMap((i) => ROWS.map((r) => r[i]));

export const STATS = [
  { value: "202,525", label: "hot leads for 17,637 companies" },
  { value: "$9", label: "median cost per lead" },
];

export const COMPETITORS = [
  { domain: "kilnandcraft.com", color: "#a3a3a3" },
  { domain: "stonewarehub.com", color: "#84cc16" },
  { domain: "tablecrafted.com", color: "#22c55e" },
  { domain: "potterydepot.com", color: "#60a5fa" },
  { domain: "hospitalityware.com", color: "#f59e0b" },
  { domain: "glazeco.com", color: "#ef4444" },
];

export const FIT_ROWS = [
  ["Restaurant groups", 92],
  ["Boutique hotels", 88],
  ["Specialty cafés", 85],
  ["Caterers", 79],
  ["Wine bars", 74],
] as const;

export const PEOPLE = [
  { i: "LW", name: "Laura Whitman", role: "Owner", company: "Juniper Table", email: "laura@junipertable.com" },
  { i: "MO", name: "Marcus Osei", role: "Head Chef", company: "Fig & Ember", email: "marcus@figandember.com" },
  { i: "EC", name: "Elena Castro", role: "Founder", company: "The Daily Grind", email: "elena@thedailygrind.com" },
  { i: "HL", name: "Hannah Lee", role: "Owner", company: "Hannah Lee Catering", email: "hannah@hannahleecatering.com" },
  { i: "PN", name: "Priya Nair", role: "F&B Manager", company: "Hotel Saffron", email: "priya@hotelsaffron.com" },
  { i: "JD", name: "James Doyle", role: "Owner", company: "Doyle Wine Bar", email: "james@doylewinebar.com" },
];

export const CAMPAIGNS = [
  ["Restaurant groups", "Scaling", "$1.69", true],
  ["Boutique hotels", "Scaling", "$1.87", true],
  ["Specialty cafés", "Working", "$2.02", true],
  ["Corporate offices", "Paused", "$6.33", false],
  ["Event venues", "Paused", "$5.80", false],
] as const;

export const FOOTER = {
  products: [
    { label: "Global B2B Company Database", badge: "105M+", href: "/b2b-database/" },
    { label: "Google Maps Dataset", badge: "218M+", href: "/gm-dataset/" },
    { label: "Segments Explorer", href: "/tools/explorer/" },
  ],
  regions: [
    ["Benin", "benin"],
    ["North America", "north-america"],
    ["Europe", "europe"],
    ["Asia Pacific", "asia-pacific"],
    ["Southeast Asia", "southeast-asia"],
    ["Latin America", "latin-america"],
    ["Middle East", "middle-east"],
    ["CIS Countries", "cis"],
    ["Oceania", "oceania"],
    ["Africa", "africa"],
  ] as const,
  resources: [
    { label: "About", href: "/about/" },
    { label: "Pricing", href: "/pricing/" },
    { label: "Affiliate program", href: "/affiliate/?src=footer" },
    { label: "API documentation", href: "/api-docs/" },
    { label: `New name, same product`, href: "/autogtm/" },
    { label: "Compliance FAQ", href: "/compliance-faq/" },
    { label: "Support", href: "/support/" },
  ],
};
