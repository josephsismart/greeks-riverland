export const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfDniZLao0vm6mwDQJgBXT0VMKPcpNI8O5SEMX7g8lYx9O_-w/viewform";
export const FORM_EMBED_URL = FORM_URL + "?embedded=true";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/families", label: "Families" },
  { href: "/towns", label: "Towns" },
  { href: "/stories", label: "Stories & Photos" },
  { href: "/in-memoriam", label: "In Memoriam" },
  { href: "/add-your-family", label: "Add Your Family" },
  { href: "/support", label: "Support" },
  { href: "/about", label: "About" },
];

export type Town = {
  slug: string;
  name: string;
  blurb: string;
  // position on the illustrated map (percent of width / height)
  x: number;
  y: number;
};

export const TOWNS: Town[] = [
  { slug: "renmark", name: "Renmark", x: 60, y: 30, blurb: "The river town at the heart of the irrigation settlements, surrounded by orchards and vineyards." },
  { slug: "paringa", name: "Paringa", x: 80, y: 42, blurb: "A small river town just east of Renmark, among citrus blocks and stone fruit." },
  { slug: "berri", name: "Berri", x: 38, y: 28, blurb: "Home of packing sheds, the winery and distillery, and many working families." },
  { slug: "barmera", name: "Barmera", x: 16, y: 52, blurb: "On the shores of Lake Bonney, a centre for farming families and community life." },
  { slug: "monash", name: "Monash", x: 34, y: 64, blurb: "A farming district between Berri and Barmera, known for its orchards and blocks." },
  { slug: "loxton", name: "Loxton", x: 70, y: 76, blurb: "A river town to the south, with irrigated horticulture and packing work." },
  { slug: "surrounding-districts", name: "Surrounding Districts", x: -1, y: -1, blurb: "Glossop, Cobdogla, Waikerie, Lyrup, Winkie and other nearby districts." },
];

export type Family = {
  slug: string;
  surname: string;
  alternateSpellings?: string;
  town: string; // town slug
  location: string;
  members: string[];
  origin?: string;
  arrival?: string;
  riverlandYears?: string;
  occupation?: string;
  children?: string;
  schools?: string;
  community?: string;
  friends?: string;
  memories?: string;
  laterSettled?: string;
  summary: string;
};

export const FAMILIES: Family[] = [
  {
    slug: "savaidis",
    surname: "Savaidis",
    town: "monash",
    location: "Distillery Road, Monash",
    members: ["Savas Savaidis (born 1932)", "Athina Savaidis"],
    origin: "Savas was originally from Ptolemaida, Greece",
    riverlandYears: "January 1970 – December 1980",
    summary:
      "Savas and Athina Savaidis lived on Distillery Road, Monash, from 1970 to 1980. Savas was born in 1932 and came from Ptolemaida in northern Greece.",
  },
];

export const STORY_TOPICS = [
  { icon: "heart", title: "Family memories", text: "Everyday life, recipes, name days and the people who made a house a home." },
  { icon: "people", title: "Community stories", text: "Dances, picnics, clubs and the gatherings that kept the community together." },
  { icon: "rings", title: "Weddings", text: "Wedding days, koumbari and celebrations across the Riverland." },
  { icon: "water", title: "Baptisms", text: "Christenings and godparents, the start of lifelong family ties." },
  { icon: "soccer", title: "Sporting events", text: "Soccer clubs, matches, carnivals and sporting heroes." },
  { icon: "school", title: "School days", text: "Riverland schools, Greek school, teachers and classmates." },
  { icon: "tractor", title: "Work & farm life", text: "Blocks, picking seasons, packing sheds, wineries and small businesses." },
  { icon: "camera", title: "Historical photographs", text: "Old photographs of people, places and events, identified by families." },
] as const;
