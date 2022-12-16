export const themeSettings = mode => ({
  palette: {
    mode,
    ...(mode === "dark"
      ? {
          primary: {
            main: "#00D5FA",
            light: "#00353F",
            dark: "#99EEFD"
          },
          background: {
            default: "#0A0A0A",
            alt: "#1A1A1A"
          },
          common: {
            dark: "#E0E0E0",
            main: "#C2C2C2",
            mediumMain: "A3A3A3",
            medium: "#858585",
            light: "#333"
          },
          divider: "#333"
        }
      : {
          primary: {
            dark: "#006B7D",
            main: "#00D5FA",
            light: "#E6FBFF"
          },
          common: {
            dark: "#333333",
            main: "#666666",
            mediumMain: "#858585",
            medium: "#A3A3A3",
            light: "#F0F0F0",
            hover: "rgba(0, 0, 0, 0.04)"
          },
          background: {
            default: "#F6F6F6",
            alt: "#FFFFFF"
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
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 30,
          height: 30,
          minHeight: 25,
          minWidth: 25,
          svg: {
            width: ".75em",
            height: ".75em"
          }
        }
      }
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          width: ".85em",
          height: ".85em"
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
              error: { main }
            }
          }
        }) => {
          return {
            padding: "4px",
            paddingLeft: "8px",
            border: `1px solid ${error ? main : divider}`,
            borderRadius: "5px",
            backgroundColor: "transparent",
            width: "100%",
            marginBottom: "8px",
            marginTop: "16px"
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

    MuiAvatar: {
      variants: [
        {
          props: { variant: "md" },
          style: {
            "@media (min-width: 0px)": {
              width: "30px",
              height: "30px"
            },
            "@media (min-width: 280px)": {
              width: "40px",
              height: "40px"
            },
            "@media (min-width: 360px)": {
              width: "50px",
              height: "50px"
            },
            "@media (min-width: 576px)": {
              width: "60px",
              height: "60px"
            }
          }
        },
        {
          props: { variant: "xl" },
          style: {
            "@media (min-width: 0px)": {
              width: "30px",
              height: "30px"
            },
            "@media (min-width: 280px)": {
              width: "40px",
              height: "40px"
            },
            "@media (min-width: 360px)": {
              width: "50px",
              height: "50px"
            },
            "@media (min-width: 576px)": {
              width: "120px",
              height: "120px"
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
      s280: 280,
      s320: 320,
      s640: 640
    }
  }
});
