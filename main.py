from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Table, MetaData
from sqlalchemy.orm import sessionmaker

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database setup ---
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


# --- API Endpoints ---
@app.post("/add_book/")
def add_book(title: str):
    db = SessionLocal()
    ins = books_table.insert().values(title=title)
    db.execute(ins)
    db.commit()
    db.close()
    return {"message": f"Book '{title}' added!"}


@app.get("/books/")
def get_books():
    db = SessionLocal()
    result = db.execute(books_table.select()).fetchall()
    db.close()
    return [{"id": r[0], "title": r[1]} for r in result]


@app.delete("/eliminate/{book_id}")
def eliminate_book(book_id: int):
    db = SessionLocal()
    db.execute(books_table.delete().where(books_table.c.id == book_id))
    db.commit()
    db.close()
    return {"message": f"Book {book_id} eliminated"}


