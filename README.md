# 🧱 Blockchain Dashboard

A sleek and simplified blockchain simulation powered by **Python Flask** and **React.js**. This project allows users to generate wallet addresses, view balances, make transactions, mine new blocks, and track all activity through a beautifully animated interface.

## 🚀 Features

- 🌐 Wallet creation & address handling
- 💸 Transaction submission with live validation
- ⛏️ Block mining via Proof-of-Work
- 🧾 Wallet-based transaction history
- 📦 Full blockchain explorer (block hashes, timestamps, transactions)
- ⚡ Modern, responsive frontend with Tailwind CSS & animations
- 🔒 (Optional) Signature-ready transaction logic

---

## 🛠️ Tech Stack

**Frontend:**
- React.js (Vite/CRA)
- Tailwind CSS
- Framer Motion (optional animations)
- Heroicons

**Backend:**
- Python Flask
- Flask-CORS
- SHA-256 for hash generation
- REST API structure

---

## 📂 Folder Structure

blockchain-dashboard/
│
├── backend/
│ ├── app.py # Flask server
│ ├── transaction.py # Transaction model (optional)
│ ├── wallet.py # Wallet signature verifier (optional)
│
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── App.js # React UI logic
│ │ └── App.css # Tailwind + custom styling
│ └── package.json
│
└── README.md



---

## 🧪 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/blockchain-dashboard.git
cd blockchain-dashboard

2️⃣ Start the Backend
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install flask flask-cors
python app.py

3️⃣ Start the Frontend
cd frontend
npm install
npm run dev                  # or npm start (depending on setup)
