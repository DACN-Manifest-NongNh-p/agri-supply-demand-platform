(() => {
  const COPY = {
    signin: {
      label: "Welcome to Farmora",
      heading: "Welcome back.",
      description: "Sign in and keep bringing supply, demand, and delivery into sync.",
    },
    signup: {
      label: "Join Farmora",
      heading: "Good things grow together.",
      description: "Join the network connecting agricultural supply, demand, and logistics.",
    },
    reset: {
      label: "Reset your Farmora password",
      heading: "A fresh start is close.",
      description: "We will help you get back to coordinating your harvest.",
    },
  };

  // Replaces the native Keycloak switch link text with "<prompt> <link>" under the form.
  const rewriteSwitchLink = (link, prompt, text) => {
    if (!link) return;
    const line = link.parentElement;
    link.textContent = text;
    line.classList.add("farmora-switch-line");
    line.replaceChildren(...(prompt ? [`${prompt} `, link] : [link]));
  };

  const buildPanel = (container, mode) => {
    const copy = COPY[mode];
    const panel = document.createElement("aside");
    panel.className = "farmora-switch-panel";
    panel.setAttribute("aria-label", copy.label);

    const brand = document.createElement("div");
    brand.className = "farmora-switch-brand";

    const logo = document.createElement("img");
    const themeScript = [...document.scripts].find((script) =>
      script.src.includes("/farmora/js/auth-panel.js"),
    );
    if (themeScript) logo.src = new URL("../img/logo.png", themeScript.src).href;
    logo.alt = "";

    const brandName = document.createElement("span");
    brandName.textContent = "Farmora";
    brand.append(logo, brandName);

    const eyebrow = document.createElement("p");
    eyebrow.className = "farmora-switch-eyebrow";
    eyebrow.textContent = "GROW TOGETHER";

    const heading = document.createElement("h2");
    heading.textContent = copy.heading;

    const description = document.createElement("p");
    description.className = "farmora-switch-description";
    description.textContent = copy.description;

    panel.append(brand, eyebrow, heading, description);
    container.append(panel);
    container.classList.add(`auth-mode-${mode}`);
  };

  const initialize = () => {
    const container = document.querySelector(".pf-v5-c-login__container");
    const registrationForm = document.querySelector("#kc-register-form");
    const loginForm = document.querySelector("#kc-form-login");
    const resetForm = document.querySelector("#kc-reset-password-form");

    if (!container || (!registrationForm && !loginForm && !resetForm)) return;

    const mode = registrationForm ? "signup" : resetForm ? "reset" : "signin";
    buildPanel(container, mode);

    const findLink = (pattern) =>
      [...container.querySelectorAll(".pf-v5-c-login__main a[href]")].find((link) =>
        pattern.test(link.href),
      );

    if (mode === "signin") {
      rewriteSwitchLink(findLink(/login-actions\/registration/), "Don't have an account?", "Create an account");
    } else if (mode === "signup") {
      rewriteSwitchLink(findLink(/login-actions\/authenticate/), "Already have an account?", "Sign in");
    } else {
      rewriteSwitchLink(findLink(/login-actions\/authenticate/), "", "Back to sign in");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
