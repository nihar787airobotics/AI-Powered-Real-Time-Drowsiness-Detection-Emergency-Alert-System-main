"""
VigilDrive AI - Stable Professional Gaze Tracking
"""

import mediapipe as mp
import numpy as np
from collections import deque


# ─────────────────────────────────────────────────────────────
# Iris Landmarks
# ─────────────────────────────────────────────────────────────

LEFT_IRIS = [474, 475, 476, 477]

RIGHT_IRIS = [469, 470, 471, 472]

# Eye corners
LEFT_EYE_OUTER = 33
LEFT_EYE_INNER = 133

RIGHT_EYE_INNER = 362
RIGHT_EYE_OUTER = 263


class GazeTracker:

    def __init__(self, smoothing_window=15):

        # MediaPipe
        self.mp_face_mesh = mp.solutions.face_mesh

        self.face_mesh = self.mp_face_mesh.FaceMesh(

            refine_landmarks=True,

            max_num_faces=1,

            min_detection_confidence=0.5,

            min_tracking_confidence=0.5
        )

        # Smoothing buffer
        self.gaze_buffer = deque(maxlen=smoothing_window)

        # Final state
        self.gaze_direction = "CENTER"

        self.gaze_ratio = 0.5

    # ─────────────────────────────────────────────────────────
    # Main Processing
    # ─────────────────────────────────────────────────────────

    def process(self, rgb_frame):

        results = self.face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:

            return self.empty_result()

        face_landmarks = results.multi_face_landmarks[0]

        h, w = rgb_frame.shape[:2]

        # ─────────────────────────────────────────────────────
        # LEFT IRIS
        # ─────────────────────────────────────────────────────

        left_iris_points = []

        for idx in LEFT_IRIS:

            landmark = face_landmarks.landmark[idx]

            x = int(landmark.x * w)

            y = int(landmark.y * h)

            left_iris_points.append((x, y))

        left_iris_center = np.mean(

            left_iris_points,

            axis=0
        ).astype(int)

        # ─────────────────────────────────────────────────────
        # RIGHT IRIS
        # ─────────────────────────────────────────────────────

        right_iris_points = []

        for idx in RIGHT_IRIS:

            landmark = face_landmarks.landmark[idx]

            x = int(landmark.x * w)

            y = int(landmark.y * h)

            right_iris_points.append((x, y))

        right_iris_center = np.mean(

            right_iris_points,

            axis=0
        ).astype(int)

        # ─────────────────────────────────────────────────────
        # LEFT EYE NORMALIZATION
        # ─────────────────────────────────────────────────────

        left_outer = face_landmarks.landmark[LEFT_EYE_OUTER]

        left_inner = face_landmarks.landmark[LEFT_EYE_INNER]

        lx_outer = int(left_outer.x * w)

        lx_inner = int(left_inner.x * w)

        left_ratio = (

            left_iris_center[0] - lx_outer

        ) / max(

            1,

            abs(lx_inner - lx_outer)
        )

        # ─────────────────────────────────────────────────────
        # RIGHT EYE NORMALIZATION
        # ─────────────────────────────────────────────────────

        right_inner = face_landmarks.landmark[RIGHT_EYE_INNER]

        right_outer = face_landmarks.landmark[RIGHT_EYE_OUTER]

        rx_outer = int(right_outer.x * w)

        rx_inner = int(right_inner.x * w)

        right_ratio = (

            right_iris_center[0] - rx_outer

        ) / max(

            1,

            abs(rx_inner - rx_outer)
        )

        # ─────────────────────────────────────────────────────
        # COMBINED GAZE RATIO
        # ─────────────────────────────────────────────────────

        gaze_ratio = (

            left_ratio + right_ratio

        ) / 2

        # Clamp
        gaze_ratio = np.clip(

            gaze_ratio,

            0.0,

            1.0
        )

        # ─────────────────────────────────────────────────────
        # DEAD-ZONE STABILIZATION
        # Ignore tiny eye jitter
        # ─────────────────────────────────────────────────────

        if abs(gaze_ratio - 0.5) < 0.08:

            gaze_ratio = 0.5

        # ─────────────────────────────────────────────────────
        # Smooth Ratio
        # ─────────────────────────────────────────────────────

        self.gaze_buffer.append(gaze_ratio)

        smooth_ratio = float(

            np.mean(self.gaze_buffer)
        )

        self.gaze_ratio = smooth_ratio

        # ─────────────────────────────────────────────────────
        # FINAL CLASSIFICATION
        # ─────────────────────────────────────────────────────

        # Large stable center zone
        if 0.00 <= smooth_ratio <= 0.00:

            self.gaze_direction = "CENTER"

        elif smooth_ratio < 0.1:

            self.gaze_direction = "RIGHT"

        else:

            self.gaze_direction = "LEFT"

        # ─────────────────────────────────────────────────────
        # Final Output
        # ─────────────────────────────────────────────────────

        return {

            "gaze_ratio":

                round(smooth_ratio, 3),

            "gaze_direction":

                self.gaze_direction,

            "left_iris_center":

                tuple(left_iris_center),

            "right_iris_center":

                tuple(right_iris_center),

            "left_iris_points":

                left_iris_points,

            "right_iris_points":

                right_iris_points,

            "face_detected": True
        }

    # ─────────────────────────────────────────────────────────
    # Empty Result
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def empty_result():

        return {

            "gaze_ratio": 0.5,

            "gaze_direction": "CENTER",

            "left_iris_center": (0, 0),

            "right_iris_center": (0, 0),

            "left_iris_points": [],

            "right_iris_points": [],

            "face_detected": False
        }