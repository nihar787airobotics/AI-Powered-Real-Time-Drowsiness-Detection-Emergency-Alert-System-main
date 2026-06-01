"""
VigilDrive AI - Advanced Head Pose + Adaptive Attention Zone
"""

import cv2
import numpy as np
import mediapipe as mp
from collections import deque


# ─────────────────────────────────────────────────────────────
# 3D Facial Model Points
# ─────────────────────────────────────────────────────────────

MODEL_POINTS_3D = np.array([

    (0.0, 0.0, 0.0),
    (0.0, -330.0, -65.0),
    (-225.0, 170.0, -135.0),
    (225.0, 170.0, -135.0),
    (-150.0, -150.0, -125.0),
    (150.0, -150.0, -125.0)

], dtype=np.float64)


# MediaPipe facial landmarks
FACE_LANDMARK_IDS = [

    1,
    152,
    33,
    263,
    61,
    291
]


# ─────────────────────────────────────────────────────────────
# Thresholds
# ─────────────────────────────────────────────────────────────

TILT_THRESHOLD = 40

YAW_THRESHOLD = 25

DISTRACTION_FRAMES = 45


class HeadPoseEstimator:

    def __init__(self, smoothing_window=15):

        # MediaPipe
        self.mp_face_mesh = mp.solutions.face_mesh

        self.face_mesh = self.mp_face_mesh.FaceMesh(

            max_num_faces=1,

            refine_landmarks=True,

            min_detection_confidence=0.6,

            min_tracking_confidence=0.6
        )

        # Smoothing buffers
        self.pitch_buffer = deque(maxlen=smoothing_window)

        self.yaw_buffer = deque(maxlen=smoothing_window)

        self.roll_buffer = deque(maxlen=smoothing_window)

        # Distraction tracking
        self.distracted_frame_count = 0

        self.distracted = False

        # Camera calibration
        self.camera_matrix = None

        self.dist_coeffs = np.zeros((4, 1))

        self.last_frame_size = (0, 0)

    # ─────────────────────────────────────────────────────────
    # Main Processing
    # ─────────────────────────────────────────────────────────

    def process(

        self,

        rgb_frame,

        bgr_frame,

        attention_zone=None
    ):

        results = self.face_mesh.process(

            rgb_frame
        )

        # No face detected
        if not results.multi_face_landmarks:

            self.distracted = False

            self.distracted_frame_count = 0

            return self.empty_result()

        landmarks = results.multi_face_landmarks[0].landmark

        height, width = rgb_frame.shape[:2]

        # ─────────────────────────────────────────────────────
        # Camera Matrix
        # ─────────────────────────────────────────────────────

        if (height, width) != self.last_frame_size:

            self.camera_matrix = self.build_camera_matrix(

                width,

                height
            )

            self.last_frame_size = (height, width)

        # ─────────────────────────────────────────────────────
        # Landmark Conversion
        # ─────────────────────────────────────────────────────

        image_points = np.array([

            (

                landmarks[index].x * width,

                landmarks[index].y * height

            )

            for index in FACE_LANDMARK_IDS

        ], dtype=np.float64)

        # ─────────────────────────────────────────────────────
        # SolvePnP Head Pose
        # ─────────────────────────────────────────────────────

        success, rotation_vector, translation_vector = cv2.solvePnP(

            MODEL_POINTS_3D,

            image_points,

            self.camera_matrix,

            self.dist_coeffs,

            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:

            return self.empty_result()

        # Rotation matrix
        rotation_matrix, _ = cv2.Rodrigues(

            rotation_vector
        )

        # Euler angles
        pitch, yaw, roll = self.rotation_matrix_to_euler(

            rotation_matrix
        )

        # ─────────────────────────────────────────────────────
        # Smoothing
        # ─────────────────────────────────────────────────────

        self.pitch_buffer.append(pitch)

        self.yaw_buffer.append(yaw)

        self.roll_buffer.append(roll)

        smooth_pitch = float(

            np.mean(self.pitch_buffer)
        )

        smooth_yaw = float(

            np.mean(self.yaw_buffer)
        )

        smooth_roll = float(

            np.mean(self.roll_buffer)
        )

        tilt_angle = abs(smooth_pitch)

        # ─────────────────────────────────────────────────────
        # Nose Tracking
        # ─────────────────────────────────────────────────────

        nose_2d = (

            int(landmarks[1].x * width),

            int(landmarks[1].y * height)
        )

        # Nose direction projection
        nose_projection, _ = cv2.projectPoints(

            np.array([[0.0, 0.0, 1000.0]]),

            rotation_vector,

            translation_vector,

            self.camera_matrix,

            self.dist_coeffs
        )

        nose_3d = (

            int(nose_projection[0][0][0]),

            int(nose_projection[0][0][1])
        )

        # ─────────────────────────────────────────────────────
        # Adaptive Attention Zone
        # ─────────────────────────────────────────────────────

        if attention_zone is not None:

            (

                left_bound,

                top_bound,

                right_bound,

                bottom_bound

            ) = attention_zone

        else:

            # Fallback default zone

            center_x = width // 2

            center_y = height // 2

            zone_w = 140

            zone_h = 120

            left_bound = center_x - zone_w

            right_bound = center_x + zone_w

            top_bound = center_y - zone_h

            bottom_bound = center_y + zone_h

        nose_x, nose_y = nose_2d

        # Dynamic boundary check
        outside_zone = (

            nose_x < left_bound

            or

            nose_x > right_bound

            or

            nose_y < top_bound

            or

            nose_y > bottom_bound
        )

        # ─────────────────────────────────────────────────────
        # Distraction Logic
        # ─────────────────────────────────────────────────────

        distracted_now = (

            abs(smooth_yaw) > YAW_THRESHOLD

            or

            smooth_pitch > TILT_THRESHOLD

            or

            outside_zone
        )

        # Temporal smoothing
        if distracted_now:

            self.distracted_frame_count += 1

        else:

            self.distracted_frame_count = max(

                0,

                self.distracted_frame_count - 2
            )

        # Final distraction state
        self.distracted = (

            self.distracted_frame_count >= DISTRACTION_FRAMES
        )

        # ─────────────────────────────────────────────────────
        # Final Output
        # ─────────────────────────────────────────────────────

        return {

            "pitch": round(smooth_pitch, 2),

            "yaw": round(smooth_yaw, 2),

            "roll": round(smooth_roll, 2),

            "tilt_angle": round(tilt_angle, 2),

            "distracted": self.distracted,

            "distraction_frames":

                self.distracted_frame_count,

            "face_detected": True,

            "nose_2d": nose_2d,

            "nose_3d": nose_3d,

            "attention_box": (

                left_bound,

                top_bound,

                right_bound,

                bottom_bound
            )
        }

    # ─────────────────────────────────────────────────────────
    # Camera Matrix
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def build_camera_matrix(width, height):

        focal_length = width

        center_x = width / 2

        center_y = height / 2

        return np.array([

            [focal_length, 0, center_x],

            [0, focal_length, center_y],

            [0, 0, 1]

        ], dtype=np.float64)

    # ─────────────────────────────────────────────────────────
    # Euler Angles
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def rotation_matrix_to_euler(rotation_matrix):

        sy = np.sqrt(

            rotation_matrix[0, 0] ** 2 +

            rotation_matrix[1, 0] ** 2
        )

        singular = sy < 1e-6

        if not singular:

            x = np.arctan2(

                rotation_matrix[2, 1],

                rotation_matrix[2, 2]
            )

            y = np.arctan2(

                -rotation_matrix[2, 0],

                sy
            )

            z = np.arctan2(

                rotation_matrix[1, 0],

                rotation_matrix[0, 0]
            )

        else:

            x = np.arctan2(

                -rotation_matrix[1, 2],

                rotation_matrix[1, 1]
            )

            y = np.arctan2(

                -rotation_matrix[2, 0],

                sy
            )

            z = 0

        pitch = np.degrees(x)

        yaw = np.degrees(y)

        roll = np.degrees(z)

        # Natural orientation correction
        pitch *= -1

        # Realistic limits
        pitch = np.clip(pitch, -35, 35)

        yaw = np.clip(yaw, -45, 45)

        roll = np.clip(roll, -25, 25)

        return (

            float(pitch),

            float(yaw),

            float(roll)
        )

    # ─────────────────────────────────────────────────────────
    # Empty Result
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def empty_result():

        return {

            "pitch": 0.0,

            "yaw": 0.0,

            "roll": 0.0,

            "tilt_angle": 0.0,

            "distracted": False,

            "distraction_frames": 0,

            "face_detected": False,

            "nose_2d": (0, 0),

            "nose_3d": (0, 0),

            "attention_box": (0, 0, 0, 0)
        }