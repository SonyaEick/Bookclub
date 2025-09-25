import React, { useEffect, useState } from "react";
import BookList from "../components/BookList";
import Controls from "../components/Controls";
import Winner from "../components/Winner";
import "../styles/App.css";

function HomePage() {
  const [books, setBooks] = useState([]);
  const [lastEliminated, setLastEliminated] = useState(null);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    refreshBooks();

    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.eliminated) {
        setLastEliminated(data.eliminated);
        refreshBooks();
      } else if (data.winner) {
        setWinner(data.winner);
      }
    };

    return () => ws.close();
  }, []);

  const refreshBooks = () => {
    fetch("http://localhost:8000/books/")
      .then((res) => res.json())
      .then(setBooks);
  };

  const eliminateRandom = () => {
    fetch("http://localhost:8000/books/eliminate/", { method: "POST" });
  };

  return (
    <div className="app-container">
      <h1>Book Eliminator</h1>

      {winner ? (
        <Winner winner={winner} />
      ) : (
        <>
          <Controls onEliminate={eliminateRandom} disabled={books.length <= 1} />
          {lastEliminated && <h3>❌ Eliminated: {lastEliminated}</h3>}

          <BookList books={books} />

        </>
      )}
    </div>
  );
}

export default HomePage;
