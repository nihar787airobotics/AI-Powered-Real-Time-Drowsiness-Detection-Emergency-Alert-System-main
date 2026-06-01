"""
VigilDrive AI - Advanced Eye Detection Module

Features:
- Eye Aspect Ratio (EAR)
- Blink detection
- Drowsiness detection
- Adaptive thresholds
- Eye landmark rendering
- Stable realtime performance
"""

import cv2
import numpy as np
import mediapipe as mp
from collections import deque


# ─────────────────────────────────────────────────────────────
# Eye Landmark Indices
# ─────────────────────────────────────────────────────────────

LEFT_EYE = [362, 385, 387, 263, 373, 380]

RIGHT_EYE = [33, 160, 158, 133, 153, 144]


# ─────────────────────────────────────────────────────────────
# Thresholds
# ─────────────────────────────────────────────────────────────

EAR_THRESHOLD = 0.20

BLINK_FRAMES = 2

DROWSY_FRAMES = 15


class EyeDetector:

    def __init__(self, smoothing_window=5):

        # MediaPipe
        self.mp_face_mesh = mp.solutions.face_mesh

        self.face_mesh = self.mp_face_mesh.FaceMesh(

            max_num_faces=1,

            refine_landmarks=True,

            min_detection_confidence=0.6,

            min_tracking_confidence=0.6
        )

        # EAR smoothing
        self.ear_buffer = deque(maxlen=smoothing_window)

        # Counters
        self.closed_frame_count = 0

        self.total_blinks = 0

        # States
        self.eyes_closed = False

        self.drowsy = False

        # Adaptive threshold
        self.dynamic_ear_threshold = EAR_THRESHOLD

        # Eye landmark points
        self.left_eye_points = []

        self.right_eye_points = []

    # ─────────────────────────────────────────────────────────
    # Set Adaptive Threshold
    # ─────────────────────────────────────────────────────────

    def set_threshold(self, threshold):

        self.dynamic_ear_threshold = threshold

    # ─────────────────────────────────────────────────────────
    # Main Processing
    # ─────────────────────────────────────────────────────────

    def process(self, rgb_frame):

        results = self.face_mesh.process(rgb_frame)

        # No face detected
        if not results.multi_face_landmarks:

            return self.empty_result()

        landmarks = results.multi_face_landmarks[0].landmark

        height, width = rgb_frame.shape[:2]

        # Extract eye points
        left_eye = self.landmarks_to_pixels(

            landmarks,

            LEFT_EYE,

            width,

            height
        )

        right_eye = self.landmarks_to_pixels(

            landmarks,

            RIGHT_EYE,

            width,

            height
        )

        # Store for drawing
        self.left_eye_points = left_eye

        self.right_eye_points = right_eye

        # Calculate EAR
        left_ear = self.calculate_ear(left_eye)

        right_ear = self.calculate_ear(right_eye)

        raw_ear = (left_ear + right_ear) / 2

        # Smooth EAR
        self.ear_buffer.append(raw_ear)

        smooth_ear = float(

            np.mean(self.ear_buffer)
        )

        # ─────────────────────────────────────────────────────
        # Eye Logic
        # ─────────────────────────────────────────────────────

        if smooth_ear < self.dynamic_ear_threshold:

            self.closed_frame_count += 1

            # Blink
            if self.closed_frame_count == BLINK_FRAMES:

                self.total_blinks += 1

            # Drowsiness
            if self.closed_frame_count >= DROWSY_FRAMES:

                self.eyes_closed = True

                self.drowsy = True

            else:

                self.eyes_closed = False

                self.drowsy = False

        else:

            self.closed_frame_count = 0

            self.eyes_closed = False

            self.drowsy = False

        return {

            "ear": round(smooth_ear, 3),

            "eyes_closed": self.eyes_closed,

            "drowsy": self.drowsy,

            "closed_frames": self.closed_frame_count,

            "blinks": self.total_blinks,

            "left_eye_points": left_eye,

            "right_eye_points": right_eye,

            "face_detected": True
        }

    # ─────────────────────────────────────────────────────────
    # Draw Eye Landmarks
    # ─────────────────────────────────────────────────────────

    def draw_eye_landmarks(self, frame):

        # Left eye
        for point in self.left_eye_points:

            cv2.circle(

                frame,

                point,

                2,

                (0, 255, 0),

                -1
            )

        # Right eye
        for point in self.right_eye_points:

            cv2.circle(

                frame,

                point,

                2,

                (0, 255, 0),

                -1
            )

    # ─────────────────────────────────────────────────────────
    # Convert Landmarks → Pixels
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def landmarks_to_pixels(

        landmarks,

        indices,

        width,

        height

    ):

        points = []

        for index in indices:

            landmark = landmarks[index]

            x = int(landmark.x * width)

            y = int(landmark.y * height)

            points.append((x, y))

        return points

    # ─────────────────────────────────────────────────────────
    # EAR Calculation
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def calculate_ear(points):

        if len(points) < 6:

            return 0.3

        p1, p2, p3, p4, p5, p6 = [

            np.array(point)

            for point in points
        ]

        # Vertical distances
        vertical_1 = np.linalg.norm(p2 - p6)

        vertical_2 = np.linalg.norm(p3 - p5)

        # Horizontal distance
        horizontal = np.linalg.norm(p1 - p4)

        if horizontal < 1e-6:

            return 0.3

        ear = (

            vertical_1 +

            vertical_2

        ) / (2.0 * horizontal)

        return float(ear)

    # ─────────────────────────────────────────────────────────
    # Empty Result
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def empty_result():

        return {

            "ear": 0.3,

            "eyes_closed": False,

            "drowsy": False,

            "closed_frames": 0,

            "blinks": 0,

            "left_eye_points": [],

            "right_eye_points": [],

            "face_detected": False
        }