import React, { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import PropTypes from "prop-types";
import { useContext } from "context/store";

function DragDropArea({
  dropView,
  onDrop,
  reset = false,
  autoResetOnDrop,
  accept = "",
  multiple = true,
  children,
  disabled,
  component,
  inputKey = "drag-drop-area-input-file-upload",
  sx,
  mimetype,
  name,
  onError,
  ...rest
}) {
  const [showError, setShowError] = useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const [hasDropedFile, setHasDropedFile] = useState(false);
  const { setSnackBar } = useContext();
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
    setShowError(false);
  };
  const onDataTransfer = e => {
    e.preventDefault();
    e.stopPropagation();
    setHasDropedFile(true);
    const handleFilesUpload = (fileList = []) => {
      const files = [];
      let message = ``;
      const validateType = fileType => {
        for (let type of accept.split(",.")) {
          if (type[0] === ".") type = type.slice(1);
          if (type[0] === ",") type = type.slice(1);
          if (fileType === `${mimetype}/${type}`) return true;
        }
        return false;
      };
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (mimetype ? validateType(file.type) : file.type.indexOf(accept) >= 0)
          files.push(file);
        else {
          message += `${i === 0 ? `Sorry file${multiple ? "s" : ""} ` : ""}${
            file.name
          }${multiple && i !== fileList.length - 1 ? "," : ""}`;
        }
      }
      if (message.length) {
        message += ` extension not supported. Accept only ${accept} extensions`;
        setShowError(true);
        setSnackBar(message);
      } else if (onDrop) {
        setShowError(false);
        onDrop(e.target.multiple ? files : files[0]);
      }
    };
    if (!hasDropedFile) {
      if (e.dataTransfer?.files) handleFilesUpload(e.dataTransfer.files);
      else if (e.target.files) handleFilesUpload(e.target.files);
    }
    if (autoResetOnDrop) resetState();
  };
  return (
    <Box
      onDrop={onDataTransfer}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      sx={{
        position: "relative",
        border: "3px solid transparent",
        borderColor: showError
          ? "error.main"
          : dragActive
          ? "primary.main"
          : "divider",
        // "& > *": {
        //   display: "block",
        //   height: "inherit",
        //   minHeight: "inherit",
        //   width: "inherit",
        //   minWidth: "inherit",
        //   border: "inherit",
        //   borderColor: "transparent",
        //   borderRadius: "inherit",
        //   position: "absolute",
        //   top: -5,
        //   left: -5
        // },
        ...sx
      }}
      className={`drag-drop-area ${dragActive ? "drag-active" : ""}`}
      component={component}
      {...rest}
    >
      <input
        name={name}
        type="file"
        accept={
          {
            audio: "audio/*",
            image: "image/*",
            video: "video/*"
          }[accept] || accept
        }
        id={inputKey}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={onDataTransfer}
      />
      <label
        htmlFor={inputKey}
        style={{
          cursor: disabled ? "not-allowed" : "pointer"
        }}
      >
        {children}
      </label>
      {hasDropedFile || disabled ? (
        <div
          style={{
            zIndex: 1,
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
