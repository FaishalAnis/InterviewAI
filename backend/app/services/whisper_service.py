import os
import tempfile
from typing import BinaryIO, Optional
from openai import OpenAI
from app.core.config import settings
from app.core.logger import logger

class WhisperService:
    def __init__(self):
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI Whisper service initialized.")
        else:
            logger.warning("No OpenAI key. Whisper will operate in mock/transcription-simulation mode.")

    async def transcribe_audio_file(self, file_path: str) -> str:
        if self.openai_client:
            try:
                with open(file_path, "rb") as audio_file:
                    transcript = self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )
                    return transcript.text
            except Exception as e:
                logger.error(f"Whisper transcription failed: {e}. Falling back to simulator.")
        
        return self._generate_mock_transcription()

    async def transcribe_audio_bytes(self, audio_bytes: bytes, file_extension: str = "webm") -> str:
        # Write bytes to temporary file, then transcribe
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name
        
        try:
            transcript = await self.transcribe_audio_file(temp_path)
            return transcript
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def _generate_mock_transcription(self) -> str:
        # Simulated responses for mock interviews if API is offline/unavailable
        mock_phrases = [
            "I believe the best approach is to first map out the requirements and design the relational schema before optimizing query structures.",
            "I have experience with that. In my last project, we used a Redis cache to optimize API response times which brought query latency down by 40%.",
            "That is an interesting question. I would start by identifying the bottleneck in the application logic, typically database lookups.",
            "I prefer to write clean, modular code with descriptive variable names and adequate unit test coverage for reliability.",
            "I work well in collaborative teams. I always schedule 1-on-1 chats to resolve technical differences with team mates constructively."
        ]
        import random
        return random.choice(mock_phrases)

whisper_service = WhisperService()
