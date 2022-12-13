import { Link } from "react-router-dom";
import { styled } from "@mui/system";
import { Typography, Box } from "@mui/material";

export const StyledLink = styled(Link, {
  shouldForwardProp: prop => {
    switch (prop) {
      case "textEllipsis":
      case "hoverDecoration":
        return false;
      default:
        return true;
    }
  }
})(
  ({
    theme: {
      typography,
      palette: {
        primary: { main }
      }
    },
    variant,
    textEllipsis,
    hoverDecoration
  }) => {
    let styles = {
      textDecoration: "none",
      display: "inline-block",
      color: main
    };
    styles = {
      ...styles,
      ...(typography[variant] || {}[variant])
    };
    textEllipsis &&
      (styles = {
        ...styles,
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap"
      });
    !hoverDecoration &&
      (styles["&:hover"] = {
        textDecoration: "underline"
      });
    return styles;
  }
);

export const StyledTypography = styled(Typography, {
  shouldForwardProp: prop => {
    switch (prop) {
      case "textEllipsis":
        return false;
      default:
        return true;
    }
  }
})(({ textEllipsis, variant, theme: { palette: { primary: { main } } } }) => {
  let styles = {};
  textEllipsis &&
    (styles = {
      ...styles,
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "nowrap"
    });
  styles = {
    ...styles,
    ...{
      link: {
        display: "inline-block",
        cursor: "pointer",
        color: main,
        "&:hover": {
          textDecoration: "underline"
        }
      }
    }[variant]
  };
  return styles;
});

export const WidgetContainer = styled(Box)(
  ({
    theme: {
      palette: {
        background: { alt }
      }
    }
  }) => {
    return {
      width: "100%",
      minHeight: "135px",
      borderRadius: "8px",
      padding: "24px",
      backgroundColor: alt,
      marginBottom: "24px"
    };
  }
);

export const Image = styled("img")`
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 12px;
  background-size: cover;
  background-repeat: no-repeat;
`;
