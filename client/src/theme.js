export const themeSettings = mode => ({
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
            altHover: `rgba(11,12,14,.95)`
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
            secondary: "#424242"
          },
          action: {
            altHover: `rgba(204, 204, 204,.78)`
          }
        }),
    common: {
      heart: "#FF1493",
      blend: "rgba(0,0,0,.4)",
      blendHover: "rgb(0,0,0,.6)"
    }
  },
  components: {
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
            palette: { background }
          }
        }) => ({
          width: 30,
          height: 30,
          minHeight: 0,
          minWidth: 0,
          backgroundColor: background.alt,
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
              width: "20px",
              height: "20px"
            },
            "@media (min-width: 280px)": {
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
      fontFamily: `'Rubik', sans-serif`,
      fontSize: 12
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
      s500: 500,
      s200: 200,
      s280: 280,
      s320: 320,
      s640: 640,
      xxxl: 1595
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
