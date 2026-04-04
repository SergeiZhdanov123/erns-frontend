# Erns - Wall Street Intelligence for Everyone

This is the source code for **Erns**, a financial terminal built for retail investors who want institutional-grade data without the institutional price tag.

## 🔗 Quick Links

- **Live URL**: [ernsdata.com](https://ernsdata.com)
- **Backend API**: Python FastAPI (Internal Data Engine)

---

## 🛠️ The Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion & GSAP
- **Users**: Clerk (Production Mode)
- **Payments**: Stripe (Demo Mode)

### Backend
- **Framework**: Python FastAPI
- **Database**: 
    - **MongoDB Atlas** (User data and watchlists)
    - **SQLite** (SEC data cache)
- **Data Scraping**: Custom SEC EDGAR XBRL parser.
- **AI Analytics**: DeepSeek LLM models for sentiment scoring.

---

## 🚀 How to Run Locally

### 1. Requirements
- Node.js 18+
- Python 3.10+
- A MongoDB instance

### 2. Frontend Setup
```bash
cd tyche-terminal
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --reload
```

---

## 📸 Project Previews (Visual Descriptions)

### The Terminal Dashboard
The Erns dashboard features a high-density "Bloomberg-style" interface. It includes real-time scrolling market tickers at the top, a "Live Earnings" calendar grid showing upcoming reports (BMO/AMC), and a series of interactive data blocks that update dynamically. The design uses a dark, professional theme with vibrant terminal-green accents.

### Plans & Pricing
The platform includes a professional, three-tier pricing model (Starter, Pro, and Enterprise). Each tier is presented in a modern, 3D-tilt animated card that highlights available features like AI-powered signals, advanced screening tools, and API access limits. The checkout flow is integrated with a simulated Stripe environment for trial testing.

### Stock Analytics & Charting
Individual stock pages provide deep-dive analytics, including interactive historical price charts with technical overlays. Users can toggle between different timeframes to view AI-generated sentiment signals and longitudinal fundamental data points pulled directly from SEC disclosures.
