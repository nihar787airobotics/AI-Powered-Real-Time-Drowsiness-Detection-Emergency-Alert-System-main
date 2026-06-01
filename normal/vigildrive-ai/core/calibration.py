"""
VigilDrive AI - Advanced Driver Calibration System
"""

import time
import numpy as np


class DriverCalibration:

    def __init__(self):

        # Calibration state
        self.calibrated = False

        self.start_time = None

        self.calibration_duration = 5

        # Baseline collections
        self.ear_values = []

        self.mar_values = []

        self.pitch_values = []

        # Personalized face center
        self.nose_x_values = []

        self.nose_y_values = []

        # Baseline values
        self.baseline_ear = 0.3

        self.baseline_mar = 0.3

        self.baseline_pitch = 0.0

        # Personalized nose center
        self.baseline_nose_x = None

        self.baseline_nose_y = None

    # ─────────────────────────────────────────────────────────
    # Start Calibration
    # ─────────────────────────────────────────────────────────

    def start(self):

        self.start_time = time.time()

        self.calibrated = False

        # Reset stored values
        self.ear_values.clear()

        self.mar_values.clear()

        self.pitch_values.clear()

        self.nose_x_values.clear()

        self.nose_y_values.clear()

    # ─────────────────────────────────────────────────────────
    # Update Calibration
    # ─────────────────────────────────────────────────────────

    def update(

        self,

        eye_data,

        yawn_data,

        head_data
    ):

        if self.start_time is None:

            return

        elapsed = time.time() - self.start_time

        # Skip if no face
        if not head_data.get("face_detected"):

            return

        # Collect baseline values
        self.ear_values.append(

            eye_data.get("ear", 0.3)
        )

        self.mar_values.append(

            yawn_data.get("mar", 0.3)
        )

        self.pitch_values.append(

            head_data.get("pitch", 0.0)
        )

        # ─────────────────────────────────────────────────────
        # Personalized Nose Tracking
        # ─────────────────────────────────────────────────────

        nose_x, nose_y = head_data.get(

            "nose_2d",

            (0, 0)
        )

        self.nose_x_values.append(nose_x)

        self.nose_y_values.append(nose_y)

        # ─────────────────────────────────────────────────────
        # Finish Calibration
        # ─────────────────────────────────────────────────────

        if elapsed >= self.calibration_duration:

            # Adaptive baselines
            self.baseline_ear = float(

                np.mean(self.ear_values)
            )

            self.baseline_mar = float(

                np.mean(self.mar_values)
            )

            self.baseline_pitch = float(

                np.mean(self.pitch_values)
            )

            # Personalized face center
            self.baseline_nose_x = int(

                np.mean(self.nose_x_values)
            )

            self.baseline_nose_y = int(

                np.mean(self.nose_y_values)
            )

            self.calibrated = True

            # ───────────────────────────────────────────────
            # Console Output
            # ───────────────────────────────────────────────

            print("\n[INFO] Calibration Complete")

            print(

                f"[INFO] Baseline EAR: {self.baseline_ear:.3f}"
            )

            print(

                f"[INFO] Baseline MAR: {self.baseline_mar:.3f}"
            )

            print(

                f"[INFO] Baseline Pitch: {self.baseline_pitch:.2f}"
            )

            print(

                f"[INFO] Face Center: ({self.baseline_nose_x}, {self.baseline_nose_y})"
            )

    # ─────────────────────────────────────────────────────────
    # Remaining Time
    # ─────────────────────────────────────────────────────────

    def remaining_time(self):

        if self.start_time is None:

            return self.calibration_duration

        elapsed = time.time() - self.start_time

        remaining = max(

            0,

            self.calibration_duration - elapsed
        )

        return int(remaining)

    # ─────────────────────────────────────────────────────────
    # Generate Adaptive Thresholds
    # ─────────────────────────────────────────────────────────

    def get_thresholds(self):

        return {

            # Dynamic eye threshold
            "ear_threshold":

                self.baseline_ear * 0.75,

            # Dynamic yawn threshold
            "mar_threshold":

                self.baseline_mar * 1.8,

            # Dynamic pitch threshold
            "pitch_threshold":

                abs(self.baseline_pitch) + 15
        }

    # ─────────────────────────────────────────────────────────
    # Personalized Attention Zone
    # ─────────────────────────────────────────────────────────

    def get_attention_zone(self):

        if (

            self.baseline_nose_x is None

            or

            self.baseline_nose_y is None
        ):

            return None

        # Personalized dynamic zone size
        zone_width = 120

        zone_height = 100

        return (

            self.baseline_nose_x - zone_width,

            self.baseline_nose_y - zone_height,

            self.baseline_nose_x + zone_width,

            self.baseline_nose_y + zone_height
        )