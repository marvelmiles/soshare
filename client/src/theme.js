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
            paper: "#0f1013"
          },
          common: {
            dark: "#E0E0E0",
            main: "rgba(255,255,255,0.7)",
            mediumMain: "#A3A3A3",
            medium: "#858585",
            light: "#333",
            black: "#333",
            heart: "#FF1493",
            blend: "linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent)"
          }
        }
      : {
          primary: {
            dark: "#1769aa",
            main: "#2196f3",
            light: "#4dabf5",
            contrastText: "#000"
          },
          common: {
            dark: "#000",
            main: "#333",
            mediumMain: "#222",
            medium: "#555",
            light: "#F0F0F0",
            hover: "rgba(0, 0, 0, 0.04)",
            darkGray: "rgba(0, 0, 0, 0.54)",
            heart: "#FF1493",
            blend: "linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent)"
          },
          background: {
            default: "#fff",
            alt: "rgb(247, 249, 249)",
            blend: "linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent)",
            paper: "#fff"
          }
        })
  },
  components: {
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
    MuiInputBase: {
      styleOverrides: {
        root: ({
          ownerState: { error },
          theme: {
            palette: {
              divider,
              error: { main },
              text
            }
          }
        }) => {
          return {
            border: `1px solid ${error ? main : divider}`,
            borderRadius: "5px",
            backgroundColor: "transparent",
            width: "100%",
            marginBottom: "8px",
            marginTop: "16px",
            "input,textarea": {
              padding: "4px",
              paddingLeft: "8px",
              border: "none",
              outline: 0,
              color: text.primary,
              caretColor: text.primary
            },
            textarea: {
              width: "100%",
              paddingTop: "16px",
              "&::placeholder": {
                color: "inherit"
              }
            },
            input: {
              "&::placeholder": {
                opacity: 1
              }
            }
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
        paper: ({ theme }) => {
          return {
            margin: 0,
            ["@media (min-width:200px)"]: {
              marginLeft: "8px",
              marginRight: "8px"
            },
            ["@media (min-width:280px)"]: {
              marginLeft: "16px",
              marginRight: "16px"
            }
          };
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingLeft: "8px",
          paddingRight: "8px"
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

    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 30,
          height: 30
        }
      },
      variants: [
        // {
        //   // props:{variant:"xs"},style
        // },
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
            "@media (min-width: 280px)": {
              width: "40px",
              height: "40px"
            },
            "@media (min-width: 360px)": {
              width: "40px",
              height: "40px"
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
      s200: 200,
      s280: 280,
      s320: 320,
      s640: 640,
      xxxl: 1595
    }
  }
});
