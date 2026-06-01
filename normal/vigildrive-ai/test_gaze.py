"""
VigilDrive AI - Advanced Gaze Tracking Test
Realtime iris + gaze visualization   its crazyy
"""

import cv2
import time

from core.gaze_tracking import GazeTracker


def main():

    print("=" * 60)

    print("VigilDrive AI - Gaze Tracking Test")

    print("=" * 60)

    # Webcam
    cap = cv2.VideoCapture(0)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)

    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    # FPS
    prev_time = time.time()

    # Gaze tracker
    gaze_tracker = GazeTracker()

    while True:

        success, frame = cap.read()

        if not success:

            print("[ERROR] Webcam frame failed.")

            break

        # Mirror
        frame = cv2.flip(frame, 1)

        rgb_frame = cv2.cvtColor(

            frame,

            cv2.COLOR_BGR2RGB
        )

        # ─────────────────────────────────────────────
        # Process Gaze
        # ─────────────────────────────────────────────

        gaze_data = gaze_tracker.process(

            rgb_frame
        )

        direction = gaze_data["gaze_direction"]

        ratio = gaze_data["gaze_ratio"]

        # ─────────────────────────────────────────────
        # FPS
        # ─────────────────────────────────────────────

        current_time = time.time()

        fps = 1 / max(

            0.001,

            current_time - prev_time
        )

        prev_time = current_time

        # ─────────────────────────────────────────────
        # Colors
        # ─────────────────────────────────────────────

        color = {

            "LEFT": (0, 255, 255),

            "RIGHT": (0, 255, 255),

            "CENTER": (0, 255, 0)

        }.get(direction, (255, 255, 255))

        # ─────────────────────────────────────────────
        # Draw Eye Landmarks
        # ─────────────────────────────────────────────

        for point in gaze_data["left_iris_points"]:

            cv2.circle(

                frame,

                point,

                2,

                (0, 255, 0),

                -1
            )

        for point in gaze_data["right_iris_points"]:

            cv2.circle(

                frame,

                point,

                2,

                (0, 255, 0),

                -1
            )

        # ─────────────────────────────────────────────
        # Draw Iris Centers
        # ─────────────────────────────────────────────

        cv2.circle(

            frame,

            gaze_data["left_iris_center"],

            4,

            (0, 0, 255),

            -1
        )

        cv2.circle(

            frame,

            gaze_data["right_iris_center"],

            4,

            (0, 0, 255),

            -1
        )

        # ─────────────────────────────────────────────
        # HUD Background
        # ─────────────────────────────────────────────

        overlay = frame.copy()

        cv2.rectangle(

            overlay,

            (0, 0),

            (260, 140),

            (20, 20, 20),

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

        # ─────────────────────────────────────────────
        # Display Text
        # ─────────────────────────────────────────────

        cv2.putText(

            frame,

            f"GAZE: {direction}",

            (20, 40),

            cv2.FONT_HERSHEY_SIMPLEX,

            1,

            color,

            2
        )

        cv2.putText(

            frame,

            f"RATIO: {ratio:.3f}",

            (20, 80),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.8,

            (255, 255, 255),

            2
        )

        cv2.putText(

            frame,

            f"FPS: {fps:.1f}",

            (20, 120),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.7,

            (200, 200, 200),

            2
        )

        # ─────────────────────────────────────────────
        # Calibration Bar
        # ─────────────────────────────────────────────

        bar_x = 20

        bar_y = 160

        bar_w = 220

        bar_h = 20

        cv2.rectangle(

            frame,

            (bar_x, bar_y),

            (bar_x + bar_w, bar_y + bar_h),

            (80, 80, 80),

            2
        )

        fill_x = int(

            ratio * bar_w
        )

        fill_x = max(

            0,

            min(fill_x, bar_w)
        )

        cv2.rectangle(

            frame,

            (bar_x, bar_y),

            (bar_x + fill_x, bar_y + bar_h),

            color,

            -1
        )

        # Center marker
        center_marker = bar_x + bar_w // 2

        cv2.line(

            frame,

            (center_marker, bar_y - 5),

            (center_marker, bar_y + bar_h + 5),

            (255, 255, 255),

            2
        )

        # ─────────────────────────────────────────────
        # Gaze Direction Arrow
        # ─────────────────────────────────────────────

        center_x = 320

        center_y = 140

        arrow_length = 120

        if direction == "LEFT":

            end_point = (

                center_x - arrow_length,

                center_y
            )

        elif direction == "RIGHT":

            end_point = (

                center_x + arrow_length,

                center_y
            )

        else:

            end_point = (

                center_x,

                center_y - arrow_length
            )

        cv2.arrowedLine(

            frame,

            (center_x, center_y),

            end_point,

            color,

            5,

            tipLength=0.3
        )

        # ─────────────────────────────────────────────
        # Instructions
        # ─────────────────────────────────────────────

        cv2.putText(

            frame,

            "Move ONLY eyes left/right",

            (20, 430),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.65,

            (255, 255, 255),

            2
        )

        cv2.putText(

            frame,

            "Press Q to exit",

            (20, 460),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.55,

            (180, 180, 180),

            1
        )

        # ─────────────────────────────────────────────
        # Display
        # ─────────────────────────────────────────────

        cv2.imshow(

            "VigilDrive AI - Gaze Test",

            frame
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):

            break

    cap.release()

    cv2.destroyAllWindows()


if __name__ == "__main__":

    main()
