from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import books, websocket

app = FastAPI(title="GNO Bookclub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(books.router, prefix="/books", tags=["Books"])
app.include_router(websocket.router, tags=["WebSocket"])
