# Election System API

This is the backend API for the Election System application built with Node.js, Express, and MongoDB.

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/election-system?retryWrites=true&w=majority
   PORT=5000
   JWT_SECRET=your_secret_key_here
   ```

3. **Seed the database**:
   ```bash
   npm run seed
   ```
   This will create an admin user with the following credentials:
   - Email: admin@example.com
   - Password: admin123

   And a test student user:
   - Email: student@example.com
   - Password: student123

4. **Start the server**:
   ```bash
   npm start
   ```
   
   For development with automatic restart:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get token

### Users
- `GET /api/users/me` - Get current user profile (requires auth)
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id/approve` - Approve a student account (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete a user (admin only)

### Elections
- `GET /api/elections` - Get all elections
- `GET /api/elections/active` - Get all active elections
- `GET /api/elections/:id` - Get election by ID
- `POST /api/elections` - Create a new election (admin only)
- `PUT /api/elections/:id` - Update an election (admin only)
- `DELETE /api/elections/:id` - Delete an election (admin only)
- `POST /api/elections/:id/vote` - Vote in an election (requires auth)
- `GET /api/elections/:id/results` - Get election results

## Testing with Postman

1. **Setup Postman Collection**:
   - Import the provided Postman collection (if available)
   - Or create a new collection for the Election System API

2. **Authentication**:
   - Register or login to get a JWT token
   - Add the token to your requests using the `x-auth-token` header

3. **Test Endpoints**:
   - Test each endpoint with appropriate request bodies
   - Verify responses match expected formats

## Connecting to Frontend

To connect this API to the React frontend:

1. Update the API URL in your frontend configuration
2. Ensure CORS is properly configured (already set up in this API)
3. Use the endpoints as documented above 