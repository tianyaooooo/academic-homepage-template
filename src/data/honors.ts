interface Honor {
  name: string;
  note?: string;
  noteLang?: string;
  year?: number;
  featured?: boolean;
}

export const honors: Honor[] = [
  { name: "Saltbend Open Methods Award", note: "Community field tools", year: 2025, featured: true },
  { name: "Alder Bay Fieldwork Fellowship", year: 2024, featured: true },
  { name: "Estuary Reach Teaching Commendation", year: 2022 },
];

export const selectedHonors = honors.filter(award => award.featured);
