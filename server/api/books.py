import random

from fastapi import APIRouter, Depends, HTTPException

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

    title = chosen[1]
    await manager.broadcast({"eliminated": title})
    return {"message": f"Eliminated {title}", "eliminated": title}


@router.delete("/clear")
async def clear_all(db=Depends(get_db)):
    db.execute(books_table.delete())
    db.commit()
    await manager.broadcast({"cleared": True})
    return {"message": "All books cleared"}


@router.delete("/{book_id}")
async def delete_book(book_id: int, db=Depends(get_db)):
    row = db.execute(
        books_table.select().where(books_table.c.id == book_id)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")

    db.execute(books_table.delete().where(books_table.c.id == book_id))
    db.commit()

    remaining = db.execute(books_table.select()).fetchall()
    if len(remaining) == 0:
        await manager.broadcast({"cleared": True})
    elif len(remaining) == 1:
        await manager.broadcast({"winner": remaining[0][1]})
    else:
        await manager.broadcast({"deleted": row[1]})

    return {"message": "Deleted"}
