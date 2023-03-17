import { Link } from "react-router-dom";
import { styled } from "@mui/system";
import { Typography, Box, MenuItem } from "@mui/material";
import Badge from "@mui/material/Badge";
import { keyframes } from "@mui/system";
import CircularProgress from "@mui/material/CircularProgress";
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
      color: main,
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

export const StyledTypography = styled(Typography)(
  ({
    $maxLine,
    variant,
    $textEllipsis,
    theme: {
      palette: {
        primary: { main }
      }
    }
  }) => {
    let styles = {};
    $textEllipsis &&
      (styles = {
        ...styles,
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap"
      });
    $maxLine &&
      (styles = {
        ...styles,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        "-webkit-box-orient": "vertical",
        "-webkit-line-clamp": `${$maxLine}`,
        maxHeight: ($maxLine > 2 ? 1.8 * $maxLine : 2.92) + "em"
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
  }
);

export const WidgetContainer = styled(Box)(
  ({
    theme: {
      palette: {
        background: { alt, default: defaultC }
      }
    },
    $plainWidget
  }) => {
    return {
      width: "100%",
      minHeight: "200px",
      borderRadius: "8px",
      padding: "16px",
      backgroundColor: alt,
      marginBottom: "24px",
      maxHeight: "400px",
      overflow: "auto",
      position: "relative",

      // border: "1px solid green",
      ...($plainWidget && {
        overflow: "none",
        marginInline: "auto",
        maxHeight: "none",
        borderRadius: "0",
        marginBottom: 0,
        backgroundColor: defaultC
        // height: "inherit"
      })
    };
  }
);

export const Image = styled("img")`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  background-size: cover;
  background-repeat: no-repeat;
`;

export const StyledMenuItem = styled(MenuItem, {
  shouldForwardProp: prop => {
    switch (prop) {
      case "selectHoverColor":
        return false;
      default:
        return true;
    }
  }
  // component: Link
})(() => {
  return {
    "&.Mui-selected": {
      backgroundColor: `${"transparent"} !important`
    }
  };
});

export const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: -3,
    top: 0,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: "0 4px"
  }
}));

export const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const Loading = () => (
  <Box
    sx={{
      color: "primary.dark",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "300px",
      height: "inherit"
    }}
  >
    <CircularProgress />
  </Box>
);

export const slideinDown = keyframes`
from {
    -webkit-transform: translate3d(0, -100%, 0);
    transform: translate3d(0, -100%, 0);
    visibility: visible;
  }

  to {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }
`;
