# **Multi-User Event Locator API**  

This is a **Node.js** and **Express.js** API for a **multi-user event locator application**. It allows users to create, manage, and discover events based on location, category, and other filters. The application supports **user authentication, multilingual support, geospatial queries using PostGIS, and real-time notifications**.  

---

## **🚀 Features**
- **User Authentication**: Register, login, and role-based access control (`admin`, `user`, etc.).
- **Event Management**: Create, update, delete, and fetch events.
- **Geospatial Search**: Find events near a given location (using PostGIS).
- **Category Filtering**: Organize events by category.
- **Multilingual Support**: Supports multiple languages via i18next.
- **Real-Time Notifications**: Uses Redis/RabbitMQ for event updates.
- **Secure API**: Implements JWT authentication and authorization.
- **Swagger API Documentation**: Provides detailed API documentation.
- **Docker Support**: Easily deployable with Docker.

---

## **📌 Tech Stack**
| Technology        | Purpose |
|------------------|---------|
| **Node.js & Express.js** | Backend API development |
| **PostgreSQL & PostGIS** | Database and geospatial data handling |
| **Sequelize ORM** | Database management |
| **JWT Authentication** | Secure user authentication |
| **i18next** | Multilingual support |
| **Redis / RabbitMQ** | Message queuing for notifications |
| **Swagger (OpenAPI)** | API documentation |
| **Jest / Mocha** | Unit testing |
| **Docker** | Containerization for deployment |

---

## **📥 Installation & Setup**
### **1️⃣ Prerequisites**
Before running the application, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/) with PostGIS extension
- [Docker](https://www.docker.com/) (for containerized deployment)
- [Redis](https://redis.io/) (for caching & messaging)

### **2️⃣ Clone the Repository**
```sh
git clone https://github.com/your-username/event-locator-api.git
cd event-locator-api
```

### **3️⃣ Install Dependencies**
```sh
npm install
```

### **4️⃣ Setup Environment Variables**
Create a `.env` file in the root directory and add the following:
```ini
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=event_locator_db
DB_PORT=5432

# JWT Authentication
JWT_SECRET=your_jwt_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost
```

### **5️⃣ Run Database Migrations**
```sh
npx sequelize-cli db:migrate
```

### **6️⃣ Start the Server**
```sh
npm start
```
The API will be available at **`http://localhost:3000`**.

---

## **📖 API Documentation (Swagger)**
The API documentation is available at:  
👉 `http://localhost:3000/api-docs`

---

## **📌 Endpoints**
### **🔐 Authentication**
| Method | Endpoint | Description | Authentication |
|--------|---------|------------|---------------|
| **POST** | `/register` | Register a new user | ❌ |
| **POST** | `/login` | Login and get JWT token | ❌ |

### **👤 User Management**
| Method | Endpoint | Description | Authentication |
|--------|---------|------------|---------------|
| **GET** | `/users/` | Get all users (admin only) | ✅ `admin` |
| **GET** | `/users/:id` | Get user by ID | ✅ |
| **PUT** | `/users/:id` | Update user by ID | ✅ `admin` |
| **DELETE** | `/users/:id` | Delete user by ID | ✅ `admin` |

### **📍 Event Management**
| Method | Endpoint | Description | Authentication |
|--------|---------|------------|---------------|
| **POST** | `/events/` | Create a new event | ✅ |
| **GET** | `/events/` | Get all events | ❌ |
| **GET** | `/events/:id` | Get event by ID | ❌ |
| **PUT** | `/events/:id` | Update event | ✅ (Owner/Admin) |
| **DELETE** | `/events/:id` | Delete event | ✅ (Owner/Admin) |

### **🗺️ Geolocation & Search**
| Method | Endpoint | Description | Authentication |
|--------|---------|------------|---------------|
| **GET** | `/events/nearby?lat=LAT&lng=LNG&radius=3000` | Find events near a location | ❌ |
| **GET** | `/events/category/:category` | Get events by category | ❌ |

### **📩 Notifications**
| Method | Endpoint | Description | Authentication |
|--------|---------|------------|---------------|
| **POST** | `/notifications/subscribe` | Subscribe to event updates | ✅ |
| **GET** | `/notifications/` | Get notifications | ✅ |

---

## **🌍 Multilingual Support**
This API supports multiple languages using `i18next`.  
Supported languages:
- 🇬🇧 English (Default)
- 🇫🇷 French
- 🇪🇸 Spanish
- 🇩🇪 German
- 🇳🇬 Yoruba (Example)

To use a specific language, send the `Accept-Language` header:  
```sh
curl -H "Accept-Language: fr" http://localhost:3000/users/
```

---

## **⚡ Running with Docker**
If you prefer running the application with **Docker**, use the following:
```sh
docker-compose up --build
```
This will start:
✅ PostgreSQL with PostGIS  
✅ Redis for caching  
✅ RabbitMQ for notifications  
✅ The Node.js API  

---

## **🛠 Testing**
Run tests using **Jest** or **Mocha**:
```sh
npm test
```

---

## **🤝 Collaboration & Contributions**
We welcome contributions! If you’d like to contribute:  
1. **Fork the repository**  
2. **Create a new branch**: `git checkout -b feature-branch`  
3. **Make your changes** and **commit** them  
4. **Push to your fork**: `git push origin feature-branch`  
5. **Create a Pull Request (PR)**  

### **Contribution Guidelines**
- Follow **ESLint rules** (`npm run lint` to check).
- Write tests for new features.
- Keep documentation up to date.

---

## **📞 Support**
For any issues or suggestions, feel free to **open an issue** or contact:  
📧 Email: `a.adeleke@alustudent.com`  
    Name: `Adeleke Ayotunde`
