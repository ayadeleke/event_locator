Here’s a structured list of all the essential **endpoints** for your multi-user event locator application, along with example requests and responses.

### **User Registration**
- **Endpoint:** `POST /users/register`
- **Description:** Registers a new user (admin or regular user).
- **Request Example:**
  ```json
  {
    "username": "johnDoe",
    "email": "johndoe@example.com",
    "password": "StrongPass@123",
    "preferred_language": "en",
    "address": "123 Main St, Berlin, Germany",
    "role": "user"
  }
  ```
- **Response Example:**
  ```json
  {
    "user_id": 22,
    "role": "user",
    "message": "User registered successfully",
    "token": "jwt_token_here"
  }
  ```

### **User Login**
- **Endpoint:** `POST /users/login`
- **Description:** Logs in a user and returns a JWT token.
- **Request Example:**
  ```json
  {
    "email": "johndoe@example.com",
    "password": "StrongPass@123"
  }
  ```
- **Response Example:**
  ```json
  {
    "user_id": 22,
    "role": "user",
    "message": "Login successful",
    "token": "jwt_token_here"
  }
  ```

---

# **2. Event Endpoints**
### **Create an Event (Admin Only)**
- **Endpoint:** `POST /events`
- **Description:** Creates a new event.
- **Headers:**
  ```json
  {
    "Authorization": "Bearer jwt_token_here"
  }
  ```
- **Request Example:**
  ```json
  {
    "title": "Tech Conference 2025",
    "description": "A conference for tech enthusiasts.",
    "event_time": "2025-06-15T10:00:00Z",
    "locationAddress": "123, address of the event",
    "category_id": 1,
    "created_by": "User_id"
  }
  ```
- **Response Example:**
  ```json
  {
    "event_id": 5,
    "title": "Tech Conference 2025",
    "message": "Event created successfully",
    "Event_time": "2025-06-15T10:00:00Z",
    "created_by": "Creator_name"
  }
  ```

### **Get All Events**
- **Endpoint:** `GET /events`
- **Description:** Fetches all events.
- **Response Example:**
  ```json
  [
    {
      "event_id": 5,
      "title": "Tech Conference 2025",
      "description": "A conference for tech enthusiasts.",
      "event_time": "2025-06-15T10:00:00Z",
      "location": {
        "latitude": 52.5200,
        "longitude": 13.4050
      },
      "category": "Technology",
      "average_rating": 4.5
    }
  ]
  ```

### **Get a Single Event by ID**
- **Endpoint:** `GET /events/:id`
- **Description:** Fetches details of a specific event.
- **Response Example:**
  ```json
  {
    "event_id": 5,
    "title": "Tech Conference 2025",
    "description": "A conference for tech enthusiasts.",
    "event_time": "2025-06-15T10:00:00Z",
    "location": {
      "latitude": 52.5200,
      "longitude": 13.4050
    },
    "category": "Technology",
    "average_rating": 4.5
  }
  ```

### **Update an Event (Admin Only)**
- **Endpoint:** `PUT /events/:id`
- **Description:** Updates an event.
- **Request Example:**
  ```json
  {
    "title": "Updated Tech Conference 2025",
    "description": "Updated description",
    "event_time": "2025-06-16T12:00:00Z"
  }
  ```
- **Response Example:**
  ```json
  {
    "message": "Event updated successfully"
  }
  ```

### **Delete an Event (Admin Only)**
- **Endpoint:** `DELETE /events/:id`
- **Description:** Deletes an event.
- **Response Example:**
  ```json
  {
    "message": "Event deleted successfully"
  }
  ```

---

# **3. Event Rating Endpoints**
### **Rate an Event**
- **Endpoint:** `POST /events/:id/rate`
- **Description:** Allows users to rate an event.
- **Request Example:**
  ```json
  {
    "rating": 5,
    "comment": "Amazing event!"
  }
  ```
- **Response Example:**
  ```json
  {
    "message": "Rating submitted successfully"
  }
  ```

### **Get Ratings for an Event**
- **Endpoint:** `GET /events/:id/ratings`
- **Description:** Fetches ratings for an event.
- **Response Example:**
  ```json
  {
    "event": "Tech Conference 2025",
    "average_rating": 4.5,
    "ratings": [
      {
        "user": "JohnDoe",
        "rating": 5,
        "comment": "Amazing event!"
      }
    ]
  }
  ```

---

# **4. Category Endpoints**
### **Create a Category (Admin Only)**
- **Endpoint:** `POST /categories`
- **Description:** Creates a new event category.
- **Request Example:**
  ```json
  {
    "name": "Technology"
  }
  ```
- **Response Example:**
  ```json
  {
    "category_id": 1,
    "name": "Technology",
    "message": "Category created successfully"
  }
  ```

### **Get All Categories**
- **Endpoint:** `GET /categories`
- **Description:** Fetches all categories.
- **Response Example:**
  ```json
  [
    {
      "category_id": 1,
      "name": "Technology"
    },
    {
      "category_id": 2,
      "name": "Music"
    }
  ]
  ```

---


### **Get All Users Profile**
- **Endpoint:** `GET /users` (Only Admin)
- **Description:** Fetches all registered users
- **Response Example:**
  ```json
  {
    "user_id": 22,
    "username": "johnDoe",
    "email": "johndoe@example.com",
    "role": "user",
    "preferred_language": "en",
    "address": "123 Main St, Berlin, Germany"
  }

   {
    "user_id": 23,
    "username": "johnDoe",
    "email": "johndoe@example.com",
    "role": "user",
    "preferred_language": "es",
    "address": "123 Main St, Berlin, Germany"
  }

   {
    "user_id": 24,
    "username": "johnDoe",
    "email": "johndoe@example.com",
    "role": "user",
    "preferred_language": "de",
    "address": "123 Main St, Berlin, Germany"
  }
  ```

### **Update User Profile**
- **Endpoint:** `PUT /users/:id` (Only admin)
- **Description:** Updates user profile details.
- **Request Example:**
  ```json
  {
    "username": "John_Doe_Updated",
    "preferred_language": "fr",
    "role": "admin/users"
  }
  ```
- **Response Example:**
  ```json
  {
    "message": "Profile updated successfully"
  }
  ```

---

# **6. Location-Based Search**
### **Search Events by Location**
- **Endpoint:** `GET /events/search?latitude=52.5200&longitude=13.4050&radius=10`
- **Description:** Searches events within a given radius (in km).
- **Response Example:**
  ```json
  [
    {
      "event_id": 5,
      "title": "Tech Conference 2025",
      "location": "Berlin, Germany",
      "distance_km": 5.2
    }
  ]
  ```

### **Search Events by Category**
- **Endpoint:** `GET /events?category=category_name`
- **Description:** Fetches events by category.
- **Response Example:**
  ```json
  [
    {
      "event_id": 5,
      "title": "Music Concert",
      "description": "A fun music event",
      "address": "2HR23P7J+W6",
      "event_time": "2025-05-01T20:00:00.000Z",
      "category_name": "Music",
      "created_by": "Adeleke akindele"
    }
  ]
  ```

---

## **Conclusion**
- **Admin Roles** can:
  - Create, update, and delete events.
  - Manage categories.
- **Users** can:
  - View events, search by location/category/radius.
  - Rate events.
