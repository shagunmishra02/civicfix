export interface CampusLandmark {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string;
}

// Mody University of Science and Technology, Laxmangarh, Sikar, Rajasthan
// 265-acre residential campus
export const CAMPUS_CENTER: [number, number] = [27.7983, 75.0291];

export const CAMPUS_LANDMARKS: CampusLandmark[] = [
  {
    name: "Main Entrance Gate (NH-52, Sikar-Bikaner Highway)",
    category: "Entrance",
    latitude: 27.7960,
    longitude: 75.0270,
    description: "Main university reception and 24/7 security checkpoint on NH-52"
  },
  {
    name: "Tapovan (Lotus Temple & Meditation Sanctuary)",
    category: "Spiritual & Cultural",
    latitude: 27.7995,
    longitude: 75.0290,
    description: "Architectural lotus temple, Yajna-Shala, and 8-acre spiritual meditation center"
  },
  {
    name: "School of Engineering & Technology (SET)",
    category: "Academic",
    latitude: 27.7988,
    longitude: 75.0310,
    description: "Computer Science, AI, Mechanical, Electronics labs and smart lecture halls"
  },
  {
    name: "School of Business (SOB)",
    category: "Academic",
    latitude: 27.7978,
    longitude: 75.0305,
    description: "Management studies, seminar halls, and incubation center"
  },
  {
    name: "School of Law and Governance (SLG)",
    category: "Academic",
    latitude: 27.7972,
    longitude: 75.0295,
    description: "Moot court, legal aid clinic, and jurisprudence lecture rooms"
  },
  {
    name: "School of Design (SOD) & Liberal Arts (SLAS)",
    category: "Academic",
    latitude: 27.7985,
    longitude: 75.0278,
    description: "Design studios, fashion workshops, and science laboratories"
  },
  {
    name: "Central Dining Hall (Annapurna Refectory)",
    category: "Dining",
    latitude: 27.7990,
    longitude: 75.0325,
    description: "Grand central student dining hall seating 1,800 students"
  },
  {
    name: "Gargi Residential Hostel Complex",
    category: "Hostel",
    latitude: 27.8002,
    longitude: 75.0320,
    description: "Women's residential hostel block with RO water and reading lounges"
  },
  {
    name: "Sarojini Residential Hostel Complex",
    category: "Hostel",
    latitude: 27.8008,
    longitude: 75.0315,
    description: "Student residential hostel block with internal quadrangle"
  },
  {
    name: "Kasturba Residential Hostel Complex",
    category: "Hostel",
    latitude: 27.8012,
    longitude: 75.0328,
    description: "Hostel block near green orchard and recreation areas"
  },
  {
    name: "Central Library & Information Centre",
    category: "Academic",
    latitude: 27.7982,
    longitude: 75.0298,
    description: "Multi-floor air-conditioned library with e-resources and study cubicles"
  },
  {
    name: "Equestrian Arena & Sports Ground",
    category: "Sports",
    latitude: 27.8005,
    longitude: 75.0275,
    description: "Horse riding arena, tennis courts, and athletic running tracks"
  },
  {
    name: "Campus Power House & Solar Plant",
    category: "Utility",
    latitude: 27.7965,
    longitude: 75.0320,
    description: "Uninterrupted power supply sub-station and captive solar grid"
  }
];

export function findNearestLandmark(lat: number, lon: number): CampusLandmark {
  let minDistance = Infinity;
  let nearest = CAMPUS_LANDMARKS[0];

  for (const lm of CAMPUS_LANDMARKS) {
    const d = Math.hypot(lat - lm.latitude, lon - lm.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = lm;
    }
  }
  return nearest;
}
