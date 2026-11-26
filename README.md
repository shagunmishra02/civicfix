# 🏛️ CivicFix — University Edition (Laxmangarh, Sikar)
### Smart Campus Infrastructure & Civic Issue Management Platform

> [!NOTE]
> **Academic Prototype & Demonstration Project**: CivicFix was designed and built as a student prototype platform for university evaluation and campus civic reporting demonstration. It is not an officially commissioned portal unless designated by campus estate authorities.

CivicFix is a complete, full-stack civic reporting and infrastructure maintenance platform designed for university residential campuses. It centralizes defect reporting (broken streetlights, AC faults, pavement cracks, hostel plumbing, waste management) between students/hostel residents and the university's Estate Maintenance Directorate.

---

## 🚀 Key Features

### 1. 📱 Student / Resident Reporting Portal
* **Live AI Auto-Categorization**: As the student types their complaint description (e.g. *"Pathway light flickering near Tapovan"* or Hindi *"bijli ka khamba kharab hai"*), the built-in Scikit-learn NLP engine suggests the category with honest, unscaled probabilities. Low-confidence queries prompt manual verification.
* **Campus Map Pin-Picker**: Built on OpenStreetMap & Leaflet. Students can tap anywhere on campus or pick from known landmarks (*Main Gate, Tapovan, Engineering Block, Dining Hall, Hostels, Central Library*).
* **Geo-Proximity Duplicate Alert**: If an active complaint was already reported nearby (< 75 meters), the platform warns the student and lets them upvote the existing ticket instead of creating duplicates.
* **Photo Upload**: Supports before/after photo documentation with file size limits (5 MB) and MIME/magic bytes verification.
* **Unique 6-Digit Ticket Generation**: Generates collision-resistant tracking IDs (e.g., `#CF-104928`) with shareable URLs and status timelines.
* **Student Privacy & Sensitive Flags**: Student reporter names are masked in the public feed, and campus security hazards (boundary wall breaches, panic alarm faults) can be flagged as sensitive to keep them off the public map.

### 2. 🔍 Public Issue Tracker & Community Upvoting
* **4-Stage Visual Stepper**: `Reported` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved`.
* **Milestone Activity Log**: Timestamps (rendered in user local time via UTC) and notes for every dispatch, department assignment, and repair step.
* **"+1 Me Too" Upvote Button**: Endorsement system with 1-upvote-per-device tracking to prevent upvote spam and priority inflation.
* **Before & After Proof**: Displays the initial defect photo alongside the Estate maintenance department's completion proof photo.

### 3. 🏢 Estate & Maintenance Directorate Admin Dashboard
* **Real-time KPI Metrics**: Total Complaints, Pending Triage, Under Active Repair, All-Time Resolved Count, and Critical Hazards.
* **Interactive Recharts Analytics**:
  * Category distribution donut chart (Garbage, Roads, Streetlights, Water, Safety, etc.)
  * Department workload comparison (Assigned vs Completed).
* **Workforce Triage & RBAC Dispatch Modal**:
  * Transition status through official milestones.
  * Role-based permissions: Electrical supervisors only triage electrical issues, while Chief Estate Officer holds system-wide triage.
  * Visible in-modal error alerts for invalid status transitions or expired tokens.
  * Upload resolution proof photos and completion notes.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS | Fast, modern mobile-responsive single-page app |
| **Icons & Visuals** | Lucide React, Recharts | Sleek UI and real-time dashboard analytics |
| **Maps** | Leaflet, OpenStreetMap | 100% free interactive campus maps with zero API keys |
| **Backend** | Python FastAPI, Uvicorn | High-performance asynchronous REST API with auto-generated Swagger docs |
| **AI Engine** | Scikit-learn (TF-IDF + Logistic Regression) | Zero-cost local NLP classifier with English + Hinglish support |
| **Database** | SQLite + SQLAlchemy ORM | Zero-setup local DB, 100% plug-and-play compatible with PostgreSQL |

---

## 🔑 Demo Evaluator Accounts (For Testing & Presentations)

For grading and testing the Estate Directorate Dashboard, use these credentials in the login modal:

| Designation | Official Email | Demo Passcode | Division / Permissions |
| :--- | :--- | :--- | :--- |
| **Chief Estate Officer** | `estate.head@modyuniversity.ac.in` | `Mody@Estate2024!` | All Campus Categories (Full Admin) |
| **Electrical Supervisor** | `electrical.lead@modyuniversity.ac.in` | `Mody@Power2024!` | Streetlights & Electrical Division |
| **Civil & Roads Inspector** | `civil.lead@modyuniversity.ac.in` | `Mody@Civil2024!` | Roads, Potholes & Infrastructure |

---

## 🏃 Quick Start Guide

### Prerequisites
* **Python 3.10+**
* **Node.js 18+ and npm**

### 1. Launch the Backend
```bash
cd backend
.\venv\Scripts\activate
python run.py
```
* Backend runs on: `http://localhost:8000`
* Interactive API documentation (Swagger UI): `http://localhost:8000/docs`

### 2. Launch the Frontend
In a new terminal window:
```bash
cd frontend
npm run dev
```
* Frontend runs on: `http://localhost:5173`

---

## 🧪 Testing

To run the automated end-to-end backend API, security, and AI test suite:
```bash
cd backend
python test_api.py
```
