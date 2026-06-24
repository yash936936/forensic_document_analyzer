# CrimeX ASDAS | Advanced Shredded Document Assembly System

![Forensic Intelligence](https://img.shields.io/badge/Forensic-Intelligence-blue?style=for-the-badge&logo=shield)
![Security](https://img.shields.io/badge/Security-Encrypted-emerald?style=for-the-badge&logo=lock)

**CrimeX ASDAS** is a state-of-the-art forensic reconstruction platform designed to assemble shredded and fragmented documents using advanced AI neural matching. It provides intelligence agencies and forensic investigators with a digital "lab bench" to recover sensitive information from physical destruction.

## 🔬 Core Use Cases

- **Forensic Investigations**: Recovering shredded financial records, memos, and logs discovered during search operations.
- **Intelligence Recovery**: Reassembling sensitive communications or classified documents that have been mechanically destroyed.
- **Data Restoration**: Digitizing and rebuilding historical archives or damaged legal documents.
- **Evidence Authentication**: Verifying the chain of custody and integrity of recovered physical fragments.

## 🛠️ Key Modules

### 1. Evidence Intake Hub

A high-precision scanning interface that processes multi-format forensic imagery. It automatically cleans fragments, strips metadata, and prepares them for neural feature extraction.

### 2. CNN Matching Engine

Utilizes Convolutional Neural Networks to analyze fragment edges, textures, and ink patterns. The engine suggests high-confidence candidate matches, significantly reducing manual effort.

### 3. OCR Semantic Review

Integrates Optical Character Recognition to extract text snippets from fragments. This allows for semantic-based reconstruction by matching sentence structures and contextual clues.

### 4. Forensic Reporting

Generates comprehensive analysis reports, including reconstruction methodology, confidence scores, and digital chain-of-custody logs for legal evidence presentation.

## 🤖 AI Frameworks & Libraries

The system leverages a specialized AI microservice to detect forgeries and analyze document integrity:

- **PyTorch & Torchvision**: Powers the deep learning model (ResNet-18) used for **Automated Forgery Detection**. It identifies subtle patterns in document structures that distinguish between genuine and AI-generated content.
- **OpenCV (Open Source Computer Vision)**: The primary tool for **Forensic Image Analysis**. It is used to perform **Error Level Analysis (ELA)**, detecting localized compression artifacts that indicate digital tampering.
- **Tesseract OCR (pytesseract)**: Enables **Semantic Analysis** by extracting text from scanned documents, allowing the system to verify textual information and identify inconsistencies in document content.
- **NumPy**: Handles the heavy lifting for mathematical computations, specifically for calculating fraud scores and analyzing pixel-level variance in forensic heatmaps.
- **FastAPI & Uvicorn**: A modern, high-performance web framework and ASGI server that provides low-latency analysis results.
- **Pillow (PIL) & python-multipart**: Facilitates image manipulation and handles multi-part file uploads for forensic scanning.
- **Pydantic & Dotenv**: Manages data validation and environment configurations (via `pydantic-settings`), ensuring secure and robust service operations.

## ⚙️ Core Backend Architecture

The primary backend service coordinates data flow, user authentication, and forensic record management:

- **Express.js**: The robust web framework used to build our RESTful API, handling high-concurrency requests and routing logic.
- **Mongoose (MongoDB)**: Acts as the Object Data Modeling (ODM) layer, managing our forensic database schema, evidence records, and audit logs.
- **JSON Web Token (JWT), BcryptJS & Cookie-Parser**: Implements our **Security-First** authentication system, ensuring secure user sessions, encrypted password storage, and signed cookie management.
- **Multer**: Handles the secure upload and temporary storage of high-resolution document scans before they are processed by the AI engine.
- **Helmet & CORS**: Provides essential security headers and cross-origin resource sharing policies to protect the system against common web vulnerabilities.
- **Axios**: Manages the internal communication between the Node.js backend and the Python AI microservice.
- **Luxon & Lodash**: Provides advanced date/time handling for forensic timestamps and utility functions for complex data manipulation.
- **Morgan & Dotenv**: Implements detailed request logging for forensic audit trails and manages environment variables.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind 4, Framer Motion (State-of-the-art UI/UX).
- **Backend**: Node.js, Express, MongoDB (Forensic data management).
- **AI/ML**: Python Microservice (CNN edge detection and text similarity).
- **Security**: JWT Authentication, AES-256 Session Encryption, Forensic Audit Logging.

### Prerequisites

- Node.js v18+
- MongoDB Atlas
- Python 3.10+ (for AI Service)

## 🛠️ Backend Setup & Installation

To initialize the forensic environment and install all required framework dependencies:

### 1. Node.js Backend

```bash
cd backend
npm install express mongoose jsonwebtoken bcryptjs multer cors helmet morgan axios cookie-parser lodash luxon dotenv
```

### 2. Python AI Service

```bash
cd ai-service
# Recommended: Create a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

pip install fastapi uvicorn python-multipart opencv-python-headless numpy pytesseract torch torchvision pillow python-dotenv pydantic pydantic-settings
```

---

**RESTRICTED ACCESS**: This system is designed for authorized forensic personnel only. All access and actions are logged via the Internal Audit Middleware.
