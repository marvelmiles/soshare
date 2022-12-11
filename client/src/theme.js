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
          }
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
            light: "#F0F0F0"
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
    MuiInputBase: {
      styleOverrides: {
        root: {
          paddingLeft: "8px"
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          //   border: "1px solid red",
          svg: {
            // width: "0.85em",
            // height: "0.85em"
          }
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
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          //   fontSize: "24px"
        }
      }
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
      lg: 1200,
      xl: 1536,
      s320: 320
    }
  }
});
