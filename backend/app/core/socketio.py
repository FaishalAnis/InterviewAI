import socketio
from app.core.logger import logger
from app.services.whisper_service import whisper_service
from app.services.ai_service import ai_service
import json

# Setup socket.io server with CORS support
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio, socketio_path="socket.io")

# Active connection rooms
# Room formatting: "room_{interview_id}"
@sio.event
async def connect(sid, environ):
    logger.info(f"Socket.io client connected: {sid}")

@sio.event
async def join_interview(sid, data):
    """
    Client joins a session room.
    data = {"interview_id": "..."}
    """
    interview_id = data.get("interview_id")
    if interview_id:
        room_name = f"room_{interview_id}"
        await sio.enter_room(sid, room_name)
        logger.info(f"Client {sid} joined room {room_name}")
        await sio.emit("joined", {"status": "success", "room": room_name}, room=sid)

@sio.event
async def audio_stream(sid, data):
    """
    Handles streaming audio chunks or finalized audio from client.
    data = {
        "interview_id": "...",
        "audio_bytes": b"...",
        "question_id": "...",
        "question_text": "..."
    }
    """
    interview_id = data.get("interview_id")
    audio_bytes = data.get("audio_bytes")
    question_id = data.get("question_id")
    question_text = data.get("question_text")

    if not audio_bytes or not interview_id:
        await sio.emit("error", {"message": "Invalid audio stream arguments"}, room=sid)
        return

    logger.info(f"Received audio bytes stream of length {len(audio_bytes)} from {sid}")

    try:
        # Transcribe audio segment
        transcript = await whisper_service.transcribe_audio_bytes(audio_bytes)
        logger.info(f"Transcribed speech chunk: {transcript}")

        # Stream transcription back to client
        await sio.emit("transcription", {
            "question_id": question_id,
            "text": transcript
        }, room=f"room_{interview_id}")

    except Exception as e:
        logger.error(f"Error processing real-time audio chunk: {e}")
        await sio.emit("error", {"message": "Failed to transcribe audio chunk"}, room=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Socket.io client disconnected: {sid}")
