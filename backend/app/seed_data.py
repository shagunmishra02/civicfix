import datetime
from sqlalchemy.orm import Session
from .models import Complaint, StatusLog

# Realistic campus landmarks for Mody University, Laxmangarh, Sikar
# Center: Lat 27.7983, Lon 75.0291 (265-acre campus)
SAMPLE_COMPLAINTS = [
    {
        "id": "CF-1001",
        "title": "Pathway lighting flickering on walkway between SET and Tapovan",
        "description": "Two pathway solar lamps are flickering and going completely dark along the stone walkway connecting the School of Engineering & Technology (SET) to Tapovan. Students walking back in the evening find it dark.",
        "category": "Streetlights & Electrical",
        "priority": "High",
        "status": "In Progress",
        "latitude": 27.7991,
        "longitude": 75.0300,
        "location_name": "Walkway between SET & Tapovan Complex",
        "image_url": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80",
        "reported_by": "Rhea Sharma (B.Tech CSE '25)",
        "upvotes": 26,
        "assigned_to": "Electrical Maintenance Division",
        "ai_confidence": 0.96,
        "hours_ago": 36,
        "history": [
            ("Reported", "Reported by student via Mody University portal", 36),
            ("Assigned", "Assigned to Campus Electrical Team (Duty Engineer: O.P. Yadav)", 28),
            ("In Progress", "Replacement LED luminaires issued from stores, technician on site", 12)
        ]
    },
    {
        "id": "CF-1002",
        "title": "Loose paving stones near Annapurna Central Dining Hall entrance",
        "description": "Near the main entrance of Annapurna Refectory, several cobblestone pavers have shifted after the rain, creating a trip hazard during peak meal hours when hundreds of students exit together.",
        "category": "Roads & Potholes",
        "priority": "High",
        "status": "Assigned",
        "latitude": 27.7990,
        "longitude": 75.0325,
        "location_name": "Central Dining Hall (Annapurna Refectory)",
        "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
        "reported_by": "Pooja Choudhary (MBA '26)",
        "upvotes": 19,
        "assigned_to": "Civil Works & Masonry Section",
        "ai_confidence": 0.94,
        "hours_ago": 24,
        "history": [
            ("Reported", "Reported via Student Mobile App", 24),
            ("Assigned", "Civil section notified to re-level pavers with sand-cement mortar", 18)
        ]
    },
    {
        "id": "CF-1003",
        "title": "Waste segregation bin overflow behind Gargi Hostel Block",
        "description": "The green organic waste bin behind Gargi Hostel has filled up and needs immediate clearing. Students request regular daily clearance.",
        "category": "Garbage & Sanitation",
        "priority": "Medium",
        "status": "Resolved",
        "latitude": 27.8002,
        "longitude": 75.0320,
        "location_name": "Gargi Residential Hostel Quadrangle",
        "image_url": "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
        "resolution_image_url": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
        "resolution_notes": "Sanitation compactor cleared all bins and the area was disinfected.",
        "reported_by": "Ananya Rathore (Law '25)",
        "upvotes": 14,
        "assigned_to": "Campus Sanitation & Housekeeping Wing",
        "ai_confidence": 0.98,
        "hours_ago": 48,
        "history": [
            ("Reported", "Issue logged by Gargi hostel resident", 48),
            ("Assigned", "Assigned to morning housekeeping squad", 40),
            ("In Progress", "Housekeeping team emptied bin and cleaned perimeter", 30),
            ("Resolved", "Inspected and verified clean by Hostel Supervisor", 22)
        ]
    },
    {
        "id": "CF-1004",
        "title": "RO water cooler 2nd floor dispensing low pressure in Sarojini Hostel",
        "description": "Drinking water cooler on the second floor east wing has very low output flow and needs filter servicing. Residents currently having to walk down to 1st floor.",
        "category": "Water & Plumbing",
        "priority": "High",
        "status": "In Progress",
        "latitude": 27.8008,
        "longitude": 75.0315,
        "location_name": "Sarojini Hostel Block East Wing",
        "image_url": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80",
        "reported_by": "Kritika Soni (B.Des '25)",
        "upvotes": 34,
        "assigned_to": "Plumbing & RO Maintenance Team",
        "ai_confidence": 0.95,
        "hours_ago": 12,
        "history": [
            ("Reported", "Logged via Student Portal", 12),
            ("Assigned", "Assigned to campus RO technician (Rajesh Kumar)", 8),
            ("In Progress", "Pre-carbon and sediment cartridges being replaced today", 3)
        ]
    },
    {
        "id": "CF-1005",
        "title": "AC unit humming abnormally in SET Seminar Hall 102",
        "description": "The ductable air conditioning unit in Seminar Hall 102 makes a loud vibrating noise during presentations and lecture sessions.",
        "category": "Infrastructure & Facilities",
        "priority": "Medium",
        "status": "Assigned",
        "latitude": 27.7988,
        "longitude": 75.0310,
        "location_name": "School of Engineering & Technology (SET) Hall 102",
        "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
        "reported_by": "Dr. Meenakshi (Faculty - SET)",
        "upvotes": 11,
        "assigned_to": "HVAC & Electrical Maintenance",
        "ai_confidence": 0.91,
        "hours_ago": 18,
        "history": [
            ("Reported", "Complaint forwarded by department coordinator", 18),
            ("Assigned", "HVAC vendor engineer scheduled for damper and motor servicing", 10)
        ]
    },
    {
        "id": "CF-1006",
        "title": "Irrigation sprinkler leaking clean water near Botanical Garden path",
        "description": "Sprinkler valve in the lawn near the Botanical Garden walkway is leaking water onto the paved jogging track, creating mud accumulation.",
        "category": "Water & Plumbing",
        "priority": "Medium",
        "status": "Resolved",
        "latitude": 27.7998,
        "longitude": 75.0285,
        "location_name": "Botanical Garden & Lawn Pathway",
        "image_url": "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80",
        "resolution_image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
        "resolution_notes": "Replaced cracked solenoid sprinkler valve and adjusted nozzle angle.",
        "reported_by": "Sunita Shekhawat (SLAS '25)",
        "upvotes": 8,
        "assigned_to": "Horticulture & Landscape Division",
        "ai_confidence": 0.93,
        "hours_ago": 40,
        "history": [
            ("Reported", "Reported by morning jogger", 40),
            ("Assigned", "Assigned to horticulture maintenance crew", 32),
            ("In Progress", "Nozzle replaced and pipe pressure calibrated", 20),
            ("Resolved", "Tested at full pressure with zero leakage", 14)
        ]
    },
    {
        "id": "CF-1007",
        "title": "Fence wire repair required near Equestrian Riding Arena",
        "description": "A 3-meter section of the safety boundary fence near the horse riding arena and sports track has loosened and requires tightening.",
        "category": "Campus Safety & Security",
        "priority": "High",
        "status": "Reported",
        "latitude": 27.8005,
        "longitude": 75.0275,
        "location_name": "Equestrian Arena & Sports Ground",
        "image_url": "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=600&auto=format&fit=crop&q=80",
        "reported_by": "Sports Secretary",
        "upvotes": 16,
        "assigned_to": None,
        "ai_confidence": 0.92,
        "hours_ago": 8,
        "history": [
            ("Reported", "Reported by sports council representative", 8)
        ]
    }
]

def seed_database(db: Session):
    # Only seed if complaints table is empty
    if db.query(Complaint).count() > 0:
        return

    now = datetime.datetime.now(datetime.timezone.utc)

    for item in SAMPLE_COMPLAINTS:
        created_time = now - datetime.timedelta(hours=item["hours_ago"])
        resolved_time = None
        if item["status"] == "Resolved":
            resolved_time = now - datetime.timedelta(hours=item["hours_ago"] // 2)

        complaint = Complaint(
            id=item["id"],
            title=item["title"],
            description=item["description"],
            category=item["category"],
            priority=item["priority"],
            status=item["status"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            location_name=item["location_name"],
            image_url=item.get("image_url"),
            resolution_image_url=item.get("resolution_image_url"),
            resolution_notes=item.get("resolution_notes"),
            reported_by=item["reported_by"],
            upvotes=item["upvotes"],
            assigned_to=item.get("assigned_to"),
            ai_confidence=item.get("ai_confidence", 0.92),
            created_at=created_time,
            updated_at=created_time + datetime.timedelta(minutes=30),
            resolved_at=resolved_time
        )
        db.add(complaint)

        # Add history audit logs
        prev_status = None
        for step, note, hrs_ago in item.get("history", []):
            log_time = now - datetime.timedelta(hours=hrs_ago)
            log = StatusLog(
                complaint_id=item["id"],
                old_status=prev_status,
                new_status=step,
                changed_by="Mody Univ Estate Office",
                note=note,
                timestamp=log_time
            )
            db.add(log)
            prev_status = step

    db.commit()
