import React from "react";
import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { StyledTypography, StyledLink } from "components/styled";
import { defaultUser } from "context/slices/userSlice";
import { useSearchParams } from "react-router-dom";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import twitterIcon from "imgs/twitter.png";
import emailIcon from "imgs/email.png";
import linkedInIcon from "imgs/linkedin.png";
import { anchorAttrs } from "context/config";

const UserTip = ({
  user = defaultUser,
  isOwner,
  userLink = `/u/${user.id}`,
  width,
  actionBar,
  disableSnippet,
  maxLine = disableSnippet ? 0 : 2
}) => {
  const [searchParams] = useSearchParams();
  const renderSV = v => {
    const view = (searchParams.get("view") || "").toLowerCase();
    return `${
      window.location.search
        ? view
          ? window.location.search.replace(`view=${view}`, `view=${v}`)
          : window.location.search + `&view=${v}`
        : `?view=${v}`
    }`;
  };

  return (
    <Box sx={disableSnippet ? undefined : { p: 2 }}>
      <Stack
        sx={{
          gap: 2,
          flexWrap: {
            xs: "wrap",
            s320: "nowrap"
          },
          width: {
            xs: "100%",
            ...width
          }
        }}
        alignItems="flex-start"
        justifyContent="normal"
      >
        <Avatar
          src={user.photoUrl}
          alt={`${user.username} avatar`}
          title={`@${user.username || user.displayName}`}
          variant="md"
        />
        <Stack
          alignItems="flex-start"
          sx={{
            minWidth: 0,
            flex: 1
          }}
        >
          <Box
            sx={{
              minWidth: 0,
              color: "text.secondary",
              flex: 1
            }}
          >
            <StyledTypography
              variant="caption"
              fontWeight="bold"
              color="text.primary"
              maxLine={maxLine}
            >
              {user.displayName || user.username}Cillum anim velit occaecat
              et.Ad magna nulla nulla duis consectetur excepteur elit esse.Qui
              eu voluptate non duis dolor aliqua pariatur officia.Magna sint ut
              minim ut cillum et adipisicing consequat incididunt ut cillum in
              labore voluptate.
            </StyledTypography>
            <StyledTypography
              color="inherit"
              component={StyledLink}
              to={userLink}
              variant="caption"
              maxLine={maxLine}
            >
              @{user.username}Cillum anim velit occaecat et.Ad magna nulla nulla
              duis consectetur excepteur elit esse.Qui eu voluptate non duis
              dolor aliqua pariatur officia.Magna sint ut minim ut cillum et
              adipisicing consequat incididunt ut cillum in labore voluptate.
            </StyledTypography>
            <div style={{ whiteSpace: "wrap" }}>
              <StyledLink
                onClick={e => e.stopPropagation()}
                sx={{ color: "inherit" }}
                to={renderSV("user-following")}
              >
                {user.following.length} following
              </StyledLink>
              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink
                onClick={e => e.stopPropagation()}
                sx={{ color: "inherit" }}
                to={renderSV("user-followers")}
              >
                {user.followers.length} followers
              </StyledLink>

              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink
                onClick={e => e.stopPropagation()}
                sx={{ color: "inherit" }}
                to={renderSV("user-posts")}
              >
                {user.postCount} posts
              </StyledLink>

              <span style={{ marginInline: "2px" }}>|</span>
              <StyledLink
                onClick={e => e.stopPropagation()}
                sx={{ color: "inherit" }}
                to={renderSV("user-shorts")}
              >
                {user.shortCount} shorts
              </StyledLink>
              {isOwner ? (
                <>
                  <span style={{ marginInline: "2px" }}>|</span>
                  <StyledLink
                    onClick={e => e.stopPropagation()}
                    sx={{ color: "inherit" }}
                    to={renderSV("user-blacklist")}
                  >
                    {user.blacklistCount} blacklist
                  </StyledLink>
                </>
              ) : null}
            </div>
          </Box>
          {actionBar === undefined ? (
            <Button
              variant="contained"
              sx={{
                minWidth: "70px",
                maxWidth: "80px",
                width: "100%",
                fontSize: "10px",
                py: "6px",
                borderRadius: 5
              }}
            >
              Follow
            </Button>
          ) : (
            actionBar
          )}
        </Stack>
      </Stack>

      {user.bio || true ? (
        <StyledTypography
          variant="caption"
          component="div"
          color="text.secondary"
          fontWeight="500"
          maxLine={3}
          sx={{
            resize: "none",
            width: "100%",
            height: "auto",
            maxHeight: "none",
            overflow: "hidden",
            whiteSpace: "pre-line",
            mt: "1rem",
            pl: "0px"
          }}
        >
          {user.bio}
          Cillum anim velit occaecat et.Ad magna nulla nulla duis consectetur
          excepteur elit esse.Qui eu voluptate non duis dolor aliqua pariatur
          officia.Magna sint ut minim ut cillum et adipisicing consequat
          incididunt ut cillum in labore voluptate.
        </StyledTypography>
      ) : null}
      {disableSnippet ? null : (
        <Stack
          gap="16px"
          justifyContent="normal"
          flexWrap="wrap"
          sx={{
            mt: "8px",
            ".brand-icon": {
              backgroundColor: "action.altHover",
              width: "35px",
              height: "35px",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "2px solid transparent",
              transition: "all 400ms linear",
              "&:hover": {
                textDecoration: "none",
                borderColor: "primary.main",
                boxShadow: "4",
                transition: "all 400ms linear"
              },
              img: {
                width: "70%",
                height: "70%"
              }
            }
          }}
        >
          {Object.keys({
            ...user.socials,
            email: user.email
          }).map(key => {
            const v = user.socials[key] ?? user.email;
            return (
              <Tooltip
                key={key}
                title={`${key}: ${v}`}
                PopperProps={{
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      maxWidth: "200px",
                      userSelect: "text !important"
                    }
                  }
                }}
              >
                {
                  <a
                    {...anchorAttrs}
                    className="brand-icon"
                    href={key === "email" ? `mailto:${v}` : v}
                  >
                    <img
                      src={
                        {
                          twitter: twitterIcon,
                          linkedIn: linkedInIcon,
                          email: emailIcon
                        }[key]
                      }
                    />
                  </a>
                }
              </Tooltip>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

UserTip.propTypes = {};

export default UserTip;
