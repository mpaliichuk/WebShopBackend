# WebShop API

This project is a HTTP REST API for managing products, built with Node.js, Express, and Firebase Firestore. It supports CRUD operations, sorting, pagination, and provides Swagger documentation.

## Prerequisites


- Node.js v18+ installed
- Firebase project with Firestore enabled
- `serviceAccountKey.json` file from Firebase Admin SDK
- `.env` file with your environment variables:

## Installation

1. Clone the repository in your local folder:

```bash
git clone https://github.com/mpaliichuk/WebShopBackend.git

Install dependencies:

npm install

Place your serviceAccountKey.json file in the project root.
```
2. Create a .env file and add your configuration variables (see below).
```
PORT=8000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"
```
3. To start the server locally write this in terminal:
```
npm start
````

The API will run on [http://localhost:8000](http://localhost:8000) (or the port specified in .env).

## Swagger API

The Swagger will run on [http://localhost:8000/api-docs](http://localhost:8000/api-docs)

## Notes
This project does not use an ORM since Firebase Firestore already provides a native SDK for database access and data modeling
