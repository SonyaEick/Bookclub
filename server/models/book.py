from sqlalchemy import Table, Column, Integer, String, ForeignKey
from db.session import metadata, engine


# class User(Base):
#     __tablename__ = 'users'
#     id = Column(Integer, primary_key=True)
#     name = Column(String)


books_table = Table(
    "books",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String, unique=True, index=True),
    # Column("description", String, unique=True, index=True),
    # Column("added_by", String, unique=True, index=True),
)

metadata.create_all(engine)
