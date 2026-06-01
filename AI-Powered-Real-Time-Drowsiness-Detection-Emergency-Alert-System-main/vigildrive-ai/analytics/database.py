"""
VigilDrive AI - Database Engine

Handles:
- Session storage
- Event storage
- Analytics persistence
- Driver telemetry
"""

import sqlite3
from datetime import datetime


class DatabaseManager:

    def __init__(self):

        # Database file
        self.db_path = "analytics/vigildrive.db"

        # Create DB + tables
        self.initialize_database()

    # ─────────────────────────────────────────────────────────
    # Database Initialization
    # ─────────────────────────────────────────────────────────

    def initialize_database(self):

        conn = sqlite3.connect(

            self.db_path
        )

        cursor = conn.cursor()

        # ─────────────────────────────────────────────────────
        # Sessions Table
        # ─────────────────────────────────────────────────────

        cursor.execute("""

            CREATE TABLE IF NOT EXISTS sessions (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                start_time TEXT,

                end_time TEXT,

                duration INTEGER,

                total_blinks INTEGER,

                total_yawns INTEGER,

                total_distractions INTEGER,

                total_drowsy_events INTEGER,

                average_attention REAL,

                average_fatigue REAL,

                risk_level TEXT
            )

        """)

        # ─────────────────────────────────────────────────────
        # Events Table
        # ─────────────────────────────────────────────────────

        cursor.execute("""

            CREATE TABLE IF NOT EXISTS events (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                timestamp TEXT,

                event_type TEXT,

                fatigue_score REAL,

                attention_state TEXT,

                gaze_direction TEXT,

                driver_status TEXT,

                screenshot_path TEXT
            )

        """)

        # ─────────────────────────────────────────────────────
        # Analytics Table
        # ─────────────────────────────────────────────────────

        cursor.execute("""

            CREATE TABLE IF NOT EXISTS analytics (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                timestamp TEXT,

                attention_score REAL,

                fatigue_score REAL,

                blink_count INTEGER,

                yawn_count INTEGER,

                distraction_count INTEGER,

                risk_level TEXT
            )

        """)

        conn.commit()

        conn.close()

        print(

            "[INFO] Database initialized successfully."
        )

    # ─────────────────────────────────────────────────────────
    # Save Session
    # ─────────────────────────────────────────────────────────

    def save_session(

        self,

        session_data

    ):

        conn = sqlite3.connect(

            self.db_path
        )

        cursor = conn.cursor()

        cursor.execute("""

            INSERT INTO sessions (

                start_time,
                end_time,
                duration,
                total_blinks,
                total_yawns,
                total_distractions,
                total_drowsy_events,
                average_attention,
                average_fatigue,
                risk_level

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        """, (

            datetime.now().strftime(

                "%Y-%m-%d %H:%M:%S"
            ),

            datetime.now().strftime(

                "%Y-%m-%d %H:%M:%S"
            ),

            session_data["session_duration"],

            session_data["total_blinks"],

            session_data["total_yawns"],

            session_data["total_distractions"],

            session_data["total_drowsy_events"],

            session_data["average_attention"],

            session_data["average_fatigue"],

            session_data["driver_risk"]
        ))

        conn.commit()

        conn.close()

    # ─────────────────────────────────────────────────────────
    # Save Event
    # ─────────────────────────────────────────────────────────

    def save_event(

        self,

        event_type,

        fatigue_score,

        attention_state,

        gaze_direction,

        driver_status,

        screenshot_path=""

    ):

        conn = sqlite3.connect(

            self.db_path
        )

        cursor = conn.cursor()

        cursor.execute("""

            INSERT INTO events (

                timestamp,
                event_type,
                fatigue_score,
                attention_state,
                gaze_direction,
                driver_status,
                screenshot_path

            )

            VALUES (?, ?, ?, ?, ?, ?, ?)

        """, (

            datetime.now().strftime(

                "%Y-%m-%d %H:%M:%S"
            ),

            event_type,

            fatigue_score,

            attention_state,

            gaze_direction,

            driver_status,

            screenshot_path
        ))

        conn.commit()

        conn.close()

    # ─────────────────────────────────────────────────────────
    # Save Analytics Snapshot
    # ─────────────────────────────────────────────────────────

    def save_analytics(

        self,

        session_data,

        fatigue_score

    ):

        conn = sqlite3.connect(

            self.db_path
        )

        cursor = conn.cursor()

        cursor.execute("""

            INSERT INTO analytics (

                timestamp,
                attention_score,
                fatigue_score,
                blink_count,
                yawn_count,
                distraction_count,
                risk_level

            )

            VALUES (?, ?, ?, ?, ?, ?, ?)

        """, (

            datetime.now().strftime(

                "%Y-%m-%d %H:%M:%S"
            ),

            session_data["average_attention"],

            fatigue_score,

            session_data["total_blinks"],

            session_data["total_yawns"],

            session_data["total_distractions"],

            session_data["driver_risk"]
        ))

        conn.commit()

        conn.close()

    # ─────────────────────────────────────────────────────────
    # Fetch Recent Sessions
    # ─────────────────────────────────────────────────────────

    def get_recent_sessions(

        self,

        limit=10

    ):

        conn = sqlite3.connect(

            self.db_path
        )

        cursor = conn.cursor()

        cursor.execute("""

            SELECT *

            FROM sessions

            ORDER BY id DESC

            LIMIT ?

        """, (limit,))

        data = cursor.fetchall()

        conn.close()

        return data

    # ─────────────────────────────────────────────────────────
    # Fetch Recent Events
    # ─────────────────────────────────────────────────────────

    def get_recent_events(

        self,

        limit=20

    ):

        conn = sqlite3.connect(

            self.db_path
        )

        cursor = conn.cursor()

        cursor.execute("""

            SELECT *

            FROM events

            ORDER BY id DESC

            LIMIT ?

        """, (limit,))

        data = cursor.fetchall()

        conn.close()

        return data
    ''' this is the database manager class that handles all interactions with the SQLite database, including initialization, saving sessions/events/analytics, and fetching recent sessions/events. It abstracts away the database logic from the rest of the application, providing a clean interface for data storage and retrieval. '''