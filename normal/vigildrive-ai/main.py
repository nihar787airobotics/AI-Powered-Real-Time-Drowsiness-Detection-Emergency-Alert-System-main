"""
VigilDrive AI - Main Entry Point
UPGRADED: WebSocket frame streaming to browser dashboard
Real-time driver monitoring with live video feed
"""

import cv2
import time
import threading
import asyncio
import base64
import json
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

# ─────────────────────────────────────────────────────────────
# WebSocket Client for Streaming Frames to FastAPI
# ─────────────────────────────────────────────────────────────

try:
    import websockets
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    print("[WARNING] websockets not installed. Run: pip install websockets")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print("[WARNING] requests not installed. Run: pip install requests")

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────

BACKEND_URL     = os.getenv("BACKEND_URL", "http://localhost:8000")
WS_URL          = os.getenv("WS_URL",      "ws://localhost:8000/ws/camera")
DRIVER_ID       = os.getenv("DRIVER_ID",   "driver_001")
STREAM_FPS      = 15   # frames per second sent to dashboard
JPEG_QUALITY    = 70   # JPEG compression quality (0-100)
ALERT_COOLDOWN  = 10
LOG_COOLDOWN    = 5
DB_SAVE_INTERVAL = 10

# ─────────────────────────────────────────────────────────────
# Global Shared State (thread-safe via lock)
# ─────────────────────────────────────────────────────────────

_lock = threading.Lock()

_shared_state = {
    "frame_jpg_b64":    None,   # base64 JPEG of latest annotated frame
    "fatigue_score":    0,
    "driver_status":    "NORMAL",
    "attention_state":  "ATTENTIVE",
    "gaze_direction":   "CENTER",
    "ear":              0.3,
    "mar":              0.3,
    "yaw":              0.0,
    "pitch":            0.0,
    "distracted":       False,
    "yawning":          False,
    "drowsy":           False,
    "blinks":           0,
    "total_yawns":      0,
    "session_duration": 0,
    "total_blinks":     0,
    "total_distractions": 0,
    "average_attention":  100.0,
    "average_fatigue":    0.0,
    "driver_risk":        "LOW",
    "calibrated":         False,
    "calibration_remaining": 5,
    "fps":                0.0,
    "timestamp":          "",
}


def update_state(**kwargs):
    """Thread-safe update of shared state."""
    with _lock:
        _shared_state.update(kwargs)


def get_state():
    """Thread-safe snapshot of shared state."""
    with _lock:
        return dict(_shared_state)


# ─────────────────────────────────────────────────────────────
# WebSocket Streaming Thread
# ─────────────────────────────────────────────────────────────

def ws_stream_loop():
    """
    Runs in a background thread.
    Connects to FastAPI /ws/camera and streams
    annotated JPEG frames + telemetry JSON.
    """
    if not WEBSOCKETS_AVAILABLE:
        print("[WS] websockets not available — frame streaming disabled.")
        return

    async def _run():
        retry_delay = 2
        while True:
            try:
                print(f"[WS] Connecting to {WS_URL}")
                async with websockets.connect(WS_URL, ping_interval=20) as ws:
                    print("[WS] Connected — streaming frames to dashboard")
                    retry_delay = 2
                    interval = 1.0 / STREAM_FPS

                    while True:
                        state = get_state()
                        frame_b64 = state.get("frame_jpg_b64")

                        if frame_b64:
                            payload = {
                                "type":              "frame",
                                "driver_id":         DRIVER_ID,
                                "frame":             frame_b64,
                                "fatigue_score":     state["fatigue_score"],
                                "driver_status":     state["driver_status"],
                                "attention_state":   state["attention_state"],
                                "gaze_direction":    state["gaze_direction"],
                                "ear":               state["ear"],
                                "mar":               state["mar"],
                                "yaw":               state["yaw"],
                                "pitch":             state["pitch"],
                                "distracted":        state["distracted"],
                                "yawning":           state["yawning"],
                                "drowsy":            state["drowsy"],
                                "blinks":            state["blinks"],
                                "total_yawns":       state["total_yawns"],
                                "session_duration":  state["session_duration"],
                                "total_blinks":      state["total_blinks"],
                                "total_distractions":state["total_distractions"],
                                "average_attention": state["average_attention"],
                                "average_fatigue":   state["average_fatigue"],
                                "driver_risk":       state["driver_risk"],
                                "calibrated":        state["calibrated"],
                                "fps":               state["fps"],
                                "timestamp":         state["timestamp"],
                            }
                            await ws.send(json.dumps(payload))

                        await asyncio.sleep(interval)

            except (websockets.ConnectionClosed,
                    ConnectionRefusedError,
                    OSError) as e:
                print(f"[WS] Disconnected ({e}). Retrying in {retry_delay}s…")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 30)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(_run())


# ─────────────────────────────────────────────────────────────
# Telemetry HTTP Push (alerts only)
# ─────────────────────────────────────────────────────────────

def push_telemetry_http(state: dict):
    """Push alert telemetry to FastAPI REST endpoint."""
    if not REQUESTS_AVAILABLE:
        return
    try:
        payload = {
            "driver_id":         DRIVER_ID,
            "drowsiness_score":  state["fatigue_score"] / 100.0,
            "eye_closure_duration": 0.0,
            "head_position":     {"yaw": state["yaw"], "pitch": state["pitch"]},
            "timestamp":         state["timestamp"],
            "alert_triggered":   state["driver_status"] in ("DANGER", "DROWSY"),
            "location":          {"lat": 19.076, "lng": 72.877},
            "vehicle_speed":     0.0,
        }
        requests.post(
            f"{BACKEND_URL}/api/telemetry",
            json=payload,
            timeout=2,
        )
    except Exception as e:
        print(f"[HTTP] Telemetry push failed: {e}")


# ─────────────────────────────────────────────────────────────
# Main Camera Loop
# ─────────────────────────────────────────────────────────────

def main():

    print("=" * 70)
    print("      VigilDrive AI - Driver Monitoring System")
    print("      WebSocket Frame Streaming ENABLED")
    print("=" * 70)

    # ─────────────────────────────────────────────────────────
    # Create Directories
    # ─────────────────────────────────────────────────────────

    os.makedirs("screenshots", exist_ok=True)
    os.makedirs("logs",        exist_ok=True)

    # ─────────────────────────────────────────────────────────
    # Start WebSocket Streaming Thread
    # ─────────────────────────────────────────────────────────

    ws_thread = threading.Thread(
        target=ws_stream_loop,
        daemon=True,
        name="WS-FrameStream",
    )
    ws_thread.start()

    # ─────────────────────────────────────────────────────────
    # Webcam Initialization
    # ─────────────────────────────────────────────────────────

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS,          30)

    if not cap.isOpened():
        print("[ERROR] Could not access webcam.")
        return

    print("[INFO] Webcam initialized successfully.")

    # ─────────────────────────────────────────────────────────
    # Initialize AI Modules
    # ─────────────────────────────────────────────────────────

    eye_detector    = EyeDetector()
    yawn_detector   = YawnDetector()
    head_estimator  = HeadPoseEstimator()
    gaze_tracker    = GazeTracker()
    attention_monitor = AttentionMonitor()
    fatigue_scorer  = FatigueScorer()
    calibration     = DriverCalibration()
    alert_system    = AlertSystem()
    event_logger    = EventLogger()
    session_analyzer = SessionAnalyzer()
    database        = DatabaseManager()
    fps_counter     = FPSCounter()

    calibration.start()
    print("[INFO] All AI modules loaded successfully.")
    print("[INFO] Starting VigilDrive AI…\n")

    # ─────────────────────────────────────────────────────────
    # Runtime Variables
    # ─────────────────────────────────────────────────────────

    last_alert_time  = 0
    last_log_time    = 0
    last_db_save     = 0
    last_http_push   = 0
    HTTP_PUSH_INTERVAL = 3  # push telemetry every 3 s

    # ─────────────────────────────────────────────────────────
    # Main Loop
    # ─────────────────────────────────────────────────────────

    while True:

        success, frame = cap.read()
        if not success:
            print("[WARNING] Failed to capture frame.")
            continue

        # Mirror & convert
        frame     = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        fps       = fps_counter.update()

        # ─────────────────────────────────────────────────────
        # Attention Zone
        # ─────────────────────────────────────────────────────

        attention_zone = None
        if calibration.calibrated:
            attention_zone = calibration.get_attention_zone()

        # ─────────────────────────────────────────────────────
        # AI Detection Pipeline
        # ─────────────────────────────────────────────────────

        eye_data       = eye_detector.process(rgb_frame)
        yawn_data      = yawn_detector.process(rgb_frame)
        head_data      = head_estimator.process(rgb_frame, frame, attention_zone)
        gaze_data      = gaze_tracker.process(rgb_frame)
        attention_data = attention_monitor.process(gaze_data, head_data)

        # ─────────────────────────────────────────────────────
        # Calibration
        # ─────────────────────────────────────────────────────

        if not calibration.calibrated:
            calibration.update(eye_data, yawn_data, head_data)
        else:
            thresholds = calibration.get_thresholds()
            eye_detector.set_threshold(thresholds["ear_threshold"])
            yawn_detector.set_threshold(thresholds["mar_threshold"])

        # ─────────────────────────────────────────────────────
        # Fatigue Analysis
        # ─────────────────────────────────────────────────────

        fatigue_data  = fatigue_scorer.process(eye_data, yawn_data, head_data)
        fatigue_score = fatigue_data["fatigue_score"]
        driver_status = fatigue_data["status"]

        # ─────────────────────────────────────────────────────
        # Session Analytics
        # ─────────────────────────────────────────────────────

        session_data = session_analyzer.process(
            eye_data, yawn_data, attention_data, fatigue_data
        )

        # ─────────────────────────────────────────────────────
        # Database Snapshot
        # ─────────────────────────────────────────────────────

        current_time = time.time()
        if (current_time - last_db_save) > DB_SAVE_INTERVAL:
            last_db_save = current_time
            database.save_analytics(session_data, fatigue_score)

        # ─────────────────────────────────────────────────────
        # Render Overlays onto Frame
        # ─────────────────────────────────────────────────────

        draw_overlay(frame, eye_data, yawn_data, head_data)
        draw_status_panel(
            frame,
            fps=fps,
            fatigue_score=fatigue_score,
            driver_state=driver_status,
            sleep_prob=fatigue_score,
            eye_data=eye_data,
            yawn_data=yawn_data,
            head_data=head_data,
        )

        # ─────────────────────────────────────────────────────
        # Attention HUD
        # ─────────────────────────────────────────────────────

        attention_state      = attention_data["attention_state"]
        distraction_duration = attention_data["distraction_duration"]

        attention_color = (
            (0, 255, 0)   if attention_state == "ATTENTIVE" else
            (0, 255, 255) if attention_state == "DISTRACTED" else
            (0, 0, 255)
        )

        overlay = frame.copy()
        cv2.rectangle(overlay, (380, 10), (630, 120), (30, 30, 30), -1)
        cv2.addWeighted(overlay, 0.55, frame, 0.45, 0, frame)

        cv2.putText(frame, f"ATTENTION: {attention_state}",
                    (395, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.65, attention_color, 2)
        cv2.putText(frame, f"GAZE: {gaze_data['gaze_direction']}",
                    (395, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"TIME: {distraction_duration:.1f}s",
                    (395, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)

        # ─────────────────────────────────────────────────────
        # Session Analytics HUD
        # ─────────────────────────────────────────────────────

        analytics_overlay = frame.copy()
        cv2.rectangle(analytics_overlay, (10, 250), (320, 420), (25, 25, 25), -1)
        cv2.addWeighted(analytics_overlay, 0.55, frame, 0.45, 0, frame)

        cv2.putText(frame, "SESSION ANALYTICS",
                    (20, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        minutes = session_data["session_duration"] // 60
        seconds = session_data["session_duration"] % 60
        cv2.putText(frame, f"TIME: {minutes:02}:{seconds:02}",
                    (20, 315), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"BLINKS: {session_data['total_blinks']}",
                    (20, 345), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"YAWNS: {session_data['total_yawns']}",
                    (20, 375), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"DISTRACTIONS: {session_data['total_distractions']}",
                    (20, 405), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        risk = session_data["driver_risk"]
        risk_color = (0,255,0) if risk=="LOW" else (0,255,255) if risk=="MEDIUM" else (0,0,255)
        cv2.putText(frame, f"RISK: {risk}",
                    (180, 345), cv2.FONT_HERSHEY_SIMPLEX, 0.7, risk_color, 2)
        cv2.putText(frame, f"ATTN: {session_data['average_attention']:.0f}%",
                    (180, 380), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"FATIGUE: {session_data['average_fatigue']:.0f}",
                    (180, 410), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # ─────────────────────────────────────────────────────
        # Calibration HUD
        # ─────────────────────────────────────────────────────

        if not calibration.calibrated:
            remaining = calibration.remaining_time()
            cv2.putText(frame, f"CALIBRATING... LOOK FORWARD ({remaining}s)",
                        (20, 440), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        else:
            cv2.putText(frame, "PERSONALIZED AI ACTIVE",
                        (20, 440), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        # ─────────────────────────────────────────────────────
        # Encode Frame as JPEG → base64 → shared state
        # ─────────────────────────────────────────────────────

        encode_params = [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY]
        _, buffer = cv2.imencode(".jpg", frame, encode_params)
        frame_b64 = base64.b64encode(buffer).decode("utf-8")

        timestamp_str = datetime.now().isoformat()

        update_state(
            frame_jpg_b64      = frame_b64,
            fatigue_score      = fatigue_score,
            driver_status      = driver_status,
            attention_state    = attention_state,
            gaze_direction     = gaze_data["gaze_direction"],
            ear                = eye_data["ear"],
            mar                = yawn_data["mar"],
            yaw                = head_data["yaw"],
            pitch              = head_data["pitch"],
            distracted         = head_data["distracted"],
            yawning            = yawn_data["yawning"],
            drowsy             = eye_data["drowsy"],
            blinks             = eye_data["blinks"],
            total_yawns        = yawn_data["total_yawns"],
            session_duration   = session_data["session_duration"],
            total_blinks       = session_data["total_blinks"],
            total_distractions = session_data["total_distractions"],
            average_attention  = session_data["average_attention"],
            average_fatigue    = session_data["average_fatigue"],
            driver_risk        = session_data["driver_risk"],
            calibrated         = calibration.calibrated,
            calibration_remaining = calibration.remaining_time(),
            fps                = round(fps, 1),
            timestamp          = timestamp_str,
        )

        # ─────────────────────────────────────────────────────
        # HTTP Telemetry Push (every 3 s)
        # ─────────────────────────────────────────────────────

        if (current_time - last_http_push) > HTTP_PUSH_INTERVAL:
            last_http_push = current_time
            state_snapshot = get_state()
            threading.Thread(
                target=push_telemetry_http,
                args=(state_snapshot,),
                daemon=True,
            ).start()

        # ─────────────────────────────────────────────────────
        # Event Logging
        # ─────────────────────────────────────────────────────

        important_event = (
            fatigue_score > 40
            or head_data["distracted"]
            or attention_data["distracted"]
            or yawn_data["yawning"]
            or eye_data["drowsy"]
        )

        if important_event and (current_time - last_log_time) > LOG_COOLDOWN:
            last_log_time = current_time
            event_logger.log(
                fatigue_score, driver_status,
                eye_data, yawn_data, head_data
            )

        # ─────────────────────────────────────────────────────
        # Alert System
        # ─────────────────────────────────────────────────────

        if (driver_status == "DANGER" or
                attention_state == "CRITICAL_DISTRACTION"):

            if (current_time - last_alert_time) > ALERT_COOLDOWN:
                last_alert_time = current_time
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                screenshot_path = f"screenshots/danger_{timestamp}.jpg"
                cv2.imwrite(screenshot_path, frame)

                database.save_event(
                    event_type     = "CRITICAL_ALERT",
                    fatigue_score  = fatigue_score,
                    attention_state = attention_state,
                    gaze_direction  = gaze_data["gaze_direction"],
                    driver_status   = driver_status,
                    screenshot_path = screenshot_path,
                )

                print(f"[ALERT] Screenshot saved: {screenshot_path}")

                alert_thread = threading.Thread(
                    target=alert_system.trigger_emergency,
                    args=(frame.copy(), fatigue_score, fatigue_score),
                    daemon=True,
                )
                alert_thread.start()

        elif (driver_status == "DROWSY" or
              attention_state == "DISTRACTED"):

            alert_system.play_warning_beep()
            database.save_event(
                event_type      = "WARNING",
                fatigue_score   = fatigue_score,
                attention_state = attention_state,
                gaze_direction  = gaze_data["gaze_direction"],
                driver_status   = driver_status,
            )

        # ─────────────────────────────────────────────────────
        # Display OpenCV Window
        # ─────────────────────────────────────────────────────

        cv2.imshow("VigilDrive AI - Driver Monitoring", frame)

        # ─────────────────────────────────────────────────────
        # Keyboard Controls
        # ─────────────────────────────────────────────────────

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            print("\n[INFO] Closing VigilDrive AI…")
            break

        elif key == ord("s"):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_path = f"screenshots/manual_{timestamp}.jpg"
            cv2.imwrite(screenshot_path, frame)
            print(f"[INFO] Screenshot saved: {screenshot_path}")

        elif key == ord("r"):
            fatigue_scorer = FatigueScorer()
            calibration.start()
            print("[INFO] Personalized calibration restarted.")

    # ─────────────────────────────────────────────────────────
    # Cleanup
    # ─────────────────────────────────────────────────────────

    database.save_session(session_data)
    cap.release()
    cv2.destroyAllWindows()
    alert_system.cleanup()
    print("[INFO] VigilDrive AI stopped successfully.")


if __name__ == "__main__":
    main()