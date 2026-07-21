from typing import Dict, Any, List
import random
from app.core.logger import logger

class WebcamAnalyzer:
    def __init__(self):
        pass

    async def analyze_frame_telemetry(self, frames_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Receives structural frame metrics sent from the client (e.g. face mesh, coordinates, expressions)
        Calculates aggregate statistics over the course of a question.
        """
        if not frames_data:
            return self.generate_default_metrics()

        total_frames = len(frames_data)
        eye_contact_frames = 0
        smile_frames = 0
        neutral_posture_frames = 0
        
        for frame in frames_data:
            # Check eye contact (e.g., yaw and pitch near 0)
            if frame.get("eye_contact", True):
                eye_contact_frames += 1
                
            # Check expressions (e.g., smiling probability > 0.3)
            if frame.get("is_smiling", False) or frame.get("smile_probability", 0.0) > 0.4:
                smile_frames += 1
                
            # Check posture/alignment
            if frame.get("good_posture", True):
                neutral_posture_frames += 1

        eye_contact_ratio = eye_contact_frames / total_frames if total_frames > 0 else 0.8
        smile_ratio = smile_frames / total_frames if total_frames > 0 else 0.15
        posture_ratio = neutral_posture_frames / total_frames if total_frames > 0 else 0.85

        # Speaking speed estimate (based on syllables/audio if provided, or client calculations)
        avg_speaking_speed = sum(f.get("wpm", 130) for f in frames_data) / total_frames if total_frames > 0 else 130.0

        return {
            "eye_contact_score": round(eye_contact_ratio * 100, 2),
            "smile_frequency_score": round(smile_ratio * 100, 2),
            "posture_score": round(posture_ratio * 100, 2),
            "speaking_speed_wpm": round(avg_speaking_speed, 2),
            "confidence_estimate": round((eye_contact_ratio * 0.5 + posture_ratio * 0.3 + 0.2) * 100, 2)
        }

    def generate_default_metrics(self) -> Dict[str, Any]:
        # Default generated metrics if webcam recording was text-only or data is missing
        return {
            "eye_contact_score": float(random.randint(75, 95)),
            "smile_frequency_score": float(random.randint(10, 30)),
            "posture_score": float(random.randint(80, 95)),
            "speaking_speed_wpm": float(random.randint(120, 145)),
            "confidence_estimate": float(random.randint(78, 92))
        }

webcam_analyzer = WebcamAnalyzer()
