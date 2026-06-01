"""
VigilDrive AI - Flask Dashboard Backend
"""

from flask import Flask
from flask import render_template
from flask import jsonify

import sqlite3

app = Flask(__name__)

DATABASE_PATH = "analytics/vigildrive.db"


# ─────────────────────────────────────────────────────────────
# Database Helper
# ─────────────────────────────────────────────────────────────

def get_connection():

    conn = sqlite3.connect(

        DATABASE_PATH
    )

    conn.row_factory = sqlite3.Row

    return conn


# ─────────────────────────────────────────────────────────────
# Dashboard Home
# ─────────────────────────────────────────────────────────────

@app.route("/")

def dashboard():

    return render_template(

        "index.html"
    )


# ─────────────────────────────────────────────────────────────
# Recent Sessions API
# ─────────────────────────────────────────────────────────────

@app.route("/api/sessions")

def get_sessions():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("""

        SELECT *

        FROM sessions

        ORDER BY id DESC

        LIMIT 10

    """)

    sessions = cursor.fetchall()

    conn.close()

    return jsonify([dict(row) for row in sessions])


# ─────────────────────────────────────────────────────────────
# Recent Events API
# ─────────────────────────────────────────────────────────────

@app.route("/api/events")

def get_events():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("""

        SELECT *

        FROM events

        ORDER BY id DESC

        LIMIT 20

    """)

    events = cursor.fetchall()

    conn.close()

    return jsonify([dict(row) for row in events])


# ─────────────────────────────────────────────────────────────
# Analytics API
# ─────────────────────────────────────────────────────────────

@app.route("/api/analytics")

def get_analytics():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("""

        SELECT *

        FROM analytics

        ORDER BY id DESC

        LIMIT 50

    """)

    analytics = cursor.fetchall()

    conn.close()

    return jsonify([dict(row) for row in analytics])


# ─────────────────────────────────────────────────────────────
# Run Flask App
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":

    app.run(

        debug=True,

        host="0.0.0.0",

        port=5000
    )