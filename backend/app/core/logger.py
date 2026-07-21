import logging
import sys

# Configure standard logging to stdout
logging_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=logging_format,
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("interviewai")
logger.setLevel(logging.INFO)
