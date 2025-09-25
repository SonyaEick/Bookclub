import React, { useState } from "react";
import BookList from "../components/BookList";


function AddBookForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:8000/books/add/?title=${encodeURIComponent(title)}`,
        { method: "POST" }
      );

      if (response.ok) {
        setMessage(`✅ Added book: ${title}`);
        setTitle("");
      } else {
        setMessage("❌ Failed to add book");
      }
    } catch (err) {
      setMessage("❌ Error connecting to server");
    }
  };

  return (
    <div className="add-book-form">
      <h2>Add a Book</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter book title"
          required
        />
        <button type="submit">Add Book</button>
      </form>
      {message && <p>{message}</p>}

{/*         <BookList books={books} /> */}
    </div>
  );
}

export default AddBookForm;
