(() => {
  const initialize = () => {
  const container = document.querySelector(".pf-v5-c-login__container");
  const registrationForm = document.querySelector("#kc-register-form");
  const loginForm = document.querySelector("#kc-form-login");
  const resetForm = document.querySelector("#kc-reset-password-form");

  if (!container || (!registrationForm && !loginForm && !resetForm)) return;

  const isRegistration = Boolean(registrationForm);
  const isReset = Boolean(resetForm);
  const mode = isRegistration ? "signup" : "signin";
  const nextMode = isRegistration ? "signin" : "signup";
  const targetPattern = loginForm
    ? /login-actions\/registration/
    : /login-actions\/authenticate/;
  const targetLink = [...container.querySelectorAll("a[href]")].find((link) =>
    targetPattern.test(link.href),
  );

  if (!targetLink) return;

  const targetUrl = targetLink.href;
  const panel = document.createElement("aside");
  panel.className = "farmora-switch-panel";
  panel.setAttribute(
    "aria-label",
    isRegistration ? "Sign in to Farmora" : isReset ? "Forgot your password?" : "Create a Farmora account",
  );

  const brand = document.createElement("div");
  brand.className = "farmora-switch-brand";

  const logo = document.createElement("img");
  const themeScript = [...document.scripts].find((script) =>
    script.src.includes("/farmora/js/auth-transition.js"),
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
  heading.textContent = isRegistration
    ? "Welcome back."
    : isReset
      ? "A fresh start is close."
      : "Good things grow together.";

  const description = document.createElement("p");
  description.className = "farmora-switch-description";
  description.textContent = isRegistration
    ? "Sign in and keep bringing supply, demand, and delivery into sync."
    : isReset
      ? "Return to sign in whenever you are ready to continue."
      : "Join the network connecting agricultural supply, demand, and logistics.";

  const action = document.createElement("a");
  action.className = "farmora-switch-action";
  action.href = targetUrl;
  action.textContent = isRegistration ? "Sign in" : isReset ? "Back to sign in" : "Create an account";
  action.setAttribute(
    "aria-label",
    isRegistration || isReset ? "Switch to sign in" : "Switch to sign up",
  );

  panel.append(brand, eyebrow, heading, description, action);
  container.append(panel);
  container.classList.add(`auth-mode-${mode}`);

  if (isRegistration) {
    targetLink.remove();
  } else {
    (targetLink.closest("#kc-registration") ?? targetLink).remove();
  }

  const previousMode = sessionStorage.getItem("farmora-auth-mode");
  sessionStorage.removeItem("farmora-auth-mode");

  if (!isReset && previousMode === mode) {
    container.classList.add(mode === "signup" ? "auth-enter-from-right" : "auth-enter-from-left");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.classList.remove("auth-enter-from-right", "auth-enter-from-left");
      });
    });
  }

  const startTransition = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    sessionStorage.setItem("farmora-auth-mode", nextMode);
    container.classList.add(`auth-leaving-to-${nextMode}`);
    window.setTimeout(() => window.location.assign(targetUrl), 660);
  };

  if (!isReset) {
    action.addEventListener("click", startTransition);
    targetLink.addEventListener("click", startTransition);
  }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();