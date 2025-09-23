from sqlalchemy import Table, Column, Integer, String
from db.session import metadata, engine

books_table = Table(
    "books",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String, unique=True, index=True),
)

metadata.create_all(engine)
