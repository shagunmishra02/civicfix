import math
import re
from typing import Tuple, List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Curated dataset of realistic university campus infrastructure complaints
# Including common Indian campus Hindi/Hinglish expressions
TRAINING_DATA = [
    # Streetlights & Electrical
    ("Streetlight near hostel gate 2 is completely dark at night", "Streetlights & Electrical"),
    ("High mast lamp post flickering continuously outside library", "Streetlights & Electrical"),
    ("Pole light broken and hanging dangerously by wire near sports ground", "Streetlights & Electrical"),
    ("Pathway lights between girls hostel and academic block not working", "Streetlights & Electrical"),
    ("Electric switchboard sparking in mechanical engineering workshop", "Streetlights & Electrical"),
    ("Exposed live electrical cables lying across pedestrian walking track", "Streetlights & Electrical"),
    ("Corridor tube lights dead on 2nd floor science block", "Streetlights & Electrical"),
    ("Lamp post glass shattered after storm near faculty quarters", "Streetlights & Electrical"),
    ("Solar street lights not turning on near north entrance", "Streetlights & Electrical"),
    ("Short circuit smell and flickering bulb in basement parking", "Streetlights & Electrical"),
    ("Streetlight pole leaning at dangerous angle after truck hit it", "Streetlights & Electrical"),
    ("Dark stretch behind auditorium needs urgent lighting for security", "Streetlights & Electrical"),
    ("bijli ka khamba kharab hai gate ke paas", "Streetlights & Electrical"),
    ("light band hai hostel ke bahar andhera hai", "Streetlights & Electrical"),
    ("switchboard me sparking ho rahi hai current lag sakta hai", "Streetlights & Electrical"),
    ("tube light fused hai room ke bahar", "Streetlights & Electrical"),

    # Roads & Potholes
    ("Huge pothole on the main road between Gate 1 and Admin block", "Roads & Potholes"),
    ("Deep crater causing two-wheelers to skid near hostel roundabout", "Roads & Potholes"),
    ("Broken speed breaker with sharp rebar sticking out", "Roads & Potholes"),
    ("Pavement pavers loose and missing along library walking plaza", "Roads & Potholes"),
    ("Road surface eroded badly due to recent heavy monsoon rains", "Roads & Potholes"),
    ("Asphalt caved in near central canteen entrance", "Roads & Potholes"),
    ("Unmarked speed bump causing cyclists and students to fall", "Roads & Potholes"),
    ("Cracked tarmac and gravel spread across sports complex road", "Roads & Potholes"),
    ("Manhole cover cracked and uneven with road surface on ring road", "Roads & Potholes"),
    ("Dangerous dip in the road right after the turning to PG hostel", "Roads & Potholes"),
    ("sadak toot gayi hai gaddha ban gaya hai", "Roads & Potholes"),
    ("road par pothole hai bike gir sakti hai", "Roads & Potholes"),
    ("pavers pathar ukhad gaye hain raste par", "Roads & Potholes"),

    # Garbage & Sanitation
    ("Garbage bin overflowing outside central food court", "Garbage & Sanitation"),
    ("Plastic bottles and food packaging dumped in garden behind block B", "Garbage & Sanitation"),
    ("Trash dump not cleared for past 4 days emitting foul odor", "Garbage & Sanitation"),
    ("Stray dogs ripping through trash bags near dining mess back door", "Garbage & Sanitation"),
    ("Bio-waste bin tipped over near biotechnology laboratory", "Garbage & Sanitation"),
    ("Overflowing dustbin causing flies and mosquito breeding near canteen", "Garbage & Sanitation"),
    ("Construction rubble and dry leaves accumulated blocking pathway", "Garbage & Sanitation"),
    ("Litter scattered everywhere after cultural fest near amphitheatre", "Garbage & Sanitation"),
    ("Sanitation workers have not cleared the compost area behind hostel", "Garbage & Sanitation"),
    ("Foul smelling uncollected waste pile near the laundry facility", "Garbage & Sanitation"),
    ("kachra faila hua hai dustbin bhar gaya hai", "Garbage & Sanitation"),
    ("mess ke bahar kachre ki badbu aa rahi hai", "Garbage & Sanitation"),
    ("safai nahi hui hai do din se gandagi hai", "Garbage & Sanitation"),

    # Water & Plumbing
    ("Main water pipeline burst flooding the road near chemistry department", "Water & Plumbing"),
    ("Drinking water cooler leaking continuously in academic block 3", "Water & Plumbing"),
    ("Restroom tap on 1st floor broken and gushing water non-stop", "Water & Plumbing"),
    ("Sewage water backing up and overflowing onto hostel ground floor", "Water & Plumbing"),
    ("Extremely low water pressure in 3rd floor washrooms of boys hostel", "Water & Plumbing"),
    ("Rooftop overhead tank overflowing for hours wasting water", "Water & Plumbing"),
    ("Clogged drainage gutter causing dirty water pooling near walkway", "Water & Plumbing"),
    ("Water filter in library dispensing foul tasting brownish water", "Water & Plumbing"),
    ("Flush valve stuck open in ground floor disabled access toilet", "Water & Plumbing"),
    ("Underground sump pump failure causing water scarcity in block A", "Water & Plumbing"),
    ("paani leak ho raha hai washroom me nal toota hai", "Water & Plumbing"),
    ("water cooler ka paani ganda aa raha hai peene layak nahi hai", "Water & Plumbing"),
    ("sewer pipe choke ho gaya hai ganda pani bahar aa raha hai", "Water & Plumbing"),

    # Campus Safety & Security
    ("Dark unlit corner near boundary wall where strangers gather at night", "Campus Safety & Security"),
    ("Campus boundary wall broken with wide opening allowing unauthorized entry", "Campus Safety & Security"),
    ("Emergency fire exit door jammed and locked from outside in CSE block", "Campus Safety & Security"),
    ("Stray dog pack showing aggressive behavior towards students near cycle stand", "Campus Safety & Security"),
    ("CCTV camera knocked down and pointed at the ground near ATM kiosk", "Campus Safety & Security"),
    ("Broken glass bottles thrown along the jogging track behind stadium", "Campus Safety & Security"),
    ("Fire extinguisher missing from designated box in chemical store corridor", "Campus Safety & Security"),
    ("Panic alarm button near women's hostel gate not responding when tested", "Campus Safety & Security"),
    ("Overgrown thorny bushes blocking visibility at sharp campus road curve", "Campus Safety & Security"),
    ("Security guard booth at gate 3 abandoned during evening shift", "Campus Safety & Security"),
    ("boundary wall tooti hui hai koi bhi andar aa sakta hai", "Campus Safety & Security"),
    ("awra kutte kaatne daudte hain cycle stand ke paas", "Campus Safety & Security"),
    ("emergency exit band hai taala laga hua hai", "Campus Safety & Security"),

    # Infrastructure & Facilities
    ("Ceiling plaster chunks peeling and falling in lecture hall 204", "Infrastructure & Facilities"),
    ("Elevator in administrative building stuck between 3rd and 4th floor", "Infrastructure & Facilities"),
    ("Balcony corridor railing dangerously loose on second floor", "Infrastructure & Facilities"),
    ("Classroom door hinge broken will not close properly", "Infrastructure & Facilities"),
    ("Window pane shattered by wind in central reading room", "Infrastructure & Facilities"),
    ("Air conditioning unit leaking water inside computer lab 2", "Infrastructure & Facilities"),
    ("Broken bench and desk rebar poking out in physics tutorial room", "Infrastructure & Facilities"),
    ("Rooftop solar panel bracket loose and rattling in high winds", "Infrastructure & Facilities"),
    ("Hostel common room exhaust fan completely burned out and jammed", "Infrastructure & Facilities"),
    ("Wheelchair ramp slope broken and blocked by debris near main entrance", "Infrastructure & Facilities"),
    ("desk toota hua hai bench ki keel nikal rahi hai", "Infrastructure & Facilities"),
    ("lift kharab hai teesri manzil par atki hui hai", "Infrastructure & Facilities"),
    ("darwaza band nahi ho raha hai chitakni tooti hai", "Infrastructure & Facilities"),
]

CRITICAL_KEYWORDS = [
    "spark", "sparking", "shock", "fire", "smoke", "burst", "bursting", "flooding",
    "collapse", "collapsed", "live wire", "hanging wire", "emergency", "stuck elevator",
    "jammed fire exit", "danger", "dangerous", "unauthorized", "electrocution"
]

HIGH_KEYWORDS = [
    "overflowing", "foul", "foul odor", "dark", "broken glass", "deep pothole",
    "crater", "sewage", "falling", "skid", "accident", "aggressive", "stray dog",
    "shattered", "missing cover", "open manhole", "no water"
]

LOW_KEYWORDS = [
    "minor", "paint", "peeling", "faded", "cleaning", "dusty", "loose paver",
    "scratch", "cosmetic", "slow drip"
]

class CivicAIEngine:
    def __init__(self):
        self.model: Pipeline = None
        self.categories: List[str] = []
        self._train()

    def _train(self):
        texts = [item[0] for item in TRAINING_DATA]
        labels = [item[1] for item in TRAINING_DATA]
        self.categories = sorted(list(set(labels)))

        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', lowercase=True)),
            ('clf', LogisticRegression(C=1.5, max_iter=300, class_weight='balanced'))
        ])
        self.model.fit(texts, labels)

    def classify_text(self, text: str) -> Dict[str, Any]:
        """
        Classifies issue description into category, confidence score, and suggested priority.
        """
        if not text or len(text.strip()) < 3:
            return {
                "category": "Other",
                "confidence": 0.5,
                "suggested_priority": "Medium",
                "reasoning": "Text too short for confident inference.",
                "alternative_categories": []
            }

        # Predict probabilities
        probs = self.model.predict_proba([text])[0]
        classes = self.model.classes_

        # Pair class with real probability
        ranked = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
        top_cat = str(ranked[0][0])
        top_conf = round(float(ranked[0][1]), 2)

        # Honest classification: If model confidence is low (< 0.35) or text lacks domain indicators,
        # fallback to "Other" with clear notice
        if top_conf < 0.35:
            return {
                "category": "Other",
                "confidence": top_conf,
                "suggested_priority": "Medium",
                "reasoning": "Confidence is low. Please review and choose the appropriate category manually.",
                "alternative_categories": [
                    {"category": str(cat), "confidence": round(float(conf), 2)}
                    for cat, conf in ranked[:3]
                ]
            }

        # Determine priority by keyword heuristics & context
        lower_text = text.lower()
        suggested_priority = "Medium"
        reasoning_tokens = []

        for kw in CRITICAL_KEYWORDS:
            if re.search(r'\b' + re.escape(kw) + r'\b', lower_text):
                suggested_priority = "Critical"
                reasoning_tokens.append(f"Contains urgent hazard trigger: '{kw}'.")
                break

        if suggested_priority != "Critical":
            for kw in HIGH_KEYWORDS:
                if re.search(r'\b' + re.escape(kw) + r'\b', lower_text):
                    suggested_priority = "High"
                    reasoning_tokens.append(f"Contains high-priority indicator: '{kw}'.")
                    break

        if suggested_priority == "Medium":
            for kw in LOW_KEYWORDS:
                if re.search(r'\b' + re.escape(kw) + r'\b', lower_text):
                    suggested_priority = "Low"
                    reasoning_tokens.append(f"Identified as non-urgent/minor maintenance.")
                    break

        reasoning = f"AI classified as '{top_cat}' with {int(top_conf * 100)}% confidence."
        if reasoning_tokens:
            reasoning += " " + " ".join(reasoning_tokens)

        alternatives = [
            {"category": str(cat), "confidence": round(float(conf), 2)}
            for cat, conf in ranked[1:3] if conf > 0.12
        ]

        return {
            "category": top_cat,
            "confidence": top_conf,
            "suggested_priority": suggested_priority,
            "reasoning": reasoning,
            "alternative_categories": alternatives
        }

    @staticmethod
    def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates great-circle distance between two points on Earth in meters.
        """
        R = 6371000  # Radius of Earth in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c


# Global singleton
ai_engine = CivicAIEngine()
