import React from "react";
import "../styles/BookList.css";

function BookList({ books }) {
  return (
    <ul className="book-list">
      {books.map((book) => (
        <li key={book.id}>{book.title}</li>
      ))}
    </ul>
  );
}

export default BookList;
