type Text = string | readonly (string | { text: string; href: string })[];

interface Appointment {
  role: string;
  organization: string;
  year?: number;
  ongoing?: boolean;
  details?: Text;
}

interface TeachingRole {
  role: string;
  institution: string;
  courses: { title: string; year?: number }[];
}

interface Service {
  role: string;
  organization: string;
  year?: number;
}

export const experience: {
  professional: Appointment[];
  academic: Appointment[];
  teaching: TeachingRole[];
  service: Service[];
} = {
  professional: [
    {
      role: "Field Scientist",
      organization: "Alder Bay Field Lab",
      year: 2024,
      ongoing: true,
      details: "Street-scale weather observations · sensor calibration · community fieldwork",
    },
    {
      role: "Field Technician",
      organization: "Saltbend Survey Cooperative",
      year: 2021,
      details: "Built and maintained low-cost rain gauges with neighborhood volunteers.",
    },
  ],
  academic: [
    {
      role: "Research Fellow",
      organization: "Estuary Reach Institute",
      year: 2022,
      details: "Studied how tree cover changes the afternoon temperature along walking routes.",
    },
  ],
  teaching: [
    {
      role: "Teaching Assistant",
      institution: "Reedwater School of Ecology",
      courses: [
        { title: "Methods in Urban Fieldwork", year: 2022 },
        { title: "Environmental Data in Practice", year: 2021 },
      ],
    },
  ],
  service: [
    { role: "Program Co-chair", organization: "Alder Bay Field Methods Forum", year: 2025 },
    { role: "Field Notes Editor", organization: "Estuary Reach Methods Circle", year: 2023 },
  ],
};
