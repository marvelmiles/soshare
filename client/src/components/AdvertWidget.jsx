import React from "react";
import { WidgetContainer, StyledLink, Image } from "./styled";
import { Stack, Typography } from "@mui/material";
import advertImg from "assets/imgs/advert.jpg";

const AdvertWidget = () => {
  return (
    <WidgetContainer>
      <Stack mb={2}>
        <Typography color="common.dark" variant="h5" fontWeight="500">
          Sponsored
        </Typography>
        <StyledLink>Learn more</StyledLink>
      </Stack>
      <Image src={advertImg} />
      <Stack
        sx={{
          wordBreak: "break-word"
        }}
      >
        <Typography color="common.main">Fredcoalagency</Typography>
        <StyledLink>www.fredcoalagency.com</StyledLink>
      </Stack>
      <Typography color="common.medium" my={1}>
        Unlocking the Power of digital: Creating Innovative Solutions for your
        brand's Success
      </Typography>
    </WidgetContainer>
  );
};

export default AdvertWidget;
