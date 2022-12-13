import React from "react";
import { WidgetContainer, StyledLink, Image } from "./styled";
import { Stack, Typography } from "@mui/material";
import img1 from "../imgs/img1.jpg";

const AdvertWidget = () => {
  return (
    <WidgetContainer>
      <Stack>
        <Typography color="common.dark" variant="h5" fontWeight="500">
          Sponsored
        </Typography>
        <StyledLink>Learn more</StyledLink>
      </Stack>
      <Image src={img1} sx={{ my: 1 }} />
      <Stack
        sx={{
          wordBreak: "break-word"
        }}
      >
        <Typography color="common.main">MikaCosmetics</Typography>
        <Typography color="common.medium">www.mikacosmetics.com</Typography>
      </Stack>
      <Typography color="common.medium" my={1}>
        Your pathway to stunning and immaculate beauty and made sure your skin
        is exfoliating skin and shining like light.
      </Typography>
    </WidgetContainer>
  );
};

export default AdvertWidget;
