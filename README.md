# Ingatlanpont - Real Estate Management System

A full-stack web application built with **Node.js** and **Express**, designed for managing and browsing real estate advertisements. The system utilizes **MongoDB** for data persistence and **EJS** for dynamic server-side rendering.

## 🏘️ Code In Action
![Screencast from 2026-03-12 00-59-23](https://github.com/user-attachments/assets/6eea0783-7a8d-4b73-8274-c730fd1706e6)


## 🌟 Key Features

* **User Authentication**: Secure login and logout system using SHA-512 password hashing with salt and session-based state management.
* **Property Search**: Advanced filtering capabilities allowing users to search by username, city, neighborhood, price range, and room count.
* **Image Management**: Integrated photo upload system (max 2MB) with automatic file renaming and a feature for owners to delete existing images.
* **Asynchronous Data Loading**: Uses AJAX to fetch and display sensitive or secondary data like room numbers and creation dates without reloading the page.

## 🛠️ Technology Stack

* **Backend**: Node.js and Express.js.
* **Database**: MongoDB (utilizing the native MongoDB Node.js Driver).
* **Security**: `mongo-sanitize` for NoSQL injection protection and custom middleware for route-level authorization.
* **Frontend**: EJS templates styled with CSS3 and enhanced with Vanilla JavaScript for DOM manipulation and fetch requests.
* **File Handling**: Multer for processing multipart/form-data and filesystem (fs) promises for file operations.

## 📂 System Logic and Validation

* **Creation Constraints**: New listings must have non-empty location fields and positive numeric values for area, price, and rooms.
* **Ownership Protection**: Features like image deletion and upload forms are conditionally rendered and verified to ensure only the listing's owner can modify them.
