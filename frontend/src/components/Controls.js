import React from "react";
import "../styles/Controls.css";

function Controls({ onEliminate, disabled }) {
  return (
    <button className="eliminate-btn" onClick={onEliminate} disabled={disabled}>
      Eliminate Random Book
    </button>
  );
}

export default Controls;
