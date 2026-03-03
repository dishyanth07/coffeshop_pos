# Coffee Shop POS System

A full-stack Point of Sale (POS) system for coffee shops, featuring a FastAPI backend and a React (Vite) frontend.

## Project Structure

```
coffeshop_pos/
├── backend/            # FastAPI Application
├── frontend/           # React Application
└── README.md           # This file
```

## Tech Stack

- **Backend**: FastAPI (Python), PostgreSQL, SQLAlchemy, Pydantic
- **Frontend**: React.js, Vite, Tailwind CSS
- **Database**: PostgreSQL

## Setup Instructions

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update database credentials
6. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
