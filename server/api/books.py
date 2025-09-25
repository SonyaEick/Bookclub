import random
from fastapi import APIRouter
from db.session import get_db
from models.book import books_table
from .websocket import manager

router = APIRouter()

@router.get("/")
def get_books():
    db = get_db()
    result = db.execute(books_table.select()).fetchall()
    db.close()
    return [{"id": r[0], "title": r[1]} for r in result]
    # return [{"id": r[0], "title": r[1], "added_by": r[2]} for r in result]

@router.post("/add/")
def add_book(title: str):
# def add_book(title: str, added_by: str):
    db = get_db()
    db.execute(books_table.insert().values(title=title))
    # db.execute(books_table.insert().values(title=title, added_by:added_by))
    db.commit()
    db.close()
    return {"message": f"Book '{title}' added!"}

@router.post("/eliminate/")
async def eliminate_random():
    db = get_db()
    result = db.execute(books_table.select()).fetchall()

    if not result:
        db.close()
        return {"message": "No books left"}

    if len(result) == 1:
        winner = result[0][1]
        db.close()
        await manager.broadcast({"winner": winner})
        return {"message": "Winner chosen!", "winner": winner}

    chosen = random.choice(result)
    db.execute(books_table.delete().where(books_table.c.id == chosen[0]))
    db.commit()
    db.close()

    await manager.broadcast({"eliminated": chosen[1]})
    return {"message": f"Eliminated {chosen[1]}"}
