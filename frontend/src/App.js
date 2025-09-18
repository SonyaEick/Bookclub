import React, { useEffect, useState } from "react";

function App() {
  const [books, setBooks] = useState([]);

  // Load initial books
  useEffect(() => {
    fetch("http://localhost:8000/books/")
      .then((res) => res.json())
      .then(setBooks);
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.action === "eliminate") {
        setBooks((prev) => prev.filter((b) => b.id !== msg.book_id));
      }
    };
    return () => ws.close();
  }, []);

  const eliminateBook = (id) => {
    fetch(`http://localhost:8000/eliminate/${id}`, { method: "DELETE" });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📚 Book Club Elimination</h1>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            {book.title}{" "}
            <button onClick={() => eliminateBook(book.id)}>Eliminate</button>
          </li>
        ))}
      </ul>
      {books.length === 1 && <h2>🎉 Next book: {books[0].title}</h2>}
    </div>
  );
}

export default App;
