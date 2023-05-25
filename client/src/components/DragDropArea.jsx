import React, { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import PropTypes from "prop-types";

function DragDropArea({
  dropView,
  onDrop,
  reset = false,
  autoResetOnDrop,
  accept = "",
  multiple = true,
  children,
  disabled,
  sx
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
    <Box
      onDrop={onDataTransfer}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      sx={{
        position: "relative",
        ...sx
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
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {children}
      </label>
      {hasDropedFile || disabled ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
            width: "inherit",
            height: "inherit",
            cursor: disabled && "not-allowed"
          }}
        >
          {hasDropedFile ? dropView : null}
        </div>
      ) : null}
    </Box>
  );
}

DragDropArea.propTypes = {};

export default DragDropArea;
