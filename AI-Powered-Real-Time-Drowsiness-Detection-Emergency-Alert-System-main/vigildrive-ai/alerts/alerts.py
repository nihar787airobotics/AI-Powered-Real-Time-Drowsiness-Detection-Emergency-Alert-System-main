"""
VigilDrive AI - Alert System
Handles alarm sounds, screenshot capture, and emergency SMS via Twilio.
"""

import os
import time
import threading
import cv2
import numpy as np
from datetime import datetime
from pathlib import Path

# Optional: pygame for audio alarm
try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False
    print("[WARNING] pygame not found. Audio alerts disabled.")

# Optional: Twilio for SMS
try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    print("[WARNING] twilio not found. SMS alerts disabled.")

# Optional: requests for backend API push
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


SCREENSHOT_DIR = Path("../screenshots")
ALARM_SOUND    = Path("../assets/alarm.wav")

# ── Environment Config ────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID  = os.getenv("TWILIO_ACCOUNT_SID",  "")
TWILIO_AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN",   "")
TWILIO_FROM_NUMBER  = os.getenv("TWILIO_FROM_NUMBER",  "")
EMERGENCY_PHONE     = os.getenv("EMERGENCY_PHONE",     "")   # E.164 format: +1234567890
GOOGLE_MAPS_BASE    = "https://maps.google.com/?q="
BACKEND_ALERT_URL   = os.getenv("BACKEND_URL", "http://localhost:8000") + "/api/alerts/"

# GPS simulation (replace with real GPS module in production)
MOCK_LATITUDE   = 19.0760    # Mumbai
MOCK_LONGITUDE  = 72.8777


class AlertSystem:
    """
    Manages all alert modalities:
    - Audible alarm (pygame)
    - Screenshot capture
    - Twilio SMS with Google Maps link
    - Backend API push notification
    """

    def __init__(self):
        self._alarm_playing  = False
        self._alarm_lock     = threading.Lock()
        self._last_beep_time = 0.0

        SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

        # Init pygame mixer
        if PYGAME_AVAILABLE:
            try:
                pygame.mixer.init()
                if ALARM_SOUND.exists():
                    self._alarm_sound = pygame.mixer.Sound(str(ALARM_SOUND))
                else:
                    self._alarm_sound = None
                    print(f"[WARNING] Alarm file not found: {ALARM_SOUND}")
            except Exception as e:
                print(f"[WARNING] pygame init failed: {e}")
                self._alarm_sound = None
        else:
            self._alarm_sound = None

        # Init Twilio client
        self._twilio = None
        if TWILIO_AVAILABLE and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            try:
                self._twilio = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                print("[INFO] Twilio client initialized.")
            except Exception as e:
                print(f"[WARNING] Twilio init failed: {e}")

    # ── Public API ────────────────────────────────────────────────────────────

    def trigger_emergency(self, frame: np.ndarray, fatigue_score: float, sleep_prob: float):
        """
        Full emergency workflow triggered when driver state = 'dangerous'.
        Runs all sub-tasks sequentially (call in a separate thread).
        """
        print(f"\n[ALERT] 🚨 EMERGENCY - Fatigue Score: {fatigue_score:.1f} | Sleep Prob: {sleep_prob:.1f}%")

        ts          = datetime.now().strftime("%Y%m%d_%H%M%S")
        screenshot  = self._capture_screenshot(frame, ts)
        location    = self._get_gps_location()
        maps_link   = self._build_maps_link(*location)

        # Alarm sound (blocking call, runs in own thread)
        self.play_alarm()

        # SMS alert
        self._send_sms(fatigue_score, sleep_prob, maps_link, ts)

        # Push to backend API
        self._push_to_backend(fatigue_score, sleep_prob, location, maps_link, ts)

        print(f"[ALERT] Emergency workflow complete. Maps: {maps_link}\n")

    def play_alarm(self, duration_ms: int = 3000):
        """Play the alarm sound (non-blocking guard prevents overlap)."""
        with self._alarm_lock:
            if self._alarm_playing:
                return
            self._alarm_playing = True

        def _play():
            try:
                if self._alarm_sound:
                    self._alarm_sound.play()
                    time.sleep(duration_ms / 1000.0)
                    self._alarm_sound.stop()
                else:
                    # ASCII bell fallback
                    print("\a")
                    time.sleep(duration_ms / 1000.0)
            finally:
                with self._alarm_lock:
                    self._alarm_playing = False

        threading.Thread(target=_play, daemon=True).start()

    def play_warning_beep(self):
        """Short beep for 'tired' state (rate-limited to once per 3 s)."""
        now = time.time()
        if now - self._last_beep_time < 3.0:
            return
        self._last_beep_time = now
        self.play_alarm(duration_ms=500)

    def cleanup(self):
        """Release resources."""
        if PYGAME_AVAILABLE:
            try:
                pygame.mixer.quit()
            except Exception:
                pass

    # ── Private Methods ───────────────────────────────────────────────────────

    def _capture_screenshot(self, frame: np.ndarray, timestamp: str) -> Path:
        path = SCREENSHOT_DIR / f"incident_{timestamp}.jpg"
        cv2.imwrite(str(path), frame)
        print(f"[ALERT] Screenshot saved: {path}")
        return path

    @staticmethod
    def _get_gps_location():
        """
        Returns (latitude, longitude).
        Replace with real GPS module (e.g. gpsd, pyserial NMEA) for production.
        """
        return MOCK_LATITUDE, MOCK_LONGITUDE

    @staticmethod
    def _build_maps_link(lat: float, lon: float) -> str:
        return f"{GOOGLE_MAPS_BASE}{lat},{lon}"

    def _send_sms(self, score: float, sleep_prob: float, maps_link: str, ts: str):
        if not self._twilio or not EMERGENCY_PHONE or not TWILIO_FROM_NUMBER:
            print("[ALERT] SMS skipped (Twilio not configured).")
            return

        body = (
            f"🚨 VigilDrive AI ALERT [{ts}]\n"
            f"Dangerous driver fatigue detected!\n"
            f"Fatigue Score: {score:.0f}/100\n"
            f"Sleep Probability: {sleep_prob:.0f}%\n"
            f"Live Location: {maps_link}\n"
            f"Immediate attention required."
        )

        try:
            msg = self._twilio.messages.create(
                body=body,
                from_=TWILIO_FROM_NUMBER,
                to=EMERGENCY_PHONE,
            )
            print(f"[ALERT] SMS sent. SID: {msg.sid}")
        except Exception as e:
            print(f"[ERROR] SMS failed: {e}")

    def _push_to_backend(
        self, score: float, sleep_prob: float,
        location: tuple, maps_link: str, ts: str,
    ):
        if not REQUESTS_AVAILABLE:
            return

        payload = {
            "timestamp":       ts,
            "fatigue_score":   score,
            "sleep_prob":      sleep_prob,
            "latitude":        location[0],
            "longitude":       location[1],
            "maps_link":       maps_link,
            "driver_state":    "dangerous",
        }

        try:
            resp = requests.post(BACKEND_ALERT_URL, json=payload, timeout=5)
            print(f"[ALERT] Backend notified. Status: {resp.status_code}")
        except Exception as e:
            print(f"[WARNING] Backend push failed: {e}")