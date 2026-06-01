"""
VigilDrive AI - Advanced Fatigue Scoring System

Features:
- Multi-factor fatigue analysis
- Stable scoring
- Gradual accumulation
- Gradual recovery
- False positive reduction
- Adaptive fatigue logic
- Smooth danger escalation
"""

import numpy as np
from collections import deque


class FatigueScorer:

    def __init__(self):

        # Current fatigue score
        self.fatigue_score = 0

        # Fatigue history smoothing
        self.score_buffer = deque(maxlen=30)

        # Driver state
        self.status = "NORMAL"

        # Counters
        self.drowsy_frames = 0
        self.yawn_frames = 0
        self.distraction_frames = 0

    # ─────────────────────────────────────────────────────────
    # Main Processing
    # ─────────────────────────────────────────────────────────

    def process(

        self,

        eye_data,
        yawn_data,
        head_data

    ):

        increment = 0

        # ─────────────────────────────────────────────────────
        # Eye Drowsiness Analysis
        # ─────────────────────────────────────────────────────

        if eye_data["drowsy"]:

            self.drowsy_frames += 1

        else:

            self.drowsy_frames = max(

                0,

                self.drowsy_frames - 2
            )

        # Long eye closure = serious fatigue
        if self.drowsy_frames > 10:

            increment += 3

        elif self.drowsy_frames > 5:

            increment += 2

        # ─────────────────────────────────────────────────────
        # Yawning Analysis
        # ─────────────────────────────────────────────────────

        if yawn_data["yawning"]:

            self.yawn_frames += 1

        else:

            self.yawn_frames = max(

                0,

                self.yawn_frames - 1
            )

        # Sustained yawn
        if self.yawn_frames > 10:

            increment += 2

        # ─────────────────────────────────────────────────────
        # Distraction Analysis
        # ─────────────────────────────────────────────────────

        if head_data["distracted"]:

            self.distraction_frames += 1

        else:

            self.distraction_frames = max(

                0,

                self.distraction_frames - 3
            )

        # Only long distraction matters
        if self.distraction_frames > 20:

            increment += 1

        # ─────────────────────────────────────────────────────
        # Fatigue Accumulation
        # ─────────────────────────────────────────────────────

        self.fatigue_score += increment

        # Recovery when normal
        if increment == 0:

            self.fatigue_score -= 0.8

        # Clamp
        self.fatigue_score = np.clip(

            self.fatigue_score,

            0,

            100
        )

        # Smooth score
        self.score_buffer.append(

            self.fatigue_score
        )

        smooth_score = int(

            np.mean(self.score_buffer)
        )

        # ─────────────────────────────────────────────────────
        # Final Driver Status
        # ─────────────────────────────────────────────────────

        if smooth_score < 25:

            self.status = "NORMAL"

        elif smooth_score < 45:

            self.status = "TIRED"

        elif smooth_score < 70:

            self.status = "DROWSY"

        else:

            self.status = "DANGER"

        return {

            "fatigue_score": smooth_score,

            "status": self.status,

            "drowsy_frames": self.drowsy_frames,

            "yawn_frames": self.yawn_frames,

            "distraction_frames": self.distraction_frames
        }