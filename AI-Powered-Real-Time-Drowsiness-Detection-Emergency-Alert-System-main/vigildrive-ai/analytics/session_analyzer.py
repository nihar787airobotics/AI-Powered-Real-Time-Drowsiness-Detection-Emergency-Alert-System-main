"""
VigilDrive AI - Session Analytics Engine

Tracks:
- Blinks
- Yawns
- Distractions
- Fatigue
- Attention
- Driver risk
"""

import time


class SessionAnalyzer:

    def __init__(self):

        # Session timing
        self.session_start = time.time()

        # Counters
        self.total_blinks = 0

        self.total_yawns = 0

        self.total_distractions = 0

        self.total_drowsy_events = 0

        # Internal tracking
        self.last_blink_state = False

        self.last_yawn_state = False

        self.last_distraction_state = False

        self.last_drowsy_state = False

        # Attention tracking
        self.attention_history = []

        self.fatigue_history = []

        # Risk score
        self.driver_risk = "LOW"

    # ─────────────────────────────────────────────────────────
    # Main Processing
    # ─────────────────────────────────────────────────────────

    def process(

        self,

        eye_data,

        yawn_data,

        attention_data,

        fatigue_data

    ):

        # ─────────────────────────────────────────────────────
        # Blink Counting
        # ─────────────────────────────────────────────────────

        current_blink = eye_data["drowsy"]

        if (

            current_blink

            and

            not self.last_blink_state
        ):

            self.total_blinks += 1

        self.last_blink_state = current_blink

        # ─────────────────────────────────────────────────────
        # Yawn Counting
        # ─────────────────────────────────────────────────────

        current_yawn = yawn_data["yawning"]

        if (

            current_yawn

            and

            not self.last_yawn_state
        ):

            self.total_yawns += 1

        self.last_yawn_state = current_yawn

        # ─────────────────────────────────────────────────────
        # Distraction Counting
        # ─────────────────────────────────────────────────────

        current_distraction = attention_data[

            "distracted"
        ]

        if (

            current_distraction

            and

            not self.last_distraction_state
        ):

            self.total_distractions += 1

        self.last_distraction_state = current_distraction

        # ─────────────────────────────────────────────────────
        # Drowsy Event Counting
        # ─────────────────────────────────────────────────────

        current_drowsy = (

            fatigue_data["status"]

            == "DROWSY"

            or

            fatigue_data["status"]

            == "DANGER"
        )

        if (

            current_drowsy

            and

            not self.last_drowsy_state
        ):

            self.total_drowsy_events += 1

        self.last_drowsy_state = current_drowsy

        # ─────────────────────────────────────────────────────
        # History Tracking
        # ─────────────────────────────────────────────────────

        self.attention_history.append(

            attention_data["attention_score"]
        )

        self.fatigue_history.append(

            fatigue_data["fatigue_score"]
        )

        # Limit history size
        if len(self.attention_history) > 300:

            self.attention_history.pop(0)

        if len(self.fatigue_history) > 300:

            self.fatigue_history.pop(0)

        # ─────────────────────────────────────────────────────
        # Session Duration
        # ─────────────────────────────────────────────────────

        session_duration = int(

            time.time() -

            self.session_start
        )

        # ─────────────────────────────────────────────────────
        # Average Scores
        # ─────────────────────────────────────────────────────

        avg_attention = sum(

            self.attention_history

        ) / max(

            1,

            len(self.attention_history)
        )

        avg_fatigue = sum(

            self.fatigue_history

        ) / max(

            1,

            len(self.fatigue_history)
        )

        # ─────────────────────────────────────────────────────
        # Risk Analysis
        # ─────────────────────────────────────────────────────

        risk_score = (

            self.total_yawns * 2

            +

            self.total_distractions * 3

            +

            self.total_drowsy_events * 5

            +

            int(avg_fatigue / 10)
        )

        if risk_score < 15:

            self.driver_risk = "LOW"

        elif risk_score < 30:

            self.driver_risk = "MEDIUM"

        else:

            self.driver_risk = "HIGH"

        # ─────────────────────────────────────────────────────
        # Final Output
        # ─────────────────────────────────────────────────────

        return {

            "session_duration":

                session_duration,

            "total_blinks":

                self.total_blinks,

            "total_yawns":

                self.total_yawns,

            "total_distractions":

                self.total_distractions,

            "total_drowsy_events":

                self.total_drowsy_events,

            "average_attention":

                round(avg_attention, 1),

            "average_fatigue":

                round(avg_fatigue, 1),

            "driver_risk":

                self.driver_risk
        }