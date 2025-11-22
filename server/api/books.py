import random
from fastapi import APIRouter, Depends
from db.session import get_db
from models.book import books_table
from .websocket import manager

router = APIRouter()

@router.get("/")
def get_books(db = Depends(get_db)):
    result = db.execute(books_table.select()).fetchall()
    return [{"id": r[0], "title": r[1]} for r in result]


@router.post("/add/")
def add_book(title: str, db = Depends(get_db)):
    db.execute(books_table.insert().values(title=title))
    db.commit()
    return {"message": f"Book '{title}' added!"}


@router.post("/eliminate/")
async def eliminate_random(db = Depends(get_db)):
    result = db.execute(books_table.select()).fetchall()

    if not result:
        return {"message": "No books left"}

    if len(result) == 1:
        winner = result[0][1]
        await manager.broadcast({"winner": winner})
        return {"message": "Winner chosen!", "winner": winner}

    chosen = random.choice(result)
    db.execute(books_table.delete().where(books_table.c.id == chosen[0]))
    db.commit()

    await manager.broadcast({"eliminated": chosen[1]})
    return {"message": f"Eliminated {chosen[1]}"}
