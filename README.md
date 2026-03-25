# 🌍 Travel Buddy Finder

A full-stack web application that helps travelers find companions with matching destinations and travel dates, chat with them, and plan trips together.

---

## 🚀 Features

* 🔐 User Authentication (Register/Login)
* ✈️ Create, Update, Delete Trips
* 🔍 Search Trips by destination and date
* 🤝 Match Travelers with overlapping trips
* 💬 Real-time Chat between matched users
* 🟢 Online / Last Seen status
* 🔔 Notifications for new messages
* 🔑 Forgot Password via Email

---

## 🛠️ Tech Stack

### Frontend

* HTML
* CSS
* JavaScript (Vanilla)

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication

### Other

* Docker

---

## 📁 Project Structure

```
travel_buddy_finder/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/travel-buddy-finder.git
cd travel-buddy-finder
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/travel_buddy
JWT_SECRET=your_secret_key

EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_app_password
```

---

### ⚠️ Important (Email Setup)

For forgot password to work:

1. Enable **2-Step Verification** in Google
2. Generate **App Password**
3. Use that instead of your real password

---

### 3️⃣ Run Backend

```bash
node server.js
```

---

### 4️⃣ Frontend

Just open:

```bash
frontend/index.html
```

---

## 🐳 Run with Docker

### Build image

```bash
docker build -t travel-buddy-finder .
```

### Run container

```bash
docker run -p 5000:5000 --env-file backend/.env travel-buddy-finder
```

---


## 🧪 Testing

* Create two users
* Add trips with:

  * Same destination
  * Overlapping dates
* Go to Matches → Click Chat

---

## ⚡ Common Issues & Fixes

### ❌ MongoDB connection error

Make sure MongoDB is running:

```bash
mongod
```

---

### ❌ Email not sending (535 error)

Use Gmail **App Password**, not your normal password.

---

### ❌ Chat not opening

* Ensure `window.openChat = openChat` is added
* Check `/api/chat/start` is working

---


* Push notifications
* Mobile app version

---
