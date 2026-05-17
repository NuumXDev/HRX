from app.database import engine, Base
from app.models import *
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def sync():
    logger.info("Creating all tables in database...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database synchronized successfully.")

if __name__ == "__main__":
    sync()
