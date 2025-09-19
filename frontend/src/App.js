import React, { useEffect, useState } from "react";

function App() {
  const [books, setBooks] = useState([]);
  const [lastEliminated, setLastEliminated] = useState(null);
  const [winner, setWinner] = useState(null);

  // Load books + set up WebSocket
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
    fetch("http://localhost:8000/eliminate_random/", { method: "POST" });
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>📚 Book Club Eliminator</h1>

      {winner ? (
        <h2>🎉 Winner: {winner}</h2>
      ) : (
        <>
          <button
            onClick={eliminateRandom}
            disabled={books.length <= 1}
            style={{ padding: "10px 20px", marginBottom: "20px" }}
          >
            Eliminate Random Book
          </button>

          <ul>
            {books.map((book) => (
              <li key={book.id}>{book.title}</li>
            ))}
          </ul>

          {lastEliminated && <h3>❌ Eliminated: {lastEliminated}</h3>}
        </>
      )}
    </div>
  );
}

export default App;
