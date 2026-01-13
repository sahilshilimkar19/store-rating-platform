# Store Rating Platform

A full-stack web application that allows users to submit ratings for stores registered on the platform. Built with NestJS, PostgreSQL, and React.

## 🚀 Features

### User Roles
- **System Administrator**: Manage users, stores, and view analytics
- **Normal User**: Browse stores, submit and modify ratings
- **Store Owner**: View ratings and customer feedback

### Key Functionalities
- Role-based access control (RBAC)
- Store rating system (1-5 stars)
- User authentication & authorization
- Admin dashboard with analytics
- Store search and filtering
- Sortable data tables

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport

### Frontend
- **Framework**: React.js
- **Styling**: TBD (Tailwind CSS / Material-UI)
- **State Management**: TBD

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v14 or higher)
- Git

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/store-rating-platform.git
cd store-rating-platform
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your database credentials
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb store_rating_platform

# Run the schema
psql -U postgres -d store_rating_platform -f database/schema.sql
```

**Or using Docker:**
```bash
docker run --name store-rating-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=store_rating_platform -p 5432:5432 -d postgres:15
```

### 4. Run Backend
```bash
cd backend
npm run start:dev
```

Backend will run on http://localhost:3000

### 5. Frontend Setup (Coming Soon)
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure
```
store-rating-platform/
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # Users module
│   │   ├── stores/        # Stores module
│   │   ├── ratings/       # Ratings module
│   │   ├── config/        # Configuration files
│   │   └── main.ts        # Application entry point
│   ├── database/
│   │   └── schema.sql     # Database schema
│   ├── .env.example
│   └── package.json
├── frontend/
│   └── (Coming soon)
└── README.md
```

## 🔐 Default Admin Credentials
```
Email: admin@storerating.com
Password: Admin@123
```

**⚠️ Change these credentials in production!**

## 📝 API Documentation

API documentation will be available at http://localhost:3000/api/docs once Swagger is configured.

## 🧪 Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📜 Form Validations

- **Name**: 20-60 characters
- **Address**: Max 400 characters
- **Password**: 8-16 characters, at least one uppercase letter and one special character
- **Email**: Standard email format
- **Rating**: Integer between 1-5

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - [GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgments

- FullStack Intern Coding Challenge
- NestJS Documentation
- TypeORM Documentation

---

**Status**: 🚧 Work in Progress

**Last Updated**: January 2026
