import { StyledLink, spin } from "components/styled";
import DataUsageOutlinedIcon from "@mui/icons-material/DataUsageOutlined";
import Stack from "@mui/material/Stack";

const BrandIcon = ({ to = "/", hasLoader, staticFont, sx }) => {
  return (
    <Stack
      gap={0}
      justifyContent="center"
      sx={
        hasLoader
          ? {
              height: "100vh",
              width: "100%",
              ...sx
            }
          : sx
      }
    >
      <StyledLink
        title="Soshare: Social network"
        variant={hasLoader || staticFont ? "h4" : "h5"}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          fontWeight: "500",
          "&:hover": {
            textDecoration: "none"
          },
          cursor: hasLoader || !to ? "default" : "pointer"
        }}
        to={hasLoader || !to ? undefined : to}
      >
        <span style={{ fontSize: hasLoader || staticFont ? "24px" : "18px" }}>
          S
        </span>
        <DataUsageOutlinedIcon
          sx={{
            fontSize: hasLoader || staticFont ? "24px" : "20px",
            minWidth: 0,
            width: "auto",
            color: "currentColor",
            cursor: "inherit",
            animation: hasLoader ? `${spin} 1s infinite` : undefined
          }}
        />
        share
      </StyledLink>
    </Stack>
  );
};
export default BrandIcon;
