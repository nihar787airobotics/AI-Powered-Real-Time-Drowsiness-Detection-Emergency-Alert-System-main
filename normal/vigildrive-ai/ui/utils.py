"""
VigilDrive AI - Advanced Utilities
Professional OpenCV overlay rendering system
"""

import cv2
import time
import numpy as np
from collections import deque


# ─────────────────────────────────────────────────────────────
# Color Palette
# ─────────────────────────────────────────────────────────────

COLOR_NORMAL = (0, 220, 0)

COLOR_TIRED = (0, 165, 255)

COLOR_DANGEROUS = (0, 0, 220)

COLOR_WHITE = (255, 255, 255)

COLOR_BLACK = (0, 0, 0)

COLOR_CYAN = (255, 220, 0)

COLOR_GRAY = (160, 160, 160)

COLOR_ZONE = (255, 255, 0)


# ─────────────────────────────────────────────────────────────
# FPS Counter
# ─────────────────────────────────────────────────────────────

class FPSCounter:

    def __init__(self, window=30):

        self.times = deque(maxlen=window)

    def update(self):

        self.times.append(time.time())

        if len(self.times) < 2:

            return 0.0

        elapsed = self.times[-1] - self.times[0]

        if elapsed <= 0:

            return 0.0

        return (

            len(self.times) - 1

        ) / elapsed


# ─────────────────────────────────────────────────────────────
# Main Overlay
# ─────────────────────────────────────────────────────────────

def draw_overlay(

    frame,

    eye_data,

    yawn_data,

    head_data
):

    _draw_attention_zone(

        frame,

        head_data
    )

    _draw_eye_contours(

        frame,

        eye_data
    )

    _draw_mouth_contour(

        frame,

        yawn_data
    )

    _draw_head_axis(

        frame,

        head_data
    )


# ─────────────────────────────────────────────────────────────
# Main Status Panel
# ─────────────────────────────────────────────────────────────

def draw_status_panel(

    frame,

    fps,

    fatigue_score,

    driver_state,

    sleep_prob,

    eye_data,

    yawn_data,

    head_data
):

    h, w = frame.shape[:2]

    panel_width = 240

    # Transparent side panel
    overlay = frame.copy()

    cv2.rectangle(

        overlay,

        (0, 0),

        (panel_width, h),

        (15, 15, 15),

        -1
    )

    cv2.addWeighted(

        overlay,

        0.65,

        frame,

        0.35,

        0,

        frame
    )

    # State color
    state_color = {

        "NORMAL": COLOR_NORMAL,

        "TIRED": COLOR_TIRED,

        "DROWSY": COLOR_TIRED,

        "DANGER": COLOR_DANGEROUS

    }.get(driver_state, COLOR_WHITE)

    # Header
    cv2.putText(

        frame,

        "VigilDrive AI",

        (10, 30),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.75,

        COLOR_CYAN,

        2
    )

    cv2.line(

        frame,

        (10, 40),

        (panel_width - 10, 40),

        COLOR_GRAY,

        1
    )

    # Driver state
    cv2.rectangle(

        frame,

        (10, 50),

        (panel_width - 10, 85),

        state_color,

        -1
    )

    cv2.putText(

        frame,

        driver_state,

        (18, 75),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.9,

        COLOR_BLACK,

        2
    )

    # Fatigue bar
    _draw_bar(

        frame,

        "FATIGUE",

        fatigue_score,

        100,

        105,

        state_color,

        panel_width
    )

    # Sleep probability
    sleep_color = (

        COLOR_DANGEROUS

        if sleep_prob > 60

        else COLOR_TIRED

        if sleep_prob > 30

        else COLOR_NORMAL
    )

    _draw_bar(

        frame,

        "SLEEP PROB",

        sleep_prob,

        100,

        150,

        sleep_color,

        panel_width
    )

    # Metrics
    _draw_metric(

        frame,

        "EAR",

        f"{eye_data.get('ear', 0):.3f}",

        205,

        COLOR_NORMAL
    )

    _draw_metric(

        frame,

        "MAR",

        f"{yawn_data.get('mar', 0):.3f}",

        235,

        COLOR_NORMAL
    )

    _draw_metric(

        frame,

        "PITCH",

        f"{head_data.get('pitch', 0):+.1f}",

        265,

        COLOR_WHITE
    )

    _draw_metric(

        frame,

        "YAW",

        f"{head_data.get('yaw', 0):+.1f}",

        295,

        COLOR_WHITE
    )

    _draw_metric(

        frame,

        "BLINKS",

        str(eye_data.get("blinks", 0)),

        325,

        COLOR_WHITE
    )

    _draw_metric(

        frame,

        "YAWNS",

        str(yawn_data.get("total_yawns", 0)),

        355,

        COLOR_WHITE
    )

    # Distraction
    distracted = head_data.get("distracted", False)

    distraction_color = (

        COLOR_DANGEROUS

        if distracted

        else COLOR_NORMAL
    )

    _draw_metric(

        frame,

        "DISTRACTED",

        "YES" if distracted else "NO",

        385,

        distraction_color
    )

    # FPS
    cv2.putText(

        frame,

        f"FPS: {fps:.1f}",

        (10, h - 15),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.5,

        COLOR_GRAY,

        1
    )

    # Danger banner
    if driver_state == "DANGER":

        _draw_alarm_banner(

            frame,

            w
        )


# ─────────────────────────────────────────────────────────────
# Bar Drawing
# ─────────────────────────────────────────────────────────────

def _draw_bar(

    frame,

    label,

    value,

    max_value,

    y,

    color,

    panel_width
):

    bar_x = 10

    bar_y = y + 18

    bar_w = panel_width - 20

    bar_h = 14

    cv2.putText(

        frame,

        f"{label}: {int(value)}%",

        (10, y),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.45,

        COLOR_GRAY,

        1
    )

    # Background
    cv2.rectangle(

        frame,

        (bar_x, bar_y),

        (bar_x + bar_w, bar_y + bar_h),

        (50, 50, 50),

        -1
    )

    # Fill
    fill_width = int(

        (value / max_value) * bar_w
    )

    cv2.rectangle(

        frame,

        (bar_x, bar_y),

        (bar_x + fill_width, bar_y + bar_h),

        color,

        -1
    )

    # Border
    cv2.rectangle(

        frame,

        (bar_x, bar_y),

        (bar_x + bar_w, bar_y + bar_h),

        COLOR_GRAY,

        1
    )


# ─────────────────────────────────────────────────────────────
# Metric Drawing
# ─────────────────────────────────────────────────────────────

def _draw_metric(

    frame,

    label,

    value,

    y,

    color
):

    cv2.putText(

        frame,

        f"{label}:",

        (10, y),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.48,

        COLOR_GRAY,

        1
    )

    cv2.putText(

        frame,

        str(value),

        (130, y),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.48,

        color,

        1
    )


# ─────────────────────────────────────────────────────────────
# Attention Zone
# ─────────────────────────────────────────────────────────────

def _draw_attention_zone(frame, head_data):

    if "attention_box" not in head_data:

        return

    left_b, top_b, right_b, bottom_b = head_data["attention_box"]

    distracted = head_data.get("distracted", False)

    color = (

        COLOR_DANGEROUS

        if distracted

        else COLOR_ZONE
    )

    cv2.rectangle(

        frame,

        (left_b, top_b),

        (right_b, bottom_b),

        color,

        2
    )

    cv2.putText(

        frame,

        "SAFE ZONE",

        (left_b, top_b - 10),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.5,

        color,

        1
    )


# ─────────────────────────────────────────────────────────────
# Eye Rendering
# ─────────────────────────────────────────────────────────────

def _draw_eye_contours(frame, eye_data):

    color = (

        COLOR_DANGEROUS

        if eye_data.get("eyes_closed")

        else COLOR_NORMAL
    )

    # Left eye
    left_pts = eye_data.get(

        "left_eye_points",

        []
    )

    if len(left_pts) >= 2:

        pts_np = np.array(

            left_pts,

            dtype=np.int32
        )

        cv2.polylines(

            frame,

            [pts_np],

            True,

            color,

            1
        )

        for point in left_pts:

            cv2.circle(

                frame,

                point,

                2,

                color,

                -1
            )

    # Right eye
    right_pts = eye_data.get(

        "right_eye_points",

        []
    )

    if len(right_pts) >= 2:

        pts_np = np.array(

            right_pts,

            dtype=np.int32
        )

        cv2.polylines(

            frame,

            [pts_np],

            True,

            color,

            1
        )

        for point in right_pts:

            cv2.circle(

                frame,

                point,

                2,

                color,

                -1
            )


# ─────────────────────────────────────────────────────────────
# Mouth Rendering
# ─────────────────────────────────────────────────────────────

def _draw_mouth_contour(frame, yawn_data):

    mouth_pts = yawn_data.get(

        "mouth_points",

        []
    )

    if len(mouth_pts) >= 2:

        color = (

            COLOR_TIRED

            if yawn_data.get("yawning")

            else COLOR_NORMAL
        )

        pts_np = np.array(

            mouth_pts,

            dtype=np.int32
        )

        cv2.polylines(

            frame,

            [pts_np],

            True,

            color,

            1
        )


# ─────────────────────────────────────────────────────────────
# Head Axis
# ─────────────────────────────────────────────────────────────

def _draw_head_axis(frame, head_data):

    if not head_data.get("face_detected"):

        return

    nose_2d = head_data.get("nose_2d", (0, 0))

    nose_3d = head_data.get("nose_3d", (0, 0))

    color = (

        COLOR_DANGEROUS

        if head_data.get("distracted")

        else COLOR_CYAN
    )

    cv2.arrowedLine(

        frame,

        nose_2d,

        nose_3d,

        color,

        3,

        tipLength=0.3
    )


# ─────────────────────────────────────────────────────────────
# Danger Banner
# ─────────────────────────────────────────────────────────────

def _draw_alarm_banner(frame, width):

    cv2.rectangle(

        frame,

        (0, 0),

        (width, 40),

        COLOR_DANGEROUS,

        -1
    )

    cv2.putText(

        frame,

        "DANGEROUS FATIGUE DETECTED",

        (width // 2 - 220, 27),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.8,

        COLOR_WHITE,

        2
    )