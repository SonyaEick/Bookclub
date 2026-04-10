import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl, bookclubWsUrl } from "../apiBase";
import "../styles/HomePage.css";

const BANNER_DISMISS_MS = 9000;

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1zm1 5h2v10h-2V8zm4 0h2v10h-2V8zM7 8h2v10H7V8z"
      />
    </svg>
  );
}

function HomePage() {
  const [books, setBooks] = useState([]);
  const [winner, setWinner] = useState(null);
  const [title, setTitle] = useState("");
  const [elimBanner, setElimBanner] = useState(null);
  const bannerTimerRef = useRef(null);

  const refreshBooks = useCallback(() => {
    fetch(apiUrl("/books/"))
      .then((res) => res.json())
      .then(setBooks);
  }, []);

  useEffect(() => {
    refreshBooks();

    const ws = new WebSocket(bookclubWsUrl());
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.cleared) {
        setElimBanner(null);
        setWinner(null);
        refreshBooks();
      } else if (data.winner) {
        setElimBanner(null);
        setWinner(data.winner);
        refreshBooks();
      } else if (data.eliminated) {
        setElimBanner({ title: data.eliminated, source: "random" });
        refreshBooks();
      } else if (data.deleted) {
        setElimBanner({ title: data.deleted, source: "manual" });
        refreshBooks();
      }
    };

    return () => ws.close();
  }, [refreshBooks]);

  useEffect(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    if (!elimBanner) return;

    bannerTimerRef.current = setTimeout(() => {
      setElimBanner(null);
      bannerTimerRef.current = null;
    }, BANNER_DISMISS_MS);

    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
    };
  }, [elimBanner]);

  const addBook = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;

    await fetch(`${apiUrl("/books/add/")}?title=${encodeURIComponent(t)}`, {
      method: "POST",
    });
    setTitle("");
    refreshBooks();
  };

  const deleteBook = async (id) => {
    await fetch(apiUrl(`/books/${id}`), { method: "DELETE" });
    refreshBooks();
  };

  const eliminateRandom = async () => {
    let res;
    try {
      res = await fetch(apiUrl("/books/eliminate/"), { method: "POST" });
    } catch {
      return;
    }
    if (!res.ok) return;

    let data = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }

    if (data.winner) {
      setElimBanner(null);
      setWinner(data.winner);
    } else if (data.eliminated) {
      setElimBanner({ title: data.eliminated, source: "random" });
    }
    refreshBooks();
  };

  const playAgain = async () => {
    await fetch(apiUrl("/books/clear"), { method: "DELETE" });
    setElimBanner(null);
    setWinner(null);
    refreshBooks();
  };

  const dismissBanner = () => {
    setElimBanner(null);
  };

  const elimDisabled = books.length === 0;
  const soloFinalist = books.length === 1 && !winner;

  return (
    <div className="home">
      <div className="home-inner">
        <h1 className="home-title">Book Eliminator</h1>
        <hr className="home-rule" />
        <p className="home-subtitle">Eliminate books randomly to find out what to read next!</p>

        {!winner && (
          <div className="home-play">
            <form className="input-row" onSubmit={addBook}>
              <input
                className="home-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a book title..."
                aria-label="Book title"
              />
              <button className="btn btn-primary" type="submit">
                Add Book
              </button>
            </form>

            <div className="section-heading">Book List</div>

            {elimBanner && (
              <div
                className={`elim-banner elim-banner--${elimBanner.source}`}
                role="status"
                aria-live="polite"
              >
                <div className="elim-banner-text">
                  <strong className="elim-banner-label">
                    {elimBanner.source === "random"
                      ? "Eliminated"
                      : "Removed from list"}
                  </strong>
                  <span className="elim-banner-title">{elimBanner.title}</span>
                </div>
                <button
                  type="button"
                  className="elim-banner-dismiss"
                  onClick={dismissBanner}
                  aria-label="Dismiss announcement"
                >
                  ×
                </button>
              </div>
            )}

            <div className="home-list-region">
              {books.length === 0 ? (
                <p className="empty-list">No books yet — add a title above.</p>
              ) : (
                <>
                  <ul className="book-card">
                    {books.map((book) => (
                      <li
                        key={book.id}
                        className={soloFinalist ? "book-row--finalist" : undefined}
                      >
                        <span className="book-title">{book.title}</span>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => deleteBook(book.id)}
                          aria-label={`Remove ${book.title}`}
                        >
                          <TrashIcon />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="book-count">
                    {books.length}{" "}
                    {books.length === 1 ? "book" : "books"} remaining —
                  </p>
                </>
              )}
            </div>

            <div className="controls-dock">
              <button
                type="button"
                className="btn btn-primary controls-single"
                onClick={eliminateRandom}
                disabled={elimDisabled}
              >
                {soloFinalist ? "Declare winner" : "Randomly Eliminate"}
              </button>
            </div>
          </div>
        )}

        {winner && (
          <div className="winner-block">
            <div className="section-heading">And the winner is…</div>
            <div className="winner-card">
              <span className="winner-name">{winner}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary play-again"
              onClick={playAgain}
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
