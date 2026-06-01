"""
VigilDrive AI - Event Logger System
"""

import csv
import os
from datetime import datetime


class EventLogger:

    def __init__(self):

        self.log_file = "logs/fatigue_log.csv"

        # Create log file if missing
        if not os.path.exists(self.log_file):

            with open(
                self.log_file,
                mode="w",
                newline=""
            ) as file:

                writer = csv.writer(file)

                writer.writerow([

                    "Timestamp",

                    "Fatigue Score",

                    "Driver State",

                    "EAR",

                    "MAR",

                    "Yaw",

                    "Pitch",

                    "Distracted",

                    "Yawning",

                    "Drowsy"
                ])

    # ─────────────────────────────────────────────────────────
    # Log Event
    # ─────────────────────────────────────────────────────────

    def log(

        self,

        fatigue_score,

        driver_state,

        eye_data,

        yawn_data,

        head_data

    ):

        timestamp = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

        with open(

            self.log_file,

            mode="a",

            newline=""

        ) as file:

            writer = csv.writer(file)

            writer.writerow([

                timestamp,

                fatigue_score,

                driver_state,

                eye_data["ear"],

                yawn_data["mar"],

                head_data["yaw"],

                head_data["pitch"],

                head_data["distracted"],

                yawn_data["yawning"],

                eye_data["drowsy"]
            ])