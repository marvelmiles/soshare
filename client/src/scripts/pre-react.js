import { createTheme } from "theme.js";
(function() {
  let id, container, styleSheet;
  function showSpinnerUntilDOMReady() {
    if (id) clearTimeout(id);

    const rootElement = document.getElementById("app-root");

    if (!rootElement) {
      if (!id) {
        const theme = localStorage.getItem("theme") || "light";
        const {
          palette: { primary, background }
        } = createTheme(
          theme === "system"
            ? window.matchMedia?.("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : theme
        );

        const styles = `
        * {
        box-sizing:border-box;
        padding:0;
        margin:0; 
        font-family:'Rubik', sans-serif;
        }

        #react-root {
          display:none;
        }

      .pre-react-loader-container {
        display:flex;
        min-height: 100vh;
        width:100%;
        background-color:${background.default};
        justify-content:center;
        align-items:center;
      }
      
      .brand-icon {  
        display:inline-flex;
        align-items:center;
      }

     .brand-icon, .brand-icon * {
        color:${primary.main};
        font-size:20px; 
        font-weight:600;
        line-height:1.235;
        letter-spacing:0.00735em;
      }
 
      .brand-icon .first-child {
        font-size: 24px;
      }
      
      .brand-icon svg {
        fill:${primary.main};
        width:24px; 
        min-width:0;
        animation: spin 1s infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      `;

        styleSheet = document.createElement("style");
        container = document.createElement("div");

        container.classList.add("pre-react-loader-container");
        container.innerHTML = `<div class="brand-icon"><span class="first-child">S</span><svg  focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DataUsageOutlinedIcon"><path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"></path></svg>share</div>`;
        styleSheet.innerHTML = styles;
        document.head.appendChild(styleSheet);
        document.body.appendChild(container);
      }
    } else if (container) {
      container.remove();
      styleSheet.remove();
      return;
    }

    id = setTimeout(showSpinnerUntilDOMReady, 100);
  }
  showSpinnerUntilDOMReady();
})();
