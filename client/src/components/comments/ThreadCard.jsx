import React from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
const ThreadCard = ({ text, hasMoreText, createdAt, user = {}, children }) => {
  let { photoUrl, displayName, username } = user;
  text =
    text ||
    `   sssssssssssssAmet esse dolore reprehenderit Fugiat cupidatat velit non
        proident excepteur.Ea fugiat irure enim in.Eu veniam nostrud nulla amet
        ea adipisicing nostrud id Lorem deserunt non. Ipsum reprehenderit sint
        sit aliquip aute cillum aliquip pariatur sit ad. Deserunt ex veniam
        officia eu. Null sssssssssssssAmet esse dolore reprehenderit Fugiat
        cupidatat velit non proident excepteur.Ea fugiat irure enim in.Eu veniam
        nostrud nulla amet ea adipisicing nostrud id Lorem deserunt non. Ipsum
        reprehenderit sint sit aliquip aute cillum aliquip pariatur sit ad.
        Deserunt ex veniam officia eu. Null`;
  displayName =
    displayName ||
    `Art olmideDolore do laboris consectetur incididunt mollit sint officia
          aliqua ex.`;
  username =
    username ||
    `Art olmideDolore do laboris consectetur incididunt mollit sint officia
          aliqua ex.`;
  return (
    <Stack
      justifyContent="normal"
      alignItems="flex-start"
      sx={{
        position: "relative",
        "&::before": {
          content: `""`,
          backgroundColor: "red",
          position: "absolute",
          // 100% - avatar size + 10px margin = net 5px spacing
          // considering bottom
          minHeight: "calc(100% - 50px)",
          width: "1px",
          left: "20px", // half the avatar size
          bottom: "5px",
          zIndex: 1
        }
      }}
    >
      <Avatar src={photoUrl} />
      <div>
        <Typography variant="h6" fontWeight="500" component="span">
          {displayName}
        </Typography>
        <Typography
          variant="caption"
          fontWeight="500"
          component="span"
          sx={{ ml: "4px" }}
        >
          <span>@{username}</span>
          <span style={{ marginInline: "4px" }}>·</span>
          <span>2h</span>
        </Typography>
        <Typography mb={1}>{text}</Typography>
        {children}
      </div>
    </Stack>
  );
};

ThreadCard.propTypes = {};

export default ThreadCard;
