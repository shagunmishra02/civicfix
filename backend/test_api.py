import sys
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("--- 1. Testing Root Endpoint ---")
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.text}"
    print("Root OK:", r.json())

    print("\n--- 2. Testing AI Classification Engine (Honest Probabilities & Hinglish) ---")
    test_cases = [
        ("Streetlight near hostel gate 2 not working at night", "Streetlights & Electrical"),
        ("Huge pothole on the main road between Gate 1 and Admin block", "Roads & Potholes"),
        ("Garbage bin overflowing outside food court with bad smell", "Garbage & Sanitation"),
        ("Main water pipeline burst flooding the courtyard", "Water & Plumbing"),
        ("Balcony corridor railing loose and wobbling dangerously", "Infrastructure & Facilities"),
        ("bijli ka khamba kharab hai gate ke paas", "Streetlights & Electrical"),
        ("sadak toot gayi hai gaddha ban gaya hai", "Roads & Potholes"),
    ]
    for text, expected in test_cases:
        r = client.post("/api/ai/classify", json={"text": text})
        assert r.status_code == 200, f"AI classify failed: {r.text}"
        data = r.json()
        print(f"Phrase: '{text[:40]}...'")
        print(f"  -> Predicted: {data['category']} ({int(data['confidence']*100)}% conf, {data['suggested_priority']} priority)")
        assert data['category'] == expected, f"Expected {expected}, got {data['category']}"

    print("\n--- 3. Testing Proximity Duplicate Detection ---")
    # Coordinates near SET walkway where CF-1001 exists (lat: 27.7991, lon: 75.0300)
    r = client.post("/api/ai/check-duplicates", json={
        "latitude": 27.7992,
        "longitude": 75.0301,
        "radius_meters": 100.0
    })
    assert r.status_code == 200
    data = r.json()
    assert data["has_duplicates"] is True
    print(f"Found {data['count']} nearby duplicate(s): {[d['id'] for d in data['nearby_issues']]}")

    print("\n--- 4. Testing Complaint Creation with Input Validation & Ticket ID Generation ---")
    new_payload = {
        "title": "Corridor light fixture hanging loose on wire",
        "description": "The tube light in the second floor hallway of SET building is dangling by an exposed cable. It might drop on someone.",
        "latitude": 27.7988,
        "longitude": 75.0310,
        "location_name": "School of Engineering & Technology (SET) 2nd Floor Corridor",
        "reported_by": "Rhea Sharma"
    }
    r = client.post("/api/complaints", json=new_payload)
    assert r.status_code == 200, f"Create failed: {r.text}"
    created = r.json()
    new_id = created["id"]
    print(f"Created ticket #{new_id}: {created['title']}")
    print(f"  -> Category auto-assigned by AI: {created['category']} (Priority: {created['priority']})")
    assert new_id.startswith("CF-") and len(new_id) >= 8, f"Expected 6-digit ticket ID, got {new_id}"

    print("\n--- 5. Testing Input Validation (Rejection of Invalid Status / Category) ---")
    bad_payload = new_payload.copy()
    bad_payload["category"] = "NotARealCategory"
    r_bad = client.post("/api/complaints", json=bad_payload)
    assert r_bad.status_code == 422, f"Expected 422 Unprocessable Entity, got {r_bad.status_code}"
    print("Invalid category correctly rejected (422)")

    print("\n--- 6. Testing Duplicate Upvote Prevention ---")
    # First upvote succeeds
    r_upvote1 = client.post(f"/api/complaints/{new_id}/upvote")
    assert r_upvote1.status_code == 200
    print(f"Upvoted #{new_id}: count now = {r_upvote1.json()['upvotes']}")
    # Second immediate upvote from same client blocked
    r_upvote2 = client.post(f"/api/complaints/{new_id}/upvote")
    assert r_upvote2.status_code == 400
    print("Second upvote from same device correctly rejected (400)")

    print("\n--- 7. Testing Security: Unauthorized Rejection ---")
    r_unauth = client.patch(f"/api/complaints/{new_id}/status", json={
        "new_status": "Assigned"
    })
    assert r_unauth.status_code == 401, f"Expected 401 Unauthorized, got {r_unauth.status_code}"
    print("Security check passed: Unauthorized access blocked (401)")

    print("\n--- 8. Testing Staff Authentication & JWT Token ---")
    r_bad_login = client.post("/api/auth/login", json={
        "email": "intruder@unknown.com",
        "password": "wrong"
    })
    assert r_bad_login.status_code == 401
    print("Invalid login correctly rejected (401)")

    r_login = client.post("/api/auth/login", json={
        "email": "estate.head@modyuniversity.ac.in",
        "password": "Mody@Estate2024!"
    })
    assert r_login.status_code == 200, f"Login failed: {r_login.text}"
    token_data = r_login.json()
    token = token_data["access_token"]
    officer_name = token_data["officer"]["name"]
    print(f"Authenticated as: {officer_name}")

    print("\n--- 9. Testing Authorized Status Transition with Bearer Token ---")
    headers = {"Authorization": f"Bearer {token}"}
    r = client.patch(f"/api/complaints/{new_id}/status", headers=headers, json={
        "new_status": "Assigned",
        "assigned_to": "Electrical Maintenance Division",
        "admin_notes": "Assigned to Duty Electrician Rajesh. Repair scheduled for 10 AM."
    })
    assert r.status_code == 200
    updated = r.json()
    print(f"Status updated: #{new_id} is now '{updated['status']}' assigned to '{updated['assigned_to']}'")

    print("\n--- 10. Testing Photo Upload Lockdown ---")
    # Valid small PNG
    tiny_png = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
        b'\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?'
        b'\x00\x05\xfe\x02\xfe\xdc\xccY\xe7\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    files = {"file": ("test.png", tiny_png, "image/png")}
    r_upload = client.post("/api/complaints/upload-photo", files=files)
    assert r_upload.status_code == 200, f"Valid PNG upload failed: {r_upload.text}"
    print("Valid PNG upload passed:", r_upload.json()["url"])

    # Fake PNG containing HTML / script
    fake_png = b"<html><script>alert('xss')</script></html>"
    files_fake = {"file": ("xss.png", fake_png, "image/png")}
    r_fake_upload = client.post("/api/complaints/upload-photo", files=files_fake)
    assert r_fake_upload.status_code == 400
    print("Malicious fake image correctly rejected (400)")

    print("\n==============================================")
    print("ALL TESTS PASSED SUCCESSFULLY! Security & Logic verified.")
    print("==============================================")

if __name__ == "__main__":
    run_tests()
