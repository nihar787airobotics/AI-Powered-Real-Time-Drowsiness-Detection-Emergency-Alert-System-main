"""
VigilDrive AI - Main Entry Point
Advanced Real-Time Driver Monitoring System
"""

import cv2
import time
import threading
import os

from datetime import datetime

# ─────────────────────────────────────────────────────────────
# Core AI Modules
# ─────────────────────────────────────────────────────────────

from core.eye_detection import EyeDetector
from core.yawn_detection import YawnDetector
from core.head_pose import HeadPoseEstimator
from core.gaze_tracking import GazeTracker
from core.attention_monitor import AttentionMonitor
from core.fatigue_score import FatigueScorer
from core.calibration import DriverCalibration

# ─────────────────────────────────────────────────────────────
# Systems
# ─────────────────────────────────────────────────────────────

from alerts.alerts import AlertSystem

from analytics.logger import EventLogger
from analytics.session_analyzer import SessionAnalyzer
from analytics.database import DatabaseManager

from ui.utils import (
    FPSCounter,
    draw_overlay,
    draw_status_panel
)


def main():

    print("=" * 70)
    print("      VigilDrive AI - Driver Monitoring System")
    print("=" * 70)

    # ─────────────────────────────────────────────────────────
    # Create Directories
    # ─────────────────────────────────────────────────────────

    os.makedirs("screenshots", exist_ok=True)

    os.makedirs("logs", exist_ok=True)

    # ─────────────────────────────────────────────────────────
    # Webcam Initialization
    # ─────────────────────────────────────────────────────────

    cap = cv2.VideoCapture(0)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)

    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    cap.set(cv2.CAP_PROP_FPS, 30)

    if not cap.isOpened():

        print("[ERROR] Could not access webcam.")

        return

    print("[INFO] Webcam initialized successfully.")

    # ─────────────────────────────────────────────────────────
    # Initialize AI Modules
    # ─────────────────────────────────────────────────────────

    eye_detector = EyeDetector()

    yawn_detector = YawnDetector()

    head_estimator = HeadPoseEstimator()

    gaze_tracker = GazeTracker()

    attention_monitor = AttentionMonitor()

    fatigue_scorer = FatigueScorer()

    calibration = DriverCalibration()

    alert_system = AlertSystem()

    event_logger = EventLogger()

    session_analyzer = SessionAnalyzer()

    database = DatabaseManager()

    fps_counter = FPSCounter()

    # Start calibration
    calibration.start()

    print("[INFO] All AI modules loaded successfully.")

    print("[INFO] Starting VigilDrive AI...\n")

    # ─────────────────────────────────────────────────────────
    # Runtime Variables
    # ─────────────────────────────────────────────────────────

    last_alert_time = 0

    last_log_time = 0

    last_db_save = 0

    ALERT_COOLDOWN = 10

    LOG_COOLDOWN = 5

    DB_SAVE_INTERVAL = 10

    # ─────────────────────────────────────────────────────────
    # Main Loop
    # ─────────────────────────────────────────────────────────

    while True:

        success, frame = cap.read()

        if not success:

            print("[WARNING] Failed to capture frame.")

            continue

        # Mirror webcam
        frame = cv2.flip(frame, 1)

        # RGB conversion
        rgb_frame = cv2.cvtColor(

            frame,

            cv2.COLOR_BGR2RGB
        )

        # FPS
        fps = fps_counter.update()

        # ─────────────────────────────────────────────────────
        # Personalized Attention Zone
        # ─────────────────────────────────────────────────────

        attention_zone = None

        if calibration.calibrated:

            attention_zone = (

                calibration.get_attention_zone()
            )

        # ─────────────────────────────────────────────────────
        # AI Detection Pipeline
        # ─────────────────────────────────────────────────────

        eye_data = eye_detector.process(

            rgb_frame
        )

        yawn_data = yawn_detector.process(

            rgb_frame
        )

        head_data = head_estimator.process(

            rgb_frame,

            frame,

            attention_zone
        )

        gaze_data = gaze_tracker.process(

            rgb_frame
        )

        attention_data = attention_monitor.process(

            gaze_data,

            head_data
        )

        # ─────────────────────────────────────────────────────
        # Calibration
        # ─────────────────────────────────────────────────────

        if not calibration.calibrated:

            calibration.update(

                eye_data,

                yawn_data,

                head_data
            )

        else:

            thresholds = (

                calibration.get_thresholds()
            )

            eye_detector.set_threshold(

                thresholds["ear_threshold"]
            )

            yawn_detector.set_threshold(

                thresholds["mar_threshold"]
            )

        # ─────────────────────────────────────────────────────
        # Fatigue Analysis
        # ─────────────────────────────────────────────────────

        fatigue_data = fatigue_scorer.process(

            eye_data,

            yawn_data,

            head_data
        )

        fatigue_score = fatigue_data[
            "fatigue_score"
        ]

        driver_status = fatigue_data[
            "status"
        ]

        # ─────────────────────────────────────────────────────
        # Session Analytics
        # ─────────────────────────────────────────────────────

        session_data = session_analyzer.process(

            eye_data,

            yawn_data,

            attention_data,

            fatigue_data
        )

        # ─────────────────────────────────────────────────────
        # Database Analytics Snapshot
        # ─────────────────────────────────────────────────────

        current_time = time.time()

        if (

            current_time - last_db_save

        ) > DB_SAVE_INTERVAL:

            last_db_save = current_time

            database.save_analytics(

                session_data,

                fatigue_score
            )

        # ─────────────────────────────────────────────────────
        # Base Rendering
        # ─────────────────────────────────────────────────────

        draw_overlay(

            frame,

            eye_data,

            yawn_data,

            head_data
        )

        draw_status_panel(

            frame,

            fps=fps,

            fatigue_score=fatigue_score,

            driver_state=driver_status,

            sleep_prob=fatigue_score,

            eye_data=eye_data,

            yawn_data=yawn_data,

            head_data=head_data
        )

        # ─────────────────────────────────────────────────────
        # Attention HUD
        # ─────────────────────────────────────────────────────

        attention_state = attention_data[
            "attention_state"
        ]

        distraction_duration = attention_data[
            "distraction_duration"
        ]

        if attention_state == "ATTENTIVE":

            attention_color = (0, 255, 0)

        elif attention_state == "DISTRACTED":

            attention_color = (0, 255, 255)

        else:

            attention_color = (0, 0, 255)

        overlay = frame.copy()

        cv2.rectangle(

            overlay,

            (380, 10),

            (630, 120),

            (30, 30, 30),

            -1
        )

        cv2.addWeighted(

            overlay,

            0.55,

            frame,

            0.45,

            0,

            frame
        )

        cv2.putText(

            frame,

            f"ATTENTION: {attention_state}",

            (395, 40),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.65,

            attention_color,

            2
        )

        cv2.putText(

            frame,

            f"GAZE: {gaze_data['gaze_direction']}",

            (395, 70),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (255, 255, 255),

            2
        )

        cv2.putText(

            frame,

            f"TIME: {distraction_duration:.1f}s",

            (395, 100),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (200, 200, 200),

            2
        )

        # ─────────────────────────────────────────────────────
        # Session Analytics HUD
        # ─────────────────────────────────────────────────────

        analytics_overlay = frame.copy()

        cv2.rectangle(

            analytics_overlay,

            (10, 250),

            (320, 420),

            (25, 25, 25),

            -1
        )

        cv2.addWeighted(

            analytics_overlay,

            0.55,

            frame,

            0.45,

            0,

            frame
        )

        cv2.putText(

            frame,

            "SESSION ANALYTICS",

            (20, 280),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.7,

            (0, 255, 255),

            2
        )

        minutes = session_data[
            "session_duration"
        ] // 60

        seconds = session_data[
            "session_duration"
        ] % 60

        cv2.putText(

            frame,

            f"TIME: {minutes:02}:{seconds:02}",

            (20, 315),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (255, 255, 255),

            2
        )

        cv2.putText(

            frame,

            f"BLINKS: {session_data['total_blinks']}",

            (20, 345),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (255, 255, 255),

            2
        )

        cv2.putText(

            frame,

            f"YAWNS: {session_data['total_yawns']}",

            (20, 375),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (255, 255, 255),

            2
        )

        cv2.putText(

            frame,

            f"DISTRACTIONS: {session_data['total_distractions']}",

            (20, 405),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (255, 255, 255),

            2
        )

        # Risk
        risk = session_data["driver_risk"]

        if risk == "LOW":

            risk_color = (0, 255, 0)

        elif risk == "MEDIUM":

            risk_color = (0, 255, 255)

        else:

            risk_color = (0, 0, 255)

        cv2.putText(

            frame,

            f"RISK: {risk}",

            (180, 345),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.7,

            risk_color,

            2
        )

        cv2.putText(

            frame,

            f"ATTN: {session_data['average_attention']:.0f}%",

            (180, 380),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (255, 255, 255),

            2
        )

        cv2.putText(

            frame,

            f"FATIGUE: {session_data['average_fatigue']:.0f}",

            (180, 410),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            (255, 255, 255),

            2
        )

        # ─────────────────────────────────────────────────────
        # Calibration UI
        # ─────────────────────────────────────────────────────

        if not calibration.calibrated:

            remaining = (

                calibration.remaining_time()
            )

            cv2.putText(

                frame,

                f"CALIBRATING... LOOK FORWARD ({remaining}s)",

                (20, 440),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.7,

                (0, 255, 255),

                2
            )

        else:

            cv2.putText(

                frame,

                "PERSONALIZED AI ACTIVE",

                (20, 440),

                cv2.FONT_HERSHEY_SIMPLEX,

                0.7,

                (0, 255, 0),

                2
            )

        # ─────────────────────────────────────────────────────
        # Event Logging
        # ─────────────────────────────────────────────────────

        important_event = (

            fatigue_score > 40

            or

            head_data["distracted"]

            or

            attention_data["distracted"]

            or

            yawn_data["yawning"]

            or

            eye_data["drowsy"]
        )

        if important_event:

            if (

                current_time - last_log_time

            ) > LOG_COOLDOWN:

                last_log_time = current_time

                event_logger.log(

                    fatigue_score,

                    driver_status,

                    eye_data,

                    yawn_data,

                    head_data
                )

        # ─────────────────────────────────────────────────────
        # Alert System
        # ─────────────────────────────────────────────────────

        if (

            driver_status == "DANGER"

            or

            attention_state == "CRITICAL_DISTRACTION"
        ):

            if (

                current_time - last_alert_time

            ) > ALERT_COOLDOWN:

                last_alert_time = current_time

                timestamp = datetime.now().strftime(

                    "%Y%m%d_%H%M%S"
                )

                screenshot_path = (

                    f"screenshots/danger_{timestamp}.jpg"
                )

                cv2.imwrite(

                    screenshot_path,

                    frame
                )

                database.save_event(

                    event_type="CRITICAL_ALERT",

                    fatigue_score=fatigue_score,

                    attention_state=attention_state,

                    gaze_direction=gaze_data["gaze_direction"],

                    driver_status=driver_status,

                    screenshot_path=screenshot_path
                )

                print(

                    f"[ALERT] Screenshot saved: {screenshot_path}"
                )

                alert_thread = threading.Thread(

                    target=alert_system.trigger_emergency,

                    args=(

                        frame.copy(),

                        fatigue_score,

                        fatigue_score
                    ),

                    daemon=True
                )

                alert_thread.start()

        elif (

            driver_status == "DROWSY"

            or

            attention_state == "DISTRACTED"
        ):

            alert_system.play_warning_beep()

            database.save_event(

                event_type="WARNING",

                fatigue_score=fatigue_score,

                attention_state=attention_state,

                gaze_direction=gaze_data["gaze_direction"],

                driver_status=driver_status
            )

        # ─────────────────────────────────────────────────────
        # Display Window
        # ─────────────────────────────────────────────────────

        cv2.imshow(

            "VigilDrive AI - Driver Monitoring",

            frame
        )

        # ─────────────────────────────────────────────────────
        # Keyboard Controls
        # ─────────────────────────────────────────────────────

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):

            print("\n[INFO] Closing VigilDrive AI...")

            break

        elif key == ord("s"):

            timestamp = datetime.now().strftime(

                "%Y%m%d_%H%M%S"
            )

            screenshot_path = (

                f"screenshots/manual_{timestamp}.jpg"
            )

            cv2.imwrite(

                screenshot_path,

                frame
            )

            print(

                f"[INFO] Screenshot saved: {screenshot_path}"
            )

        elif key == ord("r"):

            fatigue_scorer = FatigueScorer()

            calibration.start()

            print(

                "[INFO] Personalized calibration restarted."
            )

    # ─────────────────────────────────────────────────────────
    # Save Final Session
    # ─────────────────────────────────────────────────────────

    database.save_session(

        session_data
    )

    # ─────────────────────────────────────────────────────────
    # Cleanup
    # ─────────────────────────────────────────────────────────

    cap.release()

    cv2.destroyAllWindows()

    alert_system.cleanup()

    print(

        "[INFO] VigilDrive AI stopped successfully."
    )


# ─────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":

    main()