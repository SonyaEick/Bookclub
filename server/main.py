import random

from database import SessionLocal, books_table
from app import manager, app




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
