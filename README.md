# ShopKeeper - Courier Management System

A comprehensive MERN stack application for courier management, order tracking, inventory management, and accounting.

## Features

- 🔐 Role-based Authentication & Authorization
- 📦 Complete Order Lifecycle Management
- 🏪 Multi-warehouse Inventory Tracking
- 💰 Comprehensive Accounting & Finance Module
- 📊 Real-time Dashboard & Analytics
- 🛒 Point of Sale (POS) System
- 📈 Advanced Reporting System
- 🌍 International Standard Compliance

## Technology Stack

### Frontend
- React.js with Vite
- Material-UI (MUI)
- Redux Toolkit
- Chart.js for analytics
- React Router DOM

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT Authentication
- Bcryptjs for password hashing
- Multer for file uploads

## Project Structure

```
shopkeeper/
├── backend/                 # Express.js API server
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Entry point
├── frontend/               # React.js application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd frontend && npm install`
4. Configure environment variables
5. Start MongoDB service
6. Run the application: `npm run dev`

## Order Status Tracking

The system tracks orders through the following stages:
1. Customer Order Placed
2. Order Confirmed
3. Supplier Contacted (China)
4. Shipment to China Warehouse
5. Stock in China Warehouse
6. International Shipping (Ship/Air)
7. Arrived at Company Warehouse
8. Final Delivery to Customer

## Accounting Features

- Chart of Accounts
- Debit/Credit Voucher Entry
- General Ledger Reports
- Financial Statements
- Trial Balance
- Profit & Loss Statement
- Balance Sheet

## License

MIT License