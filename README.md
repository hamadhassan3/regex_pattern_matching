# IntelliRegex: Smart Text Pattern Matching & Replacement

A Django and React web application that allows users to upload CSV/Excel files, identify text patterns using natural language, and perform replacements. It leverages the Gemini API to convert natural language queries into regex.

## Key Features

*   **File Upload:** Supports CSV and Excel files.
*   **Natural Language to Regex:** Uses an LLM (gemini-2.0-flash) to generate regex from plain English.
*   **Pattern Replacement:** Replaces matched patterns in specified text columns.
*   **Interactive UI:** User-friendly interface built with React for easy data interaction.
*   **Processed Data Display:** Shows updated data in a table after replacements.

## Demonstration

**Screenshots:**

*   *Main Interface:*
*   <img width="1512" alt="Screenshot 2025-06-02 at 1 57 06 am" src="https://github.com/user-attachments/assets/8dd54f65-e68f-47e7-bc0c-ecdb77dbf65a" />

*   *After File Input:*
*   <img width="1512" alt="Screenshot 2025-06-02 at 1 58 06 am" src="https://github.com/user-attachments/assets/f37d80d7-b0aa-43df-8502-d9a6982416b3" />

*   *Pattern Input & Processed Output:*
*   <img width="1512" alt="Screenshot 2025-06-02 at 1 58 53 am" src="https://github.com/user-attachments/assets/32609958-1497-4d94-ac94-186a0701ac00" />


**Demo Video:**


## Tech Stack

*   **Backend:** Django, Django REST Framework
*   **Frontend:** React
*   **LLM:** gemini-2.0-flash

## Getting Started

### Prerequisites

*   Python `Python 3.13.3`
*   Node.js `v18.12.1` & npm
*   Git
*   Gemini API Key

### Quick Installation & Setup

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/hamadhassan3/regex_pattern_matching.git
    cd regex_pattern_matching
    ```

2.  **Backend (Django):**
    ```bash
    cd backend
    pipenv shell
    pip install -r requirements.txt
    python manage.py migrate
    ```
    Create a .env file in the backend folder and add your Gemini API key:
    ```
    GOOGLE_API_KEY="YOUR_GEMINI_API_KEY"
    ```

3.  **Frontend (React):**
    ```bash
    cd ../app
    npm install
    ```

## Running the Application

1.  **Start Backend:**
    In the `backend` directory:
    ```bash
    pipenv shell
    python manage.py runserver
    ```
2.  **Start Frontend:**
    In the `app` directory:
    ```bash
    npm start
    ```
3.  Open your browser to `http://localhost:3000`.

## How to Use

1.  Navigate to the web application in your browser.
2.  **Upload** your CSV or Excel file. The data will be displayed.
3.  Enter your **natural language query** (e.g., "Find email addresses in the Email column and replace them with 'REDACTED'").
4.  Click "**Process Data**". The table will update with the changes.
