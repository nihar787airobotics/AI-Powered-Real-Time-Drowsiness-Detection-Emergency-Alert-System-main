"""
VigilDrive AI - Attention Monitoring System

Combines:
- Gaze tracking
- Head pose
- Time-based distraction analysis
"""

import time
from collections import deque


class AttentionMonitor:

    def __init__(self):

        # Final attention state
        self.attention_state = "ATTENTIVE"

        # Distraction timer
        self.distraction_start = None

        # Attention score
        self.attention_score = 100

        # Buffer for smoothing
        self.state_buffer = deque(maxlen=15)

        # Timing thresholds
        self.warning_time = 2.0

        self.critical_time = 4.0

    # ─────────────────────────────────────────────────────────
    # Main Processing
    # ─────────────────────────────────────────────────────────

    def process(

        self,

        gaze_data,

        head_data

    ):

        # ─────────────────────────────────────────────────────
        # Detect attention loss
        # ─────────────────────────────────────────────────────

        distracted = False

        # Eye gaze distraction
        if gaze_data["gaze_direction"] != "CENTER":

            distracted = True

        # Head pose distraction
        if abs(head_data["yaw"]) > 25:

            distracted = True

        # ─────────────────────────────────────────────────────
        # Timing Logic
        # ─────────────────────────────────────────────────────

        current_time = time.time()

        if distracted:

            # Start timer
            if self.distraction_start is None:

                self.distraction_start = current_time

            distraction_duration = (

                current_time -

                self.distraction_start
            )

        else:

            self.distraction_start = None

            distraction_duration = 0

        # ─────────────────────────────────────────────────────
        # State Machine
        # ─────────────────────────────────────────────────────

        if distraction_duration >= self.critical_time:

            current_state = "CRITICAL_DISTRACTION"

            self.attention_score = 20

        elif distraction_duration >= self.warning_time:

            current_state = "DISTRACTED"

            self.attention_score = 50

        else:

            current_state = "ATTENTIVE"

            self.attention_score = 100

        # ─────────────────────────────────────────────────────
        # Smooth States
        # ─────────────────────────────────────────────────────

        self.state_buffer.append(current_state)

        attentive_count = self.state_buffer.count(

            "ATTENTIVE"
        )

        distracted_count = self.state_buffer.count(

            "DISTRACTED"
        )

        critical_count = self.state_buffer.count(

            "CRITICAL_DISTRACTION"
        )

        # Final stable state
        if critical_count > 5:

            self.attention_state = "CRITICAL_DISTRACTION"

        elif distracted_count > 5:

            self.attention_state = "DISTRACTED"

        else:

            self.attention_state = "ATTENTIVE"

        # ─────────────────────────────────────────────────────
        # Final Output
        # ─────────────────────────────────────────────────────

        return {

            "attention_state":

                self.attention_state,

            "attention_score":

                self.attention_score,

            "distraction_duration":

                round(distraction_duration, 2),

            "distracted":

                self.attention_state != "ATTENTIVE"
        }