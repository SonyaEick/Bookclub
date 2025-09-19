import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Table, MetaData
from sqlalchemy.orm import sessionmaker

app = FastAPI()

# CORS (so frontend can talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# --- WebSocket Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keeps the connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# --- API Endpoints ---

@app.get("/books/")
def get_books():
    db = SessionLocal()
    result = db.execute(books_table.select()).fetchall()
    db.close()
    return [{"id": r[0], "title": r[1]} for r in result]


@app.post("/add_book/")
def add_book(title: str):
    db = SessionLocal()
    db.execute(books_table.insert().values(title=title))
    db.commit()
    db.close()
    return {"message": f"Book '{title}' added!"}


@app.post("/eliminate_random/")
async def eliminate_random():
    db = SessionLocal()
    result = db.execute(books_table.select()).fetchall()

    if len(result) == 0:
        db.close()
        return {"message": "No books left", "eliminated": None}

    if len(result) == 1:
        winner = result[0][1]
        db.close()
        await manager.broadcast({"winner": winner})
        return {"message": "Winner chosen!", "winner": winner}

    chosen = random.choice(result)
    book_id, book_title = chosen[0], chosen[1]

    db.execute(books_table.delete().where(books_table.c.id == book_id))
    db.commit()
    db.close()

    await manager.broadcast({"eliminated": book_title})
    return {"message": f"Eliminated {book_title}", "eliminated": book_title}
