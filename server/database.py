from sqlalchemy import create_engine, Column, Integer, String, Table, MetaData
from sqlalchemy.orm import sessionmaker


# Database setup (SQLite)
DATABASE_URL = "sqlite:///./books.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
metadata = MetaData()

books_table = Table(
    "books",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String, unique=True, index=True),
)

metadata.create_all(engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)