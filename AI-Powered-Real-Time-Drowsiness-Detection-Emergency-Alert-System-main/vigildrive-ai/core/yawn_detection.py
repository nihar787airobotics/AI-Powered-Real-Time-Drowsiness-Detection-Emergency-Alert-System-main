"""
VigilDrive AI - Advanced Yawning Detection Module

Features:
- Real Mouth Aspect Ratio (MAR)
- Adaptive personalized thresholds
- Yawning detection
- Yawn counting
- Temporal smoothing
- False positive reduction
"""

import cv2
import numpy as np
import mediapipe as mp
from collections import deque


# ─────────────────────────────────────────────────────────────
# Mouth Landmarks
# ─────────────────────────────────────────────────────────────

UPPER_LIP = [13, 312, 311]

LOWER_LIP = [14, 317, 318]

LEFT_MOUTH = 78

RIGHT_MOUTH = 308


# ─────────────────────────────────────────────────────────────
# Default Thresholds
# ─────────────────────────────────────────────────────────────

MAR_THRESHOLD = 0.65

YAWN_FRAMES = 15


class YawnDetector:

    def __init__(self, smoothing_window=5):

        # MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh

        self.face_mesh = self.mp_face_mesh.FaceMesh(

            max_num_faces=1,

            refine_landmarks=True,

            min_detection_confidence=0.6,

            min_tracking_confidence=0.6
        )

        # MAR smoothing
        self.mar_buffer = deque(maxlen=smoothing_window)

        # Yawn tracking
        self.yawn_frame_count = 0

        self.total_yawns = 0

        self.yawning = False

        # Mouth points
        self.mouth_points = []

        # Adaptive threshold
        self.dynamic_mar_threshold = MAR_THRESHOLD

    # ─────────────────────────────────────────────────────────
    # Set Adaptive Threshold
    # ─────────────────────────────────────────────────────────

    def set_threshold(self, threshold):

        self.dynamic_mar_threshold = threshold

    # ─────────────────────────────────────────────────────────
    # Main Processing
    # ─────────────────────────────────────────────────────────

    def process(self, rgb_frame):

        results = self.face_mesh.process(rgb_frame)

        # No face detected
        if not results.multi_face_landmarks:

            self.yawning = False

            self.yawn_frame_count = 0

            return self.empty_result()

        landmarks = results.multi_face_landmarks[0].landmark

        height, width = rgb_frame.shape[:2]

        # Extract mouth points
        mouth_points = self.extract_mouth_points(

            landmarks,

            width,

            height
        )

        self.mouth_points = mouth_points

        # Calculate MAR
        mar = self.calculate_mar(mouth_points)

        # Smooth MAR
        self.mar_buffer.append(mar)

        smooth_mar = float(np.mean(self.mar_buffer))

        # ─────────────────────────────────────────────────────
        # Yawning Logic
        # ─────────────────────────────────────────────────────

        if smooth_mar > self.dynamic_mar_threshold:

            self.yawn_frame_count += 1

            # Continuous open mouth = yawn
            if self.yawn_frame_count >= YAWN_FRAMES:

                self.yawning = True

        else:

            # Count completed yawn
            if self.yawning:

                self.total_yawns += 1

            self.yawning = False

            self.yawn_frame_count = 0

        return {

            "mar": round(smooth_mar, 3),

            "yawning": self.yawning,

            "yawn_frames": self.yawn_frame_count,

            "total_yawns": self.total_yawns,

            "mouth_points": mouth_points,

            "face_detected": True
        }

    # ─────────────────────────────────────────────────────────
    # Extract Mouth Points
    # ─────────────────────────────────────────────────────────

    def extract_mouth_points(

        self,

        landmarks,

        width,

        height

    ):

        points = []

        mouth_indices = (

            UPPER_LIP +
            LOWER_LIP +
            [LEFT_MOUTH, RIGHT_MOUTH]
        )

        for index in mouth_indices:

            x = int(landmarks[index].x * width)

            y = int(landmarks[index].y * height)

            points.append((x, y))

        return points

    # ─────────────────────────────────────────────────────────
    # MAR Calculation
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def calculate_mar(points):

        if len(points) < 8:
            return 0.3

        p1 = np.array(points[0])
        p2 = np.array(points[1])
        p3 = np.array(points[2])

        p4 = np.array(points[3])
        p5 = np.array(points[4])
        p6 = np.array(points[5])

        left = np.array(points[6])
        right = np.array(points[7])

        # Vertical distances
        vertical_1 = np.linalg.norm(p1 - p4)

        vertical_2 = np.linalg.norm(p2 - p5)

        vertical_3 = np.linalg.norm(p3 - p6)

        # Horizontal distance
        horizontal = np.linalg.norm(left - right)

        if horizontal < 1e-6:
            return 0.3

        mar = (

            vertical_1 +
            vertical_2 +
            vertical_3

        ) / (2.0 * horizontal)

        return float(mar)

    # ─────────────────────────────────────────────────────────
    # Draw Mouth Landmarks
    # ─────────────────────────────────────────────────────────

    def draw_mouth_landmarks(self, frame):

        for point in self.mouth_points:

            cv2.circle(

                frame,

                point,

                2,

                (255, 0, 255),

                -1
            )

    # ─────────────────────────────────────────────────────────
    # Reset Detector
    # ─────────────────────────────────────────────────────────

    def reset(self):

        self.mar_buffer.clear()

        self.yawn_frame_count = 0

        self.total_yawns = 0

        self.yawning = False

    # ─────────────────────────────────────────────────────────
    # Empty Result
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def empty_result():

        return {

            "mar": 0.3,

            "yawning": False,

            "yawn_frames": 0,

            "total_yawns": 0,

            "mouth_points": [],

            "face_detected": False
        }