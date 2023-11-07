import { alpha, darken } from "@mui/material/styles";
import { createTheme as createMuiTheme } from "@mui/material";

export const fontFamily = "'Rubik', sans-serif";

export const createTheme = mode =>
  createMuiTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            primary: {
              dark: "#1769aa",
              main: "#2196f3",
              light: "#4dabf5",
              contrastText: "#fff"
            },
            background: {
              alt: "rgb(22, 24, 28)",
              default: "#000",
              paper: "rgb(22, 24, 28)"
            },
            action: {
              altHover: "#333"
            },
            text: {
              primary: "rgba(255,255,255,0.85)",
              secondary: "rgba(255,255,255,0.7)"
            }
          }
        : {
            primary: {
              dark: "#1769aa",
              main: "#2196f3",
              light: "#4dabf5",
              contrastText: "#000"
            },

            background: {
              default: "#fff",
              alt: "rgb(247, 249, 249)",
              paper: "#fff"
            },
            text: {
              primary: "#000",
              secondary: "#232323"
            },
            action: {
              altHover: darken("rgb(247, 249, 249)", 0.08)
            }
          }),
      common: {
        heart: "#FF1493",
        blend: "rgba(0,0,0,.4)",
        blendHover: "rgba(0,0,0,.6)",
        hover: alpha("#2196f3", "0.08"),
        lightHover: alpha("#2196f3", "0.04"),
        alt: "rgb(22, 24, 28)"
      }
    },
    components: {
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: "#212121"
          }
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({
            theme: {
              palette: { background, text },
              shadows
            }
          }) => ({
            backgroundColor: background.paper,
            marginBottom: "5px !important",
            borderRadius: "12px",
            boxShadow: shadows[6],
            color: text.primary,
            textTransform: "capitalize",
            width: "100%",
            maxWidth: "350px",
            marginTop: "5px !important"
          })
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none"
          }
        }
      },
      MuiStack: {
        styleOverrides: {
          root: {
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
            gap: "8px"
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            gap: "16px",
            display: "flex"
          }
        }
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            padding: 0,
            width: "100%",
            "@media (pointer:coarse)": {
              padding: 0
            }
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({
            theme: {
              palette: { background, action, text }
            }
          }) => ({
            width: 30,
            height: 30,
            minHeight: 0,
            minWidth: 0,
            backgroundColor: background.alt,
            color: text.primary,
            "&:focus": {
              backgroundColor: background.alt
            },
            "&:hover": {
              backgroundColor: action.altHover
            },
            svg: {
              fontSize: ".75em"
            }
          })
        }
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: ({ theme, "data-testid": t }) => {
            return {
              width: ".85em",
              height: ".85em",
              color: t !== "CheckBoxIcon" && theme.palette.text.primary,
              cursor: "pointer"
            };
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            minWidth: "50%",
            maxWidth: "500px"
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            margin: 0,
            ["@media (min-width:200px)"]: {
              marginLeft: "8px",
              marginRight: "8px"
            },
            ["@media (min-width:280px)"]: {
              marginLeft: "16px",
              marginRight: "16px"
            }
          }
        }
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            paddingLeft: "8px",
            paddingRight: "8px",
            height: "inherit",
            minHeight: "inherit"
          }
        }
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            paddingLeft: "8px",
            paddingRight: "8px"
          }
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: ({
            theme: {
              palette: { divider }
            }
          }) => ({
            borderBottom: "1px solid currentColor",
            borderBottomColor: divider,
            padding: "8px"
          })
        }
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            width: 30,
            height: 30
          },
          fallback: {
            color: "#fff"
          }
        },
        variants: [
          {
            props: { variant: "sm" },
            style: {
              "@media (min-width: 0px)": {
                width: "30px",
                height: "30px"
              }
            }
          },
          {
            props: { variant: "md" },
            style: {
              "@media (min-width: 0px)": {
                width: "20px",
                height: "20px"
              },
              "@media (min-width: 280px)": {
                width: "30px",
                height: "30px"
              },
              "@media (min-width: 360px)": {
                width: "45px",
                height: "45px"
              }
            }
          }
        ]
      }
    },
    typography: {
      allVariants: {
        fontFamily,
        fontSize: "12px"
      },
      h1: {
        fontSize: 40
      },
      h2: {
        fontSize: 32
      },
      h3: {
        fontSize: 24
      },
      h4: {
        fontSize: 20
      },
      h5: {
        fontSize: 16
      },
      h6: {
        fontSize: 14
      }
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 1024,
        xl: 1200,
        xxl: 1536,
        s200: 200,
        s280: 280,
        s320: 320,
        s360: 360,
        s640: 640,
        xxxl: 1595,
        s1200: 1200,
        s1400: 1400
      }
    }
  });

export const INPUT_AUTOFILL_SELECTOR = `
            input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus 
              `;
