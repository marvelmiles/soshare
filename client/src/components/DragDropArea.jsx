import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";

function DragDropArea({
  dropView,
  onDrop,
  reset = false,
  autoResetOnDrop,
  accept = "",
  multiple = true,
  children
}) {
  const [dragActive, setDragActive] = React.useState(false);
  const [hasDropedFile, setHasDropedFile] = useState(false);
  const resetState = useCallback(() => {
    setDragActive(false);
    setHasDropedFile(false);
  }, []);
  useEffect(() => {
    if (reset) resetState();
  }, [reset, resetState]);
  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const onDataTransfer = e => {
    e.preventDefault();
    e.stopPropagation();
    setHasDropedFile(true);
    if (!hasDropedFile) {
      const files = [];
      if (e.dataTransfer && e.dataTransfer.files) {
        for (let file of e.dataTransfer.files) {
          if (file.type.indexOf(accept) >= 0) files.push(file);
        }
        files.length && onDrop(multiple ? files : files[0]);
      } else if (e.target.files)
        onDrop(multiple ? e.target.files : e.target.files[0]);
      if (autoResetOnDrop) resetState();
    }
  };
  return (
    <div
      onDrop={onDataTransfer}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      style={{
        position: "relative"
      }}
      className={`drag-drop-area ${dragActive ? "drag-active" : ""}`}
    >
      <input
        type="file"
        accept={
          {
            audio: "audio/*",
            image: "image/*",
            video: "video/*"
          }[accept] || accept
        }
        id="drag-drop-area-input-file-upload"
        multiple={multiple}
        style={{ display: "none" }}
        onChange={onDataTransfer}
      />
      <label
        htmlFor="drag-drop-area-input-file-upload"
        style={{ cursor: "pointer" }}
      >
        {children}
      </label>
      {hasDropedFile ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
            width: "100%",
            height: "100%"
          }}
        >
          {dropView}
        </div>
      ) : null}
    </div>
  );
}

DragDropArea.propTypes = {};

export default DragDropArea;
