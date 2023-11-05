import { Link } from "react-router-dom";
import { styled } from "@mui/system";
import { Typography, Box, MenuItem } from "@mui/material";
import Badge from "@mui/material/Badge";
import { keyframes } from "@mui/system";

export const StyledLink = styled(Link, {
  shouldForwardProp: prop => {
    switch (prop) {
      case "textEllipsis":
      case "hoverDecoration":
      case "sx":
        return false;
      default:
        return true;
    }
  }
})(({ theme, variant, textEllipsis, hoverDecoration }) => {
  const { typography, palette } = theme;

  let styles = {
    textDecoration: "none",
    display: "inline-block",
    color: palette && palette.primary?.main,
    ...(typography ? typography[variant] || {}[variant] : undefined)
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
});

export const StyledTypography = styled(Typography, {
  shouldForwardProp: prop => {
    switch (prop) {
      case "textEllipsis":
      case "maxLine":
        return false;
      default:
        return true;
    }
  }
})(
  ({
    maxLine,
    variant,
    textEllipsis,
    theme: {
      typography,
      palette: {
        primary: { main }
      }
    }
  }) => {
    let styles = {};
    textEllipsis &&
      (styles = {
        ...styles,
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap"
      });
    maxLine &&
      (styles = {
        ...styles,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: `${maxLine}`,
        maxHeight: (maxLine > 2 ? 1.8 * maxLine : 2.92) + "em"
      });
    styles = {
      ...styles,
      ...{
        link: {
          display: "inline-block",
          cursor: "pointer",
          color: main,
          marginBottom: 0,
          ...typography.caption,
          "&:hover": {
            textDecoration: "underline"
          }
        }
      }[variant]
    };
    return styles;
  }
);

export const WidgetContainer = styled(Box, {
  shouldForwardProp: prop => {
    switch (prop) {
      case "plainWidget":
      case "sx":
        return false;
      default:
        return true;
    }
  }
})(
  ({
    theme: {
      palette: {
        background: { alt }
      }
    },
    plainWidget,
    sx,
    ty,
    ...rest
  }) => {
    return {
      width: "100%",
      minHeight: "300px",
      borderRadius: "8px",
      padding: "16px",
      backgroundColor: alt,
      marginBottom: "24px",
      maxHeight: "400px", //"450px",
      overflow: "auto",
      position: "relative",

      ...(plainWidget && {
        overflow: "none",
        marginInline: "auto",
        maxHeight: "none",
        borderRadius: "0",
        marginBottom: 0,
        backgroundColor: "transparent",
        height: "inherit",
        minHeight: "inherit"
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
    padding: "0 4px",
    color: theme.palette.primary.contrastText
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

export const zoom = keyframes`
  0% {
    transform: scale(0, 0);
    opcaity:1;
  }
  20% {
    transform: scale(0.2, 0.2);
  }
  20% {
    transform: scale(0.4, 0.4);
  }
  50% {
    transform: scale(0.5, 0.5);
    opacity:0.5
  }
  60% {
    transform: scale(0.6, 0.6);
    opacity:0.5
  }
  65% {
    transform: scale(0.8, 0.8);
    opacity:0.5
  }
  70% {
    transform: scale(1, 1);
    opacity:0.5
  }
  80% {
    transform: scale(1.4,1.4);
  }
  100%{
    transform: scale(1.4,1.4);
    opacity:0
  }
  `;

export const StyledAvatar = styled(Box)`
  ${({
    theme: {
      palette: { divider, ...rest },
      ...theme
    }
  }) => {
    return `
   width: 30px;
  height: 30px;
  border-radius: 50%;
  padding:2px;
  border: 3px solid transparent;
  border-color: ${divider};

  & > .MuiAvatar-root,
  & > img, & .styled-avatar-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%; 
  }
   `;
  }}
`;

export const authLayoutSx = {
  maxWidth: "576px",
  mx: "auto",
  width: "95%",
  minHeight: 0,
  height: "auto"
};

export const avatarProfileSx = {
  border: "1px solid currentColor",
  borderColor: "divider"
};
