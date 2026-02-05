function escapeHtml(text2) {
  const div = document.createElement("div");
  div.textContent = text2;
  return div.innerHTML;
}
const iconAdd$1 = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M13.3334%208.76191H8.76193V13.3333H7.23812V8.76191H2.66669V7.2381H7.23812V2.66667H8.76193V7.2381H13.3334V8.76191V8.76191Z'%20fill='black'/%3e%3c/svg%3e";
const iconLoading = "data:image/svg+xml,%3csvg%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3ccircle%20cx='12'%20cy='12'%20r='10'%20stroke='%23000000'%20stroke-width='3'%20stroke-linecap='round'%20stroke-dasharray='53.4%209.4'%3e%3canimateTransform%20attributeName='transform'%20type='rotate'%20from='0%2012%2012'%20to='360%2012%2012'%20dur='1s'%20repeatCount='indefinite'/%3e%3c/circle%3e%3c/svg%3e";
const iconArrowRight = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M8%200L6.59%201.41L12.17%207H0V9H12.17L6.59%2014.59L8%2016L16%208L8%200Z'%20fill='black'/%3e%3c/svg%3e";
class PlanListingWidget {
  constructor(container, instance2, callbacks) {
    this.widgetElement = null;
    this.plans = [];
    this.isLoading = false;
    this.overlayElement = null;
    this.suggestions = [];
    this.promptSuggestions = [];
    this.currentSuggestionIndex = 0;
    this.placeholderInterval = null;
    this.isTextareaFocused = false;
    this.container = container;
    this.instance = instance2;
    this.callbacks = callbacks || null;
  }
  render() {
    this.renderContent();
    this.loadPlans();
  }
  async loadPlans() {
    this.isLoading = true;
    this.renderContent();
    try {
      this.plans = await this.instance.apiService.getPlans();
      if (this.plans.length === 0) {
        await this.loadPromptSuggestions();
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      this.plans = [];
    } finally {
      this.isLoading = false;
      this.renderContent();
    }
  }
  async loadPromptSuggestions() {
    try {
      const response = await this.instance.apiService.getSuggestedPrompts(null);
      this.promptSuggestions = response.data || [];
    } catch (error) {
      console.error("Failed to load prompt suggestions:", error);
      this.promptSuggestions = [];
    }
  }
  renderContent() {
    const template = `
      <div class="miso-plan-listing">
        <h1 class="miso-plan-listing__title">Meal Plans</h1>
        ${this.isLoading ? this.renderLoading() : this.renderPlans()}
      </div>
    `;
    this.container.innerHTML = template;
    this.widgetElement = this.container.firstElementChild;
    if (!this.isLoading) {
      this.attachEventListeners();
    }
  }
  renderLoading() {
    return `
      <div class="miso-plan-listing__loading">
        <img src="${iconLoading}" alt="Loading" class="miso-plan-listing__loading-icon" />
      </div>
    `;
  }
  renderPlans() {
    if (this.plans.length === 0) {
      return this.renderEmptyState();
    }
    const planCount = this.plans.length === 1 ? "1 Plan" : `${this.plans.length} Plans`;
    return `
      <div class="miso-plan-listing__header">
        <div class="miso-plan-listing__count">${planCount}</div>
        <button class="miso-plan-listing__new-btn" data-action="create-plan">
          <span>New Plan</span>
          <img src="${iconAdd$1}" alt="" class="miso-plan-listing__new-btn-icon" />
        </button>
      </div>
      <div class="miso-plan-listing__list">
        ${this.plans.map((plan) => this.renderPlanCard(plan)).join("")}
      </div>
    `;
  }
  renderEmptyState() {
    return `
      <div class="miso-plan-listing__empty">
        <button class="miso-plan-listing__new-btn miso-plan-listing__new-btn--top-right" data-action="create-plan">
          <span>New Plan</span>
          <img src="${iconAdd$1}" alt="" class="miso-plan-listing__new-btn-icon" />
        </button>
        <h2 class="miso-plan-listing__empty-title">No Plan Yet</h2>
        <p class="miso-plan-listing__empty-desc">
          Make a <span class="miso-plan-listing__empty-link" data-action="new-plan-link">new plan</span> or get started with one of our prompts below.
        </p>
        ${this.renderPromptCards()}
      </div>
    `;
  }
  renderPromptCards() {
    if (this.promptSuggestions.length === 0) {
      return "";
    }
    const cardsHtml = this.promptSuggestions.map((prompt, index2) => {
      return `
        <div class="miso-plan-listing__prompt-card" data-prompt-index="${index2}">
          ${escapeHtml(prompt)}
        </div>
      `;
    }).join("");
    return `
      <div class="miso-plan-listing__prompt-grid">
        ${cardsHtml}
      </div>
    `;
  }
  renderPlanCard(plan) {
    const recipeCount = plan.n_recipes === 1 ? "1 RECIPE" : `${plan.n_recipes} RECIPES`;
    const createdDate = this.formatDate(plan.created_at);
    return `
      <div class="miso-plan-listing__card" data-plan-id="${plan.id}">
        ${this.renderRecipeImages(plan.recipes)}
        <div class="miso-plan-listing__card-content">
          <div class="miso-plan-listing__card-title">${escapeHtml(plan.title)}</div>
          <div class="miso-plan-listing__card-meta">
            <span class="miso-plan-listing__card-recipes">${recipeCount}</span>
            <div class="miso-plan-listing__card-dot-separator"></div>
            <span class="miso-plan-listing__card-date">CREATED ON ${createdDate}</span>
          </div>
        </div>
      </div>
    `;
  }
  renderRecipeImages(recipes) {
    const displayRecipes = recipes.slice(0, 3);
    const count = displayRecipes.length;
    if (count === 0) {
      return '<div class="miso-plan-listing__card-images"></div>';
    }
    const imageClass = `miso-plan-listing__card-images--${count}`;
    const imagesHtml = displayRecipes.map((recipe, index2) => {
      return `<img src="${recipe.cover_image}" alt="${escapeHtml(recipe.title)}" class="miso-plan-listing__card-image" style="z-index: ${count - index2}" />`;
    }).join("");
    return `<div class="miso-plan-listing__card-images ${imageClass}">${imagesHtml}</div>`;
  }
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  }
  attachEventListeners() {
    if (!this.widgetElement) return;
    const newPlanBtn = this.widgetElement.querySelector('[data-action="create-plan"]');
    if (newPlanBtn) {
      newPlanBtn.addEventListener("click", () => {
        this.showOverlay();
      });
    }
    const newPlanLink = this.widgetElement.querySelector('[data-action="new-plan-link"]');
    if (newPlanLink) {
      newPlanLink.addEventListener("click", () => {
        this.showOverlay();
      });
    }
    const promptCards = this.widgetElement.querySelectorAll("[data-prompt-index]");
    promptCards.forEach((card) => {
      card.addEventListener("click", () => {
        var _a;
        const promptIndex = parseInt(card.dataset.promptIndex || "0", 10);
        const prompt = this.promptSuggestions[promptIndex];
        if (prompt) {
          this.instance.emit("create-plan", prompt);
          if ((_a = this.callbacks) == null ? void 0 : _a.onCreatePlan) {
            this.callbacks.onCreatePlan(prompt);
          }
        }
      });
    });
    const planCards = this.widgetElement.querySelectorAll("[data-plan-id]");
    planCards.forEach((card) => {
      card.addEventListener("click", () => {
        var _a;
        const planId = card.dataset.planId;
        if (planId) {
          this.instance.emit("view-plan", planId);
          if ((_a = this.callbacks) == null ? void 0 : _a.onViewPlan) {
            this.callbacks.onViewPlan(planId);
          }
        }
      });
    });
  }
  async showOverlay() {
    if (this.suggestions.length === 0) {
      await this.loadSuggestions();
    }
    const overlay = document.createElement("div");
    overlay.className = "miso-plan-listing__overlay miso-plan-listing__overlay--show";
    overlay.innerHTML = this.renderOverlay(this.suggestions[0] || "What shall we plan?");
    document.body.appendChild(overlay);
    this.overlayElement = overlay;
    if (this.container.parentElement) {
      this.container.parentElement.style.overflow = "hidden";
    }
    this.attachOverlayListeners();
    const textarea = overlay.querySelector(".miso-plan-listing__overlay-textarea");
    if (textarea) {
      this.autoResizeTextarea(textarea);
      textarea.focus();
    }
    if (this.suggestions.length > 1) {
      this.startPlaceholderCycle();
    }
  }
  async loadSuggestions() {
    try {
      const response = await this.instance.apiService.getSuggestedPrompts(null);
      this.suggestions = response.data || [];
    } catch (error) {
      console.error("Failed to load suggestions:", error);
      this.suggestions = [];
    }
    if (this.suggestions.length === 0) {
      this.suggestions = ["What shall we plan?"];
    }
  }
  renderOverlay(placeholder) {
    return `
      <div class="miso-plan-listing__overlay-background"></div>
      <div class="miso-plan-listing__overlay-content">
        <div class="miso-plan-listing__overlay-textarea-wrapper">
          <textarea 
            class="miso-plan-listing__overlay-textarea" 
            rows="1"
          ></textarea>
          <span class="miso-plan-listing__overlay-placeholder">${escapeHtml(placeholder)}</span>
        </div>
        <button class="miso-plan-listing__overlay-button" disabled data-action="create">
          <span>Create</span>
        </button>
      </div>
    `;
  }
  attachOverlayListeners() {
    if (!this.overlayElement) return;
    const background = this.overlayElement.querySelector(".miso-plan-listing__overlay-background");
    const textarea = this.overlayElement.querySelector(".miso-plan-listing__overlay-textarea");
    const placeholder = this.overlayElement.querySelector(".miso-plan-listing__overlay-placeholder");
    const button = this.overlayElement.querySelector(".miso-plan-listing__overlay-button");
    background == null ? void 0 : background.addEventListener("click", () => {
      this.closeOverlay();
    });
    textarea == null ? void 0 : textarea.addEventListener("input", () => {
      this.autoResizeTextarea(textarea);
      this.updatePlaceholderVisibility();
      this.updateCreateButton();
    });
    placeholder == null ? void 0 : placeholder.addEventListener("click", () => {
      if (!this.isTextareaFocused && textarea.value === "") {
        const currentPlaceholder = placeholder.textContent || "";
        textarea.value = currentPlaceholder;
        this.isTextareaFocused = true;
        this.stopPlaceholderCycle();
        this.autoResizeTextarea(textarea);
        this.updatePlaceholderVisibility();
        this.updateCreateButton();
        textarea.focus();
      }
    });
    textarea == null ? void 0 : textarea.addEventListener("keydown", (e) => {
      this.isTextareaFocused = true;
      this.stopPlaceholderCycle();
      if (e.key === "Enter") {
        if (e.shiftKey) {
          return;
        } else {
          e.preventDefault();
          this.handleCreateClick();
        }
      }
    });
    button == null ? void 0 : button.addEventListener("click", () => {
      this.handleCreateClick();
    });
  }
  autoResizeTextarea(textarea) {
    var _a;
    const placeholder = (_a = this.overlayElement) == null ? void 0 : _a.querySelector(".miso-plan-listing__overlay-placeholder");
    const hasValue = textarea.value.length > 0;
    if (hasValue) {
      const styles = getComputedStyle(textarea);
      const lineHeight = parseFloat(styles.lineHeight);
      const paddingTop = parseFloat(styles.paddingTop);
      const paddingBottom = parseFloat(styles.paddingBottom);
      const currentRows = textarea.rows;
      textarea.rows = 1;
      const contentHeight = textarea.scrollHeight - paddingTop - paddingBottom;
      const lines = Math.round(contentHeight / lineHeight);
      const newRows = Math.min(Math.max(1, lines), 4);
      if (newRows !== currentRows) {
        textarea.rows = newRows;
      } else {
        textarea.rows = currentRows;
      }
    } else if (placeholder) {
      const styles = getComputedStyle(placeholder);
      const lineHeight = parseFloat(styles.lineHeight);
      const paddingTop = parseFloat(styles.paddingTop);
      const paddingBottom = parseFloat(styles.paddingBottom);
      const contentHeight = placeholder.scrollHeight - paddingTop - paddingBottom;
      const lines = Math.round(contentHeight / lineHeight);
      const newRows = Math.min(Math.max(1, lines), 4);
      textarea.rows = newRows;
    } else {
      textarea.rows = 1;
    }
  }
  updatePlaceholderVisibility() {
    if (!this.overlayElement) return;
    const textarea = this.overlayElement.querySelector(".miso-plan-listing__overlay-textarea");
    const placeholder = this.overlayElement.querySelector(".miso-plan-listing__overlay-placeholder");
    if (!textarea || !placeholder) return;
    const shouldHide = textarea.value.length > 0;
    placeholder.style.display = shouldHide ? "none" : "block";
  }
  updateCreateButton() {
    if (!this.overlayElement) return;
    const textarea = this.overlayElement.querySelector(".miso-plan-listing__overlay-textarea");
    const button = this.overlayElement.querySelector(".miso-plan-listing__overlay-button");
    if (!textarea || !button) return;
    const hasContent = textarea.value.trim().length > 0;
    if (hasContent) {
      button.disabled = false;
      button.classList.add("miso-plan-listing__overlay-button--enabled");
      if (!button.querySelector(".miso-plan-listing__overlay-button-icon")) {
        button.innerHTML = `
          <span>Create</span>
          <img src="${iconArrowRight}" alt="" class="miso-plan-listing__overlay-button-icon" />
        `;
      }
    } else {
      button.disabled = true;
      button.classList.remove("miso-plan-listing__overlay-button--enabled");
      button.innerHTML = "<span>Create</span>";
    }
  }
  startPlaceholderCycle() {
    var _a;
    if (this.suggestions.length <= 1 || this.isTextareaFocused) return;
    const placeholder = (_a = this.overlayElement) == null ? void 0 : _a.querySelector(".miso-plan-listing__overlay-placeholder");
    if (!placeholder) return;
    this.placeholderInterval = setInterval(() => {
      if (this.isTextareaFocused) {
        this.stopPlaceholderCycle();
        return;
      }
      this.currentSuggestionIndex = (this.currentSuggestionIndex + 1) % this.suggestions.length;
      placeholder.classList.add("miso-plan-listing__overlay-placeholder--fade-out");
      setTimeout(() => {
        var _a2;
        placeholder.textContent = this.suggestions[this.currentSuggestionIndex];
        placeholder.classList.remove("miso-plan-listing__overlay-placeholder--fade-out");
        placeholder.classList.add("miso-plan-listing__overlay-placeholder--fade-in");
        const textarea = (_a2 = this.overlayElement) == null ? void 0 : _a2.querySelector(".miso-plan-listing__overlay-textarea");
        if (textarea && !textarea.value) {
          this.autoResizeTextarea(textarea);
        }
        setTimeout(() => {
          placeholder.classList.remove("miso-plan-listing__overlay-placeholder--fade-in");
        }, 300);
      }, 300);
    }, 3e3);
  }
  stopPlaceholderCycle() {
    if (this.placeholderInterval) {
      clearInterval(this.placeholderInterval);
      this.placeholderInterval = null;
    }
  }
  handleCreateClick() {
    var _a;
    if (!this.overlayElement) return;
    const textarea = this.overlayElement.querySelector(".miso-plan-listing__overlay-textarea");
    const button = this.overlayElement.querySelector(".miso-plan-listing__overlay-button");
    if (!textarea || !button) return;
    const userMessage = textarea.value.trim();
    if (!userMessage) return;
    textarea.disabled = true;
    button.disabled = true;
    this.closeOverlay();
    this.instance.emit("create-plan", userMessage);
    if ((_a = this.callbacks) == null ? void 0 : _a.onCreatePlan) {
      this.callbacks.onCreatePlan(userMessage);
    }
  }
  closeOverlay() {
    this.stopPlaceholderCycle();
    if (this.overlayElement) {
      this.overlayElement.classList.remove("miso-plan-listing__overlay--show");
      this.overlayElement.classList.add("miso-plan-listing__overlay--hide");
      setTimeout(() => {
        if (this.overlayElement && document.body.contains(this.overlayElement)) {
          document.body.removeChild(this.overlayElement);
          this.overlayElement = null;
        }
      }, 300);
    }
    if (this.container.parentElement) {
      this.container.parentElement.style.overflow = "";
    }
    this.currentSuggestionIndex = 0;
    this.isTextareaFocused = false;
  }
  async getPlans() {
    return this.plans;
  }
  async refreshPlans() {
    await this.loadPlans();
  }
  destroy() {
    this.closeOverlay();
    if (this.widgetElement) {
      this.container.removeChild(this.widgetElement);
      this.widgetElement = null;
    }
    this.plans = [];
    this.suggestions = [];
  }
}
function createInitialState(planId, initialMessage, mode) {
  const resolvedMode = initialMessage ? "edit" : mode || "view";
  return {
    plan: null,
    planId,
    initialMessage,
    mode: resolvedMode,
    isLoading: false,
    isUpdating: false,
    isThinking: false,
    planNotFound: false,
    errorMessage: "",
    favoriteRecipes: [],
    suggestions: [],
    creationPhase: "idle",
    creationMessage: "",
    shouldPreserveScroll: false
  };
}
function createState$1(initialState, handlers2, fallback) {
  let state = { ...initialState };
  return {
    get: () => state,
    set: (partial) => {
      const changedKeys = Object.keys(partial);
      state = { ...state, ...partial };
      let handlerCalled = false;
      for (const key2 of changedKeys) {
        const handler = handlers2[key2];
        if (handler) {
          handler(state[key2], state);
          handlerCalled = true;
        }
      }
      if (!handlerCalled) {
        fallback();
      }
    },
    // Force full re-render regardless of handlers
    refresh: () => fallback()
  };
}
function bail(error) {
  if (error) {
    throw error;
  }
}
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;
var isArray = function isArray2(arr) {
  if (typeof Array.isArray === "function") {
    return Array.isArray(arr);
  }
  return toStr.call(arr) === "[object Array]";
};
var isPlainObject$1 = function isPlainObject(obj) {
  if (!obj || toStr.call(obj) !== "[object Object]") {
    return false;
  }
  var hasOwnConstructor = hasOwn.call(obj, "constructor");
  var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, "isPrototypeOf");
  if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
    return false;
  }
  var key2;
  for (key2 in obj) {
  }
  return typeof key2 === "undefined" || hasOwn.call(obj, key2);
};
var setProperty = function setProperty2(target, options) {
  if (defineProperty && options.name === "__proto__") {
    defineProperty(target, options.name, {
      enumerable: true,
      configurable: true,
      value: options.newValue,
      writable: true
    });
  } else {
    target[options.name] = options.newValue;
  }
};
var getProperty = function getProperty2(obj, name) {
  if (name === "__proto__") {
    if (!hasOwn.call(obj, name)) {
      return void 0;
    } else if (gOPD) {
      return gOPD(obj, name).value;
    }
  }
  return obj[name];
};
var extend$1 = function extend() {
  var options, name, src, copy, copyIsArray, clone;
  var target = arguments[0];
  var i = 1;
  var length = arguments.length;
  var deep = false;
  if (typeof target === "boolean") {
    deep = target;
    target = arguments[1] || {};
    i = 2;
  }
  if (target == null || typeof target !== "object" && typeof target !== "function") {
    target = {};
  }
  for (; i < length; ++i) {
    options = arguments[i];
    if (options != null) {
      for (name in options) {
        src = getProperty(target, name);
        copy = getProperty(options, name);
        if (target !== copy) {
          if (deep && copy && (isPlainObject$1(copy) || (copyIsArray = isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && isArray(src) ? src : [];
            } else {
              clone = src && isPlainObject$1(src) ? src : {};
            }
            setProperty(target, { name, newValue: extend(deep, clone, copy) });
          } else if (typeof copy !== "undefined") {
            setProperty(target, { name, newValue: copy });
          }
        }
      }
    }
  }
  return target;
};
const extend2 = /* @__PURE__ */ getDefaultExportFromCjs(extend$1);
function ok$1() {
}
function isPlainObject2(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}
function trough() {
  const fns = [];
  const pipeline = { run, use };
  return pipeline;
  function run(...values) {
    let middlewareIndex = -1;
    const callback = values.pop();
    if (typeof callback !== "function") {
      throw new TypeError("Expected function as last argument, not " + callback);
    }
    next(null, ...values);
    function next(error, ...output) {
      const fn = fns[++middlewareIndex];
      let index2 = -1;
      if (error) {
        callback(error);
        return;
      }
      while (++index2 < values.length) {
        if (output[index2] === null || output[index2] === void 0) {
          output[index2] = values[index2];
        }
      }
      values = output;
      if (fn) {
        wrap$1(fn, next)(...output);
      } else {
        callback(null, ...output);
      }
    }
  }
  function use(middelware) {
    if (typeof middelware !== "function") {
      throw new TypeError(
        "Expected `middelware` to be a function, not " + middelware
      );
    }
    fns.push(middelware);
    return pipeline;
  }
}
function wrap$1(middleware, callback) {
  let called;
  return wrapped;
  function wrapped(...parameters) {
    const fnExpectsCallback = middleware.length > parameters.length;
    let result;
    if (fnExpectsCallback) {
      parameters.push(done);
    }
    try {
      result = middleware.apply(this, parameters);
    } catch (error) {
      const exception = (
        /** @type {Error} */
        error
      );
      if (fnExpectsCallback && called) {
        throw exception;
      }
      return done(exception);
    }
    if (!fnExpectsCallback) {
      if (result && result.then && typeof result.then === "function") {
        result.then(then, done);
      } else if (result instanceof Error) {
        done(result);
      } else {
        then(result);
      }
    }
  }
  function done(error, ...output) {
    if (!called) {
      called = true;
      callback(error, ...output);
    }
  }
  function then(value) {
    done(null, value);
  }
}
function stringifyPosition(value) {
  if (!value || typeof value !== "object") {
    return "";
  }
  if ("position" in value || "type" in value) {
    return position$1(value.position);
  }
  if ("start" in value || "end" in value) {
    return position$1(value);
  }
  if ("line" in value || "column" in value) {
    return point$2(value);
  }
  return "";
}
function point$2(point2) {
  return index(point2 && point2.line) + ":" + index(point2 && point2.column);
}
function position$1(pos) {
  return point$2(pos && pos.start) + "-" + point$2(pos && pos.end);
}
function index(value) {
  return value && typeof value === "number" ? value : 1;
}
class VFileMessage extends Error {
  /**
   * Create a message for `reason`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {Options | null | undefined} [options]
   * @returns
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | Options | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns
   *   Instance of `VFileMessage`.
   */
  // eslint-disable-next-line complexity
  constructor(causeOrReason, optionsOrParentOrPlace, origin) {
    super();
    if (typeof optionsOrParentOrPlace === "string") {
      origin = optionsOrParentOrPlace;
      optionsOrParentOrPlace = void 0;
    }
    let reason = "";
    let options = {};
    let legacyCause = false;
    if (optionsOrParentOrPlace) {
      if ("line" in optionsOrParentOrPlace && "column" in optionsOrParentOrPlace) {
        options = { place: optionsOrParentOrPlace };
      } else if ("start" in optionsOrParentOrPlace && "end" in optionsOrParentOrPlace) {
        options = { place: optionsOrParentOrPlace };
      } else if ("type" in optionsOrParentOrPlace) {
        options = {
          ancestors: [optionsOrParentOrPlace],
          place: optionsOrParentOrPlace.position
        };
      } else {
        options = { ...optionsOrParentOrPlace };
      }
    }
    if (typeof causeOrReason === "string") {
      reason = causeOrReason;
    } else if (!options.cause && causeOrReason) {
      legacyCause = true;
      reason = causeOrReason.message;
      options.cause = causeOrReason;
    }
    if (!options.ruleId && !options.source && typeof origin === "string") {
      const index2 = origin.indexOf(":");
      if (index2 === -1) {
        options.ruleId = origin;
      } else {
        options.source = origin.slice(0, index2);
        options.ruleId = origin.slice(index2 + 1);
      }
    }
    if (!options.place && options.ancestors && options.ancestors) {
      const parent = options.ancestors[options.ancestors.length - 1];
      if (parent) {
        options.place = parent.position;
      }
    }
    const start = options.place && "start" in options.place ? options.place.start : options.place;
    this.ancestors = options.ancestors || void 0;
    this.cause = options.cause || void 0;
    this.column = start ? start.column : void 0;
    this.fatal = void 0;
    this.file = "";
    this.message = reason;
    this.line = start ? start.line : void 0;
    this.name = stringifyPosition(options.place) || "1:1";
    this.place = options.place || void 0;
    this.reason = this.message;
    this.ruleId = options.ruleId || void 0;
    this.source = options.source || void 0;
    this.stack = legacyCause && options.cause && typeof options.cause.stack === "string" ? options.cause.stack : "";
    this.actual = void 0;
    this.expected = void 0;
    this.note = void 0;
    this.url = void 0;
  }
}
VFileMessage.prototype.file = "";
VFileMessage.prototype.name = "";
VFileMessage.prototype.reason = "";
VFileMessage.prototype.message = "";
VFileMessage.prototype.stack = "";
VFileMessage.prototype.column = void 0;
VFileMessage.prototype.line = void 0;
VFileMessage.prototype.ancestors = void 0;
VFileMessage.prototype.cause = void 0;
VFileMessage.prototype.fatal = void 0;
VFileMessage.prototype.place = void 0;
VFileMessage.prototype.ruleId = void 0;
VFileMessage.prototype.source = void 0;
const minpath = { basename, dirname, extname, join, sep: "/" };
function basename(path2, extname2) {
  if (extname2 !== void 0 && typeof extname2 !== "string") {
    throw new TypeError('"ext" argument must be a string');
  }
  assertPath$1(path2);
  let start = 0;
  let end = -1;
  let index2 = path2.length;
  let seenNonSlash;
  if (extname2 === void 0 || extname2.length === 0 || extname2.length > path2.length) {
    while (index2--) {
      if (path2.codePointAt(index2) === 47) {
        if (seenNonSlash) {
          start = index2 + 1;
          break;
        }
      } else if (end < 0) {
        seenNonSlash = true;
        end = index2 + 1;
      }
    }
    return end < 0 ? "" : path2.slice(start, end);
  }
  if (extname2 === path2) {
    return "";
  }
  let firstNonSlashEnd = -1;
  let extnameIndex = extname2.length - 1;
  while (index2--) {
    if (path2.codePointAt(index2) === 47) {
      if (seenNonSlash) {
        start = index2 + 1;
        break;
      }
    } else {
      if (firstNonSlashEnd < 0) {
        seenNonSlash = true;
        firstNonSlashEnd = index2 + 1;
      }
      if (extnameIndex > -1) {
        if (path2.codePointAt(index2) === extname2.codePointAt(extnameIndex--)) {
          if (extnameIndex < 0) {
            end = index2;
          }
        } else {
          extnameIndex = -1;
          end = firstNonSlashEnd;
        }
      }
    }
  }
  if (start === end) {
    end = firstNonSlashEnd;
  } else if (end < 0) {
    end = path2.length;
  }
  return path2.slice(start, end);
}
function dirname(path2) {
  assertPath$1(path2);
  if (path2.length === 0) {
    return ".";
  }
  let end = -1;
  let index2 = path2.length;
  let unmatchedSlash;
  while (--index2) {
    if (path2.codePointAt(index2) === 47) {
      if (unmatchedSlash) {
        end = index2;
        break;
      }
    } else if (!unmatchedSlash) {
      unmatchedSlash = true;
    }
  }
  return end < 0 ? path2.codePointAt(0) === 47 ? "/" : "." : end === 1 && path2.codePointAt(0) === 47 ? "//" : path2.slice(0, end);
}
function extname(path2) {
  assertPath$1(path2);
  let index2 = path2.length;
  let end = -1;
  let startPart = 0;
  let startDot = -1;
  let preDotState = 0;
  let unmatchedSlash;
  while (index2--) {
    const code2 = path2.codePointAt(index2);
    if (code2 === 47) {
      if (unmatchedSlash) {
        startPart = index2 + 1;
        break;
      }
      continue;
    }
    if (end < 0) {
      unmatchedSlash = true;
      end = index2 + 1;
    }
    if (code2 === 46) {
      if (startDot < 0) {
        startDot = index2;
      } else if (preDotState !== 1) {
        preDotState = 1;
      }
    } else if (startDot > -1) {
      preDotState = -1;
    }
  }
  if (startDot < 0 || end < 0 || // We saw a non-dot character immediately before the dot.
  preDotState === 0 || // The (right-most) trimmed path component is exactly `..`.
  preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return "";
  }
  return path2.slice(startDot, end);
}
function join(...segments) {
  let index2 = -1;
  let joined;
  while (++index2 < segments.length) {
    assertPath$1(segments[index2]);
    if (segments[index2]) {
      joined = joined === void 0 ? segments[index2] : joined + "/" + segments[index2];
    }
  }
  return joined === void 0 ? "." : normalize$1(joined);
}
function normalize$1(path2) {
  assertPath$1(path2);
  const absolute = path2.codePointAt(0) === 47;
  let value = normalizeString(path2, !absolute);
  if (value.length === 0 && !absolute) {
    value = ".";
  }
  if (value.length > 0 && path2.codePointAt(path2.length - 1) === 47) {
    value += "/";
  }
  return absolute ? "/" + value : value;
}
function normalizeString(path2, allowAboveRoot) {
  let result = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let index2 = -1;
  let code2;
  let lastSlashIndex;
  while (++index2 <= path2.length) {
    if (index2 < path2.length) {
      code2 = path2.codePointAt(index2);
    } else if (code2 === 47) {
      break;
    } else {
      code2 = 47;
    }
    if (code2 === 47) {
      if (lastSlash === index2 - 1 || dots === 1) ;
      else if (lastSlash !== index2 - 1 && dots === 2) {
        if (result.length < 2 || lastSegmentLength !== 2 || result.codePointAt(result.length - 1) !== 46 || result.codePointAt(result.length - 2) !== 46) {
          if (result.length > 2) {
            lastSlashIndex = result.lastIndexOf("/");
            if (lastSlashIndex !== result.length - 1) {
              if (lastSlashIndex < 0) {
                result = "";
                lastSegmentLength = 0;
              } else {
                result = result.slice(0, lastSlashIndex);
                lastSegmentLength = result.length - 1 - result.lastIndexOf("/");
              }
              lastSlash = index2;
              dots = 0;
              continue;
            }
          } else if (result.length > 0) {
            result = "";
            lastSegmentLength = 0;
            lastSlash = index2;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          result = result.length > 0 ? result + "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (result.length > 0) {
          result += "/" + path2.slice(lastSlash + 1, index2);
        } else {
          result = path2.slice(lastSlash + 1, index2);
        }
        lastSegmentLength = index2 - lastSlash - 1;
      }
      lastSlash = index2;
      dots = 0;
    } else if (code2 === 46 && dots > -1) {
      dots++;
    } else {
      dots = -1;
    }
  }
  return result;
}
function assertPath$1(path2) {
  if (typeof path2 !== "string") {
    throw new TypeError(
      "Path must be a string. Received " + JSON.stringify(path2)
    );
  }
}
const minproc = { cwd };
function cwd() {
  return "/";
}
function isUrl(fileUrlOrPath) {
  return Boolean(
    fileUrlOrPath !== null && typeof fileUrlOrPath === "object" && "href" in fileUrlOrPath && fileUrlOrPath.href && "protocol" in fileUrlOrPath && fileUrlOrPath.protocol && // @ts-expect-error: indexing is fine.
    fileUrlOrPath.auth === void 0
  );
}
function urlToPath(path2) {
  if (typeof path2 === "string") {
    path2 = new URL(path2);
  } else if (!isUrl(path2)) {
    const error = new TypeError(
      'The "path" argument must be of type string or an instance of URL. Received `' + path2 + "`"
    );
    error.code = "ERR_INVALID_ARG_TYPE";
    throw error;
  }
  if (path2.protocol !== "file:") {
    const error = new TypeError("The URL must be of scheme file");
    error.code = "ERR_INVALID_URL_SCHEME";
    throw error;
  }
  return getPathFromURLPosix(path2);
}
function getPathFromURLPosix(url) {
  if (url.hostname !== "") {
    const error = new TypeError(
      'File URL host must be "localhost" or empty on darwin'
    );
    error.code = "ERR_INVALID_FILE_URL_HOST";
    throw error;
  }
  const pathname = url.pathname;
  let index2 = -1;
  while (++index2 < pathname.length) {
    if (pathname.codePointAt(index2) === 37 && pathname.codePointAt(index2 + 1) === 50) {
      const third = pathname.codePointAt(index2 + 2);
      if (third === 70 || third === 102) {
        const error = new TypeError(
          "File URL path must not include encoded / characters"
        );
        error.code = "ERR_INVALID_FILE_URL_PATH";
        throw error;
      }
    }
  }
  return decodeURIComponent(pathname);
}
const order = (
  /** @type {const} */
  [
    "history",
    "path",
    "basename",
    "stem",
    "extname",
    "dirname"
  ]
);
class VFile {
  /**
   * Create a new virtual file.
   *
   * `options` is treated as:
   *
   * *   `string` or `Uint8Array` — `{value: options}`
   * *   `URL` — `{path: options}`
   * *   `VFile` — shallow copies its data over to the new file
   * *   `object` — all fields are shallow copied over to the new file
   *
   * Path related fields are set in the following order (least specific to
   * most specific): `history`, `path`, `basename`, `stem`, `extname`,
   * `dirname`.
   *
   * You cannot set `dirname` or `extname` without setting either `history`,
   * `path`, `basename`, or `stem` too.
   *
   * @param {Compatible | null | undefined} [value]
   *   File value.
   * @returns
   *   New instance.
   */
  constructor(value) {
    let options;
    if (!value) {
      options = {};
    } else if (isUrl(value)) {
      options = { path: value };
    } else if (typeof value === "string" || isUint8Array$1(value)) {
      options = { value };
    } else {
      options = value;
    }
    this.cwd = "cwd" in options ? "" : minproc.cwd();
    this.data = {};
    this.history = [];
    this.messages = [];
    this.value;
    this.map;
    this.result;
    this.stored;
    let index2 = -1;
    while (++index2 < order.length) {
      const field2 = order[index2];
      if (field2 in options && options[field2] !== void 0 && options[field2] !== null) {
        this[field2] = field2 === "history" ? [...options[field2]] : options[field2];
      }
    }
    let field;
    for (field in options) {
      if (!order.includes(field)) {
        this[field] = options[field];
      }
    }
  }
  /**
   * Get the basename (including extname) (example: `'index.min.js'`).
   *
   * @returns {string | undefined}
   *   Basename.
   */
  get basename() {
    return typeof this.path === "string" ? minpath.basename(this.path) : void 0;
  }
  /**
   * Set basename (including extname) (`'index.min.js'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   *
   * @param {string} basename
   *   Basename.
   * @returns {undefined}
   *   Nothing.
   */
  set basename(basename2) {
    assertNonEmpty(basename2, "basename");
    assertPart(basename2, "basename");
    this.path = minpath.join(this.dirname || "", basename2);
  }
  /**
   * Get the parent path (example: `'~'`).
   *
   * @returns {string | undefined}
   *   Dirname.
   */
  get dirname() {
    return typeof this.path === "string" ? minpath.dirname(this.path) : void 0;
  }
  /**
   * Set the parent path (example: `'~'`).
   *
   * Cannot be set if there’s no `path` yet.
   *
   * @param {string | undefined} dirname
   *   Dirname.
   * @returns {undefined}
   *   Nothing.
   */
  set dirname(dirname2) {
    assertPath(this.basename, "dirname");
    this.path = minpath.join(dirname2 || "", this.basename);
  }
  /**
   * Get the extname (including dot) (example: `'.js'`).
   *
   * @returns {string | undefined}
   *   Extname.
   */
  get extname() {
    return typeof this.path === "string" ? minpath.extname(this.path) : void 0;
  }
  /**
   * Set the extname (including dot) (example: `'.js'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be set if there’s no `path` yet.
   *
   * @param {string | undefined} extname
   *   Extname.
   * @returns {undefined}
   *   Nothing.
   */
  set extname(extname2) {
    assertPart(extname2, "extname");
    assertPath(this.dirname, "extname");
    if (extname2) {
      if (extname2.codePointAt(0) !== 46) {
        throw new Error("`extname` must start with `.`");
      }
      if (extname2.includes(".", 1)) {
        throw new Error("`extname` cannot contain multiple dots");
      }
    }
    this.path = minpath.join(this.dirname, this.stem + (extname2 || ""));
  }
  /**
   * Get the full path (example: `'~/index.min.js'`).
   *
   * @returns {string}
   *   Path.
   */
  get path() {
    return this.history[this.history.length - 1];
  }
  /**
   * Set the full path (example: `'~/index.min.js'`).
   *
   * Cannot be nullified.
   * You can set a file URL (a `URL` object with a `file:` protocol) which will
   * be turned into a path with `url.fileURLToPath`.
   *
   * @param {URL | string} path
   *   Path.
   * @returns {undefined}
   *   Nothing.
   */
  set path(path2) {
    if (isUrl(path2)) {
      path2 = urlToPath(path2);
    }
    assertNonEmpty(path2, "path");
    if (this.path !== path2) {
      this.history.push(path2);
    }
  }
  /**
   * Get the stem (basename w/o extname) (example: `'index.min'`).
   *
   * @returns {string | undefined}
   *   Stem.
   */
  get stem() {
    return typeof this.path === "string" ? minpath.basename(this.path, this.extname) : void 0;
  }
  /**
   * Set the stem (basename w/o extname) (example: `'index.min'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   *
   * @param {string} stem
   *   Stem.
   * @returns {undefined}
   *   Nothing.
   */
  set stem(stem) {
    assertNonEmpty(stem, "stem");
    assertPart(stem, "stem");
    this.path = minpath.join(this.dirname || "", stem + (this.extname || ""));
  }
  // Normal prototypal methods.
  /**
   * Create a fatal message for `reason` associated with the file.
   *
   * The `fatal` field of the message is set to `true` (error; file not usable)
   * and the `file` field is set to the current file path.
   * The message is added to the `messages` field on `file`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {MessageOptions | null | undefined} [options]
   * @returns {never}
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | MessageOptions | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns {never}
   *   Never.
   * @throws {VFileMessage}
   *   Message.
   */
  fail(causeOrReason, optionsOrParentOrPlace, origin) {
    const message = this.message(causeOrReason, optionsOrParentOrPlace, origin);
    message.fatal = true;
    throw message;
  }
  /**
   * Create an info message for `reason` associated with the file.
   *
   * The `fatal` field of the message is set to `undefined` (info; change
   * likely not needed) and the `file` field is set to the current file path.
   * The message is added to the `messages` field on `file`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {MessageOptions | null | undefined} [options]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | MessageOptions | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns {VFileMessage}
   *   Message.
   */
  info(causeOrReason, optionsOrParentOrPlace, origin) {
    const message = this.message(causeOrReason, optionsOrParentOrPlace, origin);
    message.fatal = void 0;
    return message;
  }
  /**
   * Create a message for `reason` associated with the file.
   *
   * The `fatal` field of the message is set to `false` (warning; change may be
   * needed) and the `file` field is set to the current file path.
   * The message is added to the `messages` field on `file`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {MessageOptions | null | undefined} [options]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | MessageOptions | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns {VFileMessage}
   *   Message.
   */
  message(causeOrReason, optionsOrParentOrPlace, origin) {
    const message = new VFileMessage(
      // @ts-expect-error: the overloads are fine.
      causeOrReason,
      optionsOrParentOrPlace,
      origin
    );
    if (this.path) {
      message.name = this.path + ":" + message.name;
      message.file = this.path;
    }
    message.fatal = false;
    this.messages.push(message);
    return message;
  }
  /**
   * Serialize the file.
   *
   * > **Note**: which encodings are supported depends on the engine.
   * > For info on Node.js, see:
   * > <https://nodejs.org/api/util.html#whatwg-supported-encodings>.
   *
   * @param {string | null | undefined} [encoding='utf8']
   *   Character encoding to understand `value` as when it’s a `Uint8Array`
   *   (default: `'utf-8'`).
   * @returns {string}
   *   Serialized file.
   */
  toString(encoding) {
    if (this.value === void 0) {
      return "";
    }
    if (typeof this.value === "string") {
      return this.value;
    }
    const decoder = new TextDecoder(encoding || void 0);
    return decoder.decode(this.value);
  }
}
function assertPart(part, name) {
  if (part && part.includes(minpath.sep)) {
    throw new Error(
      "`" + name + "` cannot be a path: did not expect `" + minpath.sep + "`"
    );
  }
}
function assertNonEmpty(part, name) {
  if (!part) {
    throw new Error("`" + name + "` cannot be empty");
  }
}
function assertPath(path2, name) {
  if (!path2) {
    throw new Error("Setting `" + name + "` requires `path` to be set too");
  }
}
function isUint8Array$1(value) {
  return Boolean(
    value && typeof value === "object" && "byteLength" in value && "byteOffset" in value
  );
}
const CallableInstance = (
  /**
   * @type {new <Parameters extends Array<unknown>, Result>(property: string | symbol) => (...parameters: Parameters) => Result}
   */
  /** @type {unknown} */
  /**
   * @this {Function}
   * @param {string | symbol} property
   * @returns {(...parameters: Array<unknown>) => unknown}
   */
  function(property) {
    const self2 = this;
    const constr = self2.constructor;
    const proto = (
      /** @type {Record<string | symbol, Function>} */
      // Prototypes do exist.
      // type-coverage:ignore-next-line
      constr.prototype
    );
    const value = proto[property];
    const apply = function() {
      return value.apply(apply, arguments);
    };
    Object.setPrototypeOf(apply, proto);
    return apply;
  }
);
const own$5 = {}.hasOwnProperty;
class Processor extends CallableInstance {
  /**
   * Create a processor.
   */
  constructor() {
    super("copy");
    this.Compiler = void 0;
    this.Parser = void 0;
    this.attachers = [];
    this.compiler = void 0;
    this.freezeIndex = -1;
    this.frozen = void 0;
    this.namespace = {};
    this.parser = void 0;
    this.transformers = trough();
  }
  /**
   * Copy a processor.
   *
   * @deprecated
   *   This is a private internal method and should not be used.
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *   New *unfrozen* processor ({@linkcode Processor}) that is
   *   configured to work the same as its ancestor.
   *   When the descendant processor is configured in the future it does not
   *   affect the ancestral processor.
   */
  copy() {
    const destination = (
      /** @type {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>} */
      new Processor()
    );
    let index2 = -1;
    while (++index2 < this.attachers.length) {
      const attacher = this.attachers[index2];
      destination.use(...attacher);
    }
    destination.data(extend2(true, {}, this.namespace));
    return destination;
  }
  /**
   * Configure the processor with info available to all plugins.
   * Information is stored in an object.
   *
   * Typically, options can be given to a specific plugin, but sometimes it
   * makes sense to have information shared with several plugins.
   * For example, a list of HTML elements that are self-closing, which is
   * needed during all phases.
   *
   * > **Note**: setting information cannot occur on *frozen* processors.
   * > Call the processor first to create a new unfrozen processor.
   *
   * > **Note**: to register custom data in TypeScript, augment the
   * > {@linkcode Data} interface.
   *
   * @example
   *   This example show how to get and set info:
   *
   *   ```js
   *   import {unified} from 'unified'
   *
   *   const processor = unified().data('alpha', 'bravo')
   *
   *   processor.data('alpha') // => 'bravo'
   *
   *   processor.data() // => {alpha: 'bravo'}
   *
   *   processor.data({charlie: 'delta'})
   *
   *   processor.data() // => {charlie: 'delta'}
   *   ```
   *
   * @template {keyof Data} Key
   *
   * @overload
   * @returns {Data}
   *
   * @overload
   * @param {Data} dataset
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @overload
   * @param {Key} key
   * @returns {Data[Key]}
   *
   * @overload
   * @param {Key} key
   * @param {Data[Key]} value
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @param {Data | Key} [key]
   *   Key to get or set, or entire dataset to set, or nothing to get the
   *   entire dataset (optional).
   * @param {Data[Key]} [value]
   *   Value to set (optional).
   * @returns {unknown}
   *   The current processor when setting, the value at `key` when getting, or
   *   the entire dataset when getting without key.
   */
  data(key2, value) {
    if (typeof key2 === "string") {
      if (arguments.length === 2) {
        assertUnfrozen("data", this.frozen);
        this.namespace[key2] = value;
        return this;
      }
      return own$5.call(this.namespace, key2) && this.namespace[key2] || void 0;
    }
    if (key2) {
      assertUnfrozen("data", this.frozen);
      this.namespace = key2;
      return this;
    }
    return this.namespace;
  }
  /**
   * Freeze a processor.
   *
   * Frozen processors are meant to be extended and not to be configured
   * directly.
   *
   * When a processor is frozen it cannot be unfrozen.
   * New processors working the same way can be created by calling the
   * processor.
   *
   * It’s possible to freeze processors explicitly by calling `.freeze()`.
   * Processors freeze automatically when `.parse()`, `.run()`, `.runSync()`,
   * `.stringify()`, `.process()`, or `.processSync()` are called.
   *
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *   The current processor.
   */
  freeze() {
    if (this.frozen) {
      return this;
    }
    const self2 = (
      /** @type {Processor} */
      /** @type {unknown} */
      this
    );
    while (++this.freezeIndex < this.attachers.length) {
      const [attacher, ...options] = this.attachers[this.freezeIndex];
      if (options[0] === false) {
        continue;
      }
      if (options[0] === true) {
        options[0] = void 0;
      }
      const transformer = attacher.call(self2, ...options);
      if (typeof transformer === "function") {
        this.transformers.use(transformer);
      }
    }
    this.frozen = true;
    this.freezeIndex = Number.POSITIVE_INFINITY;
    return this;
  }
  /**
   * Parse text to a syntax tree.
   *
   * > **Note**: `parse` freezes the processor if not already *frozen*.
   *
   * > **Note**: `parse` performs the parse phase, not the run phase or other
   * > phases.
   *
   * @param {Compatible | undefined} [file]
   *   file to parse (optional); typically `string` or `VFile`; any value
   *   accepted as `x` in `new VFile(x)`.
   * @returns {ParseTree extends undefined ? Node : ParseTree}
   *   Syntax tree representing `file`.
   */
  parse(file) {
    this.freeze();
    const realFile = vfile(file);
    const parser = this.parser || this.Parser;
    assertParser("parse", parser);
    return parser(String(realFile), realFile);
  }
  /**
   * Process the given file as configured on the processor.
   *
   * > **Note**: `process` freezes the processor if not already *frozen*.
   *
   * > **Note**: `process` performs the parse, run, and stringify phases.
   *
   * @overload
   * @param {Compatible | undefined} file
   * @param {ProcessCallback<VFileWithOutput<CompileResult>>} done
   * @returns {undefined}
   *
   * @overload
   * @param {Compatible | undefined} [file]
   * @returns {Promise<VFileWithOutput<CompileResult>>}
   *
   * @param {Compatible | undefined} [file]
   *   File (optional); typically `string` or `VFile`]; any value accepted as
   *   `x` in `new VFile(x)`.
   * @param {ProcessCallback<VFileWithOutput<CompileResult>> | undefined} [done]
   *   Callback (optional).
   * @returns {Promise<VFile> | undefined}
   *   Nothing if `done` is given.
   *   Otherwise a promise, rejected with a fatal error or resolved with the
   *   processed file.
   *
   *   The parsed, transformed, and compiled value is available at
   *   `file.value` (see note).
   *
   *   > **Note**: unified typically compiles by serializing: most
   *   > compilers return `string` (or `Uint8Array`).
   *   > Some compilers, such as the one configured with
   *   > [`rehype-react`][rehype-react], return other values (in this case, a
   *   > React tree).
   *   > If you’re using a compiler that doesn’t serialize, expect different
   *   > result values.
   *   >
   *   > To register custom results in TypeScript, add them to
   *   > {@linkcode CompileResultMap}.
   *
   *   [rehype-react]: https://github.com/rehypejs/rehype-react
   */
  process(file, done) {
    const self2 = this;
    this.freeze();
    assertParser("process", this.parser || this.Parser);
    assertCompiler("process", this.compiler || this.Compiler);
    return done ? executor(void 0, done) : new Promise(executor);
    function executor(resolve, reject) {
      const realFile = vfile(file);
      const parseTree = (
        /** @type {HeadTree extends undefined ? Node : HeadTree} */
        /** @type {unknown} */
        self2.parse(realFile)
      );
      self2.run(parseTree, realFile, function(error, tree, file2) {
        if (error || !tree || !file2) {
          return realDone(error);
        }
        const compileTree = (
          /** @type {CompileTree extends undefined ? Node : CompileTree} */
          /** @type {unknown} */
          tree
        );
        const compileResult = self2.stringify(compileTree, file2);
        if (looksLikeAValue(compileResult)) {
          file2.value = compileResult;
        } else {
          file2.result = compileResult;
        }
        realDone(
          error,
          /** @type {VFileWithOutput<CompileResult>} */
          file2
        );
      });
      function realDone(error, file2) {
        if (error || !file2) {
          reject(error);
        } else if (resolve) {
          resolve(file2);
        } else {
          done(void 0, file2);
        }
      }
    }
  }
  /**
   * Process the given file as configured on the processor.
   *
   * An error is thrown if asynchronous transforms are configured.
   *
   * > **Note**: `processSync` freezes the processor if not already *frozen*.
   *
   * > **Note**: `processSync` performs the parse, run, and stringify phases.
   *
   * @param {Compatible | undefined} [file]
   *   File (optional); typically `string` or `VFile`; any value accepted as
   *   `x` in `new VFile(x)`.
   * @returns {VFileWithOutput<CompileResult>}
   *   The processed file.
   *
   *   The parsed, transformed, and compiled value is available at
   *   `file.value` (see note).
   *
   *   > **Note**: unified typically compiles by serializing: most
   *   > compilers return `string` (or `Uint8Array`).
   *   > Some compilers, such as the one configured with
   *   > [`rehype-react`][rehype-react], return other values (in this case, a
   *   > React tree).
   *   > If you’re using a compiler that doesn’t serialize, expect different
   *   > result values.
   *   >
   *   > To register custom results in TypeScript, add them to
   *   > {@linkcode CompileResultMap}.
   *
   *   [rehype-react]: https://github.com/rehypejs/rehype-react
   */
  processSync(file) {
    let complete = false;
    let result;
    this.freeze();
    assertParser("processSync", this.parser || this.Parser);
    assertCompiler("processSync", this.compiler || this.Compiler);
    this.process(file, realDone);
    assertDone("processSync", "process", complete);
    return result;
    function realDone(error, file2) {
      complete = true;
      bail(error);
      result = file2;
    }
  }
  /**
   * Run *transformers* on a syntax tree.
   *
   * > **Note**: `run` freezes the processor if not already *frozen*.
   *
   * > **Note**: `run` performs the run phase, not other phases.
   *
   * @overload
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   * @param {RunCallback<TailTree extends undefined ? Node : TailTree>} done
   * @returns {undefined}
   *
   * @overload
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   * @param {Compatible | undefined} file
   * @param {RunCallback<TailTree extends undefined ? Node : TailTree>} done
   * @returns {undefined}
   *
   * @overload
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   * @param {Compatible | undefined} [file]
   * @returns {Promise<TailTree extends undefined ? Node : TailTree>}
   *
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   *   Tree to transform and inspect.
   * @param {(
   *   RunCallback<TailTree extends undefined ? Node : TailTree> |
   *   Compatible
   * )} [file]
   *   File associated with `node` (optional); any value accepted as `x` in
   *   `new VFile(x)`.
   * @param {RunCallback<TailTree extends undefined ? Node : TailTree>} [done]
   *   Callback (optional).
   * @returns {Promise<TailTree extends undefined ? Node : TailTree> | undefined}
   *   Nothing if `done` is given.
   *   Otherwise, a promise rejected with a fatal error or resolved with the
   *   transformed tree.
   */
  run(tree, file, done) {
    assertNode(tree);
    this.freeze();
    const transformers = this.transformers;
    if (!done && typeof file === "function") {
      done = file;
      file = void 0;
    }
    return done ? executor(void 0, done) : new Promise(executor);
    function executor(resolve, reject) {
      const realFile = vfile(file);
      transformers.run(tree, realFile, realDone);
      function realDone(error, outputTree, file2) {
        const resultingTree = (
          /** @type {TailTree extends undefined ? Node : TailTree} */
          outputTree || tree
        );
        if (error) {
          reject(error);
        } else if (resolve) {
          resolve(resultingTree);
        } else {
          done(void 0, resultingTree, file2);
        }
      }
    }
  }
  /**
   * Run *transformers* on a syntax tree.
   *
   * An error is thrown if asynchronous transforms are configured.
   *
   * > **Note**: `runSync` freezes the processor if not already *frozen*.
   *
   * > **Note**: `runSync` performs the run phase, not other phases.
   *
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   *   Tree to transform and inspect.
   * @param {Compatible | undefined} [file]
   *   File associated with `node` (optional); any value accepted as `x` in
   *   `new VFile(x)`.
   * @returns {TailTree extends undefined ? Node : TailTree}
   *   Transformed tree.
   */
  runSync(tree, file) {
    let complete = false;
    let result;
    this.run(tree, file, realDone);
    assertDone("runSync", "run", complete);
    return result;
    function realDone(error, tree2) {
      bail(error);
      result = tree2;
      complete = true;
    }
  }
  /**
   * Compile a syntax tree.
   *
   * > **Note**: `stringify` freezes the processor if not already *frozen*.
   *
   * > **Note**: `stringify` performs the stringify phase, not the run phase
   * > or other phases.
   *
   * @param {CompileTree extends undefined ? Node : CompileTree} tree
   *   Tree to compile.
   * @param {Compatible | undefined} [file]
   *   File associated with `node` (optional); any value accepted as `x` in
   *   `new VFile(x)`.
   * @returns {CompileResult extends undefined ? Value : CompileResult}
   *   Textual representation of the tree (see note).
   *
   *   > **Note**: unified typically compiles by serializing: most compilers
   *   > return `string` (or `Uint8Array`).
   *   > Some compilers, such as the one configured with
   *   > [`rehype-react`][rehype-react], return other values (in this case, a
   *   > React tree).
   *   > If you’re using a compiler that doesn’t serialize, expect different
   *   > result values.
   *   >
   *   > To register custom results in TypeScript, add them to
   *   > {@linkcode CompileResultMap}.
   *
   *   [rehype-react]: https://github.com/rehypejs/rehype-react
   */
  stringify(tree, file) {
    this.freeze();
    const realFile = vfile(file);
    const compiler2 = this.compiler || this.Compiler;
    assertCompiler("stringify", compiler2);
    assertNode(tree);
    return compiler2(tree, realFile);
  }
  /**
   * Configure the processor to use a plugin, a list of usable values, or a
   * preset.
   *
   * If the processor is already using a plugin, the previous plugin
   * configuration is changed based on the options that are passed in.
   * In other words, the plugin is not added a second time.
   *
   * > **Note**: `use` cannot be called on *frozen* processors.
   * > Call the processor first to create a new unfrozen processor.
   *
   * @example
   *   There are many ways to pass plugins to `.use()`.
   *   This example gives an overview:
   *
   *   ```js
   *   import {unified} from 'unified'
   *
   *   unified()
   *     // Plugin with options:
   *     .use(pluginA, {x: true, y: true})
   *     // Passing the same plugin again merges configuration (to `{x: true, y: false, z: true}`):
   *     .use(pluginA, {y: false, z: true})
   *     // Plugins:
   *     .use([pluginB, pluginC])
   *     // Two plugins, the second with options:
   *     .use([pluginD, [pluginE, {}]])
   *     // Preset with plugins and settings:
   *     .use({plugins: [pluginF, [pluginG, {}]], settings: {position: false}})
   *     // Settings only:
   *     .use({settings: {position: false}})
   *   ```
   *
   * @template {Array<unknown>} [Parameters=[]]
   * @template {Node | string | undefined} [Input=undefined]
   * @template [Output=Input]
   *
   * @overload
   * @param {Preset | null | undefined} [preset]
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @overload
   * @param {PluggableList} list
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @overload
   * @param {Plugin<Parameters, Input, Output>} plugin
   * @param {...(Parameters | [boolean])} parameters
   * @returns {UsePlugin<ParseTree, HeadTree, TailTree, CompileTree, CompileResult, Input, Output>}
   *
   * @param {PluggableList | Plugin | Preset | null | undefined} value
   *   Usable value.
   * @param {...unknown} parameters
   *   Parameters, when a plugin is given as a usable value.
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *   Current processor.
   */
  use(value, ...parameters) {
    const attachers = this.attachers;
    const namespace = this.namespace;
    assertUnfrozen("use", this.frozen);
    if (value === null || value === void 0) ;
    else if (typeof value === "function") {
      addPlugin(value, parameters);
    } else if (typeof value === "object") {
      if (Array.isArray(value)) {
        addList(value);
      } else {
        addPreset(value);
      }
    } else {
      throw new TypeError("Expected usable value, not `" + value + "`");
    }
    return this;
    function add(value2) {
      if (typeof value2 === "function") {
        addPlugin(value2, []);
      } else if (typeof value2 === "object") {
        if (Array.isArray(value2)) {
          const [plugin, ...parameters2] = (
            /** @type {PluginTuple<Array<unknown>>} */
            value2
          );
          addPlugin(plugin, parameters2);
        } else {
          addPreset(value2);
        }
      } else {
        throw new TypeError("Expected usable value, not `" + value2 + "`");
      }
    }
    function addPreset(result) {
      if (!("plugins" in result) && !("settings" in result)) {
        throw new Error(
          "Expected usable value but received an empty preset, which is probably a mistake: presets typically come with `plugins` and sometimes with `settings`, but this has neither"
        );
      }
      addList(result.plugins);
      if (result.settings) {
        namespace.settings = extend2(true, namespace.settings, result.settings);
      }
    }
    function addList(plugins) {
      let index2 = -1;
      if (plugins === null || plugins === void 0) ;
      else if (Array.isArray(plugins)) {
        while (++index2 < plugins.length) {
          const thing = plugins[index2];
          add(thing);
        }
      } else {
        throw new TypeError("Expected a list of plugins, not `" + plugins + "`");
      }
    }
    function addPlugin(plugin, parameters2) {
      let index2 = -1;
      let entryIndex = -1;
      while (++index2 < attachers.length) {
        if (attachers[index2][0] === plugin) {
          entryIndex = index2;
          break;
        }
      }
      if (entryIndex === -1) {
        attachers.push([plugin, ...parameters2]);
      } else if (parameters2.length > 0) {
        let [primary, ...rest] = parameters2;
        const currentPrimary = attachers[entryIndex][1];
        if (isPlainObject2(currentPrimary) && isPlainObject2(primary)) {
          primary = extend2(true, currentPrimary, primary);
        }
        attachers[entryIndex] = [plugin, primary, ...rest];
      }
    }
  }
}
const unified = new Processor().freeze();
function assertParser(name, value) {
  if (typeof value !== "function") {
    throw new TypeError("Cannot `" + name + "` without `parser`");
  }
}
function assertCompiler(name, value) {
  if (typeof value !== "function") {
    throw new TypeError("Cannot `" + name + "` without `compiler`");
  }
}
function assertUnfrozen(name, frozen) {
  if (frozen) {
    throw new Error(
      "Cannot call `" + name + "` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`."
    );
  }
}
function assertNode(node2) {
  if (!isPlainObject2(node2) || typeof node2.type !== "string") {
    throw new TypeError("Expected node, got `" + node2 + "`");
  }
}
function assertDone(name, asyncName, complete) {
  if (!complete) {
    throw new Error(
      "`" + name + "` finished async. Use `" + asyncName + "` instead"
    );
  }
}
function vfile(value) {
  return looksLikeAVFile(value) ? value : new VFile(value);
}
function looksLikeAVFile(value) {
  return Boolean(
    value && typeof value === "object" && "message" in value && "messages" in value
  );
}
function looksLikeAValue(value) {
  return typeof value === "string" || isUint8Array(value);
}
function isUint8Array(value) {
  return Boolean(
    value && typeof value === "object" && "byteLength" in value && "byteOffset" in value
  );
}
const emptyOptions$3 = {};
function toString$1(value, options) {
  const settings = emptyOptions$3;
  const includeImageAlt = typeof settings.includeImageAlt === "boolean" ? settings.includeImageAlt : true;
  const includeHtml = typeof settings.includeHtml === "boolean" ? settings.includeHtml : true;
  return one$1(value, includeImageAlt, includeHtml);
}
function one$1(value, includeImageAlt, includeHtml) {
  if (node(value)) {
    if ("value" in value) {
      return value.type === "html" && !includeHtml ? "" : value.value;
    }
    if (includeImageAlt && "alt" in value && value.alt) {
      return value.alt;
    }
    if ("children" in value) {
      return all$1(value.children, includeImageAlt, includeHtml);
    }
  }
  if (Array.isArray(value)) {
    return all$1(value, includeImageAlt, includeHtml);
  }
  return "";
}
function all$1(values, includeImageAlt, includeHtml) {
  const result = [];
  let index2 = -1;
  while (++index2 < values.length) {
    result[index2] = one$1(values[index2], includeImageAlt, includeHtml);
  }
  return result.join("");
}
function node(value) {
  return Boolean(value && typeof value === "object");
}
const element$1 = document.createElement("i");
function decodeNamedCharacterReference(value) {
  const characterReference2 = "&" + value + ";";
  element$1.innerHTML = characterReference2;
  const character = element$1.textContent;
  if (character.charCodeAt(character.length - 1) === 59 && value !== "semi") {
    return false;
  }
  return character === characterReference2 ? false : character;
}
function splice(list2, start, remove, items) {
  const end = list2.length;
  let chunkStart = 0;
  let parameters;
  if (start < 0) {
    start = -start > end ? 0 : end + start;
  } else {
    start = start > end ? end : start;
  }
  remove = remove > 0 ? remove : 0;
  if (items.length < 1e4) {
    parameters = Array.from(items);
    parameters.unshift(start, remove);
    list2.splice(...parameters);
  } else {
    if (remove) list2.splice(start, remove);
    while (chunkStart < items.length) {
      parameters = items.slice(chunkStart, chunkStart + 1e4);
      parameters.unshift(start, 0);
      list2.splice(...parameters);
      chunkStart += 1e4;
      start += 1e4;
    }
  }
}
function push(list2, items) {
  if (list2.length > 0) {
    splice(list2, list2.length, 0, items);
    return list2;
  }
  return items;
}
const hasOwnProperty = {}.hasOwnProperty;
function combineExtensions(extensions) {
  const all2 = {};
  let index2 = -1;
  while (++index2 < extensions.length) {
    syntaxExtension(all2, extensions[index2]);
  }
  return all2;
}
function syntaxExtension(all2, extension2) {
  let hook;
  for (hook in extension2) {
    const maybe = hasOwnProperty.call(all2, hook) ? all2[hook] : void 0;
    const left = maybe || (all2[hook] = {});
    const right = extension2[hook];
    let code2;
    if (right) {
      for (code2 in right) {
        if (!hasOwnProperty.call(left, code2)) left[code2] = [];
        const value = right[code2];
        constructs(
          // @ts-expect-error Looks like a list.
          left[code2],
          Array.isArray(value) ? value : value ? [value] : []
        );
      }
    }
  }
}
function constructs(existing, list2) {
  let index2 = -1;
  const before = [];
  while (++index2 < list2.length) {
    (list2[index2].add === "after" ? existing : before).push(list2[index2]);
  }
  splice(existing, 0, 0, before);
}
function decodeNumericCharacterReference(value, base) {
  const code2 = Number.parseInt(value, base);
  if (
    // C0 except for HT, LF, FF, CR, space.
    code2 < 9 || code2 === 11 || code2 > 13 && code2 < 32 || // Control character (DEL) of C0, and C1 controls.
    code2 > 126 && code2 < 160 || // Lone high surrogates and low surrogates.
    code2 > 55295 && code2 < 57344 || // Noncharacters.
    code2 > 64975 && code2 < 65008 || /* eslint-disable no-bitwise */
    (code2 & 65535) === 65535 || (code2 & 65535) === 65534 || /* eslint-enable no-bitwise */
    // Out of range
    code2 > 1114111
  ) {
    return "�";
  }
  return String.fromCodePoint(code2);
}
function normalizeIdentifier(value) {
  return value.replace(/[\t\n\r ]+/g, " ").replace(/^ | $/g, "").toLowerCase().toUpperCase();
}
const asciiAlpha = regexCheck(/[A-Za-z]/);
const asciiAlphanumeric = regexCheck(/[\dA-Za-z]/);
const asciiAtext = regexCheck(/[#-'*+\--9=?A-Z^-~]/);
function asciiControl(code2) {
  return (
    // Special whitespace codes (which have negative values), C0 and Control
    // character DEL
    code2 !== null && (code2 < 32 || code2 === 127)
  );
}
const asciiDigit = regexCheck(/\d/);
const asciiHexDigit = regexCheck(/[\dA-Fa-f]/);
const asciiPunctuation = regexCheck(/[!-/:-@[-`{-~]/);
function markdownLineEnding(code2) {
  return code2 !== null && code2 < -2;
}
function markdownLineEndingOrSpace(code2) {
  return code2 !== null && (code2 < 0 || code2 === 32);
}
function markdownSpace(code2) {
  return code2 === -2 || code2 === -1 || code2 === 32;
}
const unicodePunctuation = regexCheck(new RegExp("\\p{P}|\\p{S}", "u"));
const unicodeWhitespace = regexCheck(/\s/);
function regexCheck(regex) {
  return check;
  function check(code2) {
    return code2 !== null && code2 > -1 && regex.test(String.fromCharCode(code2));
  }
}
function normalizeUri(value) {
  const result = [];
  let index2 = -1;
  let start = 0;
  let skip = 0;
  while (++index2 < value.length) {
    const code2 = value.charCodeAt(index2);
    let replace2 = "";
    if (code2 === 37 && asciiAlphanumeric(value.charCodeAt(index2 + 1)) && asciiAlphanumeric(value.charCodeAt(index2 + 2))) {
      skip = 2;
    } else if (code2 < 128) {
      if (!/[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(code2))) {
        replace2 = String.fromCharCode(code2);
      }
    } else if (code2 > 55295 && code2 < 57344) {
      const next = value.charCodeAt(index2 + 1);
      if (code2 < 56320 && next > 56319 && next < 57344) {
        replace2 = String.fromCharCode(code2, next);
        skip = 1;
      } else {
        replace2 = "�";
      }
    } else {
      replace2 = String.fromCharCode(code2);
    }
    if (replace2) {
      result.push(value.slice(start, index2), encodeURIComponent(replace2));
      start = index2 + skip + 1;
      replace2 = "";
    }
    if (skip) {
      index2 += skip;
      skip = 0;
    }
  }
  return result.join("") + value.slice(start);
}
function factorySpace(effects, ok2, type, max) {
  const limit = max ? max - 1 : Number.POSITIVE_INFINITY;
  let size = 0;
  return start;
  function start(code2) {
    if (markdownSpace(code2)) {
      effects.enter(type);
      return prefix(code2);
    }
    return ok2(code2);
  }
  function prefix(code2) {
    if (markdownSpace(code2) && size++ < limit) {
      effects.consume(code2);
      return prefix;
    }
    effects.exit(type);
    return ok2(code2);
  }
}
const content$1 = {
  tokenize: initializeContent
};
function initializeContent(effects) {
  const contentStart = effects.attempt(this.parser.constructs.contentInitial, afterContentStartConstruct, paragraphInitial);
  let previous2;
  return contentStart;
  function afterContentStartConstruct(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, contentStart, "linePrefix");
  }
  function paragraphInitial(code2) {
    effects.enter("paragraph");
    return lineStart(code2);
  }
  function lineStart(code2) {
    const token = effects.enter("chunkText", {
      contentType: "text",
      previous: previous2
    });
    if (previous2) {
      previous2.next = token;
    }
    previous2 = token;
    return data(code2);
  }
  function data(code2) {
    if (code2 === null) {
      effects.exit("chunkText");
      effects.exit("paragraph");
      effects.consume(code2);
      return;
    }
    if (markdownLineEnding(code2)) {
      effects.consume(code2);
      effects.exit("chunkText");
      return lineStart;
    }
    effects.consume(code2);
    return data;
  }
}
const document$2 = {
  tokenize: initializeDocument
};
const containerConstruct = {
  tokenize: tokenizeContainer
};
function initializeDocument(effects) {
  const self2 = this;
  const stack = [];
  let continued = 0;
  let childFlow;
  let childToken;
  let lineStartOffset;
  return start;
  function start(code2) {
    if (continued < stack.length) {
      const item = stack[continued];
      self2.containerState = item[1];
      return effects.attempt(item[0].continuation, documentContinue, checkNewContainers)(code2);
    }
    return checkNewContainers(code2);
  }
  function documentContinue(code2) {
    continued++;
    if (self2.containerState._closeFlow) {
      self2.containerState._closeFlow = void 0;
      if (childFlow) {
        closeFlow();
      }
      const indexBeforeExits = self2.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let point2;
      while (indexBeforeFlow--) {
        if (self2.events[indexBeforeFlow][0] === "exit" && self2.events[indexBeforeFlow][1].type === "chunkFlow") {
          point2 = self2.events[indexBeforeFlow][1].end;
          break;
        }
      }
      exitContainers(continued);
      let index2 = indexBeforeExits;
      while (index2 < self2.events.length) {
        self2.events[index2][1].end = {
          ...point2
        };
        index2++;
      }
      splice(self2.events, indexBeforeFlow + 1, 0, self2.events.slice(indexBeforeExits));
      self2.events.length = index2;
      return checkNewContainers(code2);
    }
    return start(code2);
  }
  function checkNewContainers(code2) {
    if (continued === stack.length) {
      if (!childFlow) {
        return documentContinued(code2);
      }
      if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) {
        return flowStart(code2);
      }
      self2.interrupt = Boolean(childFlow.currentConstruct && !childFlow._gfmTableDynamicInterruptHack);
    }
    self2.containerState = {};
    return effects.check(containerConstruct, thereIsANewContainer, thereIsNoNewContainer)(code2);
  }
  function thereIsANewContainer(code2) {
    if (childFlow) closeFlow();
    exitContainers(continued);
    return documentContinued(code2);
  }
  function thereIsNoNewContainer(code2) {
    self2.parser.lazy[self2.now().line] = continued !== stack.length;
    lineStartOffset = self2.now().offset;
    return flowStart(code2);
  }
  function documentContinued(code2) {
    self2.containerState = {};
    return effects.attempt(containerConstruct, containerContinue, flowStart)(code2);
  }
  function containerContinue(code2) {
    continued++;
    stack.push([self2.currentConstruct, self2.containerState]);
    return documentContinued(code2);
  }
  function flowStart(code2) {
    if (code2 === null) {
      if (childFlow) closeFlow();
      exitContainers(0);
      effects.consume(code2);
      return;
    }
    childFlow = childFlow || self2.parser.flow(self2.now());
    effects.enter("chunkFlow", {
      _tokenizer: childFlow,
      contentType: "flow",
      previous: childToken
    });
    return flowContinue(code2);
  }
  function flowContinue(code2) {
    if (code2 === null) {
      writeToChild(effects.exit("chunkFlow"), true);
      exitContainers(0);
      effects.consume(code2);
      return;
    }
    if (markdownLineEnding(code2)) {
      effects.consume(code2);
      writeToChild(effects.exit("chunkFlow"));
      continued = 0;
      self2.interrupt = void 0;
      return start;
    }
    effects.consume(code2);
    return flowContinue;
  }
  function writeToChild(token, endOfFile) {
    const stream = self2.sliceStream(token);
    if (endOfFile) stream.push(null);
    token.previous = childToken;
    if (childToken) childToken.next = token;
    childToken = token;
    childFlow.defineSkip(token.start);
    childFlow.write(stream);
    if (self2.parser.lazy[token.start.line]) {
      let index2 = childFlow.events.length;
      while (index2--) {
        if (
          // The token starts before the line ending…
          childFlow.events[index2][1].start.offset < lineStartOffset && // …and either is not ended yet…
          (!childFlow.events[index2][1].end || // …or ends after it.
          childFlow.events[index2][1].end.offset > lineStartOffset)
        ) {
          return;
        }
      }
      const indexBeforeExits = self2.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let seen;
      let point2;
      while (indexBeforeFlow--) {
        if (self2.events[indexBeforeFlow][0] === "exit" && self2.events[indexBeforeFlow][1].type === "chunkFlow") {
          if (seen) {
            point2 = self2.events[indexBeforeFlow][1].end;
            break;
          }
          seen = true;
        }
      }
      exitContainers(continued);
      index2 = indexBeforeExits;
      while (index2 < self2.events.length) {
        self2.events[index2][1].end = {
          ...point2
        };
        index2++;
      }
      splice(self2.events, indexBeforeFlow + 1, 0, self2.events.slice(indexBeforeExits));
      self2.events.length = index2;
    }
  }
  function exitContainers(size) {
    let index2 = stack.length;
    while (index2-- > size) {
      const entry = stack[index2];
      self2.containerState = entry[1];
      entry[0].exit.call(self2, effects);
    }
    stack.length = size;
  }
  function closeFlow() {
    childFlow.write([null]);
    childToken = void 0;
    childFlow = void 0;
    self2.containerState._closeFlow = void 0;
  }
}
function tokenizeContainer(effects, ok2, nok) {
  return factorySpace(effects, effects.attempt(this.parser.constructs.document, ok2, nok), "linePrefix", this.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
}
function classifyCharacter(code2) {
  if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
    return 1;
  }
  if (unicodePunctuation(code2)) {
    return 2;
  }
}
function resolveAll(constructs2, events, context) {
  const called = [];
  let index2 = -1;
  while (++index2 < constructs2.length) {
    const resolve = constructs2[index2].resolveAll;
    if (resolve && !called.includes(resolve)) {
      events = resolve(events, context);
      called.push(resolve);
    }
  }
  return events;
}
const attention = {
  name: "attention",
  resolveAll: resolveAllAttention,
  tokenize: tokenizeAttention
};
function resolveAllAttention(events, context) {
  let index2 = -1;
  let open;
  let group;
  let text2;
  let openingSequence;
  let closingSequence;
  let use;
  let nextEvents;
  let offset;
  while (++index2 < events.length) {
    if (events[index2][0] === "enter" && events[index2][1].type === "attentionSequence" && events[index2][1]._close) {
      open = index2;
      while (open--) {
        if (events[open][0] === "exit" && events[open][1].type === "attentionSequence" && events[open][1]._open && // If the markers are the same:
        context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index2][1]).charCodeAt(0)) {
          if ((events[open][1]._close || events[index2][1]._open) && (events[index2][1].end.offset - events[index2][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index2][1].end.offset - events[index2][1].start.offset) % 3)) {
            continue;
          }
          use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index2][1].end.offset - events[index2][1].start.offset > 1 ? 2 : 1;
          const start = {
            ...events[open][1].end
          };
          const end = {
            ...events[index2][1].start
          };
          movePoint(start, -use);
          movePoint(end, use);
          openingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start,
            end: {
              ...events[open][1].end
            }
          };
          closingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start: {
              ...events[index2][1].start
            },
            end
          };
          text2 = {
            type: use > 1 ? "strongText" : "emphasisText",
            start: {
              ...events[open][1].end
            },
            end: {
              ...events[index2][1].start
            }
          };
          group = {
            type: use > 1 ? "strong" : "emphasis",
            start: {
              ...openingSequence.start
            },
            end: {
              ...closingSequence.end
            }
          };
          events[open][1].end = {
            ...openingSequence.start
          };
          events[index2][1].start = {
            ...closingSequence.end
          };
          nextEvents = [];
          if (events[open][1].end.offset - events[open][1].start.offset) {
            nextEvents = push(nextEvents, [["enter", events[open][1], context], ["exit", events[open][1], context]]);
          }
          nextEvents = push(nextEvents, [["enter", group, context], ["enter", openingSequence, context], ["exit", openingSequence, context], ["enter", text2, context]]);
          nextEvents = push(nextEvents, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + 1, index2), context));
          nextEvents = push(nextEvents, [["exit", text2, context], ["enter", closingSequence, context], ["exit", closingSequence, context], ["exit", group, context]]);
          if (events[index2][1].end.offset - events[index2][1].start.offset) {
            offset = 2;
            nextEvents = push(nextEvents, [["enter", events[index2][1], context], ["exit", events[index2][1], context]]);
          } else {
            offset = 0;
          }
          splice(events, open - 1, index2 - open + 3, nextEvents);
          index2 = open + nextEvents.length - offset - 2;
          break;
        }
      }
    }
  }
  index2 = -1;
  while (++index2 < events.length) {
    if (events[index2][1].type === "attentionSequence") {
      events[index2][1].type = "data";
    }
  }
  return events;
}
function tokenizeAttention(effects, ok2) {
  const attentionMarkers2 = this.parser.constructs.attentionMarkers.null;
  const previous2 = this.previous;
  const before = classifyCharacter(previous2);
  let marker;
  return start;
  function start(code2) {
    marker = code2;
    effects.enter("attentionSequence");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      return inside;
    }
    const token = effects.exit("attentionSequence");
    const after = classifyCharacter(code2);
    const open = !after || after === 2 && before || attentionMarkers2.includes(code2);
    const close = !before || before === 2 && after || attentionMarkers2.includes(previous2);
    token._open = Boolean(marker === 42 ? open : open && (before || !close));
    token._close = Boolean(marker === 42 ? close : close && (after || !open));
    return ok2(code2);
  }
}
function movePoint(point2, offset) {
  point2.column += offset;
  point2.offset += offset;
  point2._bufferIndex += offset;
}
const autolink = {
  name: "autolink",
  tokenize: tokenizeAutolink
};
function tokenizeAutolink(effects, ok2, nok) {
  let size = 0;
  return start;
  function start(code2) {
    effects.enter("autolink");
    effects.enter("autolinkMarker");
    effects.consume(code2);
    effects.exit("autolinkMarker");
    effects.enter("autolinkProtocol");
    return open;
  }
  function open(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return schemeOrEmailAtext;
    }
    if (code2 === 64) {
      return nok(code2);
    }
    return emailAtext(code2);
  }
  function schemeOrEmailAtext(code2) {
    if (code2 === 43 || code2 === 45 || code2 === 46 || asciiAlphanumeric(code2)) {
      size = 1;
      return schemeInsideOrEmailAtext(code2);
    }
    return emailAtext(code2);
  }
  function schemeInsideOrEmailAtext(code2) {
    if (code2 === 58) {
      effects.consume(code2);
      size = 0;
      return urlInside;
    }
    if ((code2 === 43 || code2 === 45 || code2 === 46 || asciiAlphanumeric(code2)) && size++ < 32) {
      effects.consume(code2);
      return schemeInsideOrEmailAtext;
    }
    size = 0;
    return emailAtext(code2);
  }
  function urlInside(code2) {
    if (code2 === 62) {
      effects.exit("autolinkProtocol");
      effects.enter("autolinkMarker");
      effects.consume(code2);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok2;
    }
    if (code2 === null || code2 === 32 || code2 === 60 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return urlInside;
  }
  function emailAtext(code2) {
    if (code2 === 64) {
      effects.consume(code2);
      return emailAtSignOrDot;
    }
    if (asciiAtext(code2)) {
      effects.consume(code2);
      return emailAtext;
    }
    return nok(code2);
  }
  function emailAtSignOrDot(code2) {
    return asciiAlphanumeric(code2) ? emailLabel(code2) : nok(code2);
  }
  function emailLabel(code2) {
    if (code2 === 46) {
      effects.consume(code2);
      size = 0;
      return emailAtSignOrDot;
    }
    if (code2 === 62) {
      effects.exit("autolinkProtocol").type = "autolinkEmail";
      effects.enter("autolinkMarker");
      effects.consume(code2);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok2;
    }
    return emailValue(code2);
  }
  function emailValue(code2) {
    if ((code2 === 45 || asciiAlphanumeric(code2)) && size++ < 63) {
      const next = code2 === 45 ? emailValue : emailLabel;
      effects.consume(code2);
      return next;
    }
    return nok(code2);
  }
}
const blankLine = {
  partial: true,
  tokenize: tokenizeBlankLine
};
function tokenizeBlankLine(effects, ok2, nok) {
  return start;
  function start(code2) {
    return markdownSpace(code2) ? factorySpace(effects, after, "linePrefix")(code2) : after(code2);
  }
  function after(code2) {
    return code2 === null || markdownLineEnding(code2) ? ok2(code2) : nok(code2);
  }
}
const blockQuote = {
  continuation: {
    tokenize: tokenizeBlockQuoteContinuation
  },
  exit: exit$1,
  name: "blockQuote",
  tokenize: tokenizeBlockQuoteStart
};
function tokenizeBlockQuoteStart(effects, ok2, nok) {
  const self2 = this;
  return start;
  function start(code2) {
    if (code2 === 62) {
      const state = self2.containerState;
      if (!state.open) {
        effects.enter("blockQuote", {
          _container: true
        });
        state.open = true;
      }
      effects.enter("blockQuotePrefix");
      effects.enter("blockQuoteMarker");
      effects.consume(code2);
      effects.exit("blockQuoteMarker");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (markdownSpace(code2)) {
      effects.enter("blockQuotePrefixWhitespace");
      effects.consume(code2);
      effects.exit("blockQuotePrefixWhitespace");
      effects.exit("blockQuotePrefix");
      return ok2;
    }
    effects.exit("blockQuotePrefix");
    return ok2(code2);
  }
}
function tokenizeBlockQuoteContinuation(effects, ok2, nok) {
  const self2 = this;
  return contStart;
  function contStart(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, contBefore, "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
    }
    return contBefore(code2);
  }
  function contBefore(code2) {
    return effects.attempt(blockQuote, ok2, nok)(code2);
  }
}
function exit$1(effects) {
  effects.exit("blockQuote");
}
const characterEscape = {
  name: "characterEscape",
  tokenize: tokenizeCharacterEscape
};
function tokenizeCharacterEscape(effects, ok2, nok) {
  return start;
  function start(code2) {
    effects.enter("characterEscape");
    effects.enter("escapeMarker");
    effects.consume(code2);
    effects.exit("escapeMarker");
    return inside;
  }
  function inside(code2) {
    if (asciiPunctuation(code2)) {
      effects.enter("characterEscapeValue");
      effects.consume(code2);
      effects.exit("characterEscapeValue");
      effects.exit("characterEscape");
      return ok2;
    }
    return nok(code2);
  }
}
const characterReference = {
  name: "characterReference",
  tokenize: tokenizeCharacterReference
};
function tokenizeCharacterReference(effects, ok2, nok) {
  const self2 = this;
  let size = 0;
  let max;
  let test;
  return start;
  function start(code2) {
    effects.enter("characterReference");
    effects.enter("characterReferenceMarker");
    effects.consume(code2);
    effects.exit("characterReferenceMarker");
    return open;
  }
  function open(code2) {
    if (code2 === 35) {
      effects.enter("characterReferenceMarkerNumeric");
      effects.consume(code2);
      effects.exit("characterReferenceMarkerNumeric");
      return numeric;
    }
    effects.enter("characterReferenceValue");
    max = 31;
    test = asciiAlphanumeric;
    return value(code2);
  }
  function numeric(code2) {
    if (code2 === 88 || code2 === 120) {
      effects.enter("characterReferenceMarkerHexadecimal");
      effects.consume(code2);
      effects.exit("characterReferenceMarkerHexadecimal");
      effects.enter("characterReferenceValue");
      max = 6;
      test = asciiHexDigit;
      return value;
    }
    effects.enter("characterReferenceValue");
    max = 7;
    test = asciiDigit;
    return value(code2);
  }
  function value(code2) {
    if (code2 === 59 && size) {
      const token = effects.exit("characterReferenceValue");
      if (test === asciiAlphanumeric && !decodeNamedCharacterReference(self2.sliceSerialize(token))) {
        return nok(code2);
      }
      effects.enter("characterReferenceMarker");
      effects.consume(code2);
      effects.exit("characterReferenceMarker");
      effects.exit("characterReference");
      return ok2;
    }
    if (test(code2) && size++ < max) {
      effects.consume(code2);
      return value;
    }
    return nok(code2);
  }
}
const nonLazyContinuation = {
  partial: true,
  tokenize: tokenizeNonLazyContinuation
};
const codeFenced = {
  concrete: true,
  name: "codeFenced",
  tokenize: tokenizeCodeFenced
};
function tokenizeCodeFenced(effects, ok2, nok) {
  const self2 = this;
  const closeStart = {
    partial: true,
    tokenize: tokenizeCloseStart
  };
  let initialPrefix = 0;
  let sizeOpen = 0;
  let marker;
  return start;
  function start(code2) {
    return beforeSequenceOpen(code2);
  }
  function beforeSequenceOpen(code2) {
    const tail = self2.events[self2.events.length - 1];
    initialPrefix = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
    marker = code2;
    effects.enter("codeFenced");
    effects.enter("codeFencedFence");
    effects.enter("codeFencedFenceSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === marker) {
      sizeOpen++;
      effects.consume(code2);
      return sequenceOpen;
    }
    if (sizeOpen < 3) {
      return nok(code2);
    }
    effects.exit("codeFencedFenceSequence");
    return markdownSpace(code2) ? factorySpace(effects, infoBefore, "whitespace")(code2) : infoBefore(code2);
  }
  function infoBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFencedFence");
      return self2.interrupt ? ok2(code2) : effects.check(nonLazyContinuation, atNonLazyBreak, after)(code2);
    }
    effects.enter("codeFencedFenceInfo");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return info(code2);
  }
  function info(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return infoBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return factorySpace(effects, metaBefore, "whitespace")(code2);
    }
    if (code2 === 96 && code2 === marker) {
      return nok(code2);
    }
    effects.consume(code2);
    return info;
  }
  function metaBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return infoBefore(code2);
    }
    effects.enter("codeFencedFenceMeta");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return meta(code2);
  }
  function meta(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceMeta");
      return infoBefore(code2);
    }
    if (code2 === 96 && code2 === marker) {
      return nok(code2);
    }
    effects.consume(code2);
    return meta;
  }
  function atNonLazyBreak(code2) {
    return effects.attempt(closeStart, after, contentBefore)(code2);
  }
  function contentBefore(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return contentStart;
  }
  function contentStart(code2) {
    return initialPrefix > 0 && markdownSpace(code2) ? factorySpace(effects, beforeContentChunk, "linePrefix", initialPrefix + 1)(code2) : beforeContentChunk(code2);
  }
  function beforeContentChunk(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return effects.check(nonLazyContinuation, atNonLazyBreak, after)(code2);
    }
    effects.enter("codeFlowValue");
    return contentChunk(code2);
  }
  function contentChunk(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFlowValue");
      return beforeContentChunk(code2);
    }
    effects.consume(code2);
    return contentChunk;
  }
  function after(code2) {
    effects.exit("codeFenced");
    return ok2(code2);
  }
  function tokenizeCloseStart(effects2, ok3, nok2) {
    let size = 0;
    return startBefore;
    function startBefore(code2) {
      effects2.enter("lineEnding");
      effects2.consume(code2);
      effects2.exit("lineEnding");
      return start2;
    }
    function start2(code2) {
      effects2.enter("codeFencedFence");
      return markdownSpace(code2) ? factorySpace(effects2, beforeSequenceClose, "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2) : beforeSequenceClose(code2);
    }
    function beforeSequenceClose(code2) {
      if (code2 === marker) {
        effects2.enter("codeFencedFenceSequence");
        return sequenceClose(code2);
      }
      return nok2(code2);
    }
    function sequenceClose(code2) {
      if (code2 === marker) {
        size++;
        effects2.consume(code2);
        return sequenceClose;
      }
      if (size >= sizeOpen) {
        effects2.exit("codeFencedFenceSequence");
        return markdownSpace(code2) ? factorySpace(effects2, sequenceCloseAfter, "whitespace")(code2) : sequenceCloseAfter(code2);
      }
      return nok2(code2);
    }
    function sequenceCloseAfter(code2) {
      if (code2 === null || markdownLineEnding(code2)) {
        effects2.exit("codeFencedFence");
        return ok3(code2);
      }
      return nok2(code2);
    }
  }
}
function tokenizeNonLazyContinuation(effects, ok2, nok) {
  const self2 = this;
  return start;
  function start(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return lineStart;
  }
  function lineStart(code2) {
    return self2.parser.lazy[self2.now().line] ? nok(code2) : ok2(code2);
  }
}
const codeIndented = {
  name: "codeIndented",
  tokenize: tokenizeCodeIndented
};
const furtherStart = {
  partial: true,
  tokenize: tokenizeFurtherStart
};
function tokenizeCodeIndented(effects, ok2, nok) {
  const self2 = this;
  return start;
  function start(code2) {
    effects.enter("codeIndented");
    return factorySpace(effects, afterPrefix, "linePrefix", 4 + 1)(code2);
  }
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4 ? atBreak(code2) : nok(code2);
  }
  function atBreak(code2) {
    if (code2 === null) {
      return after(code2);
    }
    if (markdownLineEnding(code2)) {
      return effects.attempt(furtherStart, atBreak, after)(code2);
    }
    effects.enter("codeFlowValue");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFlowValue");
      return atBreak(code2);
    }
    effects.consume(code2);
    return inside;
  }
  function after(code2) {
    effects.exit("codeIndented");
    return ok2(code2);
  }
}
function tokenizeFurtherStart(effects, ok2, nok) {
  const self2 = this;
  return furtherStart2;
  function furtherStart2(code2) {
    if (self2.parser.lazy[self2.now().line]) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return furtherStart2;
    }
    return factorySpace(effects, afterPrefix, "linePrefix", 4 + 1)(code2);
  }
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4 ? ok2(code2) : markdownLineEnding(code2) ? furtherStart2(code2) : nok(code2);
  }
}
const codeText = {
  name: "codeText",
  previous: previous$1,
  resolve: resolveCodeText,
  tokenize: tokenizeCodeText
};
function resolveCodeText(events) {
  let tailExitIndex = events.length - 4;
  let headEnterIndex = 3;
  let index2;
  let enter;
  if ((events[headEnterIndex][1].type === "lineEnding" || events[headEnterIndex][1].type === "space") && (events[tailExitIndex][1].type === "lineEnding" || events[tailExitIndex][1].type === "space")) {
    index2 = headEnterIndex;
    while (++index2 < tailExitIndex) {
      if (events[index2][1].type === "codeTextData") {
        events[headEnterIndex][1].type = "codeTextPadding";
        events[tailExitIndex][1].type = "codeTextPadding";
        headEnterIndex += 2;
        tailExitIndex -= 2;
        break;
      }
    }
  }
  index2 = headEnterIndex - 1;
  tailExitIndex++;
  while (++index2 <= tailExitIndex) {
    if (enter === void 0) {
      if (index2 !== tailExitIndex && events[index2][1].type !== "lineEnding") {
        enter = index2;
      }
    } else if (index2 === tailExitIndex || events[index2][1].type === "lineEnding") {
      events[enter][1].type = "codeTextData";
      if (index2 !== enter + 2) {
        events[enter][1].end = events[index2 - 1][1].end;
        events.splice(enter + 2, index2 - enter - 2);
        tailExitIndex -= index2 - enter - 2;
        index2 = enter + 2;
      }
      enter = void 0;
    }
  }
  return events;
}
function previous$1(code2) {
  return code2 !== 96 || this.events[this.events.length - 1][1].type === "characterEscape";
}
function tokenizeCodeText(effects, ok2, nok) {
  let sizeOpen = 0;
  let size;
  let token;
  return start;
  function start(code2) {
    effects.enter("codeText");
    effects.enter("codeTextSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === 96) {
      effects.consume(code2);
      sizeOpen++;
      return sequenceOpen;
    }
    effects.exit("codeTextSequence");
    return between(code2);
  }
  function between(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 32) {
      effects.enter("space");
      effects.consume(code2);
      effects.exit("space");
      return between;
    }
    if (code2 === 96) {
      token = effects.enter("codeTextSequence");
      size = 0;
      return sequenceClose(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return between;
    }
    effects.enter("codeTextData");
    return data(code2);
  }
  function data(code2) {
    if (code2 === null || code2 === 32 || code2 === 96 || markdownLineEnding(code2)) {
      effects.exit("codeTextData");
      return between(code2);
    }
    effects.consume(code2);
    return data;
  }
  function sequenceClose(code2) {
    if (code2 === 96) {
      effects.consume(code2);
      size++;
      return sequenceClose;
    }
    if (size === sizeOpen) {
      effects.exit("codeTextSequence");
      effects.exit("codeText");
      return ok2(code2);
    }
    token.type = "codeTextData";
    return data(code2);
  }
}
class SpliceBuffer {
  /**
   * @param {ReadonlyArray<T> | null | undefined} [initial]
   *   Initial items (optional).
   * @returns
   *   Splice buffer.
   */
  constructor(initial) {
    this.left = initial ? [...initial] : [];
    this.right = [];
  }
  /**
   * Array access;
   * does not move the cursor.
   *
   * @param {number} index
   *   Index.
   * @return {T}
   *   Item.
   */
  get(index2) {
    if (index2 < 0 || index2 >= this.left.length + this.right.length) {
      throw new RangeError("Cannot access index `" + index2 + "` in a splice buffer of size `" + (this.left.length + this.right.length) + "`");
    }
    if (index2 < this.left.length) return this.left[index2];
    return this.right[this.right.length - index2 + this.left.length - 1];
  }
  /**
   * The length of the splice buffer, one greater than the largest index in the
   * array.
   */
  get length() {
    return this.left.length + this.right.length;
  }
  /**
   * Remove and return `list[0]`;
   * moves the cursor to `0`.
   *
   * @returns {T | undefined}
   *   Item, optional.
   */
  shift() {
    this.setCursor(0);
    return this.right.pop();
  }
  /**
   * Slice the buffer to get an array;
   * does not move the cursor.
   *
   * @param {number} start
   *   Start.
   * @param {number | null | undefined} [end]
   *   End (optional).
   * @returns {Array<T>}
   *   Array of items.
   */
  slice(start, end) {
    const stop = end === null || end === void 0 ? Number.POSITIVE_INFINITY : end;
    if (stop < this.left.length) {
      return this.left.slice(start, stop);
    }
    if (start > this.left.length) {
      return this.right.slice(this.right.length - stop + this.left.length, this.right.length - start + this.left.length).reverse();
    }
    return this.left.slice(start).concat(this.right.slice(this.right.length - stop + this.left.length).reverse());
  }
  /**
   * Mimics the behavior of Array.prototype.splice() except for the change of
   * interface necessary to avoid segfaults when patching in very large arrays.
   *
   * This operation moves cursor is moved to `start` and results in the cursor
   * placed after any inserted items.
   *
   * @param {number} start
   *   Start;
   *   zero-based index at which to start changing the array;
   *   negative numbers count backwards from the end of the array and values
   *   that are out-of bounds are clamped to the appropriate end of the array.
   * @param {number | null | undefined} [deleteCount=0]
   *   Delete count (default: `0`);
   *   maximum number of elements to delete, starting from start.
   * @param {Array<T> | null | undefined} [items=[]]
   *   Items to include in place of the deleted items (default: `[]`).
   * @return {Array<T>}
   *   Any removed items.
   */
  splice(start, deleteCount, items) {
    const count = deleteCount || 0;
    this.setCursor(Math.trunc(start));
    const removed = this.right.splice(this.right.length - count, Number.POSITIVE_INFINITY);
    if (items) chunkedPush(this.left, items);
    return removed.reverse();
  }
  /**
   * Remove and return the highest-numbered item in the array, so
   * `list[list.length - 1]`;
   * Moves the cursor to `length`.
   *
   * @returns {T | undefined}
   *   Item, optional.
   */
  pop() {
    this.setCursor(Number.POSITIVE_INFINITY);
    return this.left.pop();
  }
  /**
   * Inserts a single item to the high-numbered side of the array;
   * moves the cursor to `length`.
   *
   * @param {T} item
   *   Item.
   * @returns {undefined}
   *   Nothing.
   */
  push(item) {
    this.setCursor(Number.POSITIVE_INFINITY);
    this.left.push(item);
  }
  /**
   * Inserts many items to the high-numbered side of the array.
   * Moves the cursor to `length`.
   *
   * @param {Array<T>} items
   *   Items.
   * @returns {undefined}
   *   Nothing.
   */
  pushMany(items) {
    this.setCursor(Number.POSITIVE_INFINITY);
    chunkedPush(this.left, items);
  }
  /**
   * Inserts a single item to the low-numbered side of the array;
   * Moves the cursor to `0`.
   *
   * @param {T} item
   *   Item.
   * @returns {undefined}
   *   Nothing.
   */
  unshift(item) {
    this.setCursor(0);
    this.right.push(item);
  }
  /**
   * Inserts many items to the low-numbered side of the array;
   * moves the cursor to `0`.
   *
   * @param {Array<T>} items
   *   Items.
   * @returns {undefined}
   *   Nothing.
   */
  unshiftMany(items) {
    this.setCursor(0);
    chunkedPush(this.right, items.reverse());
  }
  /**
   * Move the cursor to a specific position in the array. Requires
   * time proportional to the distance moved.
   *
   * If `n < 0`, the cursor will end up at the beginning.
   * If `n > length`, the cursor will end up at the end.
   *
   * @param {number} n
   *   Position.
   * @return {undefined}
   *   Nothing.
   */
  setCursor(n) {
    if (n === this.left.length || n > this.left.length && this.right.length === 0 || n < 0 && this.left.length === 0) return;
    if (n < this.left.length) {
      const removed = this.left.splice(n, Number.POSITIVE_INFINITY);
      chunkedPush(this.right, removed.reverse());
    } else {
      const removed = this.right.splice(this.left.length + this.right.length - n, Number.POSITIVE_INFINITY);
      chunkedPush(this.left, removed.reverse());
    }
  }
}
function chunkedPush(list2, right) {
  let chunkStart = 0;
  if (right.length < 1e4) {
    list2.push(...right);
  } else {
    while (chunkStart < right.length) {
      list2.push(...right.slice(chunkStart, chunkStart + 1e4));
      chunkStart += 1e4;
    }
  }
}
function subtokenize(eventsArray) {
  const jumps = {};
  let index2 = -1;
  let event;
  let lineIndex;
  let otherIndex;
  let otherEvent;
  let parameters;
  let subevents;
  let more;
  const events = new SpliceBuffer(eventsArray);
  while (++index2 < events.length) {
    while (index2 in jumps) {
      index2 = jumps[index2];
    }
    event = events.get(index2);
    if (index2 && event[1].type === "chunkFlow" && events.get(index2 - 1)[1].type === "listItemPrefix") {
      subevents = event[1]._tokenizer.events;
      otherIndex = 0;
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "lineEndingBlank") {
        otherIndex += 2;
      }
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "content") {
        while (++otherIndex < subevents.length) {
          if (subevents[otherIndex][1].type === "content") {
            break;
          }
          if (subevents[otherIndex][1].type === "chunkText") {
            subevents[otherIndex][1]._isInFirstContentOfListItem = true;
            otherIndex++;
          }
        }
      }
    }
    if (event[0] === "enter") {
      if (event[1].contentType) {
        Object.assign(jumps, subcontent(events, index2));
        index2 = jumps[index2];
        more = true;
      }
    } else if (event[1]._container) {
      otherIndex = index2;
      lineIndex = void 0;
      while (otherIndex--) {
        otherEvent = events.get(otherIndex);
        if (otherEvent[1].type === "lineEnding" || otherEvent[1].type === "lineEndingBlank") {
          if (otherEvent[0] === "enter") {
            if (lineIndex) {
              events.get(lineIndex)[1].type = "lineEndingBlank";
            }
            otherEvent[1].type = "lineEnding";
            lineIndex = otherIndex;
          }
        } else if (otherEvent[1].type === "linePrefix" || otherEvent[1].type === "listItemIndent") ;
        else {
          break;
        }
      }
      if (lineIndex) {
        event[1].end = {
          ...events.get(lineIndex)[1].start
        };
        parameters = events.slice(lineIndex, index2);
        parameters.unshift(event);
        events.splice(lineIndex, index2 - lineIndex + 1, parameters);
      }
    }
  }
  splice(eventsArray, 0, Number.POSITIVE_INFINITY, events.slice(0));
  return !more;
}
function subcontent(events, eventIndex) {
  const token = events.get(eventIndex)[1];
  const context = events.get(eventIndex)[2];
  let startPosition = eventIndex - 1;
  const startPositions = [];
  let tokenizer = token._tokenizer;
  if (!tokenizer) {
    tokenizer = context.parser[token.contentType](token.start);
    if (token._contentTypeTextTrailing) {
      tokenizer._contentTypeTextTrailing = true;
    }
  }
  const childEvents = tokenizer.events;
  const jumps = [];
  const gaps = {};
  let stream;
  let previous2;
  let index2 = -1;
  let current = token;
  let adjust = 0;
  let start = 0;
  const breaks = [start];
  while (current) {
    while (events.get(++startPosition)[1] !== current) {
    }
    startPositions.push(startPosition);
    if (!current._tokenizer) {
      stream = context.sliceStream(current);
      if (!current.next) {
        stream.push(null);
      }
      if (previous2) {
        tokenizer.defineSkip(current.start);
      }
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = true;
      }
      tokenizer.write(stream);
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = void 0;
      }
    }
    previous2 = current;
    current = current.next;
  }
  current = token;
  while (++index2 < childEvents.length) {
    if (
      // Find a void token that includes a break.
      childEvents[index2][0] === "exit" && childEvents[index2 - 1][0] === "enter" && childEvents[index2][1].type === childEvents[index2 - 1][1].type && childEvents[index2][1].start.line !== childEvents[index2][1].end.line
    ) {
      start = index2 + 1;
      breaks.push(start);
      current._tokenizer = void 0;
      current.previous = void 0;
      current = current.next;
    }
  }
  tokenizer.events = [];
  if (current) {
    current._tokenizer = void 0;
    current.previous = void 0;
  } else {
    breaks.pop();
  }
  index2 = breaks.length;
  while (index2--) {
    const slice = childEvents.slice(breaks[index2], breaks[index2 + 1]);
    const start2 = startPositions.pop();
    jumps.push([start2, start2 + slice.length - 1]);
    events.splice(start2, 2, slice);
  }
  jumps.reverse();
  index2 = -1;
  while (++index2 < jumps.length) {
    gaps[adjust + jumps[index2][0]] = adjust + jumps[index2][1];
    adjust += jumps[index2][1] - jumps[index2][0] - 1;
  }
  return gaps;
}
const content = {
  resolve: resolveContent,
  tokenize: tokenizeContent
};
const continuationConstruct = {
  partial: true,
  tokenize: tokenizeContinuation
};
function resolveContent(events) {
  subtokenize(events);
  return events;
}
function tokenizeContent(effects, ok2) {
  let previous2;
  return chunkStart;
  function chunkStart(code2) {
    effects.enter("content");
    previous2 = effects.enter("chunkContent", {
      contentType: "content"
    });
    return chunkInside(code2);
  }
  function chunkInside(code2) {
    if (code2 === null) {
      return contentEnd(code2);
    }
    if (markdownLineEnding(code2)) {
      return effects.check(continuationConstruct, contentContinue, contentEnd)(code2);
    }
    effects.consume(code2);
    return chunkInside;
  }
  function contentEnd(code2) {
    effects.exit("chunkContent");
    effects.exit("content");
    return ok2(code2);
  }
  function contentContinue(code2) {
    effects.consume(code2);
    effects.exit("chunkContent");
    previous2.next = effects.enter("chunkContent", {
      contentType: "content",
      previous: previous2
    });
    previous2 = previous2.next;
    return chunkInside;
  }
}
function tokenizeContinuation(effects, ok2, nok) {
  const self2 = this;
  return startLookahead;
  function startLookahead(code2) {
    effects.exit("chunkContent");
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, prefixed, "linePrefix");
  }
  function prefixed(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return nok(code2);
    }
    const tail = self2.events[self2.events.length - 1];
    if (!self2.parser.constructs.disable.null.includes("codeIndented") && tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4) {
      return ok2(code2);
    }
    return effects.interrupt(self2.parser.constructs.flow, nok, ok2)(code2);
  }
}
function factoryDestination(effects, ok2, nok, type, literalType, literalMarkerType, rawType, stringType, max) {
  const limit = max || Number.POSITIVE_INFINITY;
  let balance = 0;
  return start;
  function start(code2) {
    if (code2 === 60) {
      effects.enter(type);
      effects.enter(literalType);
      effects.enter(literalMarkerType);
      effects.consume(code2);
      effects.exit(literalMarkerType);
      return enclosedBefore;
    }
    if (code2 === null || code2 === 32 || code2 === 41 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.enter(type);
    effects.enter(rawType);
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return raw2(code2);
  }
  function enclosedBefore(code2) {
    if (code2 === 62) {
      effects.enter(literalMarkerType);
      effects.consume(code2);
      effects.exit(literalMarkerType);
      effects.exit(literalType);
      effects.exit(type);
      return ok2;
    }
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return enclosed(code2);
  }
  function enclosed(code2) {
    if (code2 === 62) {
      effects.exit("chunkString");
      effects.exit(stringType);
      return enclosedBefore(code2);
    }
    if (code2 === null || code2 === 60 || markdownLineEnding(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? enclosedEscape : enclosed;
  }
  function enclosedEscape(code2) {
    if (code2 === 60 || code2 === 62 || code2 === 92) {
      effects.consume(code2);
      return enclosed;
    }
    return enclosed(code2);
  }
  function raw2(code2) {
    if (!balance && (code2 === null || code2 === 41 || markdownLineEndingOrSpace(code2))) {
      effects.exit("chunkString");
      effects.exit(stringType);
      effects.exit(rawType);
      effects.exit(type);
      return ok2(code2);
    }
    if (balance < limit && code2 === 40) {
      effects.consume(code2);
      balance++;
      return raw2;
    }
    if (code2 === 41) {
      effects.consume(code2);
      balance--;
      return raw2;
    }
    if (code2 === null || code2 === 32 || code2 === 40 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? rawEscape : raw2;
  }
  function rawEscape(code2) {
    if (code2 === 40 || code2 === 41 || code2 === 92) {
      effects.consume(code2);
      return raw2;
    }
    return raw2(code2);
  }
}
function factoryLabel(effects, ok2, nok, type, markerType, stringType) {
  const self2 = this;
  let size = 0;
  let seen;
  return start;
  function start(code2) {
    effects.enter(type);
    effects.enter(markerType);
    effects.consume(code2);
    effects.exit(markerType);
    effects.enter(stringType);
    return atBreak;
  }
  function atBreak(code2) {
    if (size > 999 || code2 === null || code2 === 91 || code2 === 93 && !seen || // To do: remove in the future once we’ve switched from
    // `micromark-extension-footnote` to `micromark-extension-gfm-footnote`,
    // which doesn’t need this.
    // Hidden footnotes hook.
    /* c8 ignore next 3 */
    code2 === 94 && !size && "_hiddenFootnoteSupport" in self2.parser.constructs) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit(stringType);
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      effects.exit(type);
      return ok2;
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return atBreak;
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return labelInside(code2);
  }
  function labelInside(code2) {
    if (code2 === null || code2 === 91 || code2 === 93 || markdownLineEnding(code2) || size++ > 999) {
      effects.exit("chunkString");
      return atBreak(code2);
    }
    effects.consume(code2);
    if (!seen) seen = !markdownSpace(code2);
    return code2 === 92 ? labelEscape : labelInside;
  }
  function labelEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return labelInside;
    }
    return labelInside(code2);
  }
}
function factoryTitle(effects, ok2, nok, type, markerType, stringType) {
  let marker;
  return start;
  function start(code2) {
    if (code2 === 34 || code2 === 39 || code2 === 40) {
      effects.enter(type);
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      marker = code2 === 40 ? 41 : code2;
      return begin;
    }
    return nok(code2);
  }
  function begin(code2) {
    if (code2 === marker) {
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      effects.exit(type);
      return ok2;
    }
    effects.enter(stringType);
    return atBreak(code2);
  }
  function atBreak(code2) {
    if (code2 === marker) {
      effects.exit(stringType);
      return begin(marker);
    }
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return factorySpace(effects, atBreak, "linePrefix");
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker || code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      return atBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? escape : inside;
  }
  function escape(code2) {
    if (code2 === marker || code2 === 92) {
      effects.consume(code2);
      return inside;
    }
    return inside(code2);
  }
}
function factoryWhitespace(effects, ok2) {
  let seen;
  return start;
  function start(code2) {
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      seen = true;
      return start;
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, start, seen ? "linePrefix" : "lineSuffix")(code2);
    }
    return ok2(code2);
  }
}
const definition$1 = {
  name: "definition",
  tokenize: tokenizeDefinition
};
const titleBefore = {
  partial: true,
  tokenize: tokenizeTitleBefore
};
function tokenizeDefinition(effects, ok2, nok) {
  const self2 = this;
  let identifier;
  return start;
  function start(code2) {
    effects.enter("definition");
    return before(code2);
  }
  function before(code2) {
    return factoryLabel.call(
      self2,
      effects,
      labelAfter,
      // Note: we don’t need to reset the way `markdown-rs` does.
      nok,
      "definitionLabel",
      "definitionLabelMarker",
      "definitionLabelString"
    )(code2);
  }
  function labelAfter(code2) {
    identifier = normalizeIdentifier(self2.sliceSerialize(self2.events[self2.events.length - 1][1]).slice(1, -1));
    if (code2 === 58) {
      effects.enter("definitionMarker");
      effects.consume(code2);
      effects.exit("definitionMarker");
      return markerAfter;
    }
    return nok(code2);
  }
  function markerAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, destinationBefore)(code2) : destinationBefore(code2);
  }
  function destinationBefore(code2) {
    return factoryDestination(
      effects,
      destinationAfter,
      // Note: we don’t need to reset the way `markdown-rs` does.
      nok,
      "definitionDestination",
      "definitionDestinationLiteral",
      "definitionDestinationLiteralMarker",
      "definitionDestinationRaw",
      "definitionDestinationString"
    )(code2);
  }
  function destinationAfter(code2) {
    return effects.attempt(titleBefore, after, after)(code2);
  }
  function after(code2) {
    return markdownSpace(code2) ? factorySpace(effects, afterWhitespace, "whitespace")(code2) : afterWhitespace(code2);
  }
  function afterWhitespace(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("definition");
      self2.parser.defined.push(identifier);
      return ok2(code2);
    }
    return nok(code2);
  }
}
function tokenizeTitleBefore(effects, ok2, nok) {
  return titleBefore2;
  function titleBefore2(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, beforeMarker)(code2) : nok(code2);
  }
  function beforeMarker(code2) {
    return factoryTitle(effects, titleAfter, nok, "definitionTitle", "definitionTitleMarker", "definitionTitleString")(code2);
  }
  function titleAfter(code2) {
    return markdownSpace(code2) ? factorySpace(effects, titleAfterOptionalWhitespace, "whitespace")(code2) : titleAfterOptionalWhitespace(code2);
  }
  function titleAfterOptionalWhitespace(code2) {
    return code2 === null || markdownLineEnding(code2) ? ok2(code2) : nok(code2);
  }
}
const hardBreakEscape = {
  name: "hardBreakEscape",
  tokenize: tokenizeHardBreakEscape
};
function tokenizeHardBreakEscape(effects, ok2, nok) {
  return start;
  function start(code2) {
    effects.enter("hardBreakEscape");
    effects.consume(code2);
    return after;
  }
  function after(code2) {
    if (markdownLineEnding(code2)) {
      effects.exit("hardBreakEscape");
      return ok2(code2);
    }
    return nok(code2);
  }
}
const headingAtx = {
  name: "headingAtx",
  resolve: resolveHeadingAtx,
  tokenize: tokenizeHeadingAtx
};
function resolveHeadingAtx(events, context) {
  let contentEnd = events.length - 2;
  let contentStart = 3;
  let content2;
  let text2;
  if (events[contentStart][1].type === "whitespace") {
    contentStart += 2;
  }
  if (contentEnd - 2 > contentStart && events[contentEnd][1].type === "whitespace") {
    contentEnd -= 2;
  }
  if (events[contentEnd][1].type === "atxHeadingSequence" && (contentStart === contentEnd - 1 || contentEnd - 4 > contentStart && events[contentEnd - 2][1].type === "whitespace")) {
    contentEnd -= contentStart + 1 === contentEnd ? 2 : 4;
  }
  if (contentEnd > contentStart) {
    content2 = {
      type: "atxHeadingText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end
    };
    text2 = {
      type: "chunkText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end,
      contentType: "text"
    };
    splice(events, contentStart, contentEnd - contentStart + 1, [["enter", content2, context], ["enter", text2, context], ["exit", text2, context], ["exit", content2, context]]);
  }
  return events;
}
function tokenizeHeadingAtx(effects, ok2, nok) {
  let size = 0;
  return start;
  function start(code2) {
    effects.enter("atxHeading");
    return before(code2);
  }
  function before(code2) {
    effects.enter("atxHeadingSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === 35 && size++ < 6) {
      effects.consume(code2);
      return sequenceOpen;
    }
    if (code2 === null || markdownLineEndingOrSpace(code2)) {
      effects.exit("atxHeadingSequence");
      return atBreak(code2);
    }
    return nok(code2);
  }
  function atBreak(code2) {
    if (code2 === 35) {
      effects.enter("atxHeadingSequence");
      return sequenceFurther(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("atxHeading");
      return ok2(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, atBreak, "whitespace")(code2);
    }
    effects.enter("atxHeadingText");
    return data(code2);
  }
  function sequenceFurther(code2) {
    if (code2 === 35) {
      effects.consume(code2);
      return sequenceFurther;
    }
    effects.exit("atxHeadingSequence");
    return atBreak(code2);
  }
  function data(code2) {
    if (code2 === null || code2 === 35 || markdownLineEndingOrSpace(code2)) {
      effects.exit("atxHeadingText");
      return atBreak(code2);
    }
    effects.consume(code2);
    return data;
  }
}
const htmlBlockNames = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
];
const htmlRawNames = ["pre", "script", "style", "textarea"];
const htmlFlow = {
  concrete: true,
  name: "htmlFlow",
  resolveTo: resolveToHtmlFlow,
  tokenize: tokenizeHtmlFlow
};
const blankLineBefore = {
  partial: true,
  tokenize: tokenizeBlankLineBefore
};
const nonLazyContinuationStart = {
  partial: true,
  tokenize: tokenizeNonLazyContinuationStart
};
function resolveToHtmlFlow(events) {
  let index2 = events.length;
  while (index2--) {
    if (events[index2][0] === "enter" && events[index2][1].type === "htmlFlow") {
      break;
    }
  }
  if (index2 > 1 && events[index2 - 2][1].type === "linePrefix") {
    events[index2][1].start = events[index2 - 2][1].start;
    events[index2 + 1][1].start = events[index2 - 2][1].start;
    events.splice(index2 - 2, 2);
  }
  return events;
}
function tokenizeHtmlFlow(effects, ok2, nok) {
  const self2 = this;
  let marker;
  let closingTag;
  let buffer;
  let index2;
  let markerB;
  return start;
  function start(code2) {
    return before(code2);
  }
  function before(code2) {
    effects.enter("htmlFlow");
    effects.enter("htmlFlowData");
    effects.consume(code2);
    return open;
  }
  function open(code2) {
    if (code2 === 33) {
      effects.consume(code2);
      return declarationOpen;
    }
    if (code2 === 47) {
      effects.consume(code2);
      closingTag = true;
      return tagCloseStart;
    }
    if (code2 === 63) {
      effects.consume(code2);
      marker = 3;
      return self2.interrupt ? ok2 : continuationDeclarationInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      buffer = String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function declarationOpen(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      marker = 2;
      return commentOpenInside;
    }
    if (code2 === 91) {
      effects.consume(code2);
      marker = 5;
      index2 = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      marker = 4;
      return self2.interrupt ? ok2 : continuationDeclarationInside;
    }
    return nok(code2);
  }
  function commentOpenInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return self2.interrupt ? ok2 : continuationDeclarationInside;
    }
    return nok(code2);
  }
  function cdataOpenInside(code2) {
    const value = "CDATA[";
    if (code2 === value.charCodeAt(index2++)) {
      effects.consume(code2);
      if (index2 === value.length) {
        return self2.interrupt ? ok2 : continuation;
      }
      return cdataOpenInside;
    }
    return nok(code2);
  }
  function tagCloseStart(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      buffer = String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function tagName(code2) {
    if (code2 === null || code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      const slash = code2 === 47;
      const name = buffer.toLowerCase();
      if (!slash && !closingTag && htmlRawNames.includes(name)) {
        marker = 1;
        return self2.interrupt ? ok2(code2) : continuation(code2);
      }
      if (htmlBlockNames.includes(buffer.toLowerCase())) {
        marker = 6;
        if (slash) {
          effects.consume(code2);
          return basicSelfClosing;
        }
        return self2.interrupt ? ok2(code2) : continuation(code2);
      }
      marker = 7;
      return self2.interrupt && !self2.parser.lazy[self2.now().line] ? nok(code2) : closingTag ? completeClosingTagAfter(code2) : completeAttributeNameBefore(code2);
    }
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      buffer += String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function basicSelfClosing(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return self2.interrupt ? ok2 : continuation;
    }
    return nok(code2);
  }
  function completeClosingTagAfter(code2) {
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeClosingTagAfter;
    }
    return completeEnd(code2);
  }
  function completeAttributeNameBefore(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      return completeEnd;
    }
    if (code2 === 58 || code2 === 95 || asciiAlpha(code2)) {
      effects.consume(code2);
      return completeAttributeName;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeNameBefore;
    }
    return completeEnd(code2);
  }
  function completeAttributeName(code2) {
    if (code2 === 45 || code2 === 46 || code2 === 58 || code2 === 95 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return completeAttributeName;
    }
    return completeAttributeNameAfter(code2);
  }
  function completeAttributeNameAfter(code2) {
    if (code2 === 61) {
      effects.consume(code2);
      return completeAttributeValueBefore;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeNameAfter;
    }
    return completeAttributeNameBefore(code2);
  }
  function completeAttributeValueBefore(code2) {
    if (code2 === null || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 34 || code2 === 39) {
      effects.consume(code2);
      markerB = code2;
      return completeAttributeValueQuoted;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeValueBefore;
    }
    return completeAttributeValueUnquoted(code2);
  }
  function completeAttributeValueQuoted(code2) {
    if (code2 === markerB) {
      effects.consume(code2);
      markerB = null;
      return completeAttributeValueQuotedAfter;
    }
    if (code2 === null || markdownLineEnding(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return completeAttributeValueQuoted;
  }
  function completeAttributeValueUnquoted(code2) {
    if (code2 === null || code2 === 34 || code2 === 39 || code2 === 47 || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96 || markdownLineEndingOrSpace(code2)) {
      return completeAttributeNameAfter(code2);
    }
    effects.consume(code2);
    return completeAttributeValueUnquoted;
  }
  function completeAttributeValueQuotedAfter(code2) {
    if (code2 === 47 || code2 === 62 || markdownSpace(code2)) {
      return completeAttributeNameBefore(code2);
    }
    return nok(code2);
  }
  function completeEnd(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return completeAfter;
    }
    return nok(code2);
  }
  function completeAfter(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return continuation(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAfter;
    }
    return nok(code2);
  }
  function continuation(code2) {
    if (code2 === 45 && marker === 2) {
      effects.consume(code2);
      return continuationCommentInside;
    }
    if (code2 === 60 && marker === 1) {
      effects.consume(code2);
      return continuationRawTagOpen;
    }
    if (code2 === 62 && marker === 4) {
      effects.consume(code2);
      return continuationClose;
    }
    if (code2 === 63 && marker === 3) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    if (code2 === 93 && marker === 5) {
      effects.consume(code2);
      return continuationCdataInside;
    }
    if (markdownLineEnding(code2) && (marker === 6 || marker === 7)) {
      effects.exit("htmlFlowData");
      return effects.check(blankLineBefore, continuationAfter, continuationStart)(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("htmlFlowData");
      return continuationStart(code2);
    }
    effects.consume(code2);
    return continuation;
  }
  function continuationStart(code2) {
    return effects.check(nonLazyContinuationStart, continuationStartNonLazy, continuationAfter)(code2);
  }
  function continuationStartNonLazy(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return continuationBefore;
  }
  function continuationBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return continuationStart(code2);
    }
    effects.enter("htmlFlowData");
    return continuation(code2);
  }
  function continuationCommentInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationRawTagOpen(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      buffer = "";
      return continuationRawEndTag;
    }
    return continuation(code2);
  }
  function continuationRawEndTag(code2) {
    if (code2 === 62) {
      const name = buffer.toLowerCase();
      if (htmlRawNames.includes(name)) {
        effects.consume(code2);
        return continuationClose;
      }
      return continuation(code2);
    }
    if (asciiAlpha(code2) && buffer.length < 8) {
      effects.consume(code2);
      buffer += String.fromCharCode(code2);
      return continuationRawEndTag;
    }
    return continuation(code2);
  }
  function continuationCdataInside(code2) {
    if (code2 === 93) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationDeclarationInside(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return continuationClose;
    }
    if (code2 === 45 && marker === 2) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationClose(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("htmlFlowData");
      return continuationAfter(code2);
    }
    effects.consume(code2);
    return continuationClose;
  }
  function continuationAfter(code2) {
    effects.exit("htmlFlow");
    return ok2(code2);
  }
}
function tokenizeNonLazyContinuationStart(effects, ok2, nok) {
  const self2 = this;
  return start;
  function start(code2) {
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    return self2.parser.lazy[self2.now().line] ? nok(code2) : ok2(code2);
  }
}
function tokenizeBlankLineBefore(effects, ok2, nok) {
  return start;
  function start(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return effects.attempt(blankLine, ok2, nok);
  }
}
const htmlText = {
  name: "htmlText",
  tokenize: tokenizeHtmlText
};
function tokenizeHtmlText(effects, ok2, nok) {
  const self2 = this;
  let marker;
  let index2;
  let returnState;
  return start;
  function start(code2) {
    effects.enter("htmlText");
    effects.enter("htmlTextData");
    effects.consume(code2);
    return open;
  }
  function open(code2) {
    if (code2 === 33) {
      effects.consume(code2);
      return declarationOpen;
    }
    if (code2 === 47) {
      effects.consume(code2);
      return tagCloseStart;
    }
    if (code2 === 63) {
      effects.consume(code2);
      return instruction;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return tagOpen;
    }
    return nok(code2);
  }
  function declarationOpen(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentOpenInside;
    }
    if (code2 === 91) {
      effects.consume(code2);
      index2 = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return declaration;
    }
    return nok(code2);
  }
  function commentOpenInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentEnd;
    }
    return nok(code2);
  }
  function comment2(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 45) {
      effects.consume(code2);
      return commentClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = comment2;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return comment2;
  }
  function commentClose(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentEnd;
    }
    return comment2(code2);
  }
  function commentEnd(code2) {
    return code2 === 62 ? end(code2) : code2 === 45 ? commentClose(code2) : comment2(code2);
  }
  function cdataOpenInside(code2) {
    const value = "CDATA[";
    if (code2 === value.charCodeAt(index2++)) {
      effects.consume(code2);
      return index2 === value.length ? cdata : cdataOpenInside;
    }
    return nok(code2);
  }
  function cdata(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.consume(code2);
      return cdataClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = cdata;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return cdata;
  }
  function cdataClose(code2) {
    if (code2 === 93) {
      effects.consume(code2);
      return cdataEnd;
    }
    return cdata(code2);
  }
  function cdataEnd(code2) {
    if (code2 === 62) {
      return end(code2);
    }
    if (code2 === 93) {
      effects.consume(code2);
      return cdataEnd;
    }
    return cdata(code2);
  }
  function declaration(code2) {
    if (code2 === null || code2 === 62) {
      return end(code2);
    }
    if (markdownLineEnding(code2)) {
      returnState = declaration;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return declaration;
  }
  function instruction(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 63) {
      effects.consume(code2);
      return instructionClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = instruction;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return instruction;
  }
  function instructionClose(code2) {
    return code2 === 62 ? end(code2) : instruction(code2);
  }
  function tagCloseStart(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return tagClose;
    }
    return nok(code2);
  }
  function tagClose(code2) {
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagClose;
    }
    return tagCloseBetween(code2);
  }
  function tagCloseBetween(code2) {
    if (markdownLineEnding(code2)) {
      returnState = tagCloseBetween;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagCloseBetween;
    }
    return end(code2);
  }
  function tagOpen(code2) {
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagOpen;
    }
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    return nok(code2);
  }
  function tagOpenBetween(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      return end;
    }
    if (code2 === 58 || code2 === 95 || asciiAlpha(code2)) {
      effects.consume(code2);
      return tagOpenAttributeName;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenBetween;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenBetween;
    }
    return end(code2);
  }
  function tagOpenAttributeName(code2) {
    if (code2 === 45 || code2 === 46 || code2 === 58 || code2 === 95 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagOpenAttributeName;
    }
    return tagOpenAttributeNameAfter(code2);
  }
  function tagOpenAttributeNameAfter(code2) {
    if (code2 === 61) {
      effects.consume(code2);
      return tagOpenAttributeValueBefore;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeNameAfter;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenAttributeNameAfter;
    }
    return tagOpenBetween(code2);
  }
  function tagOpenAttributeValueBefore(code2) {
    if (code2 === null || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 34 || code2 === 39) {
      effects.consume(code2);
      marker = code2;
      return tagOpenAttributeValueQuoted;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeValueBefore;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenAttributeValueBefore;
    }
    effects.consume(code2);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuoted(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      marker = void 0;
      return tagOpenAttributeValueQuotedAfter;
    }
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeValueQuoted;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return tagOpenAttributeValueQuoted;
  }
  function tagOpenAttributeValueUnquoted(code2) {
    if (code2 === null || code2 === 34 || code2 === 39 || code2 === 60 || code2 === 61 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    effects.consume(code2);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuotedAfter(code2) {
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    return nok(code2);
  }
  function end(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      effects.exit("htmlTextData");
      effects.exit("htmlText");
      return ok2;
    }
    return nok(code2);
  }
  function lineEndingBefore(code2) {
    effects.exit("htmlTextData");
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return lineEndingAfter;
  }
  function lineEndingAfter(code2) {
    return markdownSpace(code2) ? factorySpace(effects, lineEndingAfterPrefix, "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2) : lineEndingAfterPrefix(code2);
  }
  function lineEndingAfterPrefix(code2) {
    effects.enter("htmlTextData");
    return returnState(code2);
  }
}
const labelEnd = {
  name: "labelEnd",
  resolveAll: resolveAllLabelEnd,
  resolveTo: resolveToLabelEnd,
  tokenize: tokenizeLabelEnd
};
const resourceConstruct = {
  tokenize: tokenizeResource
};
const referenceFullConstruct = {
  tokenize: tokenizeReferenceFull
};
const referenceCollapsedConstruct = {
  tokenize: tokenizeReferenceCollapsed
};
function resolveAllLabelEnd(events) {
  let index2 = -1;
  const newEvents = [];
  while (++index2 < events.length) {
    const token = events[index2][1];
    newEvents.push(events[index2]);
    if (token.type === "labelImage" || token.type === "labelLink" || token.type === "labelEnd") {
      const offset = token.type === "labelImage" ? 4 : 2;
      token.type = "data";
      index2 += offset;
    }
  }
  if (events.length !== newEvents.length) {
    splice(events, 0, events.length, newEvents);
  }
  return events;
}
function resolveToLabelEnd(events, context) {
  let index2 = events.length;
  let offset = 0;
  let token;
  let open;
  let close;
  let media;
  while (index2--) {
    token = events[index2][1];
    if (open) {
      if (token.type === "link" || token.type === "labelLink" && token._inactive) {
        break;
      }
      if (events[index2][0] === "enter" && token.type === "labelLink") {
        token._inactive = true;
      }
    } else if (close) {
      if (events[index2][0] === "enter" && (token.type === "labelImage" || token.type === "labelLink") && !token._balanced) {
        open = index2;
        if (token.type !== "labelLink") {
          offset = 2;
          break;
        }
      }
    } else if (token.type === "labelEnd") {
      close = index2;
    }
  }
  const group = {
    type: events[open][1].type === "labelLink" ? "link" : "image",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };
  const label = {
    type: "label",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[close][1].end
    }
  };
  const text2 = {
    type: "labelText",
    start: {
      ...events[open + offset + 2][1].end
    },
    end: {
      ...events[close - 2][1].start
    }
  };
  media = [["enter", group, context], ["enter", label, context]];
  media = push(media, events.slice(open + 1, open + offset + 3));
  media = push(media, [["enter", text2, context]]);
  media = push(media, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + offset + 4, close - 3), context));
  media = push(media, [["exit", text2, context], events[close - 2], events[close - 1], ["exit", label, context]]);
  media = push(media, events.slice(close + 1));
  media = push(media, [["exit", group, context]]);
  splice(events, open, events.length, media);
  return events;
}
function tokenizeLabelEnd(effects, ok2, nok) {
  const self2 = this;
  let index2 = self2.events.length;
  let labelStart;
  let defined;
  while (index2--) {
    if ((self2.events[index2][1].type === "labelImage" || self2.events[index2][1].type === "labelLink") && !self2.events[index2][1]._balanced) {
      labelStart = self2.events[index2][1];
      break;
    }
  }
  return start;
  function start(code2) {
    if (!labelStart) {
      return nok(code2);
    }
    if (labelStart._inactive) {
      return labelEndNok(code2);
    }
    defined = self2.parser.defined.includes(normalizeIdentifier(self2.sliceSerialize({
      start: labelStart.end,
      end: self2.now()
    })));
    effects.enter("labelEnd");
    effects.enter("labelMarker");
    effects.consume(code2);
    effects.exit("labelMarker");
    effects.exit("labelEnd");
    return after;
  }
  function after(code2) {
    if (code2 === 40) {
      return effects.attempt(resourceConstruct, labelEndOk, defined ? labelEndOk : labelEndNok)(code2);
    }
    if (code2 === 91) {
      return effects.attempt(referenceFullConstruct, labelEndOk, defined ? referenceNotFull : labelEndNok)(code2);
    }
    return defined ? labelEndOk(code2) : labelEndNok(code2);
  }
  function referenceNotFull(code2) {
    return effects.attempt(referenceCollapsedConstruct, labelEndOk, labelEndNok)(code2);
  }
  function labelEndOk(code2) {
    return ok2(code2);
  }
  function labelEndNok(code2) {
    labelStart._balanced = true;
    return nok(code2);
  }
}
function tokenizeResource(effects, ok2, nok) {
  return resourceStart;
  function resourceStart(code2) {
    effects.enter("resource");
    effects.enter("resourceMarker");
    effects.consume(code2);
    effects.exit("resourceMarker");
    return resourceBefore;
  }
  function resourceBefore(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceOpen)(code2) : resourceOpen(code2);
  }
  function resourceOpen(code2) {
    if (code2 === 41) {
      return resourceEnd(code2);
    }
    return factoryDestination(effects, resourceDestinationAfter, resourceDestinationMissing, "resourceDestination", "resourceDestinationLiteral", "resourceDestinationLiteralMarker", "resourceDestinationRaw", "resourceDestinationString", 32)(code2);
  }
  function resourceDestinationAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceBetween)(code2) : resourceEnd(code2);
  }
  function resourceDestinationMissing(code2) {
    return nok(code2);
  }
  function resourceBetween(code2) {
    if (code2 === 34 || code2 === 39 || code2 === 40) {
      return factoryTitle(effects, resourceTitleAfter, nok, "resourceTitle", "resourceTitleMarker", "resourceTitleString")(code2);
    }
    return resourceEnd(code2);
  }
  function resourceTitleAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceEnd)(code2) : resourceEnd(code2);
  }
  function resourceEnd(code2) {
    if (code2 === 41) {
      effects.enter("resourceMarker");
      effects.consume(code2);
      effects.exit("resourceMarker");
      effects.exit("resource");
      return ok2;
    }
    return nok(code2);
  }
}
function tokenizeReferenceFull(effects, ok2, nok) {
  const self2 = this;
  return referenceFull;
  function referenceFull(code2) {
    return factoryLabel.call(self2, effects, referenceFullAfter, referenceFullMissing, "reference", "referenceMarker", "referenceString")(code2);
  }
  function referenceFullAfter(code2) {
    return self2.parser.defined.includes(normalizeIdentifier(self2.sliceSerialize(self2.events[self2.events.length - 1][1]).slice(1, -1))) ? ok2(code2) : nok(code2);
  }
  function referenceFullMissing(code2) {
    return nok(code2);
  }
}
function tokenizeReferenceCollapsed(effects, ok2, nok) {
  return referenceCollapsedStart;
  function referenceCollapsedStart(code2) {
    effects.enter("reference");
    effects.enter("referenceMarker");
    effects.consume(code2);
    effects.exit("referenceMarker");
    return referenceCollapsedOpen;
  }
  function referenceCollapsedOpen(code2) {
    if (code2 === 93) {
      effects.enter("referenceMarker");
      effects.consume(code2);
      effects.exit("referenceMarker");
      effects.exit("reference");
      return ok2;
    }
    return nok(code2);
  }
}
const labelStartImage = {
  name: "labelStartImage",
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartImage
};
function tokenizeLabelStartImage(effects, ok2, nok) {
  const self2 = this;
  return start;
  function start(code2) {
    effects.enter("labelImage");
    effects.enter("labelImageMarker");
    effects.consume(code2);
    effects.exit("labelImageMarker");
    return open;
  }
  function open(code2) {
    if (code2 === 91) {
      effects.enter("labelMarker");
      effects.consume(code2);
      effects.exit("labelMarker");
      effects.exit("labelImage");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    return code2 === 94 && "_hiddenFootnoteSupport" in self2.parser.constructs ? nok(code2) : ok2(code2);
  }
}
const labelStartLink = {
  name: "labelStartLink",
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartLink
};
function tokenizeLabelStartLink(effects, ok2, nok) {
  const self2 = this;
  return start;
  function start(code2) {
    effects.enter("labelLink");
    effects.enter("labelMarker");
    effects.consume(code2);
    effects.exit("labelMarker");
    effects.exit("labelLink");
    return after;
  }
  function after(code2) {
    return code2 === 94 && "_hiddenFootnoteSupport" in self2.parser.constructs ? nok(code2) : ok2(code2);
  }
}
const lineEnding = {
  name: "lineEnding",
  tokenize: tokenizeLineEnding
};
function tokenizeLineEnding(effects, ok2) {
  return start;
  function start(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, ok2, "linePrefix");
  }
}
const thematicBreak$2 = {
  name: "thematicBreak",
  tokenize: tokenizeThematicBreak
};
function tokenizeThematicBreak(effects, ok2, nok) {
  let size = 0;
  let marker;
  return start;
  function start(code2) {
    effects.enter("thematicBreak");
    return before(code2);
  }
  function before(code2) {
    marker = code2;
    return atBreak(code2);
  }
  function atBreak(code2) {
    if (code2 === marker) {
      effects.enter("thematicBreakSequence");
      return sequence(code2);
    }
    if (size >= 3 && (code2 === null || markdownLineEnding(code2))) {
      effects.exit("thematicBreak");
      return ok2(code2);
    }
    return nok(code2);
  }
  function sequence(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      size++;
      return sequence;
    }
    effects.exit("thematicBreakSequence");
    return markdownSpace(code2) ? factorySpace(effects, atBreak, "whitespace")(code2) : atBreak(code2);
  }
}
const list$2 = {
  continuation: {
    tokenize: tokenizeListContinuation
  },
  exit: tokenizeListEnd,
  name: "list",
  tokenize: tokenizeListStart
};
const listItemPrefixWhitespaceConstruct = {
  partial: true,
  tokenize: tokenizeListItemPrefixWhitespace
};
const indentConstruct = {
  partial: true,
  tokenize: tokenizeIndent$1
};
function tokenizeListStart(effects, ok2, nok) {
  const self2 = this;
  const tail = self2.events[self2.events.length - 1];
  let initialSize = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
  let size = 0;
  return start;
  function start(code2) {
    const kind = self2.containerState.type || (code2 === 42 || code2 === 43 || code2 === 45 ? "listUnordered" : "listOrdered");
    if (kind === "listUnordered" ? !self2.containerState.marker || code2 === self2.containerState.marker : asciiDigit(code2)) {
      if (!self2.containerState.type) {
        self2.containerState.type = kind;
        effects.enter(kind, {
          _container: true
        });
      }
      if (kind === "listUnordered") {
        effects.enter("listItemPrefix");
        return code2 === 42 || code2 === 45 ? effects.check(thematicBreak$2, nok, atMarker)(code2) : atMarker(code2);
      }
      if (!self2.interrupt || code2 === 49) {
        effects.enter("listItemPrefix");
        effects.enter("listItemValue");
        return inside(code2);
      }
    }
    return nok(code2);
  }
  function inside(code2) {
    if (asciiDigit(code2) && ++size < 10) {
      effects.consume(code2);
      return inside;
    }
    if ((!self2.interrupt || size < 2) && (self2.containerState.marker ? code2 === self2.containerState.marker : code2 === 41 || code2 === 46)) {
      effects.exit("listItemValue");
      return atMarker(code2);
    }
    return nok(code2);
  }
  function atMarker(code2) {
    effects.enter("listItemMarker");
    effects.consume(code2);
    effects.exit("listItemMarker");
    self2.containerState.marker = self2.containerState.marker || code2;
    return effects.check(
      blankLine,
      // Can’t be empty when interrupting.
      self2.interrupt ? nok : onBlank,
      effects.attempt(listItemPrefixWhitespaceConstruct, endOfPrefix, otherPrefix)
    );
  }
  function onBlank(code2) {
    self2.containerState.initialBlankLine = true;
    initialSize++;
    return endOfPrefix(code2);
  }
  function otherPrefix(code2) {
    if (markdownSpace(code2)) {
      effects.enter("listItemPrefixWhitespace");
      effects.consume(code2);
      effects.exit("listItemPrefixWhitespace");
      return endOfPrefix;
    }
    return nok(code2);
  }
  function endOfPrefix(code2) {
    self2.containerState.size = initialSize + self2.sliceSerialize(effects.exit("listItemPrefix"), true).length;
    return ok2(code2);
  }
}
function tokenizeListContinuation(effects, ok2, nok) {
  const self2 = this;
  self2.containerState._closeFlow = void 0;
  return effects.check(blankLine, onBlank, notBlank);
  function onBlank(code2) {
    self2.containerState.furtherBlankLines = self2.containerState.furtherBlankLines || self2.containerState.initialBlankLine;
    return factorySpace(effects, ok2, "listItemIndent", self2.containerState.size + 1)(code2);
  }
  function notBlank(code2) {
    if (self2.containerState.furtherBlankLines || !markdownSpace(code2)) {
      self2.containerState.furtherBlankLines = void 0;
      self2.containerState.initialBlankLine = void 0;
      return notInCurrentItem(code2);
    }
    self2.containerState.furtherBlankLines = void 0;
    self2.containerState.initialBlankLine = void 0;
    return effects.attempt(indentConstruct, ok2, notInCurrentItem)(code2);
  }
  function notInCurrentItem(code2) {
    self2.containerState._closeFlow = true;
    self2.interrupt = void 0;
    return factorySpace(effects, effects.attempt(list$2, ok2, nok), "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
  }
}
function tokenizeIndent$1(effects, ok2, nok) {
  const self2 = this;
  return factorySpace(effects, afterPrefix, "listItemIndent", self2.containerState.size + 1);
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return tail && tail[1].type === "listItemIndent" && tail[2].sliceSerialize(tail[1], true).length === self2.containerState.size ? ok2(code2) : nok(code2);
  }
}
function tokenizeListEnd(effects) {
  effects.exit(this.containerState.type);
}
function tokenizeListItemPrefixWhitespace(effects, ok2, nok) {
  const self2 = this;
  return factorySpace(effects, afterPrefix, "listItemPrefixWhitespace", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4 + 1);
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return !markdownSpace(code2) && tail && tail[1].type === "listItemPrefixWhitespace" ? ok2(code2) : nok(code2);
  }
}
const setextUnderline = {
  name: "setextUnderline",
  resolveTo: resolveToSetextUnderline,
  tokenize: tokenizeSetextUnderline
};
function resolveToSetextUnderline(events, context) {
  let index2 = events.length;
  let content2;
  let text2;
  let definition2;
  while (index2--) {
    if (events[index2][0] === "enter") {
      if (events[index2][1].type === "content") {
        content2 = index2;
        break;
      }
      if (events[index2][1].type === "paragraph") {
        text2 = index2;
      }
    } else {
      if (events[index2][1].type === "content") {
        events.splice(index2, 1);
      }
      if (!definition2 && events[index2][1].type === "definition") {
        definition2 = index2;
      }
    }
  }
  const heading2 = {
    type: "setextHeading",
    start: {
      ...events[content2][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };
  events[text2][1].type = "setextHeadingText";
  if (definition2) {
    events.splice(text2, 0, ["enter", heading2, context]);
    events.splice(definition2 + 1, 0, ["exit", events[content2][1], context]);
    events[content2][1].end = {
      ...events[definition2][1].end
    };
  } else {
    events[content2][1] = heading2;
  }
  events.push(["exit", heading2, context]);
  return events;
}
function tokenizeSetextUnderline(effects, ok2, nok) {
  const self2 = this;
  let marker;
  return start;
  function start(code2) {
    let index2 = self2.events.length;
    let paragraph2;
    while (index2--) {
      if (self2.events[index2][1].type !== "lineEnding" && self2.events[index2][1].type !== "linePrefix" && self2.events[index2][1].type !== "content") {
        paragraph2 = self2.events[index2][1].type === "paragraph";
        break;
      }
    }
    if (!self2.parser.lazy[self2.now().line] && (self2.interrupt || paragraph2)) {
      effects.enter("setextHeadingLine");
      marker = code2;
      return before(code2);
    }
    return nok(code2);
  }
  function before(code2) {
    effects.enter("setextHeadingLineSequence");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      return inside;
    }
    effects.exit("setextHeadingLineSequence");
    return markdownSpace(code2) ? factorySpace(effects, after, "lineSuffix")(code2) : after(code2);
  }
  function after(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("setextHeadingLine");
      return ok2(code2);
    }
    return nok(code2);
  }
}
const flow$1 = {
  tokenize: initializeFlow
};
function initializeFlow(effects) {
  const self2 = this;
  const initial = effects.attempt(
    // Try to parse a blank line.
    blankLine,
    atBlankEnding,
    // Try to parse initial flow (essentially, only code).
    effects.attempt(this.parser.constructs.flowInitial, afterConstruct, factorySpace(effects, effects.attempt(this.parser.constructs.flow, afterConstruct, effects.attempt(content, afterConstruct)), "linePrefix"))
  );
  return initial;
  function atBlankEnding(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEndingBlank");
    effects.consume(code2);
    effects.exit("lineEndingBlank");
    self2.currentConstruct = void 0;
    return initial;
  }
  function afterConstruct(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    self2.currentConstruct = void 0;
    return initial;
  }
}
const resolver = {
  resolveAll: createResolver()
};
const string$1 = initializeFactory("string");
const text$5 = initializeFactory("text");
function initializeFactory(field) {
  return {
    resolveAll: createResolver(field === "text" ? resolveAllLineSuffixes : void 0),
    tokenize: initializeText
  };
  function initializeText(effects) {
    const self2 = this;
    const constructs2 = this.parser.constructs[field];
    const text2 = effects.attempt(constructs2, start, notText);
    return start;
    function start(code2) {
      return atBreak(code2) ? text2(code2) : notText(code2);
    }
    function notText(code2) {
      if (code2 === null) {
        effects.consume(code2);
        return;
      }
      effects.enter("data");
      effects.consume(code2);
      return data;
    }
    function data(code2) {
      if (atBreak(code2)) {
        effects.exit("data");
        return text2(code2);
      }
      effects.consume(code2);
      return data;
    }
    function atBreak(code2) {
      if (code2 === null) {
        return true;
      }
      const list2 = constructs2[code2];
      let index2 = -1;
      if (list2) {
        while (++index2 < list2.length) {
          const item = list2[index2];
          if (!item.previous || item.previous.call(self2, self2.previous)) {
            return true;
          }
        }
      }
      return false;
    }
  }
}
function createResolver(extraResolver) {
  return resolveAllText;
  function resolveAllText(events, context) {
    let index2 = -1;
    let enter;
    while (++index2 <= events.length) {
      if (enter === void 0) {
        if (events[index2] && events[index2][1].type === "data") {
          enter = index2;
          index2++;
        }
      } else if (!events[index2] || events[index2][1].type !== "data") {
        if (index2 !== enter + 2) {
          events[enter][1].end = events[index2 - 1][1].end;
          events.splice(enter + 2, index2 - enter - 2);
          index2 = enter + 2;
        }
        enter = void 0;
      }
    }
    return extraResolver ? extraResolver(events, context) : events;
  }
}
function resolveAllLineSuffixes(events, context) {
  let eventIndex = 0;
  while (++eventIndex <= events.length) {
    if ((eventIndex === events.length || events[eventIndex][1].type === "lineEnding") && events[eventIndex - 1][1].type === "data") {
      const data = events[eventIndex - 1][1];
      const chunks = context.sliceStream(data);
      let index2 = chunks.length;
      let bufferIndex = -1;
      let size = 0;
      let tabs;
      while (index2--) {
        const chunk = chunks[index2];
        if (typeof chunk === "string") {
          bufferIndex = chunk.length;
          while (chunk.charCodeAt(bufferIndex - 1) === 32) {
            size++;
            bufferIndex--;
          }
          if (bufferIndex) break;
          bufferIndex = -1;
        } else if (chunk === -2) {
          tabs = true;
          size++;
        } else if (chunk === -1) ;
        else {
          index2++;
          break;
        }
      }
      if (context._contentTypeTextTrailing && eventIndex === events.length) {
        size = 0;
      }
      if (size) {
        const token = {
          type: eventIndex === events.length || tabs || size < 2 ? "lineSuffix" : "hardBreakTrailing",
          start: {
            _bufferIndex: index2 ? bufferIndex : data.start._bufferIndex + bufferIndex,
            _index: data.start._index + index2,
            line: data.end.line,
            column: data.end.column - size,
            offset: data.end.offset - size
          },
          end: {
            ...data.end
          }
        };
        data.end = {
          ...token.start
        };
        if (data.start.offset === data.end.offset) {
          Object.assign(data, token);
        } else {
          events.splice(eventIndex, 0, ["enter", token, context], ["exit", token, context]);
          eventIndex += 2;
        }
      }
      eventIndex++;
    }
  }
  return events;
}
const document$1 = {
  [42]: list$2,
  [43]: list$2,
  [45]: list$2,
  [48]: list$2,
  [49]: list$2,
  [50]: list$2,
  [51]: list$2,
  [52]: list$2,
  [53]: list$2,
  [54]: list$2,
  [55]: list$2,
  [56]: list$2,
  [57]: list$2,
  [62]: blockQuote
};
const contentInitial = {
  [91]: definition$1
};
const flowInitial = {
  [-2]: codeIndented,
  [-1]: codeIndented,
  [32]: codeIndented
};
const flow = {
  [35]: headingAtx,
  [42]: thematicBreak$2,
  [45]: [setextUnderline, thematicBreak$2],
  [60]: htmlFlow,
  [61]: setextUnderline,
  [95]: thematicBreak$2,
  [96]: codeFenced,
  [126]: codeFenced
};
const string = {
  [38]: characterReference,
  [92]: characterEscape
};
const text$4 = {
  [-5]: lineEnding,
  [-4]: lineEnding,
  [-3]: lineEnding,
  [33]: labelStartImage,
  [38]: characterReference,
  [42]: attention,
  [60]: [autolink, htmlText],
  [91]: labelStartLink,
  [92]: [hardBreakEscape, characterEscape],
  [93]: labelEnd,
  [95]: attention,
  [96]: codeText
};
const insideSpan = {
  null: [attention, resolver]
};
const attentionMarkers = {
  null: [42, 95]
};
const disable = {
  null: []
};
const defaultConstructs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  attentionMarkers,
  contentInitial,
  disable,
  document: document$1,
  flow,
  flowInitial,
  insideSpan,
  string,
  text: text$4
}, Symbol.toStringTag, { value: "Module" }));
function createTokenizer(parser, initialize, from) {
  let point2 = {
    _bufferIndex: -1,
    _index: 0,
    line: from && from.line || 1,
    column: from && from.column || 1,
    offset: from && from.offset || 0
  };
  const columnStart = {};
  const resolveAllConstructs = [];
  let chunks = [];
  let stack = [];
  const effects = {
    attempt: constructFactory(onsuccessfulconstruct),
    check: constructFactory(onsuccessfulcheck),
    consume,
    enter,
    exit: exit2,
    interrupt: constructFactory(onsuccessfulcheck, {
      interrupt: true
    })
  };
  const context = {
    code: null,
    containerState: {},
    defineSkip,
    events: [],
    now,
    parser,
    previous: null,
    sliceSerialize,
    sliceStream,
    write
  };
  let state = initialize.tokenize.call(context, effects);
  if (initialize.resolveAll) {
    resolveAllConstructs.push(initialize);
  }
  return context;
  function write(slice) {
    chunks = push(chunks, slice);
    main();
    if (chunks[chunks.length - 1] !== null) {
      return [];
    }
    addResult(initialize, 0);
    context.events = resolveAll(resolveAllConstructs, context.events, context);
    return context.events;
  }
  function sliceSerialize(token, expandTabs) {
    return serializeChunks(sliceStream(token), expandTabs);
  }
  function sliceStream(token) {
    return sliceChunks(chunks, token);
  }
  function now() {
    const {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    } = point2;
    return {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    };
  }
  function defineSkip(value) {
    columnStart[value.line] = value.column;
    accountForPotentialSkip();
  }
  function main() {
    let chunkIndex;
    while (point2._index < chunks.length) {
      const chunk = chunks[point2._index];
      if (typeof chunk === "string") {
        chunkIndex = point2._index;
        if (point2._bufferIndex < 0) {
          point2._bufferIndex = 0;
        }
        while (point2._index === chunkIndex && point2._bufferIndex < chunk.length) {
          go(chunk.charCodeAt(point2._bufferIndex));
        }
      } else {
        go(chunk);
      }
    }
  }
  function go(code2) {
    state = state(code2);
  }
  function consume(code2) {
    if (markdownLineEnding(code2)) {
      point2.line++;
      point2.column = 1;
      point2.offset += code2 === -3 ? 2 : 1;
      accountForPotentialSkip();
    } else if (code2 !== -1) {
      point2.column++;
      point2.offset++;
    }
    if (point2._bufferIndex < 0) {
      point2._index++;
    } else {
      point2._bufferIndex++;
      if (point2._bufferIndex === // Points w/ non-negative `_bufferIndex` reference
      // strings.
      /** @type {string} */
      chunks[point2._index].length) {
        point2._bufferIndex = -1;
        point2._index++;
      }
    }
    context.previous = code2;
  }
  function enter(type, fields) {
    const token = fields || {};
    token.type = type;
    token.start = now();
    context.events.push(["enter", token, context]);
    stack.push(token);
    return token;
  }
  function exit2(type) {
    const token = stack.pop();
    token.end = now();
    context.events.push(["exit", token, context]);
    return token;
  }
  function onsuccessfulconstruct(construct, info) {
    addResult(construct, info.from);
  }
  function onsuccessfulcheck(_, info) {
    info.restore();
  }
  function constructFactory(onreturn, fields) {
    return hook;
    function hook(constructs2, returnState, bogusState) {
      let listOfConstructs;
      let constructIndex;
      let currentConstruct;
      let info;
      return Array.isArray(constructs2) ? (
        /* c8 ignore next 1 */
        handleListOfConstructs(constructs2)
      ) : "tokenize" in constructs2 ? (
        // Looks like a construct.
        handleListOfConstructs([
          /** @type {Construct} */
          constructs2
        ])
      ) : handleMapOfConstructs(constructs2);
      function handleMapOfConstructs(map2) {
        return start;
        function start(code2) {
          const left = code2 !== null && map2[code2];
          const all2 = code2 !== null && map2.null;
          const list2 = [
            // To do: add more extension tests.
            /* c8 ignore next 2 */
            ...Array.isArray(left) ? left : left ? [left] : [],
            ...Array.isArray(all2) ? all2 : all2 ? [all2] : []
          ];
          return handleListOfConstructs(list2)(code2);
        }
      }
      function handleListOfConstructs(list2) {
        listOfConstructs = list2;
        constructIndex = 0;
        if (list2.length === 0) {
          return bogusState;
        }
        return handleConstruct(list2[constructIndex]);
      }
      function handleConstruct(construct) {
        return start;
        function start(code2) {
          info = store();
          currentConstruct = construct;
          if (!construct.partial) {
            context.currentConstruct = construct;
          }
          if (construct.name && context.parser.constructs.disable.null.includes(construct.name)) {
            return nok();
          }
          return construct.tokenize.call(
            // If we do have fields, create an object w/ `context` as its
            // prototype.
            // This allows a “live binding”, which is needed for `interrupt`.
            fields ? Object.assign(Object.create(context), fields) : context,
            effects,
            ok2,
            nok
          )(code2);
        }
      }
      function ok2(code2) {
        onreturn(currentConstruct, info);
        return returnState;
      }
      function nok(code2) {
        info.restore();
        if (++constructIndex < listOfConstructs.length) {
          return handleConstruct(listOfConstructs[constructIndex]);
        }
        return bogusState;
      }
    }
  }
  function addResult(construct, from2) {
    if (construct.resolveAll && !resolveAllConstructs.includes(construct)) {
      resolveAllConstructs.push(construct);
    }
    if (construct.resolve) {
      splice(context.events, from2, context.events.length - from2, construct.resolve(context.events.slice(from2), context));
    }
    if (construct.resolveTo) {
      context.events = construct.resolveTo(context.events, context);
    }
  }
  function store() {
    const startPoint = now();
    const startPrevious = context.previous;
    const startCurrentConstruct = context.currentConstruct;
    const startEventsIndex = context.events.length;
    const startStack = Array.from(stack);
    return {
      from: startEventsIndex,
      restore
    };
    function restore() {
      point2 = startPoint;
      context.previous = startPrevious;
      context.currentConstruct = startCurrentConstruct;
      context.events.length = startEventsIndex;
      stack = startStack;
      accountForPotentialSkip();
    }
  }
  function accountForPotentialSkip() {
    if (point2.line in columnStart && point2.column < 2) {
      point2.column = columnStart[point2.line];
      point2.offset += columnStart[point2.line] - 1;
    }
  }
}
function sliceChunks(chunks, token) {
  const startIndex = token.start._index;
  const startBufferIndex = token.start._bufferIndex;
  const endIndex = token.end._index;
  const endBufferIndex = token.end._bufferIndex;
  let view;
  if (startIndex === endIndex) {
    view = [chunks[startIndex].slice(startBufferIndex, endBufferIndex)];
  } else {
    view = chunks.slice(startIndex, endIndex);
    if (startBufferIndex > -1) {
      const head2 = view[0];
      if (typeof head2 === "string") {
        view[0] = head2.slice(startBufferIndex);
      } else {
        view.shift();
      }
    }
    if (endBufferIndex > 0) {
      view.push(chunks[endIndex].slice(0, endBufferIndex));
    }
  }
  return view;
}
function serializeChunks(chunks, expandTabs) {
  let index2 = -1;
  const result = [];
  let atTab;
  while (++index2 < chunks.length) {
    const chunk = chunks[index2];
    let value;
    if (typeof chunk === "string") {
      value = chunk;
    } else switch (chunk) {
      case -5: {
        value = "\r";
        break;
      }
      case -4: {
        value = "\n";
        break;
      }
      case -3: {
        value = "\r\n";
        break;
      }
      case -2: {
        value = expandTabs ? " " : "	";
        break;
      }
      case -1: {
        if (!expandTabs && atTab) continue;
        value = " ";
        break;
      }
      default: {
        value = String.fromCharCode(chunk);
      }
    }
    atTab = chunk === -2;
    result.push(value);
  }
  return result.join("");
}
function parse(options) {
  const settings = options || {};
  const constructs2 = (
    /** @type {FullNormalizedExtension} */
    combineExtensions([defaultConstructs, ...settings.extensions || []])
  );
  const parser = {
    constructs: constructs2,
    content: create2(content$1),
    defined: [],
    document: create2(document$2),
    flow: create2(flow$1),
    lazy: {},
    string: create2(string$1),
    text: create2(text$5)
  };
  return parser;
  function create2(initial) {
    return creator;
    function creator(from) {
      return createTokenizer(parser, initial, from);
    }
  }
}
function postprocess(events) {
  while (!subtokenize(events)) {
  }
  return events;
}
const search = /[\0\t\n\r]/g;
function preprocess() {
  let column = 1;
  let buffer = "";
  let start = true;
  let atCarriageReturn;
  return preprocessor;
  function preprocessor(value, encoding, end) {
    const chunks = [];
    let match;
    let next;
    let startPosition;
    let endPosition;
    let code2;
    value = buffer + (typeof value === "string" ? value.toString() : new TextDecoder(encoding || void 0).decode(value));
    startPosition = 0;
    buffer = "";
    if (start) {
      if (value.charCodeAt(0) === 65279) {
        startPosition++;
      }
      start = void 0;
    }
    while (startPosition < value.length) {
      search.lastIndex = startPosition;
      match = search.exec(value);
      endPosition = match && match.index !== void 0 ? match.index : value.length;
      code2 = value.charCodeAt(endPosition);
      if (!match) {
        buffer = value.slice(startPosition);
        break;
      }
      if (code2 === 10 && startPosition === endPosition && atCarriageReturn) {
        chunks.push(-3);
        atCarriageReturn = void 0;
      } else {
        if (atCarriageReturn) {
          chunks.push(-5);
          atCarriageReturn = void 0;
        }
        if (startPosition < endPosition) {
          chunks.push(value.slice(startPosition, endPosition));
          column += endPosition - startPosition;
        }
        switch (code2) {
          case 0: {
            chunks.push(65533);
            column++;
            break;
          }
          case 9: {
            next = Math.ceil(column / 4) * 4;
            chunks.push(-2);
            while (column++ < next) chunks.push(-1);
            break;
          }
          case 10: {
            chunks.push(-4);
            column = 1;
            break;
          }
          default: {
            atCarriageReturn = true;
            column = 1;
          }
        }
      }
      startPosition = endPosition + 1;
    }
    if (end) {
      if (atCarriageReturn) chunks.push(-5);
      if (buffer) chunks.push(buffer);
      chunks.push(null);
    }
    return chunks;
  }
}
const characterEscapeOrReference = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
function decodeString(value) {
  return value.replace(characterEscapeOrReference, decode);
}
function decode($0, $1, $2) {
  if ($1) {
    return $1;
  }
  const head2 = $2.charCodeAt(0);
  if (head2 === 35) {
    const head3 = $2.charCodeAt(1);
    const hex = head3 === 120 || head3 === 88;
    return decodeNumericCharacterReference($2.slice(hex ? 2 : 1), hex ? 16 : 10);
  }
  return decodeNamedCharacterReference($2) || $0;
}
const own$4 = {}.hasOwnProperty;
function fromMarkdown(value, encoding, options) {
  if (typeof encoding !== "string") {
    options = encoding;
    encoding = void 0;
  }
  return compiler(options)(postprocess(parse(options).document().write(preprocess()(value, encoding, true))));
}
function compiler(options) {
  const config = {
    transforms: [],
    canContainEols: ["emphasis", "fragment", "heading", "paragraph", "strong"],
    enter: {
      autolink: opener(link2),
      autolinkProtocol: onenterdata,
      autolinkEmail: onenterdata,
      atxHeading: opener(heading2),
      blockQuote: opener(blockQuote2),
      characterEscape: onenterdata,
      characterReference: onenterdata,
      codeFenced: opener(codeFlow),
      codeFencedFenceInfo: buffer,
      codeFencedFenceMeta: buffer,
      codeIndented: opener(codeFlow, buffer),
      codeText: opener(codeText2, buffer),
      codeTextData: onenterdata,
      data: onenterdata,
      codeFlowValue: onenterdata,
      definition: opener(definition2),
      definitionDestinationString: buffer,
      definitionLabelString: buffer,
      definitionTitleString: buffer,
      emphasis: opener(emphasis2),
      hardBreakEscape: opener(hardBreak2),
      hardBreakTrailing: opener(hardBreak2),
      htmlFlow: opener(html2, buffer),
      htmlFlowData: onenterdata,
      htmlText: opener(html2, buffer),
      htmlTextData: onenterdata,
      image: opener(image2),
      label: buffer,
      link: opener(link2),
      listItem: opener(listItem2),
      listItemValue: onenterlistitemvalue,
      listOrdered: opener(list2, onenterlistordered),
      listUnordered: opener(list2),
      paragraph: opener(paragraph2),
      reference: onenterreference,
      referenceString: buffer,
      resourceDestinationString: buffer,
      resourceTitleString: buffer,
      setextHeading: opener(heading2),
      strong: opener(strong2),
      thematicBreak: opener(thematicBreak2)
    },
    exit: {
      atxHeading: closer(),
      atxHeadingSequence: onexitatxheadingsequence,
      autolink: closer(),
      autolinkEmail: onexitautolinkemail,
      autolinkProtocol: onexitautolinkprotocol,
      blockQuote: closer(),
      characterEscapeValue: onexitdata,
      characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
      characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
      characterReferenceValue: onexitcharacterreferencevalue,
      characterReference: onexitcharacterreference,
      codeFenced: closer(onexitcodefenced),
      codeFencedFence: onexitcodefencedfence,
      codeFencedFenceInfo: onexitcodefencedfenceinfo,
      codeFencedFenceMeta: onexitcodefencedfencemeta,
      codeFlowValue: onexitdata,
      codeIndented: closer(onexitcodeindented),
      codeText: closer(onexitcodetext),
      codeTextData: onexitdata,
      data: onexitdata,
      definition: closer(),
      definitionDestinationString: onexitdefinitiondestinationstring,
      definitionLabelString: onexitdefinitionlabelstring,
      definitionTitleString: onexitdefinitiontitlestring,
      emphasis: closer(),
      hardBreakEscape: closer(onexithardbreak),
      hardBreakTrailing: closer(onexithardbreak),
      htmlFlow: closer(onexithtmlflow),
      htmlFlowData: onexitdata,
      htmlText: closer(onexithtmltext),
      htmlTextData: onexitdata,
      image: closer(onexitimage),
      label: onexitlabel,
      labelText: onexitlabeltext,
      lineEnding: onexitlineending,
      link: closer(onexitlink),
      listItem: closer(),
      listOrdered: closer(),
      listUnordered: closer(),
      paragraph: closer(),
      referenceString: onexitreferencestring,
      resourceDestinationString: onexitresourcedestinationstring,
      resourceTitleString: onexitresourcetitlestring,
      resource: onexitresource,
      setextHeading: closer(onexitsetextheading),
      setextHeadingLineSequence: onexitsetextheadinglinesequence,
      setextHeadingText: onexitsetextheadingtext,
      strong: closer(),
      thematicBreak: closer()
    }
  };
  configure(config, (options || {}).mdastExtensions || []);
  const data = {};
  return compile;
  function compile(events) {
    let tree = {
      type: "root",
      children: []
    };
    const context = {
      stack: [tree],
      tokenStack: [],
      config,
      enter,
      exit: exit2,
      buffer,
      resume,
      data
    };
    const listStack = [];
    let index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][1].type === "listOrdered" || events[index2][1].type === "listUnordered") {
        if (events[index2][0] === "enter") {
          listStack.push(index2);
        } else {
          const tail = listStack.pop();
          index2 = prepareList(events, tail, index2);
        }
      }
    }
    index2 = -1;
    while (++index2 < events.length) {
      const handler = config[events[index2][0]];
      if (own$4.call(handler, events[index2][1].type)) {
        handler[events[index2][1].type].call(Object.assign({
          sliceSerialize: events[index2][2].sliceSerialize
        }, context), events[index2][1]);
      }
    }
    if (context.tokenStack.length > 0) {
      const tail = context.tokenStack[context.tokenStack.length - 1];
      const handler = tail[1] || defaultOnError;
      handler.call(context, void 0, tail[0]);
    }
    tree.position = {
      start: point$1(events.length > 0 ? events[0][1].start : {
        line: 1,
        column: 1,
        offset: 0
      }),
      end: point$1(events.length > 0 ? events[events.length - 2][1].end : {
        line: 1,
        column: 1,
        offset: 0
      })
    };
    index2 = -1;
    while (++index2 < config.transforms.length) {
      tree = config.transforms[index2](tree) || tree;
    }
    return tree;
  }
  function prepareList(events, start, length) {
    let index2 = start - 1;
    let containerBalance = -1;
    let listSpread = false;
    let listItem3;
    let lineIndex;
    let firstBlankLineIndex;
    let atMarker;
    while (++index2 <= length) {
      const event = events[index2];
      switch (event[1].type) {
        case "listUnordered":
        case "listOrdered":
        case "blockQuote": {
          if (event[0] === "enter") {
            containerBalance++;
          } else {
            containerBalance--;
          }
          atMarker = void 0;
          break;
        }
        case "lineEndingBlank": {
          if (event[0] === "enter") {
            if (listItem3 && !atMarker && !containerBalance && !firstBlankLineIndex) {
              firstBlankLineIndex = index2;
            }
            atMarker = void 0;
          }
          break;
        }
        case "linePrefix":
        case "listItemValue":
        case "listItemMarker":
        case "listItemPrefix":
        case "listItemPrefixWhitespace": {
          break;
        }
        default: {
          atMarker = void 0;
        }
      }
      if (!containerBalance && event[0] === "enter" && event[1].type === "listItemPrefix" || containerBalance === -1 && event[0] === "exit" && (event[1].type === "listUnordered" || event[1].type === "listOrdered")) {
        if (listItem3) {
          let tailIndex = index2;
          lineIndex = void 0;
          while (tailIndex--) {
            const tailEvent = events[tailIndex];
            if (tailEvent[1].type === "lineEnding" || tailEvent[1].type === "lineEndingBlank") {
              if (tailEvent[0] === "exit") continue;
              if (lineIndex) {
                events[lineIndex][1].type = "lineEndingBlank";
                listSpread = true;
              }
              tailEvent[1].type = "lineEnding";
              lineIndex = tailIndex;
            } else if (tailEvent[1].type === "linePrefix" || tailEvent[1].type === "blockQuotePrefix" || tailEvent[1].type === "blockQuotePrefixWhitespace" || tailEvent[1].type === "blockQuoteMarker" || tailEvent[1].type === "listItemIndent") ;
            else {
              break;
            }
          }
          if (firstBlankLineIndex && (!lineIndex || firstBlankLineIndex < lineIndex)) {
            listItem3._spread = true;
          }
          listItem3.end = Object.assign({}, lineIndex ? events[lineIndex][1].start : event[1].end);
          events.splice(lineIndex || index2, 0, ["exit", listItem3, event[2]]);
          index2++;
          length++;
        }
        if (event[1].type === "listItemPrefix") {
          const item = {
            type: "listItem",
            _spread: false,
            start: Object.assign({}, event[1].start),
            // @ts-expect-error: we’ll add `end` in a second.
            end: void 0
          };
          listItem3 = item;
          events.splice(index2, 0, ["enter", item, event[2]]);
          index2++;
          length++;
          firstBlankLineIndex = void 0;
          atMarker = true;
        }
      }
    }
    events[start][1]._spread = listSpread;
    return length;
  }
  function opener(create2, and) {
    return open;
    function open(token) {
      enter.call(this, create2(token), token);
      if (and) and.call(this, token);
    }
  }
  function buffer() {
    this.stack.push({
      type: "fragment",
      children: []
    });
  }
  function enter(node2, token, errorHandler) {
    const parent = this.stack[this.stack.length - 1];
    const siblings2 = parent.children;
    siblings2.push(node2);
    this.stack.push(node2);
    this.tokenStack.push([token, errorHandler || void 0]);
    node2.position = {
      start: point$1(token.start),
      // @ts-expect-error: `end` will be patched later.
      end: void 0
    };
  }
  function closer(and) {
    return close;
    function close(token) {
      if (and) and.call(this, token);
      exit2.call(this, token);
    }
  }
  function exit2(token, onExitError) {
    const node2 = this.stack.pop();
    const open = this.tokenStack.pop();
    if (!open) {
      throw new Error("Cannot close `" + token.type + "` (" + stringifyPosition({
        start: token.start,
        end: token.end
      }) + "): it’s not open");
    } else if (open[0].type !== token.type) {
      if (onExitError) {
        onExitError.call(this, token, open[0]);
      } else {
        const handler = open[1] || defaultOnError;
        handler.call(this, token, open[0]);
      }
    }
    node2.position.end = point$1(token.end);
  }
  function resume() {
    return toString$1(this.stack.pop());
  }
  function onenterlistordered() {
    this.data.expectingFirstListItemValue = true;
  }
  function onenterlistitemvalue(token) {
    if (this.data.expectingFirstListItemValue) {
      const ancestor = this.stack[this.stack.length - 2];
      ancestor.start = Number.parseInt(this.sliceSerialize(token), 10);
      this.data.expectingFirstListItemValue = void 0;
    }
  }
  function onexitcodefencedfenceinfo() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.lang = data2;
  }
  function onexitcodefencedfencemeta() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.meta = data2;
  }
  function onexitcodefencedfence() {
    if (this.data.flowCodeInside) return;
    this.buffer();
    this.data.flowCodeInside = true;
  }
  function onexitcodefenced() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, "");
    this.data.flowCodeInside = void 0;
  }
  function onexitcodeindented() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2.replace(/(\r?\n|\r)$/g, "");
  }
  function onexitdefinitionlabelstring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
  }
  function onexitdefinitiontitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.title = data2;
  }
  function onexitdefinitiondestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.url = data2;
  }
  function onexitatxheadingsequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    if (!node2.depth) {
      const depth = this.sliceSerialize(token).length;
      node2.depth = depth;
    }
  }
  function onexitsetextheadingtext() {
    this.data.setextHeadingSlurpLineEnding = true;
  }
  function onexitsetextheadinglinesequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    node2.depth = this.sliceSerialize(token).codePointAt(0) === 61 ? 1 : 2;
  }
  function onexitsetextheading() {
    this.data.setextHeadingSlurpLineEnding = void 0;
  }
  function onenterdata(token) {
    const node2 = this.stack[this.stack.length - 1];
    const siblings2 = node2.children;
    let tail = siblings2[siblings2.length - 1];
    if (!tail || tail.type !== "text") {
      tail = text2();
      tail.position = {
        start: point$1(token.start),
        // @ts-expect-error: we’ll add `end` later.
        end: void 0
      };
      siblings2.push(tail);
    }
    this.stack.push(tail);
  }
  function onexitdata(token) {
    const tail = this.stack.pop();
    tail.value += this.sliceSerialize(token);
    tail.position.end = point$1(token.end);
  }
  function onexitlineending(token) {
    const context = this.stack[this.stack.length - 1];
    if (this.data.atHardBreak) {
      const tail = context.children[context.children.length - 1];
      tail.position.end = point$1(token.end);
      this.data.atHardBreak = void 0;
      return;
    }
    if (!this.data.setextHeadingSlurpLineEnding && config.canContainEols.includes(context.type)) {
      onenterdata.call(this, token);
      onexitdata.call(this, token);
    }
  }
  function onexithardbreak() {
    this.data.atHardBreak = true;
  }
  function onexithtmlflow() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexithtmltext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexitcodetext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexitlink() {
    const node2 = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = void 0;
  }
  function onexitimage() {
    const node2 = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = void 0;
  }
  function onexitlabeltext(token) {
    const string2 = this.sliceSerialize(token);
    const ancestor = this.stack[this.stack.length - 2];
    ancestor.label = decodeString(string2);
    ancestor.identifier = normalizeIdentifier(string2).toLowerCase();
  }
  function onexitlabel() {
    const fragment = this.stack[this.stack.length - 1];
    const value = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    this.data.inReference = true;
    if (node2.type === "link") {
      const children = fragment.children;
      node2.children = children;
    } else {
      node2.alt = value;
    }
  }
  function onexitresourcedestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.url = data2;
  }
  function onexitresourcetitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.title = data2;
  }
  function onexitresource() {
    this.data.inReference = void 0;
  }
  function onenterreference() {
    this.data.referenceType = "collapsed";
  }
  function onexitreferencestring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
    this.data.referenceType = "full";
  }
  function onexitcharacterreferencemarker(token) {
    this.data.characterReferenceType = token.type;
  }
  function onexitcharacterreferencevalue(token) {
    const data2 = this.sliceSerialize(token);
    const type = this.data.characterReferenceType;
    let value;
    if (type) {
      value = decodeNumericCharacterReference(data2, type === "characterReferenceMarkerNumeric" ? 10 : 16);
      this.data.characterReferenceType = void 0;
    } else {
      const result = decodeNamedCharacterReference(data2);
      value = result;
    }
    const tail = this.stack[this.stack.length - 1];
    tail.value += value;
  }
  function onexitcharacterreference(token) {
    const tail = this.stack.pop();
    tail.position.end = point$1(token.end);
  }
  function onexitautolinkprotocol(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    node2.url = this.sliceSerialize(token);
  }
  function onexitautolinkemail(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    node2.url = "mailto:" + this.sliceSerialize(token);
  }
  function blockQuote2() {
    return {
      type: "blockquote",
      children: []
    };
  }
  function codeFlow() {
    return {
      type: "code",
      lang: null,
      meta: null,
      value: ""
    };
  }
  function codeText2() {
    return {
      type: "inlineCode",
      value: ""
    };
  }
  function definition2() {
    return {
      type: "definition",
      identifier: "",
      label: null,
      title: null,
      url: ""
    };
  }
  function emphasis2() {
    return {
      type: "emphasis",
      children: []
    };
  }
  function heading2() {
    return {
      type: "heading",
      // @ts-expect-error `depth` will be set later.
      depth: 0,
      children: []
    };
  }
  function hardBreak2() {
    return {
      type: "break"
    };
  }
  function html2() {
    return {
      type: "html",
      value: ""
    };
  }
  function image2() {
    return {
      type: "image",
      title: null,
      url: "",
      alt: null
    };
  }
  function link2() {
    return {
      type: "link",
      title: null,
      url: "",
      children: []
    };
  }
  function list2(token) {
    return {
      type: "list",
      ordered: token.type === "listOrdered",
      start: null,
      spread: token._spread,
      children: []
    };
  }
  function listItem2(token) {
    return {
      type: "listItem",
      spread: token._spread,
      checked: null,
      children: []
    };
  }
  function paragraph2() {
    return {
      type: "paragraph",
      children: []
    };
  }
  function strong2() {
    return {
      type: "strong",
      children: []
    };
  }
  function text2() {
    return {
      type: "text",
      value: ""
    };
  }
  function thematicBreak2() {
    return {
      type: "thematicBreak"
    };
  }
}
function point$1(d) {
  return {
    line: d.line,
    column: d.column,
    offset: d.offset
  };
}
function configure(combined, extensions) {
  let index2 = -1;
  while (++index2 < extensions.length) {
    const value = extensions[index2];
    if (Array.isArray(value)) {
      configure(combined, value);
    } else {
      extension(combined, value);
    }
  }
}
function extension(combined, extension2) {
  let key2;
  for (key2 in extension2) {
    if (own$4.call(extension2, key2)) {
      switch (key2) {
        case "canContainEols": {
          const right = extension2[key2];
          if (right) {
            combined[key2].push(...right);
          }
          break;
        }
        case "transforms": {
          const right = extension2[key2];
          if (right) {
            combined[key2].push(...right);
          }
          break;
        }
        case "enter":
        case "exit": {
          const right = extension2[key2];
          if (right) {
            Object.assign(combined[key2], right);
          }
          break;
        }
      }
    }
  }
}
function defaultOnError(left, right) {
  if (left) {
    throw new Error("Cannot close `" + left.type + "` (" + stringifyPosition({
      start: left.start,
      end: left.end
    }) + "): a different token (`" + right.type + "`, " + stringifyPosition({
      start: right.start,
      end: right.end
    }) + ") is open");
  } else {
    throw new Error("Cannot close document, a token (`" + right.type + "`, " + stringifyPosition({
      start: right.start,
      end: right.end
    }) + ") is still open");
  }
}
function remarkParse(options) {
  const self2 = this;
  self2.parser = parser;
  function parser(doc) {
    return fromMarkdown(doc, {
      ...self2.data("settings"),
      ...options,
      // Note: these options are not in the readme.
      // The goal is for them to be set by plugins on `data` instead of being
      // passed by users.
      extensions: self2.data("micromarkExtensions") || [],
      mdastExtensions: self2.data("fromMarkdownExtensions") || []
    });
  }
}
function ccount(value, character) {
  const source = String(value);
  if (typeof character !== "string") {
    throw new TypeError("Expected character");
  }
  let count = 0;
  let index2 = source.indexOf(character);
  while (index2 !== -1) {
    count++;
    index2 = source.indexOf(character, index2 + character.length);
  }
  return count;
}
function escapeStringRegexp(string2) {
  if (typeof string2 !== "string") {
    throw new TypeError("Expected a string");
  }
  return string2.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
const convert = (
  // Note: overloads in JSDoc can’t yet use different `@template`s.
  /**
   * @type {(
   *   (<Condition extends string>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & {type: Condition}) &
   *   (<Condition extends Props>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Condition) &
   *   (<Condition extends TestFunction>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Predicate<Condition, Node>) &
   *   ((test?: null | undefined) => (node?: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node) &
   *   ((test?: Test) => Check)
   * )}
   */
  /**
   * @param {Test} [test]
   * @returns {Check}
   */
  function(test) {
    if (test === null || test === void 0) {
      return ok;
    }
    if (typeof test === "function") {
      return castFactory(test);
    }
    if (typeof test === "object") {
      return Array.isArray(test) ? anyFactory(test) : (
        // Cast because `ReadonlyArray` goes into the above but `isArray`
        // narrows to `Array`.
        propertiesFactory(
          /** @type {Props} */
          test
        )
      );
    }
    if (typeof test === "string") {
      return typeFactory(test);
    }
    throw new Error("Expected function, string, or object as test");
  }
);
function anyFactory(tests) {
  const checks2 = [];
  let index2 = -1;
  while (++index2 < tests.length) {
    checks2[index2] = convert(tests[index2]);
  }
  return castFactory(any);
  function any(...parameters) {
    let index3 = -1;
    while (++index3 < checks2.length) {
      if (checks2[index3].apply(this, parameters)) return true;
    }
    return false;
  }
}
function propertiesFactory(check) {
  const checkAsRecord = (
    /** @type {Record<string, unknown>} */
    check
  );
  return castFactory(all2);
  function all2(node2) {
    const nodeAsRecord = (
      /** @type {Record<string, unknown>} */
      /** @type {unknown} */
      node2
    );
    let key2;
    for (key2 in check) {
      if (nodeAsRecord[key2] !== checkAsRecord[key2]) return false;
    }
    return true;
  }
}
function typeFactory(check) {
  return castFactory(type);
  function type(node2) {
    return node2 && node2.type === check;
  }
}
function castFactory(testFunction) {
  return check;
  function check(value, index2, parent) {
    return Boolean(
      looksLikeANode(value) && testFunction.call(
        this,
        value,
        typeof index2 === "number" ? index2 : void 0,
        parent || void 0
      )
    );
  }
}
function ok() {
  return true;
}
function looksLikeANode(value) {
  return value !== null && typeof value === "object" && "type" in value;
}
function color(d) {
  return d;
}
const empty$1 = [];
const CONTINUE = true;
const EXIT = false;
const SKIP = "skip";
function visitParents(tree, test, visitor, reverse) {
  let check;
  if (typeof test === "function" && typeof visitor !== "function") {
    reverse = visitor;
    visitor = test;
  } else {
    check = test;
  }
  const is = convert(check);
  const step = reverse ? -1 : 1;
  factory(tree, void 0, [])();
  function factory(node2, index2, parents) {
    const value = (
      /** @type {Record<string, unknown>} */
      node2 && typeof node2 === "object" ? node2 : {}
    );
    if (typeof value.type === "string") {
      const name = (
        // `hast`
        typeof value.tagName === "string" ? value.tagName : (
          // `xast`
          typeof value.name === "string" ? value.name : void 0
        )
      );
      Object.defineProperty(visit2, "name", {
        value: "node (" + color(node2.type + (name ? "<" + name + ">" : "")) + ")"
      });
    }
    return visit2;
    function visit2() {
      let result = empty$1;
      let subresult;
      let offset;
      let grandparents;
      if (!test || is(node2, index2, parents[parents.length - 1] || void 0)) {
        result = toResult(visitor(node2, parents));
        if (result[0] === EXIT) {
          return result;
        }
      }
      if ("children" in node2 && node2.children) {
        const nodeAsParent = (
          /** @type {UnistParent} */
          node2
        );
        if (nodeAsParent.children && result[0] !== SKIP) {
          offset = (reverse ? nodeAsParent.children.length : -1) + step;
          grandparents = parents.concat(nodeAsParent);
          while (offset > -1 && offset < nodeAsParent.children.length) {
            const child = nodeAsParent.children[offset];
            subresult = factory(child, offset, grandparents)();
            if (subresult[0] === EXIT) {
              return subresult;
            }
            offset = typeof subresult[1] === "number" ? subresult[1] : offset + step;
          }
        }
      }
      return result;
    }
  }
}
function toResult(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "number") {
    return [CONTINUE, value];
  }
  return value === null || value === void 0 ? empty$1 : [value];
}
function findAndReplace(tree, list2, options) {
  const settings = options || {};
  const ignored = convert(settings.ignore || []);
  const pairs = toPairs(list2);
  let pairIndex = -1;
  while (++pairIndex < pairs.length) {
    visitParents(tree, "text", visitor);
  }
  function visitor(node2, parents) {
    let index2 = -1;
    let grandparent;
    while (++index2 < parents.length) {
      const parent = parents[index2];
      const siblings2 = grandparent ? grandparent.children : void 0;
      if (ignored(
        parent,
        siblings2 ? siblings2.indexOf(parent) : void 0,
        grandparent
      )) {
        return;
      }
      grandparent = parent;
    }
    if (grandparent) {
      return handler(node2, parents);
    }
  }
  function handler(node2, parents) {
    const parent = parents[parents.length - 1];
    const find2 = pairs[pairIndex][0];
    const replace2 = pairs[pairIndex][1];
    let start = 0;
    const siblings2 = parent.children;
    const index2 = siblings2.indexOf(node2);
    let change = false;
    let nodes = [];
    find2.lastIndex = 0;
    let match = find2.exec(node2.value);
    while (match) {
      const position2 = match.index;
      const matchObject = {
        index: match.index,
        input: match.input,
        stack: [...parents, node2]
      };
      let value = replace2(...match, matchObject);
      if (typeof value === "string") {
        value = value.length > 0 ? { type: "text", value } : void 0;
      }
      if (value === false) {
        find2.lastIndex = position2 + 1;
      } else {
        if (start !== position2) {
          nodes.push({
            type: "text",
            value: node2.value.slice(start, position2)
          });
        }
        if (Array.isArray(value)) {
          nodes.push(...value);
        } else if (value) {
          nodes.push(value);
        }
        start = position2 + match[0].length;
        change = true;
      }
      if (!find2.global) {
        break;
      }
      match = find2.exec(node2.value);
    }
    if (change) {
      if (start < node2.value.length) {
        nodes.push({ type: "text", value: node2.value.slice(start) });
      }
      parent.children.splice(index2, 1, ...nodes);
    } else {
      nodes = [node2];
    }
    return index2 + nodes.length;
  }
}
function toPairs(tupleOrList) {
  const result = [];
  if (!Array.isArray(tupleOrList)) {
    throw new TypeError("Expected find and replace tuple or list of tuples");
  }
  const list2 = !tupleOrList[0] || Array.isArray(tupleOrList[0]) ? tupleOrList : [tupleOrList];
  let index2 = -1;
  while (++index2 < list2.length) {
    const tuple = list2[index2];
    result.push([toExpression(tuple[0]), toFunction(tuple[1])]);
  }
  return result;
}
function toExpression(find2) {
  return typeof find2 === "string" ? new RegExp(escapeStringRegexp(find2), "g") : find2;
}
function toFunction(replace2) {
  return typeof replace2 === "function" ? replace2 : function() {
    return replace2;
  };
}
const inConstruct = "phrasing";
const notInConstruct = ["autolink", "link", "image", "label"];
function gfmAutolinkLiteralFromMarkdown() {
  return {
    transforms: [transformGfmAutolinkLiterals],
    enter: {
      literalAutolink: enterLiteralAutolink,
      literalAutolinkEmail: enterLiteralAutolinkValue,
      literalAutolinkHttp: enterLiteralAutolinkValue,
      literalAutolinkWww: enterLiteralAutolinkValue
    },
    exit: {
      literalAutolink: exitLiteralAutolink,
      literalAutolinkEmail: exitLiteralAutolinkEmail,
      literalAutolinkHttp: exitLiteralAutolinkHttp,
      literalAutolinkWww: exitLiteralAutolinkWww
    }
  };
}
function gfmAutolinkLiteralToMarkdown() {
  return {
    unsafe: [
      {
        character: "@",
        before: "[+\\-.\\w]",
        after: "[\\-.\\w]",
        inConstruct,
        notInConstruct
      },
      {
        character: ".",
        before: "[Ww]",
        after: "[\\-.\\w]",
        inConstruct,
        notInConstruct
      },
      {
        character: ":",
        before: "[ps]",
        after: "\\/",
        inConstruct,
        notInConstruct
      }
    ]
  };
}
function enterLiteralAutolink(token) {
  this.enter({ type: "link", title: null, url: "", children: [] }, token);
}
function enterLiteralAutolinkValue(token) {
  this.config.enter.autolinkProtocol.call(this, token);
}
function exitLiteralAutolinkHttp(token) {
  this.config.exit.autolinkProtocol.call(this, token);
}
function exitLiteralAutolinkWww(token) {
  this.config.exit.data.call(this, token);
  const node2 = this.stack[this.stack.length - 1];
  ok$1(node2.type === "link");
  node2.url = "http://" + this.sliceSerialize(token);
}
function exitLiteralAutolinkEmail(token) {
  this.config.exit.autolinkEmail.call(this, token);
}
function exitLiteralAutolink(token) {
  this.exit(token);
}
function transformGfmAutolinkLiterals(tree) {
  findAndReplace(
    tree,
    [
      [/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi, findUrl],
      [new RegExp("(?<=^|\\s|\\p{P}|\\p{S})([-.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)", "gu"), findEmail]
    ],
    { ignore: ["link", "linkReference"] }
  );
}
function findUrl(_, protocol, domain2, path2, match) {
  let prefix = "";
  if (!previous(match)) {
    return false;
  }
  if (/^w/i.test(protocol)) {
    domain2 = protocol + domain2;
    protocol = "";
    prefix = "http://";
  }
  if (!isCorrectDomain(domain2)) {
    return false;
  }
  const parts = splitUrl(domain2 + path2);
  if (!parts[0]) return false;
  const result = {
    type: "link",
    title: null,
    url: prefix + protocol + parts[0],
    children: [{ type: "text", value: protocol + parts[0] }]
  };
  if (parts[1]) {
    return [result, { type: "text", value: parts[1] }];
  }
  return result;
}
function findEmail(_, atext, label, match) {
  if (
    // Not an expected previous character.
    !previous(match, true) || // Label ends in not allowed character.
    /[-\d_]$/.test(label)
  ) {
    return false;
  }
  return {
    type: "link",
    title: null,
    url: "mailto:" + atext + "@" + label,
    children: [{ type: "text", value: atext + "@" + label }]
  };
}
function isCorrectDomain(domain2) {
  const parts = domain2.split(".");
  if (parts.length < 2 || parts[parts.length - 1] && (/_/.test(parts[parts.length - 1]) || !/[a-zA-Z\d]/.test(parts[parts.length - 1])) || parts[parts.length - 2] && (/_/.test(parts[parts.length - 2]) || !/[a-zA-Z\d]/.test(parts[parts.length - 2]))) {
    return false;
  }
  return true;
}
function splitUrl(url) {
  const trailExec = /[!"&'),.:;<>?\]}]+$/.exec(url);
  if (!trailExec) {
    return [url, void 0];
  }
  url = url.slice(0, trailExec.index);
  let trail2 = trailExec[0];
  let closingParenIndex = trail2.indexOf(")");
  const openingParens = ccount(url, "(");
  let closingParens = ccount(url, ")");
  while (closingParenIndex !== -1 && openingParens > closingParens) {
    url += trail2.slice(0, closingParenIndex + 1);
    trail2 = trail2.slice(closingParenIndex + 1);
    closingParenIndex = trail2.indexOf(")");
    closingParens++;
  }
  return [url, trail2];
}
function previous(match, email) {
  const code2 = match.input.charCodeAt(match.index - 1);
  return (match.index === 0 || unicodeWhitespace(code2) || unicodePunctuation(code2)) && // If it’s an email, the previous character should not be a slash.
  (!email || code2 !== 47);
}
footnoteReference$1.peek = footnoteReferencePeek;
function enterFootnoteCallString() {
  this.buffer();
}
function enterFootnoteCall(token) {
  this.enter({ type: "footnoteReference", identifier: "", label: "" }, token);
}
function enterFootnoteDefinitionLabelString() {
  this.buffer();
}
function enterFootnoteDefinition(token) {
  this.enter(
    { type: "footnoteDefinition", identifier: "", label: "", children: [] },
    token
  );
}
function exitFootnoteCallString(token) {
  const label = this.resume();
  const node2 = this.stack[this.stack.length - 1];
  ok$1(node2.type === "footnoteReference");
  node2.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node2.label = label;
}
function exitFootnoteCall(token) {
  this.exit(token);
}
function exitFootnoteDefinitionLabelString(token) {
  const label = this.resume();
  const node2 = this.stack[this.stack.length - 1];
  ok$1(node2.type === "footnoteDefinition");
  node2.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node2.label = label;
}
function exitFootnoteDefinition(token) {
  this.exit(token);
}
function footnoteReferencePeek() {
  return "[";
}
function footnoteReference$1(node2, _, state, info) {
  const tracker = state.createTracker(info);
  let value = tracker.move("[^");
  const exit2 = state.enter("footnoteReference");
  const subexit = state.enter("reference");
  value += tracker.move(
    state.safe(state.associationId(node2), { after: "]", before: value })
  );
  subexit();
  exit2();
  value += tracker.move("]");
  return value;
}
function gfmFootnoteFromMarkdown() {
  return {
    enter: {
      gfmFootnoteCallString: enterFootnoteCallString,
      gfmFootnoteCall: enterFootnoteCall,
      gfmFootnoteDefinitionLabelString: enterFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: enterFootnoteDefinition
    },
    exit: {
      gfmFootnoteCallString: exitFootnoteCallString,
      gfmFootnoteCall: exitFootnoteCall,
      gfmFootnoteDefinitionLabelString: exitFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: exitFootnoteDefinition
    }
  };
}
function gfmFootnoteToMarkdown(options) {
  let firstLineBlank = false;
  if (options && options.firstLineBlank) {
    firstLineBlank = true;
  }
  return {
    handlers: { footnoteDefinition, footnoteReference: footnoteReference$1 },
    // This is on by default already.
    unsafe: [{ character: "[", inConstruct: ["label", "phrasing", "reference"] }]
  };
  function footnoteDefinition(node2, _, state, info) {
    const tracker = state.createTracker(info);
    let value = tracker.move("[^");
    const exit2 = state.enter("footnoteDefinition");
    const subexit = state.enter("label");
    value += tracker.move(
      state.safe(state.associationId(node2), { before: value, after: "]" })
    );
    subexit();
    value += tracker.move("]:");
    if (node2.children && node2.children.length > 0) {
      tracker.shift(4);
      value += tracker.move(
        (firstLineBlank ? "\n" : " ") + state.indentLines(
          state.containerFlow(node2, tracker.current()),
          firstLineBlank ? mapAll : mapExceptFirst
        )
      );
    }
    exit2();
    return value;
  }
}
function mapExceptFirst(line, index2, blank) {
  return index2 === 0 ? line : mapAll(line, index2, blank);
}
function mapAll(line, index2, blank) {
  return (blank ? "" : "    ") + line;
}
const constructsWithoutStrikethrough = [
  "autolink",
  "destinationLiteral",
  "destinationRaw",
  "reference",
  "titleQuote",
  "titleApostrophe"
];
handleDelete.peek = peekDelete;
function gfmStrikethroughFromMarkdown() {
  return {
    canContainEols: ["delete"],
    enter: { strikethrough: enterStrikethrough },
    exit: { strikethrough: exitStrikethrough }
  };
}
function gfmStrikethroughToMarkdown() {
  return {
    unsafe: [
      {
        character: "~",
        inConstruct: "phrasing",
        notInConstruct: constructsWithoutStrikethrough
      }
    ],
    handlers: { delete: handleDelete }
  };
}
function enterStrikethrough(token) {
  this.enter({ type: "delete", children: [] }, token);
}
function exitStrikethrough(token) {
  this.exit(token);
}
function handleDelete(node2, _, state, info) {
  const tracker = state.createTracker(info);
  const exit2 = state.enter("strikethrough");
  let value = tracker.move("~~");
  value += state.containerPhrasing(node2, {
    ...tracker.current(),
    before: value,
    after: "~"
  });
  value += tracker.move("~~");
  exit2();
  return value;
}
function peekDelete() {
  return "~";
}
function defaultStringLength(value) {
  return value.length;
}
function markdownTable(table2, options) {
  const settings = options || {};
  const align = (settings.align || []).concat();
  const stringLength = settings.stringLength || defaultStringLength;
  const alignments = [];
  const cellMatrix = [];
  const sizeMatrix = [];
  const longestCellByColumn = [];
  let mostCellsPerRow = 0;
  let rowIndex = -1;
  while (++rowIndex < table2.length) {
    const row2 = [];
    const sizes2 = [];
    let columnIndex2 = -1;
    if (table2[rowIndex].length > mostCellsPerRow) {
      mostCellsPerRow = table2[rowIndex].length;
    }
    while (++columnIndex2 < table2[rowIndex].length) {
      const cell = serialize$1(table2[rowIndex][columnIndex2]);
      if (settings.alignDelimiters !== false) {
        const size = stringLength(cell);
        sizes2[columnIndex2] = size;
        if (longestCellByColumn[columnIndex2] === void 0 || size > longestCellByColumn[columnIndex2]) {
          longestCellByColumn[columnIndex2] = size;
        }
      }
      row2.push(cell);
    }
    cellMatrix[rowIndex] = row2;
    sizeMatrix[rowIndex] = sizes2;
  }
  let columnIndex = -1;
  if (typeof align === "object" && "length" in align) {
    while (++columnIndex < mostCellsPerRow) {
      alignments[columnIndex] = toAlignment(align[columnIndex]);
    }
  } else {
    const code2 = toAlignment(align);
    while (++columnIndex < mostCellsPerRow) {
      alignments[columnIndex] = code2;
    }
  }
  columnIndex = -1;
  const row = [];
  const sizes = [];
  while (++columnIndex < mostCellsPerRow) {
    const code2 = alignments[columnIndex];
    let before = "";
    let after = "";
    if (code2 === 99) {
      before = ":";
      after = ":";
    } else if (code2 === 108) {
      before = ":";
    } else if (code2 === 114) {
      after = ":";
    }
    let size = settings.alignDelimiters === false ? 1 : Math.max(
      1,
      longestCellByColumn[columnIndex] - before.length - after.length
    );
    const cell = before + "-".repeat(size) + after;
    if (settings.alignDelimiters !== false) {
      size = before.length + size + after.length;
      if (size > longestCellByColumn[columnIndex]) {
        longestCellByColumn[columnIndex] = size;
      }
      sizes[columnIndex] = size;
    }
    row[columnIndex] = cell;
  }
  cellMatrix.splice(1, 0, row);
  sizeMatrix.splice(1, 0, sizes);
  rowIndex = -1;
  const lines = [];
  while (++rowIndex < cellMatrix.length) {
    const row2 = cellMatrix[rowIndex];
    const sizes2 = sizeMatrix[rowIndex];
    columnIndex = -1;
    const line = [];
    while (++columnIndex < mostCellsPerRow) {
      const cell = row2[columnIndex] || "";
      let before = "";
      let after = "";
      if (settings.alignDelimiters !== false) {
        const size = longestCellByColumn[columnIndex] - (sizes2[columnIndex] || 0);
        const code2 = alignments[columnIndex];
        if (code2 === 114) {
          before = " ".repeat(size);
        } else if (code2 === 99) {
          if (size % 2) {
            before = " ".repeat(size / 2 + 0.5);
            after = " ".repeat(size / 2 - 0.5);
          } else {
            before = " ".repeat(size / 2);
            after = before;
          }
        } else {
          after = " ".repeat(size);
        }
      }
      if (settings.delimiterStart !== false && !columnIndex) {
        line.push("|");
      }
      if (settings.padding !== false && // Don’t add the opening space if we’re not aligning and the cell is
      // empty: there will be a closing space.
      !(settings.alignDelimiters === false && cell === "") && (settings.delimiterStart !== false || columnIndex)) {
        line.push(" ");
      }
      if (settings.alignDelimiters !== false) {
        line.push(before);
      }
      line.push(cell);
      if (settings.alignDelimiters !== false) {
        line.push(after);
      }
      if (settings.padding !== false) {
        line.push(" ");
      }
      if (settings.delimiterEnd !== false || columnIndex !== mostCellsPerRow - 1) {
        line.push("|");
      }
    }
    lines.push(
      settings.delimiterEnd === false ? line.join("").replace(/ +$/, "") : line.join("")
    );
  }
  return lines.join("\n");
}
function serialize$1(value) {
  return value === null || value === void 0 ? "" : String(value);
}
function toAlignment(value) {
  const code2 = typeof value === "string" ? value.codePointAt(0) : 0;
  return code2 === 67 || code2 === 99 ? 99 : code2 === 76 || code2 === 108 ? 108 : code2 === 82 || code2 === 114 ? 114 : 0;
}
const own$3 = {}.hasOwnProperty;
function zwitch(key2, options) {
  const settings = options || {};
  function one2(value, ...parameters) {
    let fn = one2.invalid;
    const handlers2 = one2.handlers;
    if (value && own$3.call(value, key2)) {
      const id = String(value[key2]);
      fn = own$3.call(handlers2, id) ? handlers2[id] : one2.unknown;
    }
    if (fn) {
      return fn.call(this, value, ...parameters);
    }
  }
  one2.handlers = settings.handlers || {};
  one2.invalid = settings.invalid;
  one2.unknown = settings.unknown;
  return one2;
}
function blockquote$1(node2, _, state, info) {
  const exit2 = state.enter("blockquote");
  const tracker = state.createTracker(info);
  tracker.move("> ");
  tracker.shift(2);
  const value = state.indentLines(
    state.containerFlow(node2, tracker.current()),
    map$1
  );
  exit2();
  return value;
}
function map$1(line, _, blank) {
  return ">" + (blank ? "" : " ") + line;
}
function patternInScope(stack, pattern) {
  return listInScope(stack, pattern.inConstruct, true) && !listInScope(stack, pattern.notInConstruct, false);
}
function listInScope(stack, list2, none) {
  if (typeof list2 === "string") {
    list2 = [list2];
  }
  if (!list2 || list2.length === 0) {
    return none;
  }
  let index2 = -1;
  while (++index2 < list2.length) {
    if (stack.includes(list2[index2])) {
      return true;
    }
  }
  return false;
}
function hardBreak$1(_, _1, state, info) {
  let index2 = -1;
  while (++index2 < state.unsafe.length) {
    if (state.unsafe[index2].character === "\n" && patternInScope(state.stack, state.unsafe[index2])) {
      return /[ \t]/.test(info.before) ? "" : " ";
    }
  }
  return "\\\n";
}
function longestStreak(value, substring) {
  const source = String(value);
  let index2 = source.indexOf(substring);
  let expected = index2;
  let count = 0;
  let max = 0;
  if (typeof substring !== "string") {
    throw new TypeError("Expected substring");
  }
  while (index2 !== -1) {
    if (index2 === expected) {
      if (++count > max) {
        max = count;
      }
    } else {
      count = 1;
    }
    expected = index2 + substring.length;
    index2 = source.indexOf(substring, expected);
  }
  return max;
}
function formatCodeAsIndented(node2, state) {
  return Boolean(
    state.options.fences === false && node2.value && // If there’s no info…
    !node2.lang && // And there’s a non-whitespace character…
    /[^ \r\n]/.test(node2.value) && // And the value doesn’t start or end in a blank…
    !/^[\t ]*(?:[\r\n]|$)|(?:^|[\r\n])[\t ]*$/.test(node2.value)
  );
}
function checkFence(state) {
  const marker = state.options.fence || "`";
  if (marker !== "`" && marker !== "~") {
    throw new Error(
      "Cannot serialize code with `" + marker + "` for `options.fence`, expected `` ` `` or `~`"
    );
  }
  return marker;
}
function code$2(node2, _, state, info) {
  const marker = checkFence(state);
  const raw2 = node2.value || "";
  const suffix = marker === "`" ? "GraveAccent" : "Tilde";
  if (formatCodeAsIndented(node2, state)) {
    const exit3 = state.enter("codeIndented");
    const value2 = state.indentLines(raw2, map);
    exit3();
    return value2;
  }
  const tracker = state.createTracker(info);
  const sequence = marker.repeat(Math.max(longestStreak(raw2, marker) + 1, 3));
  const exit2 = state.enter("codeFenced");
  let value = tracker.move(sequence);
  if (node2.lang) {
    const subexit = state.enter(`codeFencedLang${suffix}`);
    value += tracker.move(
      state.safe(node2.lang, {
        before: value,
        after: " ",
        encode: ["`"],
        ...tracker.current()
      })
    );
    subexit();
  }
  if (node2.lang && node2.meta) {
    const subexit = state.enter(`codeFencedMeta${suffix}`);
    value += tracker.move(" ");
    value += tracker.move(
      state.safe(node2.meta, {
        before: value,
        after: "\n",
        encode: ["`"],
        ...tracker.current()
      })
    );
    subexit();
  }
  value += tracker.move("\n");
  if (raw2) {
    value += tracker.move(raw2 + "\n");
  }
  value += tracker.move(sequence);
  exit2();
  return value;
}
function map(line, _, blank) {
  return (blank ? "" : "    ") + line;
}
function checkQuote(state) {
  const marker = state.options.quote || '"';
  if (marker !== '"' && marker !== "'") {
    throw new Error(
      "Cannot serialize title with `" + marker + "` for `options.quote`, expected `\"`, or `'`"
    );
  }
  return marker;
}
function definition(node2, _, state, info) {
  const quote = checkQuote(state);
  const suffix = quote === '"' ? "Quote" : "Apostrophe";
  const exit2 = state.enter("definition");
  let subexit = state.enter("label");
  const tracker = state.createTracker(info);
  let value = tracker.move("[");
  value += tracker.move(
    state.safe(state.associationId(node2), {
      before: value,
      after: "]",
      ...tracker.current()
    })
  );
  value += tracker.move("]: ");
  subexit();
  if (
    // If there’s no url, or…
    !node2.url || // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node2.url)
  ) {
    subexit = state.enter("destinationLiteral");
    value += tracker.move("<");
    value += tracker.move(
      state.safe(node2.url, { before: value, after: ">", ...tracker.current() })
    );
    value += tracker.move(">");
  } else {
    subexit = state.enter("destinationRaw");
    value += tracker.move(
      state.safe(node2.url, {
        before: value,
        after: node2.title ? " " : "\n",
        ...tracker.current()
      })
    );
  }
  subexit();
  if (node2.title) {
    subexit = state.enter(`title${suffix}`);
    value += tracker.move(" " + quote);
    value += tracker.move(
      state.safe(node2.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    );
    value += tracker.move(quote);
    subexit();
  }
  exit2();
  return value;
}
function checkEmphasis(state) {
  const marker = state.options.emphasis || "*";
  if (marker !== "*" && marker !== "_") {
    throw new Error(
      "Cannot serialize emphasis with `" + marker + "` for `options.emphasis`, expected `*`, or `_`"
    );
  }
  return marker;
}
function encodeCharacterReference(code2) {
  return "&#x" + code2.toString(16).toUpperCase() + ";";
}
function encodeInfo(outside, inside, marker) {
  const outsideKind = classifyCharacter(outside);
  const insideKind = classifyCharacter(inside);
  if (outsideKind === void 0) {
    return insideKind === void 0 ? (
      // Letter inside:
      // we have to encode *both* letters for `_` as it is looser.
      // it already forms for `*` (and GFMs `~`).
      marker === "_" ? { inside: true, outside: true } : { inside: false, outside: false }
    ) : insideKind === 1 ? (
      // Whitespace inside: encode both (letter, whitespace).
      { inside: true, outside: true }
    ) : (
      // Punctuation inside: encode outer (letter)
      { inside: false, outside: true }
    );
  }
  if (outsideKind === 1) {
    return insideKind === void 0 ? (
      // Letter inside: already forms.
      { inside: false, outside: false }
    ) : insideKind === 1 ? (
      // Whitespace inside: encode both (whitespace).
      { inside: true, outside: true }
    ) : (
      // Punctuation inside: already forms.
      { inside: false, outside: false }
    );
  }
  return insideKind === void 0 ? (
    // Letter inside: already forms.
    { inside: false, outside: false }
  ) : insideKind === 1 ? (
    // Whitespace inside: encode inner (whitespace).
    { inside: true, outside: false }
  ) : (
    // Punctuation inside: already forms.
    { inside: false, outside: false }
  );
}
emphasis$1.peek = emphasisPeek;
function emphasis$1(node2, _, state, info) {
  const marker = checkEmphasis(state);
  const exit2 = state.enter("emphasis");
  const tracker = state.createTracker(info);
  const before = tracker.move(marker);
  let between = tracker.move(
    state.containerPhrasing(node2, {
      after: marker,
      before,
      ...tracker.current()
    })
  );
  const betweenHead = between.charCodeAt(0);
  const open = encodeInfo(
    info.before.charCodeAt(info.before.length - 1),
    betweenHead,
    marker
  );
  if (open.inside) {
    between = encodeCharacterReference(betweenHead) + between.slice(1);
  }
  const betweenTail = between.charCodeAt(between.length - 1);
  const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker);
  if (close.inside) {
    between = between.slice(0, -1) + encodeCharacterReference(betweenTail);
  }
  const after = tracker.move(marker);
  exit2();
  state.attentionEncodeSurroundingInfo = {
    after: close.outside,
    before: open.outside
  };
  return before + between + after;
}
function emphasisPeek(_, _1, state) {
  return state.options.emphasis || "*";
}
function visit(tree, testOrVisitor, visitorOrReverse, maybeReverse) {
  let reverse;
  let test;
  let visitor;
  if (typeof testOrVisitor === "function" && typeof visitorOrReverse !== "function") {
    test = void 0;
    visitor = testOrVisitor;
    reverse = visitorOrReverse;
  } else {
    test = testOrVisitor;
    visitor = visitorOrReverse;
    reverse = maybeReverse;
  }
  visitParents(tree, test, overload, reverse);
  function overload(node2, parents) {
    const parent = parents[parents.length - 1];
    const index2 = parent ? parent.children.indexOf(node2) : void 0;
    return visitor(node2, index2, parent);
  }
}
function formatHeadingAsSetext(node2, state) {
  let literalWithBreak = false;
  visit(node2, function(node3) {
    if ("value" in node3 && /\r?\n|\r/.test(node3.value) || node3.type === "break") {
      literalWithBreak = true;
      return EXIT;
    }
  });
  return Boolean(
    (!node2.depth || node2.depth < 3) && toString$1(node2) && (state.options.setext || literalWithBreak)
  );
}
function heading$1(node2, _, state, info) {
  const rank = Math.max(Math.min(6, node2.depth || 1), 1);
  const tracker = state.createTracker(info);
  if (formatHeadingAsSetext(node2, state)) {
    const exit3 = state.enter("headingSetext");
    const subexit2 = state.enter("phrasing");
    const value2 = state.containerPhrasing(node2, {
      ...tracker.current(),
      before: "\n",
      after: "\n"
    });
    subexit2();
    exit3();
    return value2 + "\n" + (rank === 1 ? "=" : "-").repeat(
      // The whole size…
      value2.length - // Minus the position of the character after the last EOL (or
      // 0 if there is none)…
      (Math.max(value2.lastIndexOf("\r"), value2.lastIndexOf("\n")) + 1)
    );
  }
  const sequence = "#".repeat(rank);
  const exit2 = state.enter("headingAtx");
  const subexit = state.enter("phrasing");
  tracker.move(sequence + " ");
  let value = state.containerPhrasing(node2, {
    before: "# ",
    after: "\n",
    ...tracker.current()
  });
  if (/^[\t ]/.test(value)) {
    value = encodeCharacterReference(value.charCodeAt(0)) + value.slice(1);
  }
  value = value ? sequence + " " + value : sequence;
  if (state.options.closeAtx) {
    value += " " + sequence;
  }
  subexit();
  exit2();
  return value;
}
html$5.peek = htmlPeek;
function html$5(node2) {
  return node2.value || "";
}
function htmlPeek() {
  return "<";
}
image$1.peek = imagePeek;
function image$1(node2, _, state, info) {
  const quote = checkQuote(state);
  const suffix = quote === '"' ? "Quote" : "Apostrophe";
  const exit2 = state.enter("image");
  let subexit = state.enter("label");
  const tracker = state.createTracker(info);
  let value = tracker.move("![");
  value += tracker.move(
    state.safe(node2.alt, { before: value, after: "]", ...tracker.current() })
  );
  value += tracker.move("](");
  subexit();
  if (
    // If there’s no url but there is a title…
    !node2.url && node2.title || // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node2.url)
  ) {
    subexit = state.enter("destinationLiteral");
    value += tracker.move("<");
    value += tracker.move(
      state.safe(node2.url, { before: value, after: ">", ...tracker.current() })
    );
    value += tracker.move(">");
  } else {
    subexit = state.enter("destinationRaw");
    value += tracker.move(
      state.safe(node2.url, {
        before: value,
        after: node2.title ? " " : ")",
        ...tracker.current()
      })
    );
  }
  subexit();
  if (node2.title) {
    subexit = state.enter(`title${suffix}`);
    value += tracker.move(" " + quote);
    value += tracker.move(
      state.safe(node2.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    );
    value += tracker.move(quote);
    subexit();
  }
  value += tracker.move(")");
  exit2();
  return value;
}
function imagePeek() {
  return "!";
}
imageReference$1.peek = imageReferencePeek;
function imageReference$1(node2, _, state, info) {
  const type = node2.referenceType;
  const exit2 = state.enter("imageReference");
  let subexit = state.enter("label");
  const tracker = state.createTracker(info);
  let value = tracker.move("![");
  const alt = state.safe(node2.alt, {
    before: value,
    after: "]",
    ...tracker.current()
  });
  value += tracker.move(alt + "][");
  subexit();
  const stack = state.stack;
  state.stack = [];
  subexit = state.enter("reference");
  const reference = state.safe(state.associationId(node2), {
    before: value,
    after: "]",
    ...tracker.current()
  });
  subexit();
  state.stack = stack;
  exit2();
  if (type === "full" || !alt || alt !== reference) {
    value += tracker.move(reference + "]");
  } else if (type === "shortcut") {
    value = value.slice(0, -1);
  } else {
    value += tracker.move("]");
  }
  return value;
}
function imageReferencePeek() {
  return "!";
}
inlineCode$1.peek = inlineCodePeek;
function inlineCode$1(node2, _, state) {
  let value = node2.value || "";
  let sequence = "`";
  let index2 = -1;
  while (new RegExp("(^|[^`])" + sequence + "([^`]|$)").test(value)) {
    sequence += "`";
  }
  if (/[^ \r\n]/.test(value) && (/^[ \r\n]/.test(value) && /[ \r\n]$/.test(value) || /^`|`$/.test(value))) {
    value = " " + value + " ";
  }
  while (++index2 < state.unsafe.length) {
    const pattern = state.unsafe[index2];
    const expression = state.compilePattern(pattern);
    let match;
    if (!pattern.atBreak) continue;
    while (match = expression.exec(value)) {
      let position2 = match.index;
      if (value.charCodeAt(position2) === 10 && value.charCodeAt(position2 - 1) === 13) {
        position2--;
      }
      value = value.slice(0, position2) + " " + value.slice(match.index + 1);
    }
  }
  return sequence + value + sequence;
}
function inlineCodePeek() {
  return "`";
}
function formatLinkAsAutolink(node2, state) {
  const raw2 = toString$1(node2);
  return Boolean(
    !state.options.resourceLink && // If there’s a url…
    node2.url && // And there’s a no title…
    !node2.title && // And the content of `node` is a single text node…
    node2.children && node2.children.length === 1 && node2.children[0].type === "text" && // And if the url is the same as the content…
    (raw2 === node2.url || "mailto:" + raw2 === node2.url) && // And that starts w/ a protocol…
    /^[a-z][a-z+.-]+:/i.test(node2.url) && // And that doesn’t contain ASCII control codes (character escapes and
    // references don’t work), space, or angle brackets…
    !/[\0- <>\u007F]/.test(node2.url)
  );
}
link$1.peek = linkPeek;
function link$1(node2, _, state, info) {
  const quote = checkQuote(state);
  const suffix = quote === '"' ? "Quote" : "Apostrophe";
  const tracker = state.createTracker(info);
  let exit2;
  let subexit;
  if (formatLinkAsAutolink(node2, state)) {
    const stack = state.stack;
    state.stack = [];
    exit2 = state.enter("autolink");
    let value2 = tracker.move("<");
    value2 += tracker.move(
      state.containerPhrasing(node2, {
        before: value2,
        after: ">",
        ...tracker.current()
      })
    );
    value2 += tracker.move(">");
    exit2();
    state.stack = stack;
    return value2;
  }
  exit2 = state.enter("link");
  subexit = state.enter("label");
  let value = tracker.move("[");
  value += tracker.move(
    state.containerPhrasing(node2, {
      before: value,
      after: "](",
      ...tracker.current()
    })
  );
  value += tracker.move("](");
  subexit();
  if (
    // If there’s no url but there is a title…
    !node2.url && node2.title || // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node2.url)
  ) {
    subexit = state.enter("destinationLiteral");
    value += tracker.move("<");
    value += tracker.move(
      state.safe(node2.url, { before: value, after: ">", ...tracker.current() })
    );
    value += tracker.move(">");
  } else {
    subexit = state.enter("destinationRaw");
    value += tracker.move(
      state.safe(node2.url, {
        before: value,
        after: node2.title ? " " : ")",
        ...tracker.current()
      })
    );
  }
  subexit();
  if (node2.title) {
    subexit = state.enter(`title${suffix}`);
    value += tracker.move(" " + quote);
    value += tracker.move(
      state.safe(node2.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    );
    value += tracker.move(quote);
    subexit();
  }
  value += tracker.move(")");
  exit2();
  return value;
}
function linkPeek(node2, _, state) {
  return formatLinkAsAutolink(node2, state) ? "<" : "[";
}
linkReference$1.peek = linkReferencePeek;
function linkReference$1(node2, _, state, info) {
  const type = node2.referenceType;
  const exit2 = state.enter("linkReference");
  let subexit = state.enter("label");
  const tracker = state.createTracker(info);
  let value = tracker.move("[");
  const text2 = state.containerPhrasing(node2, {
    before: value,
    after: "]",
    ...tracker.current()
  });
  value += tracker.move(text2 + "][");
  subexit();
  const stack = state.stack;
  state.stack = [];
  subexit = state.enter("reference");
  const reference = state.safe(state.associationId(node2), {
    before: value,
    after: "]",
    ...tracker.current()
  });
  subexit();
  state.stack = stack;
  exit2();
  if (type === "full" || !text2 || text2 !== reference) {
    value += tracker.move(reference + "]");
  } else if (type === "shortcut") {
    value = value.slice(0, -1);
  } else {
    value += tracker.move("]");
  }
  return value;
}
function linkReferencePeek() {
  return "[";
}
function checkBullet(state) {
  const marker = state.options.bullet || "*";
  if (marker !== "*" && marker !== "+" && marker !== "-") {
    throw new Error(
      "Cannot serialize items with `" + marker + "` for `options.bullet`, expected `*`, `+`, or `-`"
    );
  }
  return marker;
}
function checkBulletOther(state) {
  const bullet = checkBullet(state);
  const bulletOther = state.options.bulletOther;
  if (!bulletOther) {
    return bullet === "*" ? "-" : "*";
  }
  if (bulletOther !== "*" && bulletOther !== "+" && bulletOther !== "-") {
    throw new Error(
      "Cannot serialize items with `" + bulletOther + "` for `options.bulletOther`, expected `*`, `+`, or `-`"
    );
  }
  if (bulletOther === bullet) {
    throw new Error(
      "Expected `bullet` (`" + bullet + "`) and `bulletOther` (`" + bulletOther + "`) to be different"
    );
  }
  return bulletOther;
}
function checkBulletOrdered(state) {
  const marker = state.options.bulletOrdered || ".";
  if (marker !== "." && marker !== ")") {
    throw new Error(
      "Cannot serialize items with `" + marker + "` for `options.bulletOrdered`, expected `.` or `)`"
    );
  }
  return marker;
}
function checkRule(state) {
  const marker = state.options.rule || "*";
  if (marker !== "*" && marker !== "-" && marker !== "_") {
    throw new Error(
      "Cannot serialize rules with `" + marker + "` for `options.rule`, expected `*`, `-`, or `_`"
    );
  }
  return marker;
}
function list$1(node2, parent, state, info) {
  const exit2 = state.enter("list");
  const bulletCurrent = state.bulletCurrent;
  let bullet = node2.ordered ? checkBulletOrdered(state) : checkBullet(state);
  const bulletOther = node2.ordered ? bullet === "." ? ")" : "." : checkBulletOther(state);
  let useDifferentMarker = parent && state.bulletLastUsed ? bullet === state.bulletLastUsed : false;
  if (!node2.ordered) {
    const firstListItem = node2.children ? node2.children[0] : void 0;
    if (
      // Bullet could be used as a thematic break marker:
      (bullet === "*" || bullet === "-") && // Empty first list item:
      firstListItem && (!firstListItem.children || !firstListItem.children[0]) && // Directly in two other list items:
      state.stack[state.stack.length - 1] === "list" && state.stack[state.stack.length - 2] === "listItem" && state.stack[state.stack.length - 3] === "list" && state.stack[state.stack.length - 4] === "listItem" && // That are each the first child.
      state.indexStack[state.indexStack.length - 1] === 0 && state.indexStack[state.indexStack.length - 2] === 0 && state.indexStack[state.indexStack.length - 3] === 0
    ) {
      useDifferentMarker = true;
    }
    if (checkRule(state) === bullet && firstListItem) {
      let index2 = -1;
      while (++index2 < node2.children.length) {
        const item = node2.children[index2];
        if (item && item.type === "listItem" && item.children && item.children[0] && item.children[0].type === "thematicBreak") {
          useDifferentMarker = true;
          break;
        }
      }
    }
  }
  if (useDifferentMarker) {
    bullet = bulletOther;
  }
  state.bulletCurrent = bullet;
  const value = state.containerFlow(node2, info);
  state.bulletLastUsed = bullet;
  state.bulletCurrent = bulletCurrent;
  exit2();
  return value;
}
function checkListItemIndent(state) {
  const style = state.options.listItemIndent || "one";
  if (style !== "tab" && style !== "one" && style !== "mixed") {
    throw new Error(
      "Cannot serialize items with `" + style + "` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`"
    );
  }
  return style;
}
function listItem$1(node2, parent, state, info) {
  const listItemIndent = checkListItemIndent(state);
  let bullet = state.bulletCurrent || checkBullet(state);
  if (parent && parent.type === "list" && parent.ordered) {
    bullet = (typeof parent.start === "number" && parent.start > -1 ? parent.start : 1) + (state.options.incrementListMarker === false ? 0 : parent.children.indexOf(node2)) + bullet;
  }
  let size = bullet.length + 1;
  if (listItemIndent === "tab" || listItemIndent === "mixed" && (parent && parent.type === "list" && parent.spread || node2.spread)) {
    size = Math.ceil(size / 4) * 4;
  }
  const tracker = state.createTracker(info);
  tracker.move(bullet + " ".repeat(size - bullet.length));
  tracker.shift(size);
  const exit2 = state.enter("listItem");
  const value = state.indentLines(
    state.containerFlow(node2, tracker.current()),
    map2
  );
  exit2();
  return value;
  function map2(line, index2, blank) {
    if (index2) {
      return (blank ? "" : " ".repeat(size)) + line;
    }
    return (blank ? bullet : bullet + " ".repeat(size - bullet.length)) + line;
  }
}
function paragraph$1(node2, _, state, info) {
  const exit2 = state.enter("paragraph");
  const subexit = state.enter("phrasing");
  const value = state.containerPhrasing(node2, info);
  subexit();
  exit2();
  return value;
}
const phrasing = (
  /** @type {(node?: unknown) => node is Exclude<PhrasingContent, Html>} */
  convert([
    "break",
    "delete",
    "emphasis",
    // To do: next major: removed since footnotes were added to GFM.
    "footnote",
    "footnoteReference",
    "image",
    "imageReference",
    "inlineCode",
    // Enabled by `mdast-util-math`:
    "inlineMath",
    "link",
    "linkReference",
    // Enabled by `mdast-util-mdx`:
    "mdxJsxTextElement",
    // Enabled by `mdast-util-mdx`:
    "mdxTextExpression",
    "strong",
    "text",
    // Enabled by `mdast-util-directive`:
    "textDirective"
  ])
);
function root$2(node2, _, state, info) {
  const hasPhrasing = node2.children.some(function(d) {
    return phrasing(d);
  });
  const container = hasPhrasing ? state.containerPhrasing : state.containerFlow;
  return container.call(state, node2, info);
}
function checkStrong(state) {
  const marker = state.options.strong || "*";
  if (marker !== "*" && marker !== "_") {
    throw new Error(
      "Cannot serialize strong with `" + marker + "` for `options.strong`, expected `*`, or `_`"
    );
  }
  return marker;
}
strong$1.peek = strongPeek;
function strong$1(node2, _, state, info) {
  const marker = checkStrong(state);
  const exit2 = state.enter("strong");
  const tracker = state.createTracker(info);
  const before = tracker.move(marker + marker);
  let between = tracker.move(
    state.containerPhrasing(node2, {
      after: marker,
      before,
      ...tracker.current()
    })
  );
  const betweenHead = between.charCodeAt(0);
  const open = encodeInfo(
    info.before.charCodeAt(info.before.length - 1),
    betweenHead,
    marker
  );
  if (open.inside) {
    between = encodeCharacterReference(betweenHead) + between.slice(1);
  }
  const betweenTail = between.charCodeAt(between.length - 1);
  const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker);
  if (close.inside) {
    between = between.slice(0, -1) + encodeCharacterReference(betweenTail);
  }
  const after = tracker.move(marker + marker);
  exit2();
  state.attentionEncodeSurroundingInfo = {
    after: close.outside,
    before: open.outside
  };
  return before + between + after;
}
function strongPeek(_, _1, state) {
  return state.options.strong || "*";
}
function text$3(node2, _, state, info) {
  return state.safe(node2.value, info);
}
function checkRuleRepetition(state) {
  const repetition = state.options.ruleRepetition || 3;
  if (repetition < 3) {
    throw new Error(
      "Cannot serialize rules with repetition `" + repetition + "` for `options.ruleRepetition`, expected `3` or more"
    );
  }
  return repetition;
}
function thematicBreak$1(_, _1, state) {
  const value = (checkRule(state) + (state.options.ruleSpaces ? " " : "")).repeat(checkRuleRepetition(state));
  return state.options.ruleSpaces ? value.slice(0, -1) : value;
}
const handle$1 = {
  blockquote: blockquote$1,
  break: hardBreak$1,
  code: code$2,
  definition,
  emphasis: emphasis$1,
  hardBreak: hardBreak$1,
  heading: heading$1,
  html: html$5,
  image: image$1,
  imageReference: imageReference$1,
  inlineCode: inlineCode$1,
  link: link$1,
  linkReference: linkReference$1,
  list: list$1,
  listItem: listItem$1,
  paragraph: paragraph$1,
  root: root$2,
  strong: strong$1,
  text: text$3,
  thematicBreak: thematicBreak$1
};
function gfmTableFromMarkdown() {
  return {
    enter: {
      table: enterTable,
      tableData: enterCell,
      tableHeader: enterCell,
      tableRow: enterRow
    },
    exit: {
      codeText: exitCodeText,
      table: exitTable,
      tableData: exit,
      tableHeader: exit,
      tableRow: exit
    }
  };
}
function enterTable(token) {
  const align = token._align;
  this.enter(
    {
      type: "table",
      align: align.map(function(d) {
        return d === "none" ? null : d;
      }),
      children: []
    },
    token
  );
  this.data.inTable = true;
}
function exitTable(token) {
  this.exit(token);
  this.data.inTable = void 0;
}
function enterRow(token) {
  this.enter({ type: "tableRow", children: [] }, token);
}
function exit(token) {
  this.exit(token);
}
function enterCell(token) {
  this.enter({ type: "tableCell", children: [] }, token);
}
function exitCodeText(token) {
  let value = this.resume();
  if (this.data.inTable) {
    value = value.replace(/\\([\\|])/g, replace);
  }
  const node2 = this.stack[this.stack.length - 1];
  ok$1(node2.type === "inlineCode");
  node2.value = value;
  this.exit(token);
}
function replace($0, $1) {
  return $1 === "|" ? $1 : $0;
}
function gfmTableToMarkdown(options) {
  const settings = options || {};
  const padding = settings.tableCellPadding;
  const alignDelimiters = settings.tablePipeAlign;
  const stringLength = settings.stringLength;
  const around = padding ? " " : "|";
  return {
    unsafe: [
      { character: "\r", inConstruct: "tableCell" },
      { character: "\n", inConstruct: "tableCell" },
      // A pipe, when followed by a tab or space (padding), or a dash or colon
      // (unpadded delimiter row), could result in a table.
      { atBreak: true, character: "|", after: "[	 :-]" },
      // A pipe in a cell must be encoded.
      { character: "|", inConstruct: "tableCell" },
      // A colon must be followed by a dash, in which case it could start a
      // delimiter row.
      { atBreak: true, character: ":", after: "-" },
      // A delimiter row can also start with a dash, when followed by more
      // dashes, a colon, or a pipe.
      // This is a stricter version than the built in check for lists, thematic
      // breaks, and setex heading underlines though:
      // <https://github.com/syntax-tree/mdast-util-to-markdown/blob/51a2038/lib/unsafe.js#L57>
      { atBreak: true, character: "-", after: "[:|-]" }
    ],
    handlers: {
      inlineCode: inlineCodeWithTable,
      table: handleTable,
      tableCell: handleTableCell,
      tableRow: handleTableRow
    }
  };
  function handleTable(node2, _, state, info) {
    return serializeData(handleTableAsData(node2, state, info), node2.align);
  }
  function handleTableRow(node2, _, state, info) {
    const row = handleTableRowAsData(node2, state, info);
    const value = serializeData([row]);
    return value.slice(0, value.indexOf("\n"));
  }
  function handleTableCell(node2, _, state, info) {
    const exit2 = state.enter("tableCell");
    const subexit = state.enter("phrasing");
    const value = state.containerPhrasing(node2, {
      ...info,
      before: around,
      after: around
    });
    subexit();
    exit2();
    return value;
  }
  function serializeData(matrix, align) {
    return markdownTable(matrix, {
      align,
      // @ts-expect-error: `markdown-table` types should support `null`.
      alignDelimiters,
      // @ts-expect-error: `markdown-table` types should support `null`.
      padding,
      // @ts-expect-error: `markdown-table` types should support `null`.
      stringLength
    });
  }
  function handleTableAsData(node2, state, info) {
    const children = node2.children;
    let index2 = -1;
    const result = [];
    const subexit = state.enter("table");
    while (++index2 < children.length) {
      result[index2] = handleTableRowAsData(children[index2], state, info);
    }
    subexit();
    return result;
  }
  function handleTableRowAsData(node2, state, info) {
    const children = node2.children;
    let index2 = -1;
    const result = [];
    const subexit = state.enter("tableRow");
    while (++index2 < children.length) {
      result[index2] = handleTableCell(children[index2], node2, state, info);
    }
    subexit();
    return result;
  }
  function inlineCodeWithTable(node2, parent, state) {
    let value = handle$1.inlineCode(node2, parent, state);
    if (state.stack.includes("tableCell")) {
      value = value.replace(/\|/g, "\\$&");
    }
    return value;
  }
}
function gfmTaskListItemFromMarkdown() {
  return {
    exit: {
      taskListCheckValueChecked: exitCheck,
      taskListCheckValueUnchecked: exitCheck,
      paragraph: exitParagraphWithTaskListItem
    }
  };
}
function gfmTaskListItemToMarkdown() {
  return {
    unsafe: [{ atBreak: true, character: "-", after: "[:|-]" }],
    handlers: { listItem: listItemWithTaskListItem }
  };
}
function exitCheck(token) {
  const node2 = this.stack[this.stack.length - 2];
  ok$1(node2.type === "listItem");
  node2.checked = token.type === "taskListCheckValueChecked";
}
function exitParagraphWithTaskListItem(token) {
  const parent = this.stack[this.stack.length - 2];
  if (parent && parent.type === "listItem" && typeof parent.checked === "boolean") {
    const node2 = this.stack[this.stack.length - 1];
    ok$1(node2.type === "paragraph");
    const head2 = node2.children[0];
    if (head2 && head2.type === "text") {
      const siblings2 = parent.children;
      let index2 = -1;
      let firstParaghraph;
      while (++index2 < siblings2.length) {
        const sibling = siblings2[index2];
        if (sibling.type === "paragraph") {
          firstParaghraph = sibling;
          break;
        }
      }
      if (firstParaghraph === node2) {
        head2.value = head2.value.slice(1);
        if (head2.value.length === 0) {
          node2.children.shift();
        } else if (node2.position && head2.position && typeof head2.position.start.offset === "number") {
          head2.position.start.column++;
          head2.position.start.offset++;
          node2.position.start = Object.assign({}, head2.position.start);
        }
      }
    }
  }
  this.exit(token);
}
function listItemWithTaskListItem(node2, parent, state, info) {
  const head2 = node2.children[0];
  const checkable = typeof node2.checked === "boolean" && head2 && head2.type === "paragraph";
  const checkbox = "[" + (node2.checked ? "x" : " ") + "] ";
  const tracker = state.createTracker(info);
  if (checkable) {
    tracker.move(checkbox);
  }
  let value = handle$1.listItem(node2, parent, state, {
    ...info,
    ...tracker.current()
  });
  if (checkable) {
    value = value.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/, check);
  }
  return value;
  function check($0) {
    return $0 + checkbox;
  }
}
function gfmFromMarkdown() {
  return [
    gfmAutolinkLiteralFromMarkdown(),
    gfmFootnoteFromMarkdown(),
    gfmStrikethroughFromMarkdown(),
    gfmTableFromMarkdown(),
    gfmTaskListItemFromMarkdown()
  ];
}
function gfmToMarkdown(options) {
  return {
    extensions: [
      gfmAutolinkLiteralToMarkdown(),
      gfmFootnoteToMarkdown(options),
      gfmStrikethroughToMarkdown(),
      gfmTableToMarkdown(options),
      gfmTaskListItemToMarkdown()
    ]
  };
}
const wwwPrefix = {
  tokenize: tokenizeWwwPrefix,
  partial: true
};
const domain = {
  tokenize: tokenizeDomain,
  partial: true
};
const path = {
  tokenize: tokenizePath,
  partial: true
};
const trail = {
  tokenize: tokenizeTrail,
  partial: true
};
const emailDomainDotTrail = {
  tokenize: tokenizeEmailDomainDotTrail,
  partial: true
};
const wwwAutolink = {
  name: "wwwAutolink",
  tokenize: tokenizeWwwAutolink,
  previous: previousWww
};
const protocolAutolink = {
  name: "protocolAutolink",
  tokenize: tokenizeProtocolAutolink,
  previous: previousProtocol
};
const emailAutolink = {
  name: "emailAutolink",
  tokenize: tokenizeEmailAutolink,
  previous: previousEmail
};
const text$2 = {};
function gfmAutolinkLiteral() {
  return {
    text: text$2
  };
}
let code$1 = 48;
while (code$1 < 123) {
  text$2[code$1] = emailAutolink;
  code$1++;
  if (code$1 === 58) code$1 = 65;
  else if (code$1 === 91) code$1 = 97;
}
text$2[43] = emailAutolink;
text$2[45] = emailAutolink;
text$2[46] = emailAutolink;
text$2[95] = emailAutolink;
text$2[72] = [emailAutolink, protocolAutolink];
text$2[104] = [emailAutolink, protocolAutolink];
text$2[87] = [emailAutolink, wwwAutolink];
text$2[119] = [emailAutolink, wwwAutolink];
function tokenizeEmailAutolink(effects, ok2, nok) {
  const self2 = this;
  let dot;
  let data;
  return start;
  function start(code2) {
    if (!gfmAtext(code2) || !previousEmail.call(self2, self2.previous) || previousUnbalanced(self2.events)) {
      return nok(code2);
    }
    effects.enter("literalAutolink");
    effects.enter("literalAutolinkEmail");
    return atext(code2);
  }
  function atext(code2) {
    if (gfmAtext(code2)) {
      effects.consume(code2);
      return atext;
    }
    if (code2 === 64) {
      effects.consume(code2);
      return emailDomain;
    }
    return nok(code2);
  }
  function emailDomain(code2) {
    if (code2 === 46) {
      return effects.check(emailDomainDotTrail, emailDomainAfter, emailDomainDot)(code2);
    }
    if (code2 === 45 || code2 === 95 || asciiAlphanumeric(code2)) {
      data = true;
      effects.consume(code2);
      return emailDomain;
    }
    return emailDomainAfter(code2);
  }
  function emailDomainDot(code2) {
    effects.consume(code2);
    dot = true;
    return emailDomain;
  }
  function emailDomainAfter(code2) {
    if (data && dot && asciiAlpha(self2.previous)) {
      effects.exit("literalAutolinkEmail");
      effects.exit("literalAutolink");
      return ok2(code2);
    }
    return nok(code2);
  }
}
function tokenizeWwwAutolink(effects, ok2, nok) {
  const self2 = this;
  return wwwStart;
  function wwwStart(code2) {
    if (code2 !== 87 && code2 !== 119 || !previousWww.call(self2, self2.previous) || previousUnbalanced(self2.events)) {
      return nok(code2);
    }
    effects.enter("literalAutolink");
    effects.enter("literalAutolinkWww");
    return effects.check(wwwPrefix, effects.attempt(domain, effects.attempt(path, wwwAfter), nok), nok)(code2);
  }
  function wwwAfter(code2) {
    effects.exit("literalAutolinkWww");
    effects.exit("literalAutolink");
    return ok2(code2);
  }
}
function tokenizeProtocolAutolink(effects, ok2, nok) {
  const self2 = this;
  let buffer = "";
  let seen = false;
  return protocolStart;
  function protocolStart(code2) {
    if ((code2 === 72 || code2 === 104) && previousProtocol.call(self2, self2.previous) && !previousUnbalanced(self2.events)) {
      effects.enter("literalAutolink");
      effects.enter("literalAutolinkHttp");
      buffer += String.fromCodePoint(code2);
      effects.consume(code2);
      return protocolPrefixInside;
    }
    return nok(code2);
  }
  function protocolPrefixInside(code2) {
    if (asciiAlpha(code2) && buffer.length < 5) {
      buffer += String.fromCodePoint(code2);
      effects.consume(code2);
      return protocolPrefixInside;
    }
    if (code2 === 58) {
      const protocol = buffer.toLowerCase();
      if (protocol === "http" || protocol === "https") {
        effects.consume(code2);
        return protocolSlashesInside;
      }
    }
    return nok(code2);
  }
  function protocolSlashesInside(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      if (seen) {
        return afterProtocol;
      }
      seen = true;
      return protocolSlashesInside;
    }
    return nok(code2);
  }
  function afterProtocol(code2) {
    return code2 === null || asciiControl(code2) || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2) || unicodePunctuation(code2) ? nok(code2) : effects.attempt(domain, effects.attempt(path, protocolAfter), nok)(code2);
  }
  function protocolAfter(code2) {
    effects.exit("literalAutolinkHttp");
    effects.exit("literalAutolink");
    return ok2(code2);
  }
}
function tokenizeWwwPrefix(effects, ok2, nok) {
  let size = 0;
  return wwwPrefixInside;
  function wwwPrefixInside(code2) {
    if ((code2 === 87 || code2 === 119) && size < 3) {
      size++;
      effects.consume(code2);
      return wwwPrefixInside;
    }
    if (code2 === 46 && size === 3) {
      effects.consume(code2);
      return wwwPrefixAfter;
    }
    return nok(code2);
  }
  function wwwPrefixAfter(code2) {
    return code2 === null ? nok(code2) : ok2(code2);
  }
}
function tokenizeDomain(effects, ok2, nok) {
  let underscoreInLastSegment;
  let underscoreInLastLastSegment;
  let seen;
  return domainInside;
  function domainInside(code2) {
    if (code2 === 46 || code2 === 95) {
      return effects.check(trail, domainAfter, domainAtPunctuation)(code2);
    }
    if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2) || code2 !== 45 && unicodePunctuation(code2)) {
      return domainAfter(code2);
    }
    seen = true;
    effects.consume(code2);
    return domainInside;
  }
  function domainAtPunctuation(code2) {
    if (code2 === 95) {
      underscoreInLastSegment = true;
    } else {
      underscoreInLastLastSegment = underscoreInLastSegment;
      underscoreInLastSegment = void 0;
    }
    effects.consume(code2);
    return domainInside;
  }
  function domainAfter(code2) {
    if (underscoreInLastLastSegment || underscoreInLastSegment || !seen) {
      return nok(code2);
    }
    return ok2(code2);
  }
}
function tokenizePath(effects, ok2) {
  let sizeOpen = 0;
  let sizeClose = 0;
  return pathInside;
  function pathInside(code2) {
    if (code2 === 40) {
      sizeOpen++;
      effects.consume(code2);
      return pathInside;
    }
    if (code2 === 41 && sizeClose < sizeOpen) {
      return pathAtPunctuation(code2);
    }
    if (code2 === 33 || code2 === 34 || code2 === 38 || code2 === 39 || code2 === 41 || code2 === 42 || code2 === 44 || code2 === 46 || code2 === 58 || code2 === 59 || code2 === 60 || code2 === 63 || code2 === 93 || code2 === 95 || code2 === 126) {
      return effects.check(trail, ok2, pathAtPunctuation)(code2);
    }
    if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
      return ok2(code2);
    }
    effects.consume(code2);
    return pathInside;
  }
  function pathAtPunctuation(code2) {
    if (code2 === 41) {
      sizeClose++;
    }
    effects.consume(code2);
    return pathInside;
  }
}
function tokenizeTrail(effects, ok2, nok) {
  return trail2;
  function trail2(code2) {
    if (code2 === 33 || code2 === 34 || code2 === 39 || code2 === 41 || code2 === 42 || code2 === 44 || code2 === 46 || code2 === 58 || code2 === 59 || code2 === 63 || code2 === 95 || code2 === 126) {
      effects.consume(code2);
      return trail2;
    }
    if (code2 === 38) {
      effects.consume(code2);
      return trailCharacterReferenceStart;
    }
    if (code2 === 93) {
      effects.consume(code2);
      return trailBracketAfter;
    }
    if (
      // `<` is an end.
      code2 === 60 || // So is whitespace.
      code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)
    ) {
      return ok2(code2);
    }
    return nok(code2);
  }
  function trailBracketAfter(code2) {
    if (code2 === null || code2 === 40 || code2 === 91 || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
      return ok2(code2);
    }
    return trail2(code2);
  }
  function trailCharacterReferenceStart(code2) {
    return asciiAlpha(code2) ? trailCharacterReferenceInside(code2) : nok(code2);
  }
  function trailCharacterReferenceInside(code2) {
    if (code2 === 59) {
      effects.consume(code2);
      return trail2;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return trailCharacterReferenceInside;
    }
    return nok(code2);
  }
}
function tokenizeEmailDomainDotTrail(effects, ok2, nok) {
  return start;
  function start(code2) {
    effects.consume(code2);
    return after;
  }
  function after(code2) {
    return asciiAlphanumeric(code2) ? nok(code2) : ok2(code2);
  }
}
function previousWww(code2) {
  return code2 === null || code2 === 40 || code2 === 42 || code2 === 95 || code2 === 91 || code2 === 93 || code2 === 126 || markdownLineEndingOrSpace(code2);
}
function previousProtocol(code2) {
  return !asciiAlpha(code2);
}
function previousEmail(code2) {
  return !(code2 === 47 || gfmAtext(code2));
}
function gfmAtext(code2) {
  return code2 === 43 || code2 === 45 || code2 === 46 || code2 === 95 || asciiAlphanumeric(code2);
}
function previousUnbalanced(events) {
  let index2 = events.length;
  let result = false;
  while (index2--) {
    const token = events[index2][1];
    if ((token.type === "labelLink" || token.type === "labelImage") && !token._balanced) {
      result = true;
      break;
    }
    if (token._gfmAutolinkLiteralWalkedInto) {
      result = false;
      break;
    }
  }
  if (events.length > 0 && !result) {
    events[events.length - 1][1]._gfmAutolinkLiteralWalkedInto = true;
  }
  return result;
}
const indent = {
  tokenize: tokenizeIndent,
  partial: true
};
function gfmFootnote() {
  return {
    document: {
      [91]: {
        name: "gfmFootnoteDefinition",
        tokenize: tokenizeDefinitionStart,
        continuation: {
          tokenize: tokenizeDefinitionContinuation
        },
        exit: gfmFootnoteDefinitionEnd
      }
    },
    text: {
      [91]: {
        name: "gfmFootnoteCall",
        tokenize: tokenizeGfmFootnoteCall
      },
      [93]: {
        name: "gfmPotentialFootnoteCall",
        add: "after",
        tokenize: tokenizePotentialGfmFootnoteCall,
        resolveTo: resolveToPotentialGfmFootnoteCall
      }
    }
  };
}
function tokenizePotentialGfmFootnoteCall(effects, ok2, nok) {
  const self2 = this;
  let index2 = self2.events.length;
  const defined = self2.parser.gfmFootnotes || (self2.parser.gfmFootnotes = []);
  let labelStart;
  while (index2--) {
    const token = self2.events[index2][1];
    if (token.type === "labelImage") {
      labelStart = token;
      break;
    }
    if (token.type === "gfmFootnoteCall" || token.type === "labelLink" || token.type === "label" || token.type === "image" || token.type === "link") {
      break;
    }
  }
  return start;
  function start(code2) {
    if (!labelStart || !labelStart._balanced) {
      return nok(code2);
    }
    const id = normalizeIdentifier(self2.sliceSerialize({
      start: labelStart.end,
      end: self2.now()
    }));
    if (id.codePointAt(0) !== 94 || !defined.includes(id.slice(1))) {
      return nok(code2);
    }
    effects.enter("gfmFootnoteCallLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallLabelMarker");
    return ok2(code2);
  }
}
function resolveToPotentialGfmFootnoteCall(events, context) {
  let index2 = events.length;
  while (index2--) {
    if (events[index2][1].type === "labelImage" && events[index2][0] === "enter") {
      events[index2][1];
      break;
    }
  }
  events[index2 + 1][1].type = "data";
  events[index2 + 3][1].type = "gfmFootnoteCallLabelMarker";
  const call = {
    type: "gfmFootnoteCall",
    start: Object.assign({}, events[index2 + 3][1].start),
    end: Object.assign({}, events[events.length - 1][1].end)
  };
  const marker = {
    type: "gfmFootnoteCallMarker",
    start: Object.assign({}, events[index2 + 3][1].end),
    end: Object.assign({}, events[index2 + 3][1].end)
  };
  marker.end.column++;
  marker.end.offset++;
  marker.end._bufferIndex++;
  const string2 = {
    type: "gfmFootnoteCallString",
    start: Object.assign({}, marker.end),
    end: Object.assign({}, events[events.length - 1][1].start)
  };
  const chunk = {
    type: "chunkString",
    contentType: "string",
    start: Object.assign({}, string2.start),
    end: Object.assign({}, string2.end)
  };
  const replacement = [
    // Take the `labelImageMarker` (now `data`, the `!`)
    events[index2 + 1],
    events[index2 + 2],
    ["enter", call, context],
    // The `[`
    events[index2 + 3],
    events[index2 + 4],
    // The `^`.
    ["enter", marker, context],
    ["exit", marker, context],
    // Everything in between.
    ["enter", string2, context],
    ["enter", chunk, context],
    ["exit", chunk, context],
    ["exit", string2, context],
    // The ending (`]`, properly parsed and labelled).
    events[events.length - 2],
    events[events.length - 1],
    ["exit", call, context]
  ];
  events.splice(index2, events.length - index2 + 1, ...replacement);
  return events;
}
function tokenizeGfmFootnoteCall(effects, ok2, nok) {
  const self2 = this;
  const defined = self2.parser.gfmFootnotes || (self2.parser.gfmFootnotes = []);
  let size = 0;
  let data;
  return start;
  function start(code2) {
    effects.enter("gfmFootnoteCall");
    effects.enter("gfmFootnoteCallLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallLabelMarker");
    return callStart;
  }
  function callStart(code2) {
    if (code2 !== 94) return nok(code2);
    effects.enter("gfmFootnoteCallMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallMarker");
    effects.enter("gfmFootnoteCallString");
    effects.enter("chunkString").contentType = "string";
    return callData;
  }
  function callData(code2) {
    if (
      // Too long.
      size > 999 || // Closing brace with nothing.
      code2 === 93 && !data || // Space or tab is not supported by GFM for some reason.
      // `\n` and `[` not being supported makes sense.
      code2 === null || code2 === 91 || markdownLineEndingOrSpace(code2)
    ) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit("chunkString");
      const token = effects.exit("gfmFootnoteCallString");
      if (!defined.includes(normalizeIdentifier(self2.sliceSerialize(token)))) {
        return nok(code2);
      }
      effects.enter("gfmFootnoteCallLabelMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteCallLabelMarker");
      effects.exit("gfmFootnoteCall");
      return ok2;
    }
    if (!markdownLineEndingOrSpace(code2)) {
      data = true;
    }
    size++;
    effects.consume(code2);
    return code2 === 92 ? callEscape : callData;
  }
  function callEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return callData;
    }
    return callData(code2);
  }
}
function tokenizeDefinitionStart(effects, ok2, nok) {
  const self2 = this;
  const defined = self2.parser.gfmFootnotes || (self2.parser.gfmFootnotes = []);
  let identifier;
  let size = 0;
  let data;
  return start;
  function start(code2) {
    effects.enter("gfmFootnoteDefinition")._container = true;
    effects.enter("gfmFootnoteDefinitionLabel");
    effects.enter("gfmFootnoteDefinitionLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteDefinitionLabelMarker");
    return labelAtMarker;
  }
  function labelAtMarker(code2) {
    if (code2 === 94) {
      effects.enter("gfmFootnoteDefinitionMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteDefinitionMarker");
      effects.enter("gfmFootnoteDefinitionLabelString");
      effects.enter("chunkString").contentType = "string";
      return labelInside;
    }
    return nok(code2);
  }
  function labelInside(code2) {
    if (
      // Too long.
      size > 999 || // Closing brace with nothing.
      code2 === 93 && !data || // Space or tab is not supported by GFM for some reason.
      // `\n` and `[` not being supported makes sense.
      code2 === null || code2 === 91 || markdownLineEndingOrSpace(code2)
    ) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit("chunkString");
      const token = effects.exit("gfmFootnoteDefinitionLabelString");
      identifier = normalizeIdentifier(self2.sliceSerialize(token));
      effects.enter("gfmFootnoteDefinitionLabelMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteDefinitionLabelMarker");
      effects.exit("gfmFootnoteDefinitionLabel");
      return labelAfter;
    }
    if (!markdownLineEndingOrSpace(code2)) {
      data = true;
    }
    size++;
    effects.consume(code2);
    return code2 === 92 ? labelEscape : labelInside;
  }
  function labelEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return labelInside;
    }
    return labelInside(code2);
  }
  function labelAfter(code2) {
    if (code2 === 58) {
      effects.enter("definitionMarker");
      effects.consume(code2);
      effects.exit("definitionMarker");
      if (!defined.includes(identifier)) {
        defined.push(identifier);
      }
      return factorySpace(effects, whitespaceAfter, "gfmFootnoteDefinitionWhitespace");
    }
    return nok(code2);
  }
  function whitespaceAfter(code2) {
    return ok2(code2);
  }
}
function tokenizeDefinitionContinuation(effects, ok2, nok) {
  return effects.check(blankLine, ok2, effects.attempt(indent, ok2, nok));
}
function gfmFootnoteDefinitionEnd(effects) {
  effects.exit("gfmFootnoteDefinition");
}
function tokenizeIndent(effects, ok2, nok) {
  const self2 = this;
  return factorySpace(effects, afterPrefix, "gfmFootnoteDefinitionIndent", 4 + 1);
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return tail && tail[1].type === "gfmFootnoteDefinitionIndent" && tail[2].sliceSerialize(tail[1], true).length === 4 ? ok2(code2) : nok(code2);
  }
}
function gfmStrikethrough(options) {
  const options_ = options || {};
  let single = options_.singleTilde;
  const tokenizer = {
    name: "strikethrough",
    tokenize: tokenizeStrikethrough,
    resolveAll: resolveAllStrikethrough
  };
  if (single === null || single === void 0) {
    single = true;
  }
  return {
    text: {
      [126]: tokenizer
    },
    insideSpan: {
      null: [tokenizer]
    },
    attentionMarkers: {
      null: [126]
    }
  };
  function resolveAllStrikethrough(events, context) {
    let index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][0] === "enter" && events[index2][1].type === "strikethroughSequenceTemporary" && events[index2][1]._close) {
        let open = index2;
        while (open--) {
          if (events[open][0] === "exit" && events[open][1].type === "strikethroughSequenceTemporary" && events[open][1]._open && // If the sizes are the same:
          events[index2][1].end.offset - events[index2][1].start.offset === events[open][1].end.offset - events[open][1].start.offset) {
            events[index2][1].type = "strikethroughSequence";
            events[open][1].type = "strikethroughSequence";
            const strikethrough2 = {
              type: "strikethrough",
              start: Object.assign({}, events[open][1].start),
              end: Object.assign({}, events[index2][1].end)
            };
            const text2 = {
              type: "strikethroughText",
              start: Object.assign({}, events[open][1].end),
              end: Object.assign({}, events[index2][1].start)
            };
            const nextEvents = [["enter", strikethrough2, context], ["enter", events[open][1], context], ["exit", events[open][1], context], ["enter", text2, context]];
            const insideSpan2 = context.parser.constructs.insideSpan.null;
            if (insideSpan2) {
              splice(nextEvents, nextEvents.length, 0, resolveAll(insideSpan2, events.slice(open + 1, index2), context));
            }
            splice(nextEvents, nextEvents.length, 0, [["exit", text2, context], ["enter", events[index2][1], context], ["exit", events[index2][1], context], ["exit", strikethrough2, context]]);
            splice(events, open - 1, index2 - open + 3, nextEvents);
            index2 = open + nextEvents.length - 2;
            break;
          }
        }
      }
    }
    index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][1].type === "strikethroughSequenceTemporary") {
        events[index2][1].type = "data";
      }
    }
    return events;
  }
  function tokenizeStrikethrough(effects, ok2, nok) {
    const previous2 = this.previous;
    const events = this.events;
    let size = 0;
    return start;
    function start(code2) {
      if (previous2 === 126 && events[events.length - 1][1].type !== "characterEscape") {
        return nok(code2);
      }
      effects.enter("strikethroughSequenceTemporary");
      return more(code2);
    }
    function more(code2) {
      const before = classifyCharacter(previous2);
      if (code2 === 126) {
        if (size > 1) return nok(code2);
        effects.consume(code2);
        size++;
        return more;
      }
      if (size < 2 && !single) return nok(code2);
      const token = effects.exit("strikethroughSequenceTemporary");
      const after = classifyCharacter(code2);
      token._open = !after || after === 2 && Boolean(before);
      token._close = !before || before === 2 && Boolean(after);
      return ok2(code2);
    }
  }
}
class EditMap {
  /**
   * Create a new edit map.
   */
  constructor() {
    this.map = [];
  }
  /**
   * Create an edit: a remove and/or add at a certain place.
   *
   * @param {number} index
   * @param {number} remove
   * @param {Array<Event>} add
   * @returns {undefined}
   */
  add(index2, remove, add) {
    addImplementation(this, index2, remove, add);
  }
  // To do: add this when moving to `micromark`.
  // /**
  //  * Create an edit: but insert `add` before existing additions.
  //  *
  //  * @param {number} index
  //  * @param {number} remove
  //  * @param {Array<Event>} add
  //  * @returns {undefined}
  //  */
  // addBefore(index, remove, add) {
  //   addImplementation(this, index, remove, add, true)
  // }
  /**
   * Done, change the events.
   *
   * @param {Array<Event>} events
   * @returns {undefined}
   */
  consume(events) {
    this.map.sort(function(a, b) {
      return a[0] - b[0];
    });
    if (this.map.length === 0) {
      return;
    }
    let index2 = this.map.length;
    const vecs = [];
    while (index2 > 0) {
      index2 -= 1;
      vecs.push(events.slice(this.map[index2][0] + this.map[index2][1]), this.map[index2][2]);
      events.length = this.map[index2][0];
    }
    vecs.push(events.slice());
    events.length = 0;
    let slice = vecs.pop();
    while (slice) {
      for (const element2 of slice) {
        events.push(element2);
      }
      slice = vecs.pop();
    }
    this.map.length = 0;
  }
}
function addImplementation(editMap, at, remove, add) {
  let index2 = 0;
  if (remove === 0 && add.length === 0) {
    return;
  }
  while (index2 < editMap.map.length) {
    if (editMap.map[index2][0] === at) {
      editMap.map[index2][1] += remove;
      editMap.map[index2][2].push(...add);
      return;
    }
    index2 += 1;
  }
  editMap.map.push([at, remove, add]);
}
function gfmTableAlign(events, index2) {
  let inDelimiterRow = false;
  const align = [];
  while (index2 < events.length) {
    const event = events[index2];
    if (inDelimiterRow) {
      if (event[0] === "enter") {
        if (event[1].type === "tableContent") {
          align.push(events[index2 + 1][1].type === "tableDelimiterMarker" ? "left" : "none");
        }
      } else if (event[1].type === "tableContent") {
        if (events[index2 - 1][1].type === "tableDelimiterMarker") {
          const alignIndex = align.length - 1;
          align[alignIndex] = align[alignIndex] === "left" ? "center" : "right";
        }
      } else if (event[1].type === "tableDelimiterRow") {
        break;
      }
    } else if (event[0] === "enter" && event[1].type === "tableDelimiterRow") {
      inDelimiterRow = true;
    }
    index2 += 1;
  }
  return align;
}
function gfmTable() {
  return {
    flow: {
      null: {
        name: "table",
        tokenize: tokenizeTable,
        resolveAll: resolveTable
      }
    }
  };
}
function tokenizeTable(effects, ok2, nok) {
  const self2 = this;
  let size = 0;
  let sizeB = 0;
  let seen;
  return start;
  function start(code2) {
    let index2 = self2.events.length - 1;
    while (index2 > -1) {
      const type = self2.events[index2][1].type;
      if (type === "lineEnding" || // Note: markdown-rs uses `whitespace` instead of `linePrefix`
      type === "linePrefix") index2--;
      else break;
    }
    const tail = index2 > -1 ? self2.events[index2][1].type : null;
    const next = tail === "tableHead" || tail === "tableRow" ? bodyRowStart : headRowBefore;
    if (next === bodyRowStart && self2.parser.lazy[self2.now().line]) {
      return nok(code2);
    }
    return next(code2);
  }
  function headRowBefore(code2) {
    effects.enter("tableHead");
    effects.enter("tableRow");
    return headRowStart(code2);
  }
  function headRowStart(code2) {
    if (code2 === 124) {
      return headRowBreak(code2);
    }
    seen = true;
    sizeB += 1;
    return headRowBreak(code2);
  }
  function headRowBreak(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      if (sizeB > 1) {
        sizeB = 0;
        self2.interrupt = true;
        effects.exit("tableRow");
        effects.enter("lineEnding");
        effects.consume(code2);
        effects.exit("lineEnding");
        return headDelimiterStart;
      }
      return nok(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, headRowBreak, "whitespace")(code2);
    }
    sizeB += 1;
    if (seen) {
      seen = false;
      size += 1;
    }
    if (code2 === 124) {
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      seen = true;
      return headRowBreak;
    }
    effects.enter("data");
    return headRowData(code2);
  }
  function headRowData(code2) {
    if (code2 === null || code2 === 124 || markdownLineEndingOrSpace(code2)) {
      effects.exit("data");
      return headRowBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? headRowEscape : headRowData;
  }
  function headRowEscape(code2) {
    if (code2 === 92 || code2 === 124) {
      effects.consume(code2);
      return headRowData;
    }
    return headRowData(code2);
  }
  function headDelimiterStart(code2) {
    self2.interrupt = false;
    if (self2.parser.lazy[self2.now().line]) {
      return nok(code2);
    }
    effects.enter("tableDelimiterRow");
    seen = false;
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterBefore, "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
    }
    return headDelimiterBefore(code2);
  }
  function headDelimiterBefore(code2) {
    if (code2 === 45 || code2 === 58) {
      return headDelimiterValueBefore(code2);
    }
    if (code2 === 124) {
      seen = true;
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      return headDelimiterCellBefore;
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterCellBefore(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterValueBefore, "whitespace")(code2);
    }
    return headDelimiterValueBefore(code2);
  }
  function headDelimiterValueBefore(code2) {
    if (code2 === 58) {
      sizeB += 1;
      seen = true;
      effects.enter("tableDelimiterMarker");
      effects.consume(code2);
      effects.exit("tableDelimiterMarker");
      return headDelimiterLeftAlignmentAfter;
    }
    if (code2 === 45) {
      sizeB += 1;
      return headDelimiterLeftAlignmentAfter(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      return headDelimiterCellAfter(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterLeftAlignmentAfter(code2) {
    if (code2 === 45) {
      effects.enter("tableDelimiterFiller");
      return headDelimiterFiller(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterFiller(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return headDelimiterFiller;
    }
    if (code2 === 58) {
      seen = true;
      effects.exit("tableDelimiterFiller");
      effects.enter("tableDelimiterMarker");
      effects.consume(code2);
      effects.exit("tableDelimiterMarker");
      return headDelimiterRightAlignmentAfter;
    }
    effects.exit("tableDelimiterFiller");
    return headDelimiterRightAlignmentAfter(code2);
  }
  function headDelimiterRightAlignmentAfter(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterCellAfter, "whitespace")(code2);
    }
    return headDelimiterCellAfter(code2);
  }
  function headDelimiterCellAfter(code2) {
    if (code2 === 124) {
      return headDelimiterBefore(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      if (!seen || size !== sizeB) {
        return headDelimiterNok(code2);
      }
      effects.exit("tableDelimiterRow");
      effects.exit("tableHead");
      return ok2(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterNok(code2) {
    return nok(code2);
  }
  function bodyRowStart(code2) {
    effects.enter("tableRow");
    return bodyRowBreak(code2);
  }
  function bodyRowBreak(code2) {
    if (code2 === 124) {
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      return bodyRowBreak;
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("tableRow");
      return ok2(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, bodyRowBreak, "whitespace")(code2);
    }
    effects.enter("data");
    return bodyRowData(code2);
  }
  function bodyRowData(code2) {
    if (code2 === null || code2 === 124 || markdownLineEndingOrSpace(code2)) {
      effects.exit("data");
      return bodyRowBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? bodyRowEscape : bodyRowData;
  }
  function bodyRowEscape(code2) {
    if (code2 === 92 || code2 === 124) {
      effects.consume(code2);
      return bodyRowData;
    }
    return bodyRowData(code2);
  }
}
function resolveTable(events, context) {
  let index2 = -1;
  let inFirstCellAwaitingPipe = true;
  let rowKind = 0;
  let lastCell = [0, 0, 0, 0];
  let cell = [0, 0, 0, 0];
  let afterHeadAwaitingFirstBodyRow = false;
  let lastTableEnd = 0;
  let currentTable;
  let currentBody;
  let currentCell;
  const map2 = new EditMap();
  while (++index2 < events.length) {
    const event = events[index2];
    const token = event[1];
    if (event[0] === "enter") {
      if (token.type === "tableHead") {
        afterHeadAwaitingFirstBodyRow = false;
        if (lastTableEnd !== 0) {
          flushTableEnd(map2, context, lastTableEnd, currentTable, currentBody);
          currentBody = void 0;
          lastTableEnd = 0;
        }
        currentTable = {
          type: "table",
          start: Object.assign({}, token.start),
          // Note: correct end is set later.
          end: Object.assign({}, token.end)
        };
        map2.add(index2, 0, [["enter", currentTable, context]]);
      } else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
        inFirstCellAwaitingPipe = true;
        currentCell = void 0;
        lastCell = [0, 0, 0, 0];
        cell = [0, index2 + 1, 0, 0];
        if (afterHeadAwaitingFirstBodyRow) {
          afterHeadAwaitingFirstBodyRow = false;
          currentBody = {
            type: "tableBody",
            start: Object.assign({}, token.start),
            // Note: correct end is set later.
            end: Object.assign({}, token.end)
          };
          map2.add(index2, 0, [["enter", currentBody, context]]);
        }
        rowKind = token.type === "tableDelimiterRow" ? 2 : currentBody ? 3 : 1;
      } else if (rowKind && (token.type === "data" || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) {
        inFirstCellAwaitingPipe = false;
        if (cell[2] === 0) {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map2, context, lastCell, rowKind, void 0, currentCell);
            lastCell = [0, 0, 0, 0];
          }
          cell[2] = index2;
        }
      } else if (token.type === "tableCellDivider") {
        if (inFirstCellAwaitingPipe) {
          inFirstCellAwaitingPipe = false;
        } else {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map2, context, lastCell, rowKind, void 0, currentCell);
          }
          lastCell = cell;
          cell = [lastCell[1], index2, 0, 0];
        }
      }
    } else if (token.type === "tableHead") {
      afterHeadAwaitingFirstBodyRow = true;
      lastTableEnd = index2;
    } else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
      lastTableEnd = index2;
      if (lastCell[1] !== 0) {
        cell[0] = cell[1];
        currentCell = flushCell(map2, context, lastCell, rowKind, index2, currentCell);
      } else if (cell[1] !== 0) {
        currentCell = flushCell(map2, context, cell, rowKind, index2, currentCell);
      }
      rowKind = 0;
    } else if (rowKind && (token.type === "data" || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) {
      cell[3] = index2;
    }
  }
  if (lastTableEnd !== 0) {
    flushTableEnd(map2, context, lastTableEnd, currentTable, currentBody);
  }
  map2.consume(context.events);
  index2 = -1;
  while (++index2 < context.events.length) {
    const event = context.events[index2];
    if (event[0] === "enter" && event[1].type === "table") {
      event[1]._align = gfmTableAlign(context.events, index2);
    }
  }
  return events;
}
function flushCell(map2, context, range, rowKind, rowEnd, previousCell) {
  const groupName = rowKind === 1 ? "tableHeader" : rowKind === 2 ? "tableDelimiter" : "tableData";
  const valueName = "tableContent";
  if (range[0] !== 0) {
    previousCell.end = Object.assign({}, getPoint(context.events, range[0]));
    map2.add(range[0], 0, [["exit", previousCell, context]]);
  }
  const now = getPoint(context.events, range[1]);
  previousCell = {
    type: groupName,
    start: Object.assign({}, now),
    // Note: correct end is set later.
    end: Object.assign({}, now)
  };
  map2.add(range[1], 0, [["enter", previousCell, context]]);
  if (range[2] !== 0) {
    const relatedStart = getPoint(context.events, range[2]);
    const relatedEnd = getPoint(context.events, range[3]);
    const valueToken = {
      type: valueName,
      start: Object.assign({}, relatedStart),
      end: Object.assign({}, relatedEnd)
    };
    map2.add(range[2], 0, [["enter", valueToken, context]]);
    if (rowKind !== 2) {
      const start = context.events[range[2]];
      const end = context.events[range[3]];
      start[1].end = Object.assign({}, end[1].end);
      start[1].type = "chunkText";
      start[1].contentType = "text";
      if (range[3] > range[2] + 1) {
        const a = range[2] + 1;
        const b = range[3] - range[2] - 1;
        map2.add(a, b, []);
      }
    }
    map2.add(range[3] + 1, 0, [["exit", valueToken, context]]);
  }
  if (rowEnd !== void 0) {
    previousCell.end = Object.assign({}, getPoint(context.events, rowEnd));
    map2.add(rowEnd, 0, [["exit", previousCell, context]]);
    previousCell = void 0;
  }
  return previousCell;
}
function flushTableEnd(map2, context, index2, table2, tableBody) {
  const exits = [];
  const related = getPoint(context.events, index2);
  if (tableBody) {
    tableBody.end = Object.assign({}, related);
    exits.push(["exit", tableBody, context]);
  }
  table2.end = Object.assign({}, related);
  exits.push(["exit", table2, context]);
  map2.add(index2 + 1, 0, exits);
}
function getPoint(events, index2) {
  const event = events[index2];
  const side = event[0] === "enter" ? "start" : "end";
  return event[1][side];
}
const tasklistCheck = {
  name: "tasklistCheck",
  tokenize: tokenizeTasklistCheck
};
function gfmTaskListItem() {
  return {
    text: {
      [91]: tasklistCheck
    }
  };
}
function tokenizeTasklistCheck(effects, ok2, nok) {
  const self2 = this;
  return open;
  function open(code2) {
    if (
      // Exit if there’s stuff before.
      self2.previous !== null || // Exit if not in the first content that is the first child of a list
      // item.
      !self2._gfmTasklistFirstContentOfListItem
    ) {
      return nok(code2);
    }
    effects.enter("taskListCheck");
    effects.enter("taskListCheckMarker");
    effects.consume(code2);
    effects.exit("taskListCheckMarker");
    return inside;
  }
  function inside(code2) {
    if (markdownLineEndingOrSpace(code2)) {
      effects.enter("taskListCheckValueUnchecked");
      effects.consume(code2);
      effects.exit("taskListCheckValueUnchecked");
      return close;
    }
    if (code2 === 88 || code2 === 120) {
      effects.enter("taskListCheckValueChecked");
      effects.consume(code2);
      effects.exit("taskListCheckValueChecked");
      return close;
    }
    return nok(code2);
  }
  function close(code2) {
    if (code2 === 93) {
      effects.enter("taskListCheckMarker");
      effects.consume(code2);
      effects.exit("taskListCheckMarker");
      effects.exit("taskListCheck");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (markdownLineEnding(code2)) {
      return ok2(code2);
    }
    if (markdownSpace(code2)) {
      return effects.check({
        tokenize: spaceThenNonSpace
      }, ok2, nok)(code2);
    }
    return nok(code2);
  }
}
function spaceThenNonSpace(effects, ok2, nok) {
  return factorySpace(effects, after, "whitespace");
  function after(code2) {
    return code2 === null ? nok(code2) : ok2(code2);
  }
}
function gfm(options) {
  return combineExtensions([
    gfmAutolinkLiteral(),
    gfmFootnote(),
    gfmStrikethrough(options),
    gfmTable(),
    gfmTaskListItem()
  ]);
}
const emptyOptions$2 = {};
function remarkGfm(options) {
  const self2 = (
    /** @type {Processor<Root>} */
    this
  );
  const settings = options || emptyOptions$2;
  const data = self2.data();
  const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
  const fromMarkdownExtensions = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  micromarkExtensions.push(gfm(settings));
  fromMarkdownExtensions.push(gfmFromMarkdown());
  toMarkdownExtensions.push(gfmToMarkdown(settings));
}
function blockquote(state, node2) {
  const result = {
    type: "element",
    tagName: "blockquote",
    properties: {},
    children: state.wrap(state.all(node2), true)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function hardBreak(state, node2) {
  const result = { type: "element", tagName: "br", properties: {}, children: [] };
  state.patch(node2, result);
  return [state.applyData(node2, result), { type: "text", value: "\n" }];
}
function code(state, node2) {
  const value = node2.value ? node2.value + "\n" : "";
  const properties = {};
  const language = node2.lang ? node2.lang.split(/\s+/) : [];
  if (language.length > 0) {
    properties.className = ["language-" + language[0]];
  }
  let result = {
    type: "element",
    tagName: "code",
    properties,
    children: [{ type: "text", value }]
  };
  if (node2.meta) {
    result.data = { meta: node2.meta };
  }
  state.patch(node2, result);
  result = state.applyData(node2, result);
  result = { type: "element", tagName: "pre", properties: {}, children: [result] };
  state.patch(node2, result);
  return result;
}
function strikethrough(state, node2) {
  const result = {
    type: "element",
    tagName: "del",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function emphasis(state, node2) {
  const result = {
    type: "element",
    tagName: "em",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function footnoteReference(state, node2) {
  const clobberPrefix = typeof state.options.clobberPrefix === "string" ? state.options.clobberPrefix : "user-content-";
  const id = String(node2.identifier).toUpperCase();
  const safeId = normalizeUri(id.toLowerCase());
  const index2 = state.footnoteOrder.indexOf(id);
  let counter;
  let reuseCounter = state.footnoteCounts.get(id);
  if (reuseCounter === void 0) {
    reuseCounter = 0;
    state.footnoteOrder.push(id);
    counter = state.footnoteOrder.length;
  } else {
    counter = index2 + 1;
  }
  reuseCounter += 1;
  state.footnoteCounts.set(id, reuseCounter);
  const link2 = {
    type: "element",
    tagName: "a",
    properties: {
      href: "#" + clobberPrefix + "fn-" + safeId,
      id: clobberPrefix + "fnref-" + safeId + (reuseCounter > 1 ? "-" + reuseCounter : ""),
      dataFootnoteRef: true,
      ariaDescribedBy: ["footnote-label"]
    },
    children: [{ type: "text", value: String(counter) }]
  };
  state.patch(node2, link2);
  const sup = {
    type: "element",
    tagName: "sup",
    properties: {},
    children: [link2]
  };
  state.patch(node2, sup);
  return state.applyData(node2, sup);
}
function heading(state, node2) {
  const result = {
    type: "element",
    tagName: "h" + node2.depth,
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function html$4(state, node2) {
  if (state.options.allowDangerousHtml) {
    const result = { type: "raw", value: node2.value };
    state.patch(node2, result);
    return state.applyData(node2, result);
  }
  return void 0;
}
function revert(state, node2) {
  const subtype = node2.referenceType;
  let suffix = "]";
  if (subtype === "collapsed") {
    suffix += "[]";
  } else if (subtype === "full") {
    suffix += "[" + (node2.label || node2.identifier) + "]";
  }
  if (node2.type === "imageReference") {
    return [{ type: "text", value: "![" + node2.alt + suffix }];
  }
  const contents = state.all(node2);
  const head2 = contents[0];
  if (head2 && head2.type === "text") {
    head2.value = "[" + head2.value;
  } else {
    contents.unshift({ type: "text", value: "[" });
  }
  const tail = contents[contents.length - 1];
  if (tail && tail.type === "text") {
    tail.value += suffix;
  } else {
    contents.push({ type: "text", value: suffix });
  }
  return contents;
}
function imageReference(state, node2) {
  const id = String(node2.identifier).toUpperCase();
  const definition2 = state.definitionById.get(id);
  if (!definition2) {
    return revert(state, node2);
  }
  const properties = { src: normalizeUri(definition2.url || ""), alt: node2.alt };
  if (definition2.title !== null && definition2.title !== void 0) {
    properties.title = definition2.title;
  }
  const result = { type: "element", tagName: "img", properties, children: [] };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function image(state, node2) {
  const properties = { src: normalizeUri(node2.url) };
  if (node2.alt !== null && node2.alt !== void 0) {
    properties.alt = node2.alt;
  }
  if (node2.title !== null && node2.title !== void 0) {
    properties.title = node2.title;
  }
  const result = { type: "element", tagName: "img", properties, children: [] };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function inlineCode(state, node2) {
  const text2 = { type: "text", value: node2.value.replace(/\r?\n|\r/g, " ") };
  state.patch(node2, text2);
  const result = {
    type: "element",
    tagName: "code",
    properties: {},
    children: [text2]
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function linkReference(state, node2) {
  const id = String(node2.identifier).toUpperCase();
  const definition2 = state.definitionById.get(id);
  if (!definition2) {
    return revert(state, node2);
  }
  const properties = { href: normalizeUri(definition2.url || "") };
  if (definition2.title !== null && definition2.title !== void 0) {
    properties.title = definition2.title;
  }
  const result = {
    type: "element",
    tagName: "a",
    properties,
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function link(state, node2) {
  const properties = { href: normalizeUri(node2.url) };
  if (node2.title !== null && node2.title !== void 0) {
    properties.title = node2.title;
  }
  const result = {
    type: "element",
    tagName: "a",
    properties,
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function listItem(state, node2, parent) {
  const results = state.all(node2);
  const loose = parent ? listLoose(parent) : listItemLoose(node2);
  const properties = {};
  const children = [];
  if (typeof node2.checked === "boolean") {
    const head2 = results[0];
    let paragraph2;
    if (head2 && head2.type === "element" && head2.tagName === "p") {
      paragraph2 = head2;
    } else {
      paragraph2 = { type: "element", tagName: "p", properties: {}, children: [] };
      results.unshift(paragraph2);
    }
    if (paragraph2.children.length > 0) {
      paragraph2.children.unshift({ type: "text", value: " " });
    }
    paragraph2.children.unshift({
      type: "element",
      tagName: "input",
      properties: { type: "checkbox", checked: node2.checked, disabled: true },
      children: []
    });
    properties.className = ["task-list-item"];
  }
  let index2 = -1;
  while (++index2 < results.length) {
    const child = results[index2];
    if (loose || index2 !== 0 || child.type !== "element" || child.tagName !== "p") {
      children.push({ type: "text", value: "\n" });
    }
    if (child.type === "element" && child.tagName === "p" && !loose) {
      children.push(...child.children);
    } else {
      children.push(child);
    }
  }
  const tail = results[results.length - 1];
  if (tail && (loose || tail.type !== "element" || tail.tagName !== "p")) {
    children.push({ type: "text", value: "\n" });
  }
  const result = { type: "element", tagName: "li", properties, children };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function listLoose(node2) {
  let loose = false;
  if (node2.type === "list") {
    loose = node2.spread || false;
    const children = node2.children;
    let index2 = -1;
    while (!loose && ++index2 < children.length) {
      loose = listItemLoose(children[index2]);
    }
  }
  return loose;
}
function listItemLoose(node2) {
  const spread = node2.spread;
  return spread === null || spread === void 0 ? node2.children.length > 1 : spread;
}
function list(state, node2) {
  const properties = {};
  const results = state.all(node2);
  let index2 = -1;
  if (typeof node2.start === "number" && node2.start !== 1) {
    properties.start = node2.start;
  }
  while (++index2 < results.length) {
    const child = results[index2];
    if (child.type === "element" && child.tagName === "li" && child.properties && Array.isArray(child.properties.className) && child.properties.className.includes("task-list-item")) {
      properties.className = ["contains-task-list"];
      break;
    }
  }
  const result = {
    type: "element",
    tagName: node2.ordered ? "ol" : "ul",
    properties,
    children: state.wrap(results, true)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function paragraph(state, node2) {
  const result = {
    type: "element",
    tagName: "p",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function root$1(state, node2) {
  const result = { type: "root", children: state.wrap(state.all(node2)) };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function strong(state, node2) {
  const result = {
    type: "element",
    tagName: "strong",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
const pointEnd = point("end");
const pointStart = point("start");
function point(type) {
  return point2;
  function point2(node2) {
    const point3 = node2 && node2.position && node2.position[type] || {};
    if (typeof point3.line === "number" && point3.line > 0 && typeof point3.column === "number" && point3.column > 0) {
      return {
        line: point3.line,
        column: point3.column,
        offset: typeof point3.offset === "number" && point3.offset > -1 ? point3.offset : void 0
      };
    }
  }
}
function position(node2) {
  const start = pointStart(node2);
  const end = pointEnd(node2);
  if (start && end) {
    return { start, end };
  }
}
function table(state, node2) {
  const rows = state.all(node2);
  const firstRow = rows.shift();
  const tableContent = [];
  if (firstRow) {
    const head2 = {
      type: "element",
      tagName: "thead",
      properties: {},
      children: state.wrap([firstRow], true)
    };
    state.patch(node2.children[0], head2);
    tableContent.push(head2);
  }
  if (rows.length > 0) {
    const body2 = {
      type: "element",
      tagName: "tbody",
      properties: {},
      children: state.wrap(rows, true)
    };
    const start = pointStart(node2.children[1]);
    const end = pointEnd(node2.children[node2.children.length - 1]);
    if (start && end) body2.position = { start, end };
    tableContent.push(body2);
  }
  const result = {
    type: "element",
    tagName: "table",
    properties: {},
    children: state.wrap(tableContent, true)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function tableRow(state, node2, parent) {
  const siblings2 = parent ? parent.children : void 0;
  const rowIndex = siblings2 ? siblings2.indexOf(node2) : 1;
  const tagName = rowIndex === 0 ? "th" : "td";
  const align = parent && parent.type === "table" ? parent.align : void 0;
  const length = align ? align.length : node2.children.length;
  let cellIndex = -1;
  const cells2 = [];
  while (++cellIndex < length) {
    const cell = node2.children[cellIndex];
    const properties = {};
    const alignValue = align ? align[cellIndex] : void 0;
    if (alignValue) {
      properties.align = alignValue;
    }
    let result2 = { type: "element", tagName, properties, children: [] };
    if (cell) {
      result2.children = state.all(cell);
      state.patch(cell, result2);
      result2 = state.applyData(cell, result2);
    }
    cells2.push(result2);
  }
  const result = {
    type: "element",
    tagName: "tr",
    properties: {},
    children: state.wrap(cells2, true)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function tableCell(state, node2) {
  const result = {
    type: "element",
    tagName: "td",
    // Assume body cell.
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
const tab = 9;
const space = 32;
function trimLines(value) {
  const source = String(value);
  const search2 = /\r?\n|\r/g;
  let match = search2.exec(source);
  let last = 0;
  const lines = [];
  while (match) {
    lines.push(
      trimLine(source.slice(last, match.index), last > 0, true),
      match[0]
    );
    last = match.index + match[0].length;
    match = search2.exec(source);
  }
  lines.push(trimLine(source.slice(last), last > 0, false));
  return lines.join("");
}
function trimLine(value, start, end) {
  let startIndex = 0;
  let endIndex = value.length;
  if (start) {
    let code2 = value.codePointAt(startIndex);
    while (code2 === tab || code2 === space) {
      startIndex++;
      code2 = value.codePointAt(startIndex);
    }
  }
  if (end) {
    let code2 = value.codePointAt(endIndex - 1);
    while (code2 === tab || code2 === space) {
      endIndex--;
      code2 = value.codePointAt(endIndex - 1);
    }
  }
  return endIndex > startIndex ? value.slice(startIndex, endIndex) : "";
}
function text$1(state, node2) {
  const result = { type: "text", value: trimLines(String(node2.value)) };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function thematicBreak(state, node2) {
  const result = {
    type: "element",
    tagName: "hr",
    properties: {},
    children: []
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
const handlers = {
  blockquote,
  break: hardBreak,
  code,
  delete: strikethrough,
  emphasis,
  footnoteReference,
  heading,
  html: html$4,
  imageReference,
  image,
  inlineCode,
  linkReference,
  link,
  listItem,
  list,
  paragraph,
  // @ts-expect-error: root is different, but hard to type.
  root: root$1,
  strong,
  table,
  tableCell,
  tableRow,
  text: text$1,
  thematicBreak,
  toml: ignore,
  yaml: ignore,
  definition: ignore,
  footnoteDefinition: ignore
};
function ignore() {
  return void 0;
}
const VOID = -1;
const PRIMITIVE = 0;
const ARRAY = 1;
const OBJECT = 2;
const DATE = 3;
const REGEXP = 4;
const MAP = 5;
const SET = 6;
const ERROR = 7;
const BIGINT = 8;
const env = typeof self === "object" ? self : globalThis;
const deserializer = ($, _) => {
  const as = (out, index2) => {
    $.set(index2, out);
    return out;
  };
  const unpair = (index2) => {
    if ($.has(index2))
      return $.get(index2);
    const [type, value] = _[index2];
    switch (type) {
      case PRIMITIVE:
      case VOID:
        return as(value, index2);
      case ARRAY: {
        const arr = as([], index2);
        for (const index3 of value)
          arr.push(unpair(index3));
        return arr;
      }
      case OBJECT: {
        const object = as({}, index2);
        for (const [key2, index3] of value)
          object[unpair(key2)] = unpair(index3);
        return object;
      }
      case DATE:
        return as(new Date(value), index2);
      case REGEXP: {
        const { source, flags } = value;
        return as(new RegExp(source, flags), index2);
      }
      case MAP: {
        const map2 = as(/* @__PURE__ */ new Map(), index2);
        for (const [key2, index3] of value)
          map2.set(unpair(key2), unpair(index3));
        return map2;
      }
      case SET: {
        const set = as(/* @__PURE__ */ new Set(), index2);
        for (const index3 of value)
          set.add(unpair(index3));
        return set;
      }
      case ERROR: {
        const { name, message } = value;
        return as(new env[name](message), index2);
      }
      case BIGINT:
        return as(BigInt(value), index2);
      case "BigInt":
        return as(Object(BigInt(value)), index2);
      case "ArrayBuffer":
        return as(new Uint8Array(value).buffer, value);
      case "DataView": {
        const { buffer } = new Uint8Array(value);
        return as(new DataView(buffer), value);
      }
    }
    return as(new env[type](value), index2);
  };
  return unpair;
};
const deserialize = (serialized) => deserializer(/* @__PURE__ */ new Map(), serialized)(0);
const EMPTY = "";
const { toString } = {};
const { keys } = Object;
const typeOf = (value) => {
  const type = typeof value;
  if (type !== "object" || !value)
    return [PRIMITIVE, type];
  const asString = toString.call(value).slice(8, -1);
  switch (asString) {
    case "Array":
      return [ARRAY, EMPTY];
    case "Object":
      return [OBJECT, EMPTY];
    case "Date":
      return [DATE, EMPTY];
    case "RegExp":
      return [REGEXP, EMPTY];
    case "Map":
      return [MAP, EMPTY];
    case "Set":
      return [SET, EMPTY];
    case "DataView":
      return [ARRAY, asString];
  }
  if (asString.includes("Array"))
    return [ARRAY, asString];
  if (asString.includes("Error"))
    return [ERROR, asString];
  return [OBJECT, asString];
};
const shouldSkip = ([TYPE, type]) => TYPE === PRIMITIVE && (type === "function" || type === "symbol");
const serializer = (strict, json, $, _) => {
  const as = (out, value) => {
    const index2 = _.push(out) - 1;
    $.set(value, index2);
    return index2;
  };
  const pair = (value) => {
    if ($.has(value))
      return $.get(value);
    let [TYPE, type] = typeOf(value);
    switch (TYPE) {
      case PRIMITIVE: {
        let entry = value;
        switch (type) {
          case "bigint":
            TYPE = BIGINT;
            entry = value.toString();
            break;
          case "function":
          case "symbol":
            if (strict)
              throw new TypeError("unable to serialize " + type);
            entry = null;
            break;
          case "undefined":
            return as([VOID], value);
        }
        return as([TYPE, entry], value);
      }
      case ARRAY: {
        if (type) {
          let spread = value;
          if (type === "DataView") {
            spread = new Uint8Array(value.buffer);
          } else if (type === "ArrayBuffer") {
            spread = new Uint8Array(value);
          }
          return as([type, [...spread]], value);
        }
        const arr = [];
        const index2 = as([TYPE, arr], value);
        for (const entry of value)
          arr.push(pair(entry));
        return index2;
      }
      case OBJECT: {
        if (type) {
          switch (type) {
            case "BigInt":
              return as([type, value.toString()], value);
            case "Boolean":
            case "Number":
            case "String":
              return as([type, value.valueOf()], value);
          }
        }
        if (json && "toJSON" in value)
          return pair(value.toJSON());
        const entries = [];
        const index2 = as([TYPE, entries], value);
        for (const key2 of keys(value)) {
          if (strict || !shouldSkip(typeOf(value[key2])))
            entries.push([pair(key2), pair(value[key2])]);
        }
        return index2;
      }
      case DATE:
        return as([TYPE, value.toISOString()], value);
      case REGEXP: {
        const { source, flags } = value;
        return as([TYPE, { source, flags }], value);
      }
      case MAP: {
        const entries = [];
        const index2 = as([TYPE, entries], value);
        for (const [key2, entry] of value) {
          if (strict || !(shouldSkip(typeOf(key2)) || shouldSkip(typeOf(entry))))
            entries.push([pair(key2), pair(entry)]);
        }
        return index2;
      }
      case SET: {
        const entries = [];
        const index2 = as([TYPE, entries], value);
        for (const entry of value) {
          if (strict || !shouldSkip(typeOf(entry)))
            entries.push(pair(entry));
        }
        return index2;
      }
    }
    const { message } = value;
    return as([TYPE, { name: type, message }], value);
  };
  return pair;
};
const serialize = (value, { json, lossy } = {}) => {
  const _ = [];
  return serializer(!(json || lossy), !!json, /* @__PURE__ */ new Map(), _)(value), _;
};
const structuredClone$1 = typeof structuredClone === "function" ? (
  /* c8 ignore start */
  (any, options) => options && ("json" in options || "lossy" in options) ? deserialize(serialize(any, options)) : structuredClone(any)
) : (any, options) => deserialize(serialize(any, options));
function defaultFootnoteBackContent(_, rereferenceIndex) {
  const result = [{ type: "text", value: "↩" }];
  if (rereferenceIndex > 1) {
    result.push({
      type: "element",
      tagName: "sup",
      properties: {},
      children: [{ type: "text", value: String(rereferenceIndex) }]
    });
  }
  return result;
}
function defaultFootnoteBackLabel(referenceIndex, rereferenceIndex) {
  return "Back to reference " + (referenceIndex + 1) + (rereferenceIndex > 1 ? "-" + rereferenceIndex : "");
}
function footer(state) {
  const clobberPrefix = typeof state.options.clobberPrefix === "string" ? state.options.clobberPrefix : "user-content-";
  const footnoteBackContent = state.options.footnoteBackContent || defaultFootnoteBackContent;
  const footnoteBackLabel = state.options.footnoteBackLabel || defaultFootnoteBackLabel;
  const footnoteLabel = state.options.footnoteLabel || "Footnotes";
  const footnoteLabelTagName = state.options.footnoteLabelTagName || "h2";
  const footnoteLabelProperties = state.options.footnoteLabelProperties || {
    className: ["sr-only"]
  };
  const listItems = [];
  let referenceIndex = -1;
  while (++referenceIndex < state.footnoteOrder.length) {
    const definition2 = state.footnoteById.get(
      state.footnoteOrder[referenceIndex]
    );
    if (!definition2) {
      continue;
    }
    const content2 = state.all(definition2);
    const id = String(definition2.identifier).toUpperCase();
    const safeId = normalizeUri(id.toLowerCase());
    let rereferenceIndex = 0;
    const backReferences = [];
    const counts = state.footnoteCounts.get(id);
    while (counts !== void 0 && ++rereferenceIndex <= counts) {
      if (backReferences.length > 0) {
        backReferences.push({ type: "text", value: " " });
      }
      let children = typeof footnoteBackContent === "string" ? footnoteBackContent : footnoteBackContent(referenceIndex, rereferenceIndex);
      if (typeof children === "string") {
        children = { type: "text", value: children };
      }
      backReferences.push({
        type: "element",
        tagName: "a",
        properties: {
          href: "#" + clobberPrefix + "fnref-" + safeId + (rereferenceIndex > 1 ? "-" + rereferenceIndex : ""),
          dataFootnoteBackref: "",
          ariaLabel: typeof footnoteBackLabel === "string" ? footnoteBackLabel : footnoteBackLabel(referenceIndex, rereferenceIndex),
          className: ["data-footnote-backref"]
        },
        children: Array.isArray(children) ? children : [children]
      });
    }
    const tail = content2[content2.length - 1];
    if (tail && tail.type === "element" && tail.tagName === "p") {
      const tailTail = tail.children[tail.children.length - 1];
      if (tailTail && tailTail.type === "text") {
        tailTail.value += " ";
      } else {
        tail.children.push({ type: "text", value: " " });
      }
      tail.children.push(...backReferences);
    } else {
      content2.push(...backReferences);
    }
    const listItem2 = {
      type: "element",
      tagName: "li",
      properties: { id: clobberPrefix + "fn-" + safeId },
      children: state.wrap(content2, true)
    };
    state.patch(definition2, listItem2);
    listItems.push(listItem2);
  }
  if (listItems.length === 0) {
    return;
  }
  return {
    type: "element",
    tagName: "section",
    properties: { dataFootnotes: true, className: ["footnotes"] },
    children: [
      {
        type: "element",
        tagName: footnoteLabelTagName,
        properties: {
          ...structuredClone$1(footnoteLabelProperties),
          id: "footnote-label"
        },
        children: [{ type: "text", value: footnoteLabel }]
      },
      { type: "text", value: "\n" },
      {
        type: "element",
        tagName: "ol",
        properties: {},
        children: state.wrap(listItems, true)
      },
      { type: "text", value: "\n" }
    ]
  };
}
const own$2 = {}.hasOwnProperty;
const emptyOptions$1 = {};
function createState(tree, options) {
  const settings = options || emptyOptions$1;
  const definitionById = /* @__PURE__ */ new Map();
  const footnoteById = /* @__PURE__ */ new Map();
  const footnoteCounts = /* @__PURE__ */ new Map();
  const handlers$1 = { ...handlers, ...settings.handlers };
  const state = {
    all: all2,
    applyData,
    definitionById,
    footnoteById,
    footnoteCounts,
    footnoteOrder: [],
    handlers: handlers$1,
    one: one2,
    options: settings,
    patch,
    wrap
  };
  visit(tree, function(node2) {
    if (node2.type === "definition" || node2.type === "footnoteDefinition") {
      const map2 = node2.type === "definition" ? definitionById : footnoteById;
      const id = String(node2.identifier).toUpperCase();
      if (!map2.has(id)) {
        map2.set(id, node2);
      }
    }
  });
  return state;
  function one2(node2, parent) {
    const type = node2.type;
    const handle2 = state.handlers[type];
    if (own$2.call(state.handlers, type) && handle2) {
      return handle2(state, node2, parent);
    }
    if (state.options.passThrough && state.options.passThrough.includes(type)) {
      if ("children" in node2) {
        const { children, ...shallow } = node2;
        const result = structuredClone$1(shallow);
        result.children = state.all(node2);
        return result;
      }
      return structuredClone$1(node2);
    }
    const unknown2 = state.options.unknownHandler || defaultUnknownHandler;
    return unknown2(state, node2, parent);
  }
  function all2(parent) {
    const values = [];
    if ("children" in parent) {
      const nodes = parent.children;
      let index2 = -1;
      while (++index2 < nodes.length) {
        const result = state.one(nodes[index2], parent);
        if (result) {
          if (index2 && nodes[index2 - 1].type === "break") {
            if (!Array.isArray(result) && result.type === "text") {
              result.value = trimMarkdownSpaceStart(result.value);
            }
            if (!Array.isArray(result) && result.type === "element") {
              const head2 = result.children[0];
              if (head2 && head2.type === "text") {
                head2.value = trimMarkdownSpaceStart(head2.value);
              }
            }
          }
          if (Array.isArray(result)) {
            values.push(...result);
          } else {
            values.push(result);
          }
        }
      }
    }
    return values;
  }
}
function patch(from, to) {
  if (from.position) to.position = position(from);
}
function applyData(from, to) {
  let result = to;
  if (from && from.data) {
    const hName = from.data.hName;
    const hChildren = from.data.hChildren;
    const hProperties = from.data.hProperties;
    if (typeof hName === "string") {
      if (result.type === "element") {
        result.tagName = hName;
      } else {
        const children = "children" in result ? result.children : [result];
        result = { type: "element", tagName: hName, properties: {}, children };
      }
    }
    if (result.type === "element" && hProperties) {
      Object.assign(result.properties, structuredClone$1(hProperties));
    }
    if ("children" in result && result.children && hChildren !== null && hChildren !== void 0) {
      result.children = hChildren;
    }
  }
  return result;
}
function defaultUnknownHandler(state, node2) {
  const data = node2.data || {};
  const result = "value" in node2 && !(own$2.call(data, "hProperties") || own$2.call(data, "hChildren")) ? { type: "text", value: node2.value } : {
    type: "element",
    tagName: "div",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function wrap(nodes, loose) {
  const result = [];
  let index2 = -1;
  if (loose) {
    result.push({ type: "text", value: "\n" });
  }
  while (++index2 < nodes.length) {
    if (index2) result.push({ type: "text", value: "\n" });
    result.push(nodes[index2]);
  }
  if (loose && nodes.length > 0) {
    result.push({ type: "text", value: "\n" });
  }
  return result;
}
function trimMarkdownSpaceStart(value) {
  let index2 = 0;
  let code2 = value.charCodeAt(index2);
  while (code2 === 9 || code2 === 32) {
    index2++;
    code2 = value.charCodeAt(index2);
  }
  return value.slice(index2);
}
function toHast(tree, options) {
  const state = createState(tree, options);
  const node2 = state.one(tree, void 0);
  const foot = footer(state);
  const result = Array.isArray(node2) ? { type: "root", children: node2 } : node2 || { type: "root", children: [] };
  if (foot) {
    result.children.push({ type: "text", value: "\n" }, foot);
  }
  return result;
}
function remarkRehype(destination, options) {
  if (destination && "run" in destination) {
    return async function(tree, file) {
      const hastTree = (
        /** @type {HastRoot} */
        toHast(tree, { file, ...options })
      );
      await destination.run(hastTree, file);
    };
  }
  return function(tree, file) {
    return (
      /** @type {HastRoot} */
      toHast(tree, { file, ...destination || options })
    );
  };
}
const htmlVoidElements = [
  "area",
  "base",
  "basefont",
  "bgsound",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "image",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
class Schema {
  /**
   * @param {SchemaType['property']} property
   *   Property.
   * @param {SchemaType['normal']} normal
   *   Normal.
   * @param {Space | undefined} [space]
   *   Space.
   * @returns
   *   Schema.
   */
  constructor(property, normal, space2) {
    this.normal = normal;
    this.property = property;
    if (space2) {
      this.space = space2;
    }
  }
}
Schema.prototype.normal = {};
Schema.prototype.property = {};
Schema.prototype.space = void 0;
function merge(definitions, space2) {
  const property = {};
  const normal = {};
  for (const definition2 of definitions) {
    Object.assign(property, definition2.property);
    Object.assign(normal, definition2.normal);
  }
  return new Schema(property, normal, space2);
}
function normalize(value) {
  return value.toLowerCase();
}
class Info {
  /**
   * @param {string} property
   *   Property.
   * @param {string} attribute
   *   Attribute.
   * @returns
   *   Info.
   */
  constructor(property, attribute) {
    this.attribute = attribute;
    this.property = property;
  }
}
Info.prototype.attribute = "";
Info.prototype.booleanish = false;
Info.prototype.boolean = false;
Info.prototype.commaOrSpaceSeparated = false;
Info.prototype.commaSeparated = false;
Info.prototype.defined = false;
Info.prototype.mustUseProperty = false;
Info.prototype.number = false;
Info.prototype.overloadedBoolean = false;
Info.prototype.property = "";
Info.prototype.spaceSeparated = false;
Info.prototype.space = void 0;
let powers = 0;
const boolean = increment();
const booleanish = increment();
const overloadedBoolean = increment();
const number = increment();
const spaceSeparated = increment();
const commaSeparated = increment();
const commaOrSpaceSeparated = increment();
function increment() {
  return 2 ** ++powers;
}
const types = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  boolean,
  booleanish,
  commaOrSpaceSeparated,
  commaSeparated,
  number,
  overloadedBoolean,
  spaceSeparated
}, Symbol.toStringTag, { value: "Module" }));
const checks = (
  /** @type {ReadonlyArray<keyof typeof types>} */
  Object.keys(types)
);
class DefinedInfo extends Info {
  /**
   * @constructor
   * @param {string} property
   *   Property.
   * @param {string} attribute
   *   Attribute.
   * @param {number | null | undefined} [mask]
   *   Mask.
   * @param {Space | undefined} [space]
   *   Space.
   * @returns
   *   Info.
   */
  constructor(property, attribute, mask, space2) {
    let index2 = -1;
    super(property, attribute);
    mark(this, "space", space2);
    if (typeof mask === "number") {
      while (++index2 < checks.length) {
        const check = checks[index2];
        mark(this, checks[index2], (mask & types[check]) === types[check]);
      }
    }
  }
}
DefinedInfo.prototype.defined = true;
function mark(values, key2, value) {
  if (value) {
    values[key2] = value;
  }
}
function create(definition2) {
  const properties = {};
  const normals = {};
  for (const [property, value] of Object.entries(definition2.properties)) {
    const info = new DefinedInfo(
      property,
      definition2.transform(definition2.attributes || {}, property),
      value,
      definition2.space
    );
    if (definition2.mustUseProperty && definition2.mustUseProperty.includes(property)) {
      info.mustUseProperty = true;
    }
    properties[property] = info;
    normals[normalize(property)] = property;
    normals[normalize(info.attribute)] = property;
  }
  return new Schema(properties, normals, definition2.space);
}
const aria = create({
  properties: {
    ariaActiveDescendant: null,
    ariaAtomic: booleanish,
    ariaAutoComplete: null,
    ariaBusy: booleanish,
    ariaChecked: booleanish,
    ariaColCount: number,
    ariaColIndex: number,
    ariaColSpan: number,
    ariaControls: spaceSeparated,
    ariaCurrent: null,
    ariaDescribedBy: spaceSeparated,
    ariaDetails: null,
    ariaDisabled: booleanish,
    ariaDropEffect: spaceSeparated,
    ariaErrorMessage: null,
    ariaExpanded: booleanish,
    ariaFlowTo: spaceSeparated,
    ariaGrabbed: booleanish,
    ariaHasPopup: null,
    ariaHidden: booleanish,
    ariaInvalid: null,
    ariaKeyShortcuts: null,
    ariaLabel: null,
    ariaLabelledBy: spaceSeparated,
    ariaLevel: number,
    ariaLive: null,
    ariaModal: booleanish,
    ariaMultiLine: booleanish,
    ariaMultiSelectable: booleanish,
    ariaOrientation: null,
    ariaOwns: spaceSeparated,
    ariaPlaceholder: null,
    ariaPosInSet: number,
    ariaPressed: booleanish,
    ariaReadOnly: booleanish,
    ariaRelevant: null,
    ariaRequired: booleanish,
    ariaRoleDescription: spaceSeparated,
    ariaRowCount: number,
    ariaRowIndex: number,
    ariaRowSpan: number,
    ariaSelected: booleanish,
    ariaSetSize: number,
    ariaSort: null,
    ariaValueMax: number,
    ariaValueMin: number,
    ariaValueNow: number,
    ariaValueText: null,
    role: null
  },
  transform(_, property) {
    return property === "role" ? property : "aria-" + property.slice(4).toLowerCase();
  }
});
function caseSensitiveTransform(attributes, attribute) {
  return attribute in attributes ? attributes[attribute] : attribute;
}
function caseInsensitiveTransform(attributes, property) {
  return caseSensitiveTransform(attributes, property.toLowerCase());
}
const html$3 = create({
  attributes: {
    acceptcharset: "accept-charset",
    classname: "class",
    htmlfor: "for",
    httpequiv: "http-equiv"
  },
  mustUseProperty: ["checked", "multiple", "muted", "selected"],
  properties: {
    // Standard Properties.
    abbr: null,
    accept: commaSeparated,
    acceptCharset: spaceSeparated,
    accessKey: spaceSeparated,
    action: null,
    allow: null,
    allowFullScreen: boolean,
    allowPaymentRequest: boolean,
    allowUserMedia: boolean,
    alt: null,
    as: null,
    async: boolean,
    autoCapitalize: null,
    autoComplete: spaceSeparated,
    autoFocus: boolean,
    autoPlay: boolean,
    blocking: spaceSeparated,
    capture: null,
    charSet: null,
    checked: boolean,
    cite: null,
    className: spaceSeparated,
    cols: number,
    colSpan: null,
    content: null,
    contentEditable: booleanish,
    controls: boolean,
    controlsList: spaceSeparated,
    coords: number | commaSeparated,
    crossOrigin: null,
    data: null,
    dateTime: null,
    decoding: null,
    default: boolean,
    defer: boolean,
    dir: null,
    dirName: null,
    disabled: boolean,
    download: overloadedBoolean,
    draggable: booleanish,
    encType: null,
    enterKeyHint: null,
    fetchPriority: null,
    form: null,
    formAction: null,
    formEncType: null,
    formMethod: null,
    formNoValidate: boolean,
    formTarget: null,
    headers: spaceSeparated,
    height: number,
    hidden: overloadedBoolean,
    high: number,
    href: null,
    hrefLang: null,
    htmlFor: spaceSeparated,
    httpEquiv: spaceSeparated,
    id: null,
    imageSizes: null,
    imageSrcSet: null,
    inert: boolean,
    inputMode: null,
    integrity: null,
    is: null,
    isMap: boolean,
    itemId: null,
    itemProp: spaceSeparated,
    itemRef: spaceSeparated,
    itemScope: boolean,
    itemType: spaceSeparated,
    kind: null,
    label: null,
    lang: null,
    language: null,
    list: null,
    loading: null,
    loop: boolean,
    low: number,
    manifest: null,
    max: null,
    maxLength: number,
    media: null,
    method: null,
    min: null,
    minLength: number,
    multiple: boolean,
    muted: boolean,
    name: null,
    nonce: null,
    noModule: boolean,
    noValidate: boolean,
    onAbort: null,
    onAfterPrint: null,
    onAuxClick: null,
    onBeforeMatch: null,
    onBeforePrint: null,
    onBeforeToggle: null,
    onBeforeUnload: null,
    onBlur: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onContextLost: null,
    onContextMenu: null,
    onContextRestored: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFormData: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLanguageChange: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadEnd: null,
    onLoadStart: null,
    onMessage: null,
    onMessageError: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRejectionHandled: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onScrollEnd: null,
    onSecurityPolicyViolation: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onSlotChange: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnhandledRejection: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onWheel: null,
    open: boolean,
    optimum: number,
    pattern: null,
    ping: spaceSeparated,
    placeholder: null,
    playsInline: boolean,
    popover: null,
    popoverTarget: null,
    popoverTargetAction: null,
    poster: null,
    preload: null,
    readOnly: boolean,
    referrerPolicy: null,
    rel: spaceSeparated,
    required: boolean,
    reversed: boolean,
    rows: number,
    rowSpan: number,
    sandbox: spaceSeparated,
    scope: null,
    scoped: boolean,
    seamless: boolean,
    selected: boolean,
    shadowRootClonable: boolean,
    shadowRootDelegatesFocus: boolean,
    shadowRootMode: null,
    shape: null,
    size: number,
    sizes: null,
    slot: null,
    span: number,
    spellCheck: booleanish,
    src: null,
    srcDoc: null,
    srcLang: null,
    srcSet: null,
    start: number,
    step: null,
    style: null,
    tabIndex: number,
    target: null,
    title: null,
    translate: null,
    type: null,
    typeMustMatch: boolean,
    useMap: null,
    value: booleanish,
    width: number,
    wrap: null,
    writingSuggestions: null,
    // Legacy.
    // See: https://html.spec.whatwg.org/#other-elements,-attributes-and-apis
    align: null,
    // Several. Use CSS `text-align` instead,
    aLink: null,
    // `<body>`. Use CSS `a:active {color}` instead
    archive: spaceSeparated,
    // `<object>`. List of URIs to archives
    axis: null,
    // `<td>` and `<th>`. Use `scope` on `<th>`
    background: null,
    // `<body>`. Use CSS `background-image` instead
    bgColor: null,
    // `<body>` and table elements. Use CSS `background-color` instead
    border: number,
    // `<table>`. Use CSS `border-width` instead,
    borderColor: null,
    // `<table>`. Use CSS `border-color` instead,
    bottomMargin: number,
    // `<body>`
    cellPadding: null,
    // `<table>`
    cellSpacing: null,
    // `<table>`
    char: null,
    // Several table elements. When `align=char`, sets the character to align on
    charOff: null,
    // Several table elements. When `char`, offsets the alignment
    classId: null,
    // `<object>`
    clear: null,
    // `<br>`. Use CSS `clear` instead
    code: null,
    // `<object>`
    codeBase: null,
    // `<object>`
    codeType: null,
    // `<object>`
    color: null,
    // `<font>` and `<hr>`. Use CSS instead
    compact: boolean,
    // Lists. Use CSS to reduce space between items instead
    declare: boolean,
    // `<object>`
    event: null,
    // `<script>`
    face: null,
    // `<font>`. Use CSS instead
    frame: null,
    // `<table>`
    frameBorder: null,
    // `<iframe>`. Use CSS `border` instead
    hSpace: number,
    // `<img>` and `<object>`
    leftMargin: number,
    // `<body>`
    link: null,
    // `<body>`. Use CSS `a:link {color: *}` instead
    longDesc: null,
    // `<frame>`, `<iframe>`, and `<img>`. Use an `<a>`
    lowSrc: null,
    // `<img>`. Use a `<picture>`
    marginHeight: number,
    // `<body>`
    marginWidth: number,
    // `<body>`
    noResize: boolean,
    // `<frame>`
    noHref: boolean,
    // `<area>`. Use no href instead of an explicit `nohref`
    noShade: boolean,
    // `<hr>`. Use background-color and height instead of borders
    noWrap: boolean,
    // `<td>` and `<th>`
    object: null,
    // `<applet>`
    profile: null,
    // `<head>`
    prompt: null,
    // `<isindex>`
    rev: null,
    // `<link>`
    rightMargin: number,
    // `<body>`
    rules: null,
    // `<table>`
    scheme: null,
    // `<meta>`
    scrolling: booleanish,
    // `<frame>`. Use overflow in the child context
    standby: null,
    // `<object>`
    summary: null,
    // `<table>`
    text: null,
    // `<body>`. Use CSS `color` instead
    topMargin: number,
    // `<body>`
    valueType: null,
    // `<param>`
    version: null,
    // `<html>`. Use a doctype.
    vAlign: null,
    // Several. Use CSS `vertical-align` instead
    vLink: null,
    // `<body>`. Use CSS `a:visited {color}` instead
    vSpace: number,
    // `<img>` and `<object>`
    // Non-standard Properties.
    allowTransparency: null,
    autoCorrect: null,
    autoSave: null,
    disablePictureInPicture: boolean,
    disableRemotePlayback: boolean,
    prefix: null,
    property: null,
    results: number,
    security: null,
    unselectable: null
  },
  space: "html",
  transform: caseInsensitiveTransform
});
const svg$1 = create({
  attributes: {
    accentHeight: "accent-height",
    alignmentBaseline: "alignment-baseline",
    arabicForm: "arabic-form",
    baselineShift: "baseline-shift",
    capHeight: "cap-height",
    className: "class",
    clipPath: "clip-path",
    clipRule: "clip-rule",
    colorInterpolation: "color-interpolation",
    colorInterpolationFilters: "color-interpolation-filters",
    colorProfile: "color-profile",
    colorRendering: "color-rendering",
    crossOrigin: "crossorigin",
    dataType: "datatype",
    dominantBaseline: "dominant-baseline",
    enableBackground: "enable-background",
    fillOpacity: "fill-opacity",
    fillRule: "fill-rule",
    floodColor: "flood-color",
    floodOpacity: "flood-opacity",
    fontFamily: "font-family",
    fontSize: "font-size",
    fontSizeAdjust: "font-size-adjust",
    fontStretch: "font-stretch",
    fontStyle: "font-style",
    fontVariant: "font-variant",
    fontWeight: "font-weight",
    glyphName: "glyph-name",
    glyphOrientationHorizontal: "glyph-orientation-horizontal",
    glyphOrientationVertical: "glyph-orientation-vertical",
    hrefLang: "hreflang",
    horizAdvX: "horiz-adv-x",
    horizOriginX: "horiz-origin-x",
    horizOriginY: "horiz-origin-y",
    imageRendering: "image-rendering",
    letterSpacing: "letter-spacing",
    lightingColor: "lighting-color",
    markerEnd: "marker-end",
    markerMid: "marker-mid",
    markerStart: "marker-start",
    navDown: "nav-down",
    navDownLeft: "nav-down-left",
    navDownRight: "nav-down-right",
    navLeft: "nav-left",
    navNext: "nav-next",
    navPrev: "nav-prev",
    navRight: "nav-right",
    navUp: "nav-up",
    navUpLeft: "nav-up-left",
    navUpRight: "nav-up-right",
    onAbort: "onabort",
    onActivate: "onactivate",
    onAfterPrint: "onafterprint",
    onBeforePrint: "onbeforeprint",
    onBegin: "onbegin",
    onCancel: "oncancel",
    onCanPlay: "oncanplay",
    onCanPlayThrough: "oncanplaythrough",
    onChange: "onchange",
    onClick: "onclick",
    onClose: "onclose",
    onCopy: "oncopy",
    onCueChange: "oncuechange",
    onCut: "oncut",
    onDblClick: "ondblclick",
    onDrag: "ondrag",
    onDragEnd: "ondragend",
    onDragEnter: "ondragenter",
    onDragExit: "ondragexit",
    onDragLeave: "ondragleave",
    onDragOver: "ondragover",
    onDragStart: "ondragstart",
    onDrop: "ondrop",
    onDurationChange: "ondurationchange",
    onEmptied: "onemptied",
    onEnd: "onend",
    onEnded: "onended",
    onError: "onerror",
    onFocus: "onfocus",
    onFocusIn: "onfocusin",
    onFocusOut: "onfocusout",
    onHashChange: "onhashchange",
    onInput: "oninput",
    onInvalid: "oninvalid",
    onKeyDown: "onkeydown",
    onKeyPress: "onkeypress",
    onKeyUp: "onkeyup",
    onLoad: "onload",
    onLoadedData: "onloadeddata",
    onLoadedMetadata: "onloadedmetadata",
    onLoadStart: "onloadstart",
    onMessage: "onmessage",
    onMouseDown: "onmousedown",
    onMouseEnter: "onmouseenter",
    onMouseLeave: "onmouseleave",
    onMouseMove: "onmousemove",
    onMouseOut: "onmouseout",
    onMouseOver: "onmouseover",
    onMouseUp: "onmouseup",
    onMouseWheel: "onmousewheel",
    onOffline: "onoffline",
    onOnline: "ononline",
    onPageHide: "onpagehide",
    onPageShow: "onpageshow",
    onPaste: "onpaste",
    onPause: "onpause",
    onPlay: "onplay",
    onPlaying: "onplaying",
    onPopState: "onpopstate",
    onProgress: "onprogress",
    onRateChange: "onratechange",
    onRepeat: "onrepeat",
    onReset: "onreset",
    onResize: "onresize",
    onScroll: "onscroll",
    onSeeked: "onseeked",
    onSeeking: "onseeking",
    onSelect: "onselect",
    onShow: "onshow",
    onStalled: "onstalled",
    onStorage: "onstorage",
    onSubmit: "onsubmit",
    onSuspend: "onsuspend",
    onTimeUpdate: "ontimeupdate",
    onToggle: "ontoggle",
    onUnload: "onunload",
    onVolumeChange: "onvolumechange",
    onWaiting: "onwaiting",
    onZoom: "onzoom",
    overlinePosition: "overline-position",
    overlineThickness: "overline-thickness",
    paintOrder: "paint-order",
    panose1: "panose-1",
    pointerEvents: "pointer-events",
    referrerPolicy: "referrerpolicy",
    renderingIntent: "rendering-intent",
    shapeRendering: "shape-rendering",
    stopColor: "stop-color",
    stopOpacity: "stop-opacity",
    strikethroughPosition: "strikethrough-position",
    strikethroughThickness: "strikethrough-thickness",
    strokeDashArray: "stroke-dasharray",
    strokeDashOffset: "stroke-dashoffset",
    strokeLineCap: "stroke-linecap",
    strokeLineJoin: "stroke-linejoin",
    strokeMiterLimit: "stroke-miterlimit",
    strokeOpacity: "stroke-opacity",
    strokeWidth: "stroke-width",
    tabIndex: "tabindex",
    textAnchor: "text-anchor",
    textDecoration: "text-decoration",
    textRendering: "text-rendering",
    transformOrigin: "transform-origin",
    typeOf: "typeof",
    underlinePosition: "underline-position",
    underlineThickness: "underline-thickness",
    unicodeBidi: "unicode-bidi",
    unicodeRange: "unicode-range",
    unitsPerEm: "units-per-em",
    vAlphabetic: "v-alphabetic",
    vHanging: "v-hanging",
    vIdeographic: "v-ideographic",
    vMathematical: "v-mathematical",
    vectorEffect: "vector-effect",
    vertAdvY: "vert-adv-y",
    vertOriginX: "vert-origin-x",
    vertOriginY: "vert-origin-y",
    wordSpacing: "word-spacing",
    writingMode: "writing-mode",
    xHeight: "x-height",
    // These were camelcased in Tiny. Now lowercased in SVG 2
    playbackOrder: "playbackorder",
    timelineBegin: "timelinebegin"
  },
  properties: {
    about: commaOrSpaceSeparated,
    accentHeight: number,
    accumulate: null,
    additive: null,
    alignmentBaseline: null,
    alphabetic: number,
    amplitude: number,
    arabicForm: null,
    ascent: number,
    attributeName: null,
    attributeType: null,
    azimuth: number,
    bandwidth: null,
    baselineShift: null,
    baseFrequency: null,
    baseProfile: null,
    bbox: null,
    begin: null,
    bias: number,
    by: null,
    calcMode: null,
    capHeight: number,
    className: spaceSeparated,
    clip: null,
    clipPath: null,
    clipPathUnits: null,
    clipRule: null,
    color: null,
    colorInterpolation: null,
    colorInterpolationFilters: null,
    colorProfile: null,
    colorRendering: null,
    content: null,
    contentScriptType: null,
    contentStyleType: null,
    crossOrigin: null,
    cursor: null,
    cx: null,
    cy: null,
    d: null,
    dataType: null,
    defaultAction: null,
    descent: number,
    diffuseConstant: number,
    direction: null,
    display: null,
    dur: null,
    divisor: number,
    dominantBaseline: null,
    download: boolean,
    dx: null,
    dy: null,
    edgeMode: null,
    editable: null,
    elevation: number,
    enableBackground: null,
    end: null,
    event: null,
    exponent: number,
    externalResourcesRequired: null,
    fill: null,
    fillOpacity: number,
    fillRule: null,
    filter: null,
    filterRes: null,
    filterUnits: null,
    floodColor: null,
    floodOpacity: null,
    focusable: null,
    focusHighlight: null,
    fontFamily: null,
    fontSize: null,
    fontSizeAdjust: null,
    fontStretch: null,
    fontStyle: null,
    fontVariant: null,
    fontWeight: null,
    format: null,
    fr: null,
    from: null,
    fx: null,
    fy: null,
    g1: commaSeparated,
    g2: commaSeparated,
    glyphName: commaSeparated,
    glyphOrientationHorizontal: null,
    glyphOrientationVertical: null,
    glyphRef: null,
    gradientTransform: null,
    gradientUnits: null,
    handler: null,
    hanging: number,
    hatchContentUnits: null,
    hatchUnits: null,
    height: null,
    href: null,
    hrefLang: null,
    horizAdvX: number,
    horizOriginX: number,
    horizOriginY: number,
    id: null,
    ideographic: number,
    imageRendering: null,
    initialVisibility: null,
    in: null,
    in2: null,
    intercept: number,
    k: number,
    k1: number,
    k2: number,
    k3: number,
    k4: number,
    kernelMatrix: commaOrSpaceSeparated,
    kernelUnitLength: null,
    keyPoints: null,
    // SEMI_COLON_SEPARATED
    keySplines: null,
    // SEMI_COLON_SEPARATED
    keyTimes: null,
    // SEMI_COLON_SEPARATED
    kerning: null,
    lang: null,
    lengthAdjust: null,
    letterSpacing: null,
    lightingColor: null,
    limitingConeAngle: number,
    local: null,
    markerEnd: null,
    markerMid: null,
    markerStart: null,
    markerHeight: null,
    markerUnits: null,
    markerWidth: null,
    mask: null,
    maskContentUnits: null,
    maskUnits: null,
    mathematical: null,
    max: null,
    media: null,
    mediaCharacterEncoding: null,
    mediaContentEncodings: null,
    mediaSize: number,
    mediaTime: null,
    method: null,
    min: null,
    mode: null,
    name: null,
    navDown: null,
    navDownLeft: null,
    navDownRight: null,
    navLeft: null,
    navNext: null,
    navPrev: null,
    navRight: null,
    navUp: null,
    navUpLeft: null,
    navUpRight: null,
    numOctaves: null,
    observer: null,
    offset: null,
    onAbort: null,
    onActivate: null,
    onAfterPrint: null,
    onBeforePrint: null,
    onBegin: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnd: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFocusIn: null,
    onFocusOut: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadStart: null,
    onMessage: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onMouseWheel: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRepeat: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onShow: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onZoom: null,
    opacity: null,
    operator: null,
    order: null,
    orient: null,
    orientation: null,
    origin: null,
    overflow: null,
    overlay: null,
    overlinePosition: number,
    overlineThickness: number,
    paintOrder: null,
    panose1: null,
    path: null,
    pathLength: number,
    patternContentUnits: null,
    patternTransform: null,
    patternUnits: null,
    phase: null,
    ping: spaceSeparated,
    pitch: null,
    playbackOrder: null,
    pointerEvents: null,
    points: null,
    pointsAtX: number,
    pointsAtY: number,
    pointsAtZ: number,
    preserveAlpha: null,
    preserveAspectRatio: null,
    primitiveUnits: null,
    propagate: null,
    property: commaOrSpaceSeparated,
    r: null,
    radius: null,
    referrerPolicy: null,
    refX: null,
    refY: null,
    rel: commaOrSpaceSeparated,
    rev: commaOrSpaceSeparated,
    renderingIntent: null,
    repeatCount: null,
    repeatDur: null,
    requiredExtensions: commaOrSpaceSeparated,
    requiredFeatures: commaOrSpaceSeparated,
    requiredFonts: commaOrSpaceSeparated,
    requiredFormats: commaOrSpaceSeparated,
    resource: null,
    restart: null,
    result: null,
    rotate: null,
    rx: null,
    ry: null,
    scale: null,
    seed: null,
    shapeRendering: null,
    side: null,
    slope: null,
    snapshotTime: null,
    specularConstant: number,
    specularExponent: number,
    spreadMethod: null,
    spacing: null,
    startOffset: null,
    stdDeviation: null,
    stemh: null,
    stemv: null,
    stitchTiles: null,
    stopColor: null,
    stopOpacity: null,
    strikethroughPosition: number,
    strikethroughThickness: number,
    string: null,
    stroke: null,
    strokeDashArray: commaOrSpaceSeparated,
    strokeDashOffset: null,
    strokeLineCap: null,
    strokeLineJoin: null,
    strokeMiterLimit: number,
    strokeOpacity: number,
    strokeWidth: null,
    style: null,
    surfaceScale: number,
    syncBehavior: null,
    syncBehaviorDefault: null,
    syncMaster: null,
    syncTolerance: null,
    syncToleranceDefault: null,
    systemLanguage: commaOrSpaceSeparated,
    tabIndex: number,
    tableValues: null,
    target: null,
    targetX: number,
    targetY: number,
    textAnchor: null,
    textDecoration: null,
    textRendering: null,
    textLength: null,
    timelineBegin: null,
    title: null,
    transformBehavior: null,
    type: null,
    typeOf: commaOrSpaceSeparated,
    to: null,
    transform: null,
    transformOrigin: null,
    u1: null,
    u2: null,
    underlinePosition: number,
    underlineThickness: number,
    unicode: null,
    unicodeBidi: null,
    unicodeRange: null,
    unitsPerEm: number,
    values: null,
    vAlphabetic: number,
    vMathematical: number,
    vectorEffect: null,
    vHanging: number,
    vIdeographic: number,
    version: null,
    vertAdvY: number,
    vertOriginX: number,
    vertOriginY: number,
    viewBox: null,
    viewTarget: null,
    visibility: null,
    width: null,
    widths: null,
    wordSpacing: null,
    writingMode: null,
    x: null,
    x1: null,
    x2: null,
    xChannelSelector: null,
    xHeight: number,
    y: null,
    y1: null,
    y2: null,
    yChannelSelector: null,
    z: null,
    zoomAndPan: null
  },
  space: "svg",
  transform: caseSensitiveTransform
});
const xlink = create({
  properties: {
    xLinkActuate: null,
    xLinkArcRole: null,
    xLinkHref: null,
    xLinkRole: null,
    xLinkShow: null,
    xLinkTitle: null,
    xLinkType: null
  },
  space: "xlink",
  transform(_, property) {
    return "xlink:" + property.slice(5).toLowerCase();
  }
});
const xmlns = create({
  attributes: { xmlnsxlink: "xmlns:xlink" },
  properties: { xmlnsXLink: null, xmlns: null },
  space: "xmlns",
  transform: caseInsensitiveTransform
});
const xml = create({
  properties: { xmlBase: null, xmlLang: null, xmlSpace: null },
  space: "xml",
  transform(_, property) {
    return "xml:" + property.slice(3).toLowerCase();
  }
});
const cap = /[A-Z]/g;
const dash = /-[a-z]/g;
const valid = /^data[-\w.:]+$/i;
function find(schema, value) {
  const normal = normalize(value);
  let property = value;
  let Type = Info;
  if (normal in schema.normal) {
    return schema.property[schema.normal[normal]];
  }
  if (normal.length > 4 && normal.slice(0, 4) === "data" && valid.test(value)) {
    if (value.charAt(4) === "-") {
      const rest = value.slice(5).replace(dash, camelcase);
      property = "data" + rest.charAt(0).toUpperCase() + rest.slice(1);
    } else {
      const rest = value.slice(4);
      if (!dash.test(rest)) {
        let dashes = rest.replace(cap, kebab);
        if (dashes.charAt(0) !== "-") {
          dashes = "-" + dashes;
        }
        value = "data" + dashes;
      }
    }
    Type = DefinedInfo;
  }
  return new Type(property, value);
}
function kebab($0) {
  return "-" + $0.toLowerCase();
}
function camelcase($0) {
  return $0.charAt(1).toUpperCase();
}
const html$2 = merge([aria, html$3, xlink, xmlns, xml], "html");
const svg = merge([aria, svg$1, xlink, xmlns, xml], "svg");
const defaultSubsetRegex = /["&'<>`]/g;
const surrogatePairsRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
const controlCharactersRegex = (
  // eslint-disable-next-line no-control-regex, unicorn/no-hex-escape
  /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g
);
const regexEscapeRegex = /[|\\{}()[\]^$+*?.]/g;
const subsetToRegexCache = /* @__PURE__ */ new WeakMap();
function core(value, options) {
  value = value.replace(
    options.subset ? charactersToExpressionCached(options.subset) : defaultSubsetRegex,
    basic
  );
  if (options.subset || options.escapeOnly) {
    return value;
  }
  return value.replace(surrogatePairsRegex, surrogate).replace(controlCharactersRegex, basic);
  function surrogate(pair, index2, all2) {
    return options.format(
      (pair.charCodeAt(0) - 55296) * 1024 + pair.charCodeAt(1) - 56320 + 65536,
      all2.charCodeAt(index2 + 2),
      options
    );
  }
  function basic(character, index2, all2) {
    return options.format(
      character.charCodeAt(0),
      all2.charCodeAt(index2 + 1),
      options
    );
  }
}
function charactersToExpressionCached(subset) {
  let cached = subsetToRegexCache.get(subset);
  if (!cached) {
    cached = charactersToExpression(subset);
    subsetToRegexCache.set(subset, cached);
  }
  return cached;
}
function charactersToExpression(subset) {
  const groups = [];
  let index2 = -1;
  while (++index2 < subset.length) {
    groups.push(subset[index2].replace(regexEscapeRegex, "\\$&"));
  }
  return new RegExp("(?:" + groups.join("|") + ")", "g");
}
const hexadecimalRegex = /[\dA-Fa-f]/;
function toHexadecimal(code2, next, omit) {
  const value = "&#x" + code2.toString(16).toUpperCase();
  return omit && next && !hexadecimalRegex.test(String.fromCharCode(next)) ? value : value + ";";
}
const decimalRegex = /\d/;
function toDecimal(code2, next, omit) {
  const value = "&#" + String(code2);
  return omit && next && !decimalRegex.test(String.fromCharCode(next)) ? value : value + ";";
}
const characterEntitiesLegacy = [
  "AElig",
  "AMP",
  "Aacute",
  "Acirc",
  "Agrave",
  "Aring",
  "Atilde",
  "Auml",
  "COPY",
  "Ccedil",
  "ETH",
  "Eacute",
  "Ecirc",
  "Egrave",
  "Euml",
  "GT",
  "Iacute",
  "Icirc",
  "Igrave",
  "Iuml",
  "LT",
  "Ntilde",
  "Oacute",
  "Ocirc",
  "Ograve",
  "Oslash",
  "Otilde",
  "Ouml",
  "QUOT",
  "REG",
  "THORN",
  "Uacute",
  "Ucirc",
  "Ugrave",
  "Uuml",
  "Yacute",
  "aacute",
  "acirc",
  "acute",
  "aelig",
  "agrave",
  "amp",
  "aring",
  "atilde",
  "auml",
  "brvbar",
  "ccedil",
  "cedil",
  "cent",
  "copy",
  "curren",
  "deg",
  "divide",
  "eacute",
  "ecirc",
  "egrave",
  "eth",
  "euml",
  "frac12",
  "frac14",
  "frac34",
  "gt",
  "iacute",
  "icirc",
  "iexcl",
  "igrave",
  "iquest",
  "iuml",
  "laquo",
  "lt",
  "macr",
  "micro",
  "middot",
  "nbsp",
  "not",
  "ntilde",
  "oacute",
  "ocirc",
  "ograve",
  "ordf",
  "ordm",
  "oslash",
  "otilde",
  "ouml",
  "para",
  "plusmn",
  "pound",
  "quot",
  "raquo",
  "reg",
  "sect",
  "shy",
  "sup1",
  "sup2",
  "sup3",
  "szlig",
  "thorn",
  "times",
  "uacute",
  "ucirc",
  "ugrave",
  "uml",
  "uuml",
  "yacute",
  "yen",
  "yuml"
];
const characterEntitiesHtml4 = {
  nbsp: " ",
  iexcl: "¡",
  cent: "¢",
  pound: "£",
  curren: "¤",
  yen: "¥",
  brvbar: "¦",
  sect: "§",
  uml: "¨",
  copy: "©",
  ordf: "ª",
  laquo: "«",
  not: "¬",
  shy: "­",
  reg: "®",
  macr: "¯",
  deg: "°",
  plusmn: "±",
  sup2: "²",
  sup3: "³",
  acute: "´",
  micro: "µ",
  para: "¶",
  middot: "·",
  cedil: "¸",
  sup1: "¹",
  ordm: "º",
  raquo: "»",
  frac14: "¼",
  frac12: "½",
  frac34: "¾",
  iquest: "¿",
  Agrave: "À",
  Aacute: "Á",
  Acirc: "Â",
  Atilde: "Ã",
  Auml: "Ä",
  Aring: "Å",
  AElig: "Æ",
  Ccedil: "Ç",
  Egrave: "È",
  Eacute: "É",
  Ecirc: "Ê",
  Euml: "Ë",
  Igrave: "Ì",
  Iacute: "Í",
  Icirc: "Î",
  Iuml: "Ï",
  ETH: "Ð",
  Ntilde: "Ñ",
  Ograve: "Ò",
  Oacute: "Ó",
  Ocirc: "Ô",
  Otilde: "Õ",
  Ouml: "Ö",
  times: "×",
  Oslash: "Ø",
  Ugrave: "Ù",
  Uacute: "Ú",
  Ucirc: "Û",
  Uuml: "Ü",
  Yacute: "Ý",
  THORN: "Þ",
  szlig: "ß",
  agrave: "à",
  aacute: "á",
  acirc: "â",
  atilde: "ã",
  auml: "ä",
  aring: "å",
  aelig: "æ",
  ccedil: "ç",
  egrave: "è",
  eacute: "é",
  ecirc: "ê",
  euml: "ë",
  igrave: "ì",
  iacute: "í",
  icirc: "î",
  iuml: "ï",
  eth: "ð",
  ntilde: "ñ",
  ograve: "ò",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  ouml: "ö",
  divide: "÷",
  oslash: "ø",
  ugrave: "ù",
  uacute: "ú",
  ucirc: "û",
  uuml: "ü",
  yacute: "ý",
  thorn: "þ",
  yuml: "ÿ",
  fnof: "ƒ",
  Alpha: "Α",
  Beta: "Β",
  Gamma: "Γ",
  Delta: "Δ",
  Epsilon: "Ε",
  Zeta: "Ζ",
  Eta: "Η",
  Theta: "Θ",
  Iota: "Ι",
  Kappa: "Κ",
  Lambda: "Λ",
  Mu: "Μ",
  Nu: "Ν",
  Xi: "Ξ",
  Omicron: "Ο",
  Pi: "Π",
  Rho: "Ρ",
  Sigma: "Σ",
  Tau: "Τ",
  Upsilon: "Υ",
  Phi: "Φ",
  Chi: "Χ",
  Psi: "Ψ",
  Omega: "Ω",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  omicron: "ο",
  pi: "π",
  rho: "ρ",
  sigmaf: "ς",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  thetasym: "ϑ",
  upsih: "ϒ",
  piv: "ϖ",
  bull: "•",
  hellip: "…",
  prime: "′",
  Prime: "″",
  oline: "‾",
  frasl: "⁄",
  weierp: "℘",
  image: "ℑ",
  real: "ℜ",
  trade: "™",
  alefsym: "ℵ",
  larr: "←",
  uarr: "↑",
  rarr: "→",
  darr: "↓",
  harr: "↔",
  crarr: "↵",
  lArr: "⇐",
  uArr: "⇑",
  rArr: "⇒",
  dArr: "⇓",
  hArr: "⇔",
  forall: "∀",
  part: "∂",
  exist: "∃",
  empty: "∅",
  nabla: "∇",
  isin: "∈",
  notin: "∉",
  ni: "∋",
  prod: "∏",
  sum: "∑",
  minus: "−",
  lowast: "∗",
  radic: "√",
  prop: "∝",
  infin: "∞",
  ang: "∠",
  and: "∧",
  or: "∨",
  cap: "∩",
  cup: "∪",
  int: "∫",
  there4: "∴",
  sim: "∼",
  cong: "≅",
  asymp: "≈",
  ne: "≠",
  equiv: "≡",
  le: "≤",
  ge: "≥",
  sub: "⊂",
  sup: "⊃",
  nsub: "⊄",
  sube: "⊆",
  supe: "⊇",
  oplus: "⊕",
  otimes: "⊗",
  perp: "⊥",
  sdot: "⋅",
  lceil: "⌈",
  rceil: "⌉",
  lfloor: "⌊",
  rfloor: "⌋",
  lang: "〈",
  rang: "〉",
  loz: "◊",
  spades: "♠",
  clubs: "♣",
  hearts: "♥",
  diams: "♦",
  quot: '"',
  amp: "&",
  lt: "<",
  gt: ">",
  OElig: "Œ",
  oelig: "œ",
  Scaron: "Š",
  scaron: "š",
  Yuml: "Ÿ",
  circ: "ˆ",
  tilde: "˜",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
  zwnj: "‌",
  zwj: "‍",
  lrm: "‎",
  rlm: "‏",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  dagger: "†",
  Dagger: "‡",
  permil: "‰",
  lsaquo: "‹",
  rsaquo: "›",
  euro: "€"
};
const dangerous = [
  "cent",
  "copy",
  "divide",
  "gt",
  "lt",
  "not",
  "para",
  "times"
];
const own$1 = {}.hasOwnProperty;
const characters = {};
let key;
for (key in characterEntitiesHtml4) {
  if (own$1.call(characterEntitiesHtml4, key)) {
    characters[characterEntitiesHtml4[key]] = key;
  }
}
const notAlphanumericRegex = /[^\dA-Za-z]/;
function toNamed(code2, next, omit, attribute) {
  const character = String.fromCharCode(code2);
  if (own$1.call(characters, character)) {
    const name = characters[character];
    const value = "&" + name;
    if (omit && characterEntitiesLegacy.includes(name) && !dangerous.includes(name) && (!attribute || next && next !== 61 && notAlphanumericRegex.test(String.fromCharCode(next)))) {
      return value;
    }
    return value + ";";
  }
  return "";
}
function formatSmart(code2, next, options) {
  let numeric = toHexadecimal(code2, next, options.omitOptionalSemicolons);
  let named;
  if (options.useNamedReferences || options.useShortestReferences) {
    named = toNamed(
      code2,
      next,
      options.omitOptionalSemicolons,
      options.attribute
    );
  }
  if ((options.useShortestReferences || !named) && options.useShortestReferences) {
    const decimal = toDecimal(code2, next, options.omitOptionalSemicolons);
    if (decimal.length < numeric.length) {
      numeric = decimal;
    }
  }
  return named && (!options.useShortestReferences || named.length < numeric.length) ? named : numeric;
}
function stringifyEntities(value, options) {
  return core(value, Object.assign({ format: formatSmart }, options));
}
const htmlCommentRegex = /^>|^->|<!--|-->|--!>|<!-$/g;
const bogusCommentEntitySubset = [">"];
const commentEntitySubset = ["<", ">"];
function comment(node2, _1, _2, state) {
  return state.settings.bogusComments ? "<?" + stringifyEntities(
    node2.value,
    Object.assign({}, state.settings.characterReferences, {
      subset: bogusCommentEntitySubset
    })
  ) + ">" : "<!--" + node2.value.replace(htmlCommentRegex, encode) + "-->";
  function encode($0) {
    return stringifyEntities(
      $0,
      Object.assign({}, state.settings.characterReferences, {
        subset: commentEntitySubset
      })
    );
  }
}
function doctype(_1, _2, _3, state) {
  return "<!" + (state.settings.upperDoctype ? "DOCTYPE" : "doctype") + (state.settings.tightDoctype ? "" : " ") + "html>";
}
function stringify$1(values, options) {
  const settings = options || {};
  const input = values[values.length - 1] === "" ? [...values, ""] : values;
  return input.join(
    (settings.padRight ? " " : "") + "," + (settings.padLeft === false ? "" : " ")
  ).trim();
}
function stringify(values) {
  return values.join(" ").trim();
}
const re = /[ \t\n\f\r]/g;
function whitespace(thing) {
  return typeof thing === "object" ? thing.type === "text" ? empty(thing.value) : false : empty(thing);
}
function empty(value) {
  return value.replace(re, "") === "";
}
const siblingAfter = siblings(1);
const siblingBefore = siblings(-1);
const emptyChildren$1 = [];
function siblings(increment2) {
  return sibling;
  function sibling(parent, index2, includeWhitespace) {
    const siblings2 = parent ? parent.children : emptyChildren$1;
    let offset = (index2 || 0) + increment2;
    let next = siblings2[offset];
    if (!includeWhitespace) {
      while (next && whitespace(next)) {
        offset += increment2;
        next = siblings2[offset];
      }
    }
    return next;
  }
}
const own = {}.hasOwnProperty;
function omission(handlers2) {
  return omit;
  function omit(node2, index2, parent) {
    return own.call(handlers2, node2.tagName) && handlers2[node2.tagName](node2, index2, parent);
  }
}
const closing = omission({
  body: body$1,
  caption: headOrColgroupOrCaption,
  colgroup: headOrColgroupOrCaption,
  dd,
  dt,
  head: headOrColgroupOrCaption,
  html: html$1,
  li,
  optgroup,
  option,
  p,
  rp: rubyElement,
  rt: rubyElement,
  tbody: tbody$1,
  td: cells,
  tfoot,
  th: cells,
  thead,
  tr
});
function headOrColgroupOrCaption(_, index2, parent) {
  const next = siblingAfter(parent, index2, true);
  return !next || next.type !== "comment" && !(next.type === "text" && whitespace(next.value.charAt(0)));
}
function html$1(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type !== "comment";
}
function body$1(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type !== "comment";
}
function p(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return next ? next.type === "element" && (next.tagName === "address" || next.tagName === "article" || next.tagName === "aside" || next.tagName === "blockquote" || next.tagName === "details" || next.tagName === "div" || next.tagName === "dl" || next.tagName === "fieldset" || next.tagName === "figcaption" || next.tagName === "figure" || next.tagName === "footer" || next.tagName === "form" || next.tagName === "h1" || next.tagName === "h2" || next.tagName === "h3" || next.tagName === "h4" || next.tagName === "h5" || next.tagName === "h6" || next.tagName === "header" || next.tagName === "hgroup" || next.tagName === "hr" || next.tagName === "main" || next.tagName === "menu" || next.tagName === "nav" || next.tagName === "ol" || next.tagName === "p" || next.tagName === "pre" || next.tagName === "section" || next.tagName === "table" || next.tagName === "ul") : !parent || // Confusing parent.
  !(parent.type === "element" && (parent.tagName === "a" || parent.tagName === "audio" || parent.tagName === "del" || parent.tagName === "ins" || parent.tagName === "map" || parent.tagName === "noscript" || parent.tagName === "video"));
}
function li(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type === "element" && next.tagName === "li";
}
function dt(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return Boolean(
    next && next.type === "element" && (next.tagName === "dt" || next.tagName === "dd")
  );
}
function dd(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type === "element" && (next.tagName === "dt" || next.tagName === "dd");
}
function rubyElement(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type === "element" && (next.tagName === "rp" || next.tagName === "rt");
}
function optgroup(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type === "element" && next.tagName === "optgroup";
}
function option(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type === "element" && (next.tagName === "option" || next.tagName === "optgroup");
}
function thead(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return Boolean(
    next && next.type === "element" && (next.tagName === "tbody" || next.tagName === "tfoot")
  );
}
function tbody$1(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type === "element" && (next.tagName === "tbody" || next.tagName === "tfoot");
}
function tfoot(_, index2, parent) {
  return !siblingAfter(parent, index2);
}
function tr(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type === "element" && next.tagName === "tr";
}
function cells(_, index2, parent) {
  const next = siblingAfter(parent, index2);
  return !next || next.type === "element" && (next.tagName === "td" || next.tagName === "th");
}
const opening = omission({
  body,
  colgroup,
  head,
  html,
  tbody
});
function html(node2) {
  const head2 = siblingAfter(node2, -1);
  return !head2 || head2.type !== "comment";
}
function head(node2) {
  const seen = /* @__PURE__ */ new Set();
  for (const child2 of node2.children) {
    if (child2.type === "element" && (child2.tagName === "base" || child2.tagName === "title")) {
      if (seen.has(child2.tagName)) return false;
      seen.add(child2.tagName);
    }
  }
  const child = node2.children[0];
  return !child || child.type === "element";
}
function body(node2) {
  const head2 = siblingAfter(node2, -1, true);
  return !head2 || head2.type !== "comment" && !(head2.type === "text" && whitespace(head2.value.charAt(0))) && !(head2.type === "element" && (head2.tagName === "meta" || head2.tagName === "link" || head2.tagName === "script" || head2.tagName === "style" || head2.tagName === "template"));
}
function colgroup(node2, index2, parent) {
  const previous2 = siblingBefore(parent, index2);
  const head2 = siblingAfter(node2, -1, true);
  if (parent && previous2 && previous2.type === "element" && previous2.tagName === "colgroup" && closing(previous2, parent.children.indexOf(previous2), parent)) {
    return false;
  }
  return Boolean(head2 && head2.type === "element" && head2.tagName === "col");
}
function tbody(node2, index2, parent) {
  const previous2 = siblingBefore(parent, index2);
  const head2 = siblingAfter(node2, -1);
  if (parent && previous2 && previous2.type === "element" && (previous2.tagName === "thead" || previous2.tagName === "tbody") && closing(previous2, parent.children.indexOf(previous2), parent)) {
    return false;
  }
  return Boolean(head2 && head2.type === "element" && head2.tagName === "tr");
}
const constants = {
  // See: <https://html.spec.whatwg.org/#attribute-name-state>.
  name: [
    ["	\n\f\r &/=>".split(""), "	\n\f\r \"&'/=>`".split("")],
    [`\0	
\f\r "&'/<=>`.split(""), "\0	\n\f\r \"&'/<=>`".split("")]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(unquoted)-state>.
  unquoted: [
    ["	\n\f\r &>".split(""), "\0	\n\f\r \"&'<=>`".split("")],
    ["\0	\n\f\r \"&'<=>`".split(""), "\0	\n\f\r \"&'<=>`".split("")]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(single-quoted)-state>.
  single: [
    ["&'".split(""), "\"&'`".split("")],
    ["\0&'".split(""), "\0\"&'`".split("")]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(double-quoted)-state>.
  double: [
    ['"&'.split(""), "\"&'`".split("")],
    ['\0"&'.split(""), "\0\"&'`".split("")]
  ]
};
function element(node2, index2, parent, state) {
  const schema = state.schema;
  const omit = schema.space === "svg" ? false : state.settings.omitOptionalTags;
  let selfClosing = schema.space === "svg" ? state.settings.closeEmptyElements : state.settings.voids.includes(node2.tagName.toLowerCase());
  const parts = [];
  let last;
  if (schema.space === "html" && node2.tagName === "svg") {
    state.schema = svg;
  }
  const attributes = serializeAttributes(state, node2.properties);
  const content2 = state.all(
    schema.space === "html" && node2.tagName === "template" ? node2.content : node2
  );
  state.schema = schema;
  if (content2) selfClosing = false;
  if (attributes || !omit || !opening(node2, index2, parent)) {
    parts.push("<", node2.tagName, attributes ? " " + attributes : "");
    if (selfClosing && (schema.space === "svg" || state.settings.closeSelfClosing)) {
      last = attributes.charAt(attributes.length - 1);
      if (!state.settings.tightSelfClosing || last === "/" || last && last !== '"' && last !== "'") {
        parts.push(" ");
      }
      parts.push("/");
    }
    parts.push(">");
  }
  parts.push(content2);
  if (!selfClosing && (!omit || !closing(node2, index2, parent))) {
    parts.push("</" + node2.tagName + ">");
  }
  return parts.join("");
}
function serializeAttributes(state, properties) {
  const values = [];
  let index2 = -1;
  let key2;
  if (properties) {
    for (key2 in properties) {
      if (properties[key2] !== null && properties[key2] !== void 0) {
        const value = serializeAttribute(state, key2, properties[key2]);
        if (value) values.push(value);
      }
    }
  }
  while (++index2 < values.length) {
    const last = state.settings.tightAttributes ? values[index2].charAt(values[index2].length - 1) : void 0;
    if (index2 !== values.length - 1 && last !== '"' && last !== "'") {
      values[index2] += " ";
    }
  }
  return values.join("");
}
function serializeAttribute(state, key2, value) {
  const info = find(state.schema, key2);
  const x = state.settings.allowParseErrors && state.schema.space === "html" ? 0 : 1;
  const y = state.settings.allowDangerousCharacters ? 0 : 1;
  let quote = state.quote;
  let result;
  if (info.overloadedBoolean && (value === info.attribute || value === "")) {
    value = true;
  } else if ((info.boolean || info.overloadedBoolean) && (typeof value !== "string" || value === info.attribute || value === "")) {
    value = Boolean(value);
  }
  if (value === null || value === void 0 || value === false || typeof value === "number" && Number.isNaN(value)) {
    return "";
  }
  const name = stringifyEntities(
    info.attribute,
    Object.assign({}, state.settings.characterReferences, {
      // Always encode without parse errors in non-HTML.
      subset: constants.name[x][y]
    })
  );
  if (value === true) return name;
  value = Array.isArray(value) ? (info.commaSeparated ? stringify$1 : stringify)(value, {
    padLeft: !state.settings.tightCommaSeparatedLists
  }) : String(value);
  if (state.settings.collapseEmptyAttributes && !value) return name;
  if (state.settings.preferUnquoted) {
    result = stringifyEntities(
      value,
      Object.assign({}, state.settings.characterReferences, {
        attribute: true,
        subset: constants.unquoted[x][y]
      })
    );
  }
  if (result !== value) {
    if (state.settings.quoteSmart && ccount(value, quote) > ccount(value, state.alternative)) {
      quote = state.alternative;
    }
    result = quote + stringifyEntities(
      value,
      Object.assign({}, state.settings.characterReferences, {
        // Always encode without parse errors in non-HTML.
        subset: (quote === "'" ? constants.single : constants.double)[x][y],
        attribute: true
      })
    ) + quote;
  }
  return name + (result ? "=" + result : result);
}
const textEntitySubset = ["<", "&"];
function text(node2, _, parent, state) {
  return parent && parent.type === "element" && (parent.tagName === "script" || parent.tagName === "style") ? node2.value : stringifyEntities(
    node2.value,
    Object.assign({}, state.settings.characterReferences, {
      subset: textEntitySubset
    })
  );
}
function raw(node2, index2, parent, state) {
  return state.settings.allowDangerousHtml ? node2.value : text(node2, index2, parent, state);
}
function root(node2, _1, _2, state) {
  return state.all(node2);
}
const handle = zwitch("type", {
  invalid,
  unknown,
  handlers: { comment, doctype, element, raw, root, text }
});
function invalid(node2) {
  throw new Error("Expected node, not `" + node2 + "`");
}
function unknown(node_) {
  const node2 = (
    /** @type {Nodes} */
    node_
  );
  throw new Error("Cannot compile unknown node `" + node2.type + "`");
}
const emptyOptions = {};
const emptyCharacterReferences = {};
const emptyChildren = [];
function toHtml(tree, options) {
  const options_ = options || emptyOptions;
  const quote = options_.quote || '"';
  const alternative = quote === '"' ? "'" : '"';
  if (quote !== '"' && quote !== "'") {
    throw new Error("Invalid quote `" + quote + "`, expected `'` or `\"`");
  }
  const state = {
    one,
    all,
    settings: {
      omitOptionalTags: options_.omitOptionalTags || false,
      allowParseErrors: options_.allowParseErrors || false,
      allowDangerousCharacters: options_.allowDangerousCharacters || false,
      quoteSmart: options_.quoteSmart || false,
      preferUnquoted: options_.preferUnquoted || false,
      tightAttributes: options_.tightAttributes || false,
      upperDoctype: options_.upperDoctype || false,
      tightDoctype: options_.tightDoctype || false,
      bogusComments: options_.bogusComments || false,
      tightCommaSeparatedLists: options_.tightCommaSeparatedLists || false,
      tightSelfClosing: options_.tightSelfClosing || false,
      collapseEmptyAttributes: options_.collapseEmptyAttributes || false,
      allowDangerousHtml: options_.allowDangerousHtml || false,
      voids: options_.voids || htmlVoidElements,
      characterReferences: options_.characterReferences || emptyCharacterReferences,
      closeSelfClosing: options_.closeSelfClosing || false,
      closeEmptyElements: options_.closeEmptyElements || false
    },
    schema: options_.space === "svg" ? svg : html$2,
    quote,
    alternative
  };
  return state.one(
    Array.isArray(tree) ? { type: "root", children: tree } : tree,
    void 0,
    void 0
  );
}
function one(node2, index2, parent) {
  return handle(node2, index2, parent, this);
}
function all(parent) {
  const results = [];
  const children = parent && parent.children || emptyChildren;
  let index2 = -1;
  while (++index2 < children.length) {
    results[index2] = this.one(children[index2], index2, parent);
  }
  return results.join("");
}
function rehypeStringify(options) {
  const self2 = this;
  const settings = { ...self2.data("settings"), ...options };
  self2.compiler = compiler2;
  function compiler2(tree) {
    return toHtml(tree, settings);
  }
}
function parseMarkdownSync(markdown) {
  const result = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify).processSync(markdown);
  return String(result);
}
const iconArrowLeft = "data:image/svg+xml,%3csvg%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M9.9172%2018.7216L4.26035%2012.6722C3.91322%2012.3009%203.91322%2011.6991%204.26035%2011.3278L9.91721%205.27842C10.2643%204.90719%2010.8272%204.90719%2011.1743%205.27842C11.5214%205.64964%2011.5214%206.25151%2011.1743%206.62273L7.03486%2011.0494L19.1111%2011.0494C19.602%2011.0494%2020%2011.475%2020%2012C20%2012.525%2019.602%2012.9506%2019.1111%2012.9506L7.03486%2012.9506L11.1743%2017.3773C11.5214%2017.7485%2011.5214%2018.3504%2011.1743%2018.7216C10.8271%2019.0928%2010.2643%2019.0928%209.9172%2018.7216Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M9.1868%2019.4046L3.52994%2013.3552C2.82335%2012.5995%202.82335%2011.4005%203.52994%2010.6448L9.1868%204.59541C9.92916%203.80153%2011.1623%203.80153%2011.9047%204.59541C12.6113%205.35103%2012.6113%206.55012%2011.9047%207.30574L9.33906%2010.0494L19.1111%2010.0494C20.2165%2010.0494%2021%2010.987%2021%2012C21%2013.013%2020.2165%2013.9506%2019.1111%2013.9506L9.33906%2013.9506L11.9047%2016.6943C12.6113%2017.4499%2012.6113%2018.649%2011.9047%2019.4046C11.1623%2020.1985%209.92915%2020.1985%209.1868%2019.4046ZM11.1743%2017.3773C11.5214%2017.7485%2011.5214%2018.3504%2011.1743%2018.7216C10.8272%2019.0928%2010.2643%2019.0928%209.9172%2018.7216L4.26035%2012.6722C3.91322%2012.3009%203.91322%2011.6991%204.26035%2011.3278L9.91721%205.27842C10.2643%204.90719%2010.8272%204.90719%2011.1743%205.27842C11.5214%205.64964%2011.5214%206.25151%2011.1743%206.62273L7.03486%2011.0494L19.1111%2011.0494C19.602%2011.0494%2020%2011.475%2020%2012C20%2012.525%2019.602%2012.9506%2019.1111%2012.9506L7.03486%2012.9506L11.1743%2017.3773Z'%20fill='black'/%3e%3c/svg%3e";
const iconArrowUp = "data:image/svg+xml,%3csvg%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M18.7216%209.91721L12.6722%204.26035C12.3009%203.91322%2011.6991%203.91322%2011.3278%204.26035L5.27842%209.91721C4.90719%2010.2643%204.90719%2010.8272%205.27842%2011.1743C5.64964%2011.5214%206.25151%2011.5214%206.62273%2011.1743L11.0494%207.03486L11.0494%2019.1111C11.0494%2019.602%2011.475%2020%2012%2020C12.525%2020%2012.9506%2019.602%2012.9506%2019.1111L12.9506%207.03486L17.3773%2011.1743C17.7485%2011.5214%2018.3504%2011.5214%2018.7216%2011.1743C19.0928%2010.8272%2019.0928%2010.2643%2018.7216%209.91721Z'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M19.4046%209.1868L13.3552%203.52994C12.5995%202.82336%2011.4005%202.82336%2010.6448%203.52994L4.59541%209.1868C3.80153%209.92916%203.80153%2011.1623%204.59541%2011.9047C5.35103%2012.6113%206.55012%2012.6113%207.30574%2011.9047L10.0494%209.33906L10.0494%2019.1111C10.0494%2020.2165%2010.987%2021%2012%2021C13.013%2021%2013.9506%2020.2165%2013.9506%2019.1111L13.9506%209.33906L16.6943%2011.9047C17.4499%2012.6113%2018.649%2012.6113%2019.4046%2011.9047C20.1985%2011.1623%2020.1985%209.92915%2019.4046%209.1868ZM17.3773%2011.1743C17.7485%2011.5214%2018.3504%2011.5214%2018.7216%2011.1743C19.0928%2010.8272%2019.0928%2010.2643%2018.7216%209.91721L12.6722%204.26035C12.3009%203.91322%2011.6991%203.91322%2011.3278%204.26035L5.27842%209.91721C4.90719%2010.2643%204.90719%2010.8272%205.27842%2011.1743C5.64964%2011.5214%206.25151%2011.5214%206.62273%2011.1743L11.0494%207.03486L11.0494%2019.1111C11.0494%2019.602%2011.475%2020%2012%2020C12.525%2020%2012.9506%2019.602%2012.9506%2019.1111L12.9506%207.03486L17.3773%2011.1743Z'%20fill='black'/%3e%3c/svg%3e";
const iconDots = "data:image/svg+xml,%3csvg%20width='32'%20height='32'%20viewBox='0%200%2032%2032'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3ccircle%20cx='7.5'%20cy='15.5'%20r='3'%20fill='white'%20stroke='black'/%3e%3ccircle%20cx='16'%20cy='15.5'%20r='3'%20fill='white'%20stroke='black'/%3e%3ccircle%20cx='24.5'%20cy='15.5'%20r='3'%20fill='white'%20stroke='black'/%3e%3c/svg%3e";
const iconClose = "data:image/svg+xml,%3csvg%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M18.6897%206.80873C19.1034%206.39496%2019.1034%205.7241%2018.6897%205.31033C18.2759%204.89656%2017.605%204.89656%2017.1913%205.31033L12%2010.5016L6.80873%205.31033C6.39496%204.89656%205.7241%204.89656%205.31033%205.31033C4.89656%205.7241%204.89656%206.39496%205.31033%206.80873L10.5016%2012L5.31033%2017.1913C4.89656%2017.605%204.89656%2018.2759%205.31033%2018.6897C5.7241%2019.1034%206.39496%2019.1034%206.80873%2018.6897L12%2013.4984L17.1913%2018.6897C17.605%2019.1034%2018.2759%2019.1034%2018.6897%2018.6897C19.1034%2018.2759%2019.1034%2017.605%2018.6897%2017.1913L13.4984%2012L18.6897%206.80873Z'%20fill='black'/%3e%3c/svg%3e";
const iconLike = "data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M19.1667%205.31804C19.1667%205.31804%2019.1667%205.31479%2019.1667%205.31284C19.1647%204.60204%2019.0286%203.91203%2018.7622%203.25905C18.4952%202.60347%2018.1105%202.01871%2017.6186%201.52102C17.1241%201.02008%2016.5467%200.633487%2015.9022%200.370996C15.2978%200.124748%2014.6619%200%2014.0122%200C13.9707%200%2013.9293%200%2013.8872%200.00129946C13.0665%200.00779676%2012.2714%200.189072%2011.5243%200.540576C10.7792%200.89143%2010.1262%201.38977%209.58366%202.02326C9.04046%201.38977%208.38809%200.89078%207.64299%200.540576C6.89526%200.189072%206.10019%200.00779676%205.27946%200.00129946C5.23803%200%205.19594%200%205.15451%200C4.50477%200%203.86884%200.124748%203.26448%200.370996C2.62%200.633487%202.0426%201.02008%201.54806%201.52102C1.05616%202.01871%200.671442%202.60347%200.404443%203.25905C0.138103%203.91138%200.00197289%204.60204%200%205.31025C0%205.31285%200%205.31544%200%205.31804V7.50828C0%207.50828%200%207.50828%200%207.50893C0%207.50893%200%207.51023%200%207.51088V7.54727C0.0105221%209.23917%200.700377%2010.844%202.23397%2012.7458L2.24384%2012.7581L2.25436%2012.7704C4.09244%2014.8665%206.08704%2016.8495%208.18291%2018.6635L9.03125%2019.4815L9.56854%2020L10.119%2019.4952L10.9746%2018.7109C13.0698%2016.8917%2015.067%2014.9074%2016.9097%2012.8127L16.9241%2012.7964L16.938%2012.7789C18.4676%2010.8284%2019.1561%209.21318%2019.1653%207.54727V5.31804H19.1667Z'%20fill='black'/%3e%3cpath%20d='M13.9003%200.780983C13.198%200.785531%2012.5035%200.943415%2011.863%201.24424C11.2225%201.54572%2010.6503%201.98363%2010.1828%202.53006L9.583%203.24671L8.98324%202.53006C8.51566%201.98363%207.94287%201.54572%207.30233%201.24424C6.6618%200.942766%205.968%200.784881%205.26565%200.780983C4.6843%200.765389%204.10625%200.871295%203.56436%201.09155C3.02313%201.31181%202.52925%201.64317%202.11231%202.0655C1.69537%202.48782%201.36327%202.99201%201.13638%203.55013C0.908843%204.1076%200.791127%204.7073%200.789154%205.31285C0.789154%206.82867%201.42048%208.28667%202.85149%2010.0611C4.67641%2012.1428%206.63747%2014.0914%208.71953%2015.8924L9.583%2016.7254L10.4465%2015.934C12.5259%2014.1297%2014.4863%2012.1812%2016.3145%2010.1027C17.7455%208.27822%2018.3775%206.82023%2018.3775%205.31285C18.3755%204.7073%2018.2572%204.1076%2018.0303%203.55013C17.8034%202.99266%2017.4713%202.48782%2017.0537%202.0655C16.6368%201.64317%2016.1429%201.31246%2015.6016%201.09155C15.0604%200.871295%2014.4817%200.765389%2013.9003%200.780983Z'%20fill='white'/%3e%3c/svg%3e";
const iconLikeActive = "data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M19.1667%205.31804C19.1667%205.31804%2019.1667%205.31479%2019.1667%205.31284C19.1647%204.60204%2019.0286%203.91203%2018.7622%203.25905C18.4952%202.60347%2018.1105%202.01871%2017.6186%201.52102C17.1241%201.02008%2016.5467%200.633487%2015.9022%200.370996C15.2978%200.124748%2014.6619%200%2014.0122%200C13.9707%200%2013.9293%200%2013.8872%200.00129946C13.0665%200.00779676%2012.2714%200.189072%2011.5243%200.540576C10.7792%200.89143%2010.1262%201.38977%209.58366%202.02326C9.04046%201.38977%208.38809%200.89078%207.64299%200.540576C6.89526%200.189072%206.10019%200.00779676%205.27946%200.00129946C5.23803%200%205.19594%200%205.15451%200C4.50477%200%203.86884%200.124748%203.26448%200.370996C2.62%200.633487%202.0426%201.02008%201.54806%201.52102C1.05616%202.01871%200.671442%202.60347%200.404443%203.25905C0.138103%203.91138%200.00197289%204.60204%200%205.31025C0%205.31285%200%205.31544%200%205.31804V7.50828C0%207.50828%200%207.50828%200%207.50893C0%207.50893%200%207.51023%200%207.51088V7.54727C0.0105221%209.23917%200.700377%2010.844%202.23397%2012.7458L2.24384%2012.7581L2.25436%2012.7704C4.09244%2014.8665%206.08704%2016.8495%208.18291%2018.6635L9.03125%2019.4815L9.56854%2020L10.119%2019.4952L10.9746%2018.7109C13.0698%2016.8917%2015.067%2014.9074%2016.9097%2012.8127L16.9241%2012.7964L16.938%2012.7789C18.4676%2010.8284%2019.1561%209.21318%2019.1653%207.54727V5.31804H19.1667Z'%20fill='black'/%3e%3cpath%20d='M13.9003%200.780983C13.198%200.785531%2012.5035%200.943415%2011.863%201.24424C11.2225%201.54572%2010.6503%201.98363%2010.1828%202.53006L9.583%203.24671L8.98324%202.53006C8.51566%201.98363%207.94287%201.54572%207.30233%201.24424C6.6618%200.942766%205.968%200.784881%205.26565%200.780983C4.6843%200.765389%204.10625%200.871295%203.56436%201.09155C3.02313%201.31181%202.52925%201.64317%202.11231%202.0655C1.69537%202.48782%201.36327%202.99201%201.13638%203.55013C0.908843%204.1076%200.791127%204.7073%200.789154%205.31285C0.789154%206.82867%201.42048%208.28667%202.85149%2010.0611C4.67641%2012.1428%206.63747%2014.0914%208.71953%2015.8924L9.583%2016.7254L10.4465%2015.934C12.5259%2014.1297%2014.4863%2012.1812%2016.3145%2010.1027C17.7455%208.27822%2018.3775%206.82023%2018.3775%205.31285C18.3755%204.7073%2018.2572%204.1076%2018.0303%203.55013C17.8034%202.99266%2017.4713%202.48782%2017.0537%202.0655C16.6368%201.64317%2016.1429%201.31246%2015.6016%201.09155C15.0604%200.871295%2014.4817%200.765389%2013.9003%200.780983Z'%20fill='url(%23paint0_linear_2439_35)'/%3e%3cdefs%3e%3clinearGradient%20id='paint0_linear_2439_35'%20x1='20.0615'%20y1='12.1852'%20x2='-3.82082'%20y2='-4.58681'%20gradientUnits='userSpaceOnUse'%3e%3cstop%20offset='0.36291'%20stop-color='%23FF597A'/%3e%3cstop%20offset='0.572672'%20stop-color='%23FF29C4'/%3e%3c/linearGradient%3e%3c/defs%3e%3c/svg%3e";
const iconLightbulb = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M7.9999%200C4.9119%200%202.3999%202.512%202.3999%205.6C2.3999%207.504%203.3519%209.176%204.7999%2010.192V12C4.7999%2012.44%205.1599%2012.8%205.5999%2012.8H10.3999C10.8399%2012.8%2011.1999%2012.44%2011.1999%2012V10.192C12.6479%209.176%2013.5999%207.504%2013.5999%205.6C13.5999%202.512%2011.0879%200%207.9999%200ZM5.5999%2015.2C5.5999%2015.64%205.9599%2016%206.3999%2016H9.5999C10.0399%2016%2010.3999%2015.64%2010.3999%2015.2V14.4H5.5999V15.2ZM9.5999%209.36L10.2799%208.88C11.3599%208.128%2011.9999%206.904%2011.9999%205.6C11.9999%203.392%2010.2079%201.6%207.9999%201.6C5.7919%201.6%203.9999%203.392%203.9999%205.6C3.9999%206.904%204.6399%208.128%205.7199%208.88L6.3999%209.36V11.2H9.5999V9.36Z'%20fill='black'%20fill-opacity='0.65'/%3e%3c/svg%3e";
const iconEdit = "data:image/svg+xml,%3csvg%20width='12'%20height='12'%20viewBox='0%200%2012%2012'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M0%209.50035V12H2.49965L9.87196%204.62769L7.37231%202.12804L0%209.50035ZM11.8049%202.69463C12.0649%202.43466%2012.0649%202.01472%2011.8049%201.75476L10.2452%200.194973C9.9852%20-0.064991%209.56526%20-0.064991%209.3053%200.194973L8.08547%201.4148L10.5851%203.91446L11.8049%202.69463Z'%20fill='black'/%3e%3c/svg%3e";
const iconClock = "data:image/svg+xml,%3csvg%20width='14'%20height='14'%20viewBox='0%200%2014%2014'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M7%2013.125C10.3827%2013.125%2013.125%2010.3827%2013.125%207C13.125%203.61726%2010.3827%200.875%207%200.875C3.61726%200.875%200.875%203.61726%200.875%207C0.875%2010.3827%203.61726%2013.125%207%2013.125Z'%20fill='white'%20stroke='black'%20stroke-miterlimit='10'/%3e%3cpath%20d='M7%202.40625V7.14242H11.1562'%20stroke='black'%20stroke-width='0.95'%20stroke-miterlimit='10'/%3e%3c/svg%3e";
const iconStarSolid = "data:image/svg+xml,%3csvg%20width='14'%20height='14'%20viewBox='0%200%2014%2014'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_1257_1205)'%3e%3cpath%20d='M6.99951%200.958332C7.20056%200.958332%207.38231%201.07878%207.46045%201.264L8.97607%204.86361L12.8745%205.1888C13.0751%205.20552%2013.2468%205.34116%2013.3091%205.53255C13.3714%205.72398%2013.312%205.93417%2013.1597%206.06575L10.1821%208.63607L11.1021%2012.4242C11.1495%2012.6203%2011.0744%2012.8254%2010.9116%2012.9447C10.7488%2013.0639%2010.5306%2013.0735%2010.3579%2012.9691L6.99951%2010.9378L3.64209%2012.9691C3.4693%2013.0736%203.25027%2013.064%203.0874%2012.9447C2.92484%2012.8254%202.8496%2012.6201%202.89697%2012.4242L3.81689%208.63607L0.839355%206.06575C0.687199%205.93416%200.62866%205.72387%200.690918%205.53255C0.753213%205.34134%200.924139%205.20567%201.12451%205.1888L5.02295%204.86361L6.53857%201.264L6.57275%201.19759C6.66252%201.05048%206.82367%200.958446%206.99951%200.958332Z'%20fill='black'%20stroke='black'%20stroke-linejoin='round'/%3e%3c/g%3e%3cdefs%3e%3cclipPath%20id='clip0_1257_1205'%3e%3crect%20width='14'%20height='14'%20fill='white'/%3e%3c/clipPath%3e%3c/defs%3e%3c/svg%3e";
const iconStarHalfSolid = "data:image/svg+xml,%3csvg%20width='14'%20height='14'%20viewBox='0%200%2014%2014'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20clip-path='url(%23clip0_1257_1207)'%3e%3cpath%20d='M7.00033%201.45833L8.63366%205.3375L12.8337%205.6875L9.62533%208.45833L10.617%2012.5417L7.00033%2010.3542L3.38366%2012.5417L4.37533%208.45833L1.16699%205.6875L5.36699%205.3375L7.00033%201.45833Z'%20fill='black'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M7.00019%200.875C7.23489%200.875%207.44673%201.01566%207.53781%201.23197L9.03404%204.78552L12.882%205.10618C13.116%205.12569%2013.3155%205.28365%2013.3882%205.50699C13.4609%205.73033%2013.3925%205.97547%2013.2148%206.12898L10.2761%208.66692L11.1837%2012.404C11.2393%2012.6329%2011.1517%2012.8729%2010.9617%2013.0121C10.7717%2013.1514%2010.5166%2013.1627%2010.315%2013.0408L7.00019%2011.0359L3.68542%2013.0408C3.48382%2013.1627%203.22868%2013.1514%203.03866%2013.0121C2.84864%2012.8729%202.76106%2012.6329%202.81666%2012.404L3.72424%208.66692L0.785576%206.12898C0.607825%205.97547%200.539475%205.73033%200.612152%205.50699C0.68483%205.28365%200.884358%205.12569%201.11841%205.10618L4.96633%204.78552L6.46257%201.23197C6.55364%201.01566%206.76549%200.875%207.00019%200.875ZM5.36685%205.3375L1.16685%205.6875L4.37519%208.45833L3.38352%2012.5417L7.00019%2010.3542L10.6169%2012.5417L9.62519%208.45833L12.8335%205.6875L8.63352%205.3375L7.00019%201.45833L5.36685%205.3375Z'%20fill='black'/%3e%3cpath%20d='M7.00033%201.45833L8.63366%205.3375L12.8337%205.6875L9.62533%208.45833L10.617%2012.5417L7.00033%2010.3542L3.38366%2012.5417L4.37533%208.45833L1.16699%205.6875L5.36699%205.3375L7.00033%201.45833Z'%20fill='white'/%3e%3cpath%20d='M7.00033%201.45833V10.3542L3.38366%2012.5417L4.37533%208.45833L1.16699%205.6875L5.36699%205.3375L7.00033%201.45833Z'%20fill='black'/%3e%3c/g%3e%3cdefs%3e%3cclipPath%20id='clip0_1257_1207'%3e%3crect%20width='14'%20height='14'%20fill='white'/%3e%3c/clipPath%3e%3c/defs%3e%3c/svg%3e";
const iconSwap = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M13.6449%202.35C12.1949%200.9%2010.2049%200%207.99488%200C3.57488%200%200.00488281%203.58%200.00488281%208C0.00488281%2012.42%203.57488%2016%207.99488%2016C11.7249%2016%2014.8349%2013.45%2015.7249%2010H13.6449C12.8249%2012.33%2010.6049%2014%207.99488%2014C4.68488%2014%201.99488%2011.31%201.99488%208C1.99488%204.69%204.68488%202%207.99488%202C9.65488%202%2011.1349%202.69%2012.2149%203.78L8.99488%207H15.9949V0L13.6449%202.35Z'%20fill='black'/%3e%3c/svg%3e";
const iconMove = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M3.54667%207.1111L0%2010.6667L3.54667%2014.2222V11.5555H9.77778V9.77777H3.54667V7.1111ZM16%205.33333L12.4533%201.77777V4.44444H6.22222V6.22222H12.4533V8.88888L16%205.33333Z'%20fill='black'/%3e%3c/svg%3e";
const iconChevronRight = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M6.67999%200L4.79999%201.88L10.9067%208L4.79999%2014.12L6.67999%2016L14.68%208L6.67999%200Z'%20fill='black'/%3e%3c/svg%3e";
const loadingSteps = {
  searching: [
    "Browsing our recipe collection...",
    "Hunting down delicious ideas...",
    "Exploring thousands of recipes...",
    "Searching for the perfect dishes...",
    "Digging through our cookbook...",
    "Scouring the kitchen for inspiration...",
    "Flipping through recipe pages...",
    "Discovering culinary gems...",
    "Peeking into our recipe vault...",
    "Gathering tasty possibilities..."
  ],
  validating: [
    "Checking dietary requirements...",
    "Making sure everything fits your needs...",
    "Filtering out what doesn't match...",
    "Double-checking ingredients for you...",
    "Ensuring every dish works for you...",
    "Scanning for allergens and restrictions...",
    "Verifying nutritional balance...",
    "Matching recipes to your preferences...",
    "Reviewing ingredients carefully...",
    "Confirming everything meets your criteria..."
  ],
  building: [
    "Putting together your meal plan...",
    "Balancing flavors and nutrition...",
    "Crafting the perfect day of meals...",
    "Almost ready to serve...",
    "Adding the finishing touches...",
    "Arranging your daily menu...",
    "Mixing variety into your plan...",
    "Plating your personalized meals...",
    "Seasoning your schedule with great picks...",
    "Wrapping up your delicious day..."
  ]
};
function renderFullLoading() {
  return `
    <div class="miso-plan-detail">
      <div class="miso-plan-detail__loading-full">
        <img src="${iconLoading}" alt="Loading" class="miso-plan-detail__loading-icon" />
      </div>
    </div>
  `;
}
function renderPlanNotFound() {
  return `
    <div class="miso-plan-detail">
      <div class="miso-plan-detail__not-found">
        <div class="miso-plan-detail__not-found-content">
          <h2 class="miso-plan-detail__not-found-title">Plan Not Found</h2>
          <p class="miso-plan-detail__not-found-message">The meal plan you're looking for doesn't exist or has been removed.</p>
          <button class="miso-plan-detail__not-found-btn" data-action="back-to-home">
            <img src="${iconArrowLeft}" alt="Back" class="miso-plan-detail__not-found-icon" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  `;
}
function renderPlanEditor(ctx) {
  return `
    <div class="miso-plan-detail">
      ${renderTopSection(ctx)}
      ${renderBottomSection(ctx)}
      ${renderPromptSection(ctx)}
      <button class="miso-plan-detail__scroll-top-fixed-btn">
        <img src="${iconArrowUp}" alt="Scroll to top" class="miso-plan-detail__scroll-top-icon" />
      </button>
      <button class="miso-plan-detail__scroll-bottom-btn">
        <img src="${iconArrowUp}" alt="Scroll to bottom" class="miso-plan-detail__scroll-bottom-icon" />
      </button>
    </div>
  `;
}
function renderTopSection(ctx) {
  var _a, _b;
  const { state } = ctx;
  const title = ((_a = state.plan) == null ? void 0 : _a.title) || "Untitled Plan";
  const hasRecipes = ((_b = state.plan) == null ? void 0 : _b.recipes) && state.plan.recipes.length > 0;
  const isCreatingPlan = !state.plan;
  return `
    <div class="miso-plan-detail__top">
      <div class="miso-plan-detail__title-area ${!hasRecipes ? "miso-plan-detail__title-area--no-recipes" : ""}">
        <div class="miso-plan-detail__title-left">
          <img src="${iconArrowLeft}" alt="Back" class="miso-plan-detail__back-btn" />
          <h1 class="miso-plan-detail__title">${escapeHtml(title)}</h1>
        </div>
        ${!isCreatingPlan ? `<img src="${iconDots}" alt="More" class="miso-plan-detail__dots-icon" />` : ""}
      </div>
      ${hasRecipes ? renderRecipeArea(ctx) : ""}
      <button class="miso-plan-detail__scroll-top-btn">
        <img src="${iconArrowUp}" alt="Scroll to top" class="miso-plan-detail__scroll-top-icon" />
      </button>
    </div>
  `;
}
function renderRecipeArea(ctx) {
  var _a;
  const { state } = ctx;
  if (!((_a = state.plan) == null ? void 0 : _a.recipes)) return "";
  return `
    <div class="miso-plan-detail__recipe-area-wrapper">
      <button class="miso-plan-detail__scroll-btn miso-plan-detail__scroll-btn--left" aria-label="Scroll left">
        <img src="${iconChevronRight}" alt="" class="miso-plan-detail__scroll-btn-icon" />
      </button>
      <div class="miso-plan-detail__recipe-area">
        ${state.plan.recipes.map((recipe, index2) => renderRecipeSlot(recipe, index2, ctx)).join("")}
      </div>
      <button class="miso-plan-detail__scroll-btn miso-plan-detail__scroll-btn--right" aria-label="Scroll right">
        <img src="${iconChevronRight}" alt="" class="miso-plan-detail__scroll-btn-icon" />
      </button>
    </div>
  `;
}
function renderRecipeSlot(recipe, index2, ctx) {
  return `
    <div class="miso-plan-detail__recipe-slot">
      <button class="miso-plan-detail__slot-label" data-recipe-index="${index2}" aria-label="Edit ${escapeHtml(recipe.slot_label)}">
        <span>${escapeHtml(recipe.slot_label)}</span>
        <img src="${iconEdit}" alt="" class="miso-plan-detail__edit-icon" />
      </button>
      ${renderRecipeCard(recipe, ctx)}
      <div class="miso-plan-detail__slot-actions">
        <button class="miso-plan-detail__action-btn miso-plan-detail__swap-btn" data-recipe-index="${index2}" aria-label="Swap ${escapeHtml(recipe.slot_label)}">
          <span>Swap</span>
          <img src="${iconSwap}" alt="" class="miso-plan-detail__swap-icon" />
        </button>
        <button class="miso-plan-detail__action-btn miso-plan-detail__move-btn" data-recipe-index="${index2}" aria-label="Move ${escapeHtml(recipe.slot_label)}">
          <span>Move</span>
          <img src="${iconMove}" alt="" class="miso-plan-detail__move-icon" />
        </button>
      </div>
    </div>
  `;
}
function renderRecipeCard(recipe, ctx) {
  const { state } = ctx;
  const isSaved = state.favoriteRecipes.includes(recipe.id);
  const hasImage = recipe.cover_image && recipe.cover_image !== null;
  return `
    <div class="miso-plan-detail__recipe-card">
      <button class="miso-plan-detail__save-btn${isSaved ? " miso-plan-detail__save-btn--active" : ""}" data-recipe-id="${recipe.id}">
        <img src="${iconLike}" alt="Save" class="miso-plan-detail__save-icon miso-plan-detail__save-icon--default" />
        <img src="${iconLikeActive}" alt="Save" class="miso-plan-detail__save-icon miso-plan-detail__save-icon--active" />
      </button>
      <a href="${escapeHtml(recipe.url)}" target="_blank" rel="noopener" class="miso-plan-detail__recipe-card-link">
        <div class="miso-plan-detail__recipe-image" style="${hasImage ? `background-image: url('${recipe.cover_image}')` : "background-color: rgba(0,0,0,0.15)"}">${hasImage ? `<img src="${recipe.cover_image}" alt="" style="display:none;" onerror="this.parentElement.style.backgroundImage='none'; this.parentElement.style.backgroundColor='rgba(0,0,0,0.15)';" />` : ""}</div>
        <div class="miso-plan-detail__recipe-title">
          <span class="miso-plan-detail__recipe-title-text">${escapeHtml(recipe.title)}</span>
        </div>
      </a>
    </div>
  `;
}
function renderBottomSection(ctx) {
  const messageContent = renderMessageHistory(ctx);
  return `
    <div class="miso-plan-detail__bottom">
      <div class="miso-plan-detail__message-area">
        ${messageContent}
      </div>
    </div>
  `;
}
function renderMessageHistory(ctx) {
  var _a;
  const { state } = ctx;
  const messages = ((_a = state.plan) == null ? void 0 : _a.messages) || [];
  if (state.initialMessage && messages.length === 0) {
    const userMessageHtml = `
      <div class="miso-plan-detail__user-message">
        ${escapeHtml(state.initialMessage)}
      </div>
    `;
    const thinkingHtml = state.isThinking ? `
      <div class="miso-plan-detail__thinking-indicator">
        <img src="${iconLightbulb}" alt="Thinking" class="miso-plan-detail__thinking-icon" />
        <span>Thinking...</span>
      </div>
    ` : "";
    return userMessageHtml + thinkingHtml;
  }
  let html2 = "";
  for (const message of messages) {
    if (message.role === "user") {
      html2 += `
        <div class="miso-plan-detail__user-message">
          ${escapeHtml(message.content)}
        </div>
      `;
    } else {
      const markdownHtml = parseMarkdownSync(message.content);
      html2 += `
        <div class="miso-plan-detail__assistant-message">
          ${markdownHtml}
        </div>
      `;
    }
  }
  if (state.isThinking) {
    html2 += `
      <div class="miso-plan-detail__thinking-indicator">
        <img src="${iconLightbulb}" alt="Thinking" class="miso-plan-detail__thinking-icon" />
        <span>Thinking...</span>
      </div>
    `;
  }
  return html2;
}
function renderPromptSection(ctx) {
  return `
    <div class="miso-plan-detail__prompt-section">
      ${renderSuggestions(ctx)}
      ${renderInputArea(ctx)}
    </div>
  `;
}
function renderSuggestions(ctx) {
  const { state } = ctx;
  if (state.suggestions.length === 0) return "";
  return `
    <div class="miso-plan-detail__suggestions">
      ${state.suggestions.map((suggestion) => `
        <button class="miso-plan-detail__suggestion-btn" data-suggestion="${escapeHtml(suggestion)}">
          <span class="miso-plan-detail__suggestion-btn-text">${escapeHtml(suggestion)}</span>
        </button>
      `).join("")}
    </div>
  `;
}
function renderInputArea(ctx) {
  const { state } = ctx;
  const isNewPlan = !state.planId;
  const placeholder = isNewPlan ? "What shall we plan?" : "Any updates or tweaks?";
  return `
    <form class="miso-plan-detail__input-form">
      <div class="miso-plan-detail__input-wrapper">
        <input 
          type="text" 
          class="miso-plan-detail__input" 
          placeholder="${placeholder}"
          value=""
          ${state.isLoading ? "disabled" : ""}
        />
        <img src="${iconClose}" alt="Clear" class="miso-plan-detail__clear-btn" style="display: none;" />
      </div>
      ${state.errorMessage ? `<div class="miso-plan-detail__error">${escapeHtml(state.errorMessage)}</div>` : ""}
    </form>
  `;
}
function renderPlanView(ctx) {
  var _a, _b;
  const { state } = ctx;
  const title = ((_a = state.plan) == null ? void 0 : _a.title) || "Untitled Plan";
  const recipes = ((_b = state.plan) == null ? void 0 : _b.recipes) || [];
  return `
    <div class="miso-plan-detail miso-plan-detail--view-mode">
      <div class="miso-plan-detail__view-container">
        <div class="miso-plan-detail__view-header">
          <div class="miso-plan-detail__title-area">
            <div class="miso-plan-detail__title-left">
              <img src="${iconArrowLeft}" alt="Back" class="miso-plan-detail__back-btn" />
              <h1 class="miso-plan-detail__title">${escapeHtml(title)}</h1>
            </div>
            <img src="${iconDots}" alt="More" class="miso-plan-detail__dots-icon" />
          </div>
        </div>
        <div class="miso-plan-detail__view-content">
          <div class="miso-plan-detail__view-actions">
            <button class="miso-plan-detail__edit-plan-btn">
              <span>Edit Plan</span>
              <img src="${iconEdit}" alt="Edit" class="miso-plan-detail__edit-icon" />
            </button>
          </div>
          ${recipes.length > 0 ? renderRecipeList(recipes) : renderEmptyRecipeList()}
        </div>
      </div>
    </div>
  `;
}
function renderRecipeList(recipes) {
  return `
    <div class="miso-plan-detail__recipe-list">
      ${recipes.map((recipe) => renderRecipeListItem(recipe)).join("")}
    </div>
  `;
}
function renderRecipeListItem(recipe) {
  const hasImage = recipe.cover_image && recipe.cover_image !== null;
  const imageHtml = hasImage ? `<img src="${escapeHtml(recipe.cover_image)}" alt="" class="miso-plan-detail__recipe-list-image" onerror="this.style.display='none'; this.parentElement.style.backgroundColor='rgba(0,0,0,0.15)';" />` : `<div class="miso-plan-detail__recipe-list-image-placeholder"></div>`;
  return `
    <div class="miso-plan-detail__recipe-list-item">
      <div class="miso-plan-detail__recipe-list-label">${escapeHtml(recipe.slot_label)}</div>
      <a href="${escapeHtml(recipe.url)}" target="_blank" rel="noopener" class="miso-plan-detail__recipe-list-card">
        <div class="miso-plan-detail__recipe-list-image-container">
          ${imageHtml}
        </div>
        <div class="miso-plan-detail__recipe-list-info">
          <h3 class="miso-plan-detail__recipe-list-title">${escapeHtml(recipe.title)}</h3>
          ${recipe.rating ? renderRecipeRating(recipe.rating) : ""}
          ${recipe.cook_time ? renderRecipeCookTime(recipe.cook_time) : ""}
          ${recipe.author ? `<div class="miso-plan-detail__recipe-list-author">
            From <span class="miso-plan-detail__recipe-list-author-name">${escapeHtml(recipe.author)}</span>
          </div>` : ""}
        </div>
      </a>
    </div>
  `;
}
function renderRecipeRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let starsHtml = "";
  for (let i = 0; i < fullStars; i++) {
    starsHtml += `<img src="${iconStarSolid}" alt="Star" class="miso-plan-detail__recipe-list-star" />`;
  }
  if (hasHalfStar) {
    starsHtml += `<img src="${iconStarHalfSolid}" alt="Half star" class="miso-plan-detail__recipe-list-star" />`;
  }
  return `
    <div class="miso-plan-detail__recipe-list-rating">
      ${starsHtml}
    </div>
  `;
}
function renderRecipeCookTime(cookTimeMinutes) {
  const hours = Math.floor(cookTimeMinutes / 60);
  const minutes = cookTimeMinutes % 60;
  let timeText = "";
  if (hours > 0) {
    timeText += `${hours} hr `;
  }
  if (minutes > 0) {
    timeText += `${minutes} min`;
  }
  return `
    <div class="miso-plan-detail__recipe-list-time">
      <img src="${iconClock}" alt="Time" class="miso-plan-detail__recipe-list-time-icon" />
      <span>${timeText.trim()}</span>
    </div>
  `;
}
function renderEmptyRecipeList() {
  return `
    <div class="miso-plan-detail__recipe-list-empty">
      <p>No recipes in this meal plan.</p>
    </div>
  `;
}
const modalState = {
  active: null
};
class ModalWidget {
  constructor(container, options) {
    this.modalElement = null;
    this.previousActiveElement = null;
    this.container = container;
    this.options = options;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }
  render() {
    var _a;
    const template = `
      <div class="miso-modal" role="dialog" aria-modal="true">
        <div class="miso-modal__overlay"></div>
        <div class="miso-modal__dialog">
          <button class="miso-modal__close-btn" aria-label="Close modal">
            <img src="${iconClose}" alt="Close" />
          </button>
          <div class="miso-modal__content"></div>
        </div>
      </div>
    `;
    this.container.innerHTML = template;
    this.modalElement = this.container.querySelector(".miso-modal");
    const contentContainer = (_a = this.modalElement) == null ? void 0 : _a.querySelector(".miso-modal__content");
    if (contentContainer && this.options.content) {
      const contentElement = this.options.content();
      contentContainer.appendChild(contentElement);
    }
    this.attachEventListeners();
  }
  attachEventListeners() {
    if (!this.modalElement) return;
    const closeBtn = this.modalElement.querySelector(".miso-modal__close-btn");
    closeBtn == null ? void 0 : closeBtn.addEventListener("click", () => this.closeModal("button"));
    const overlay = this.modalElement.querySelector(".miso-modal__overlay");
    overlay == null ? void 0 : overlay.addEventListener("click", () => this.closeModal("overlay"));
    const dialog = this.modalElement.querySelector(".miso-modal__dialog");
    dialog == null ? void 0 : dialog.addEventListener("click", (e) => e.stopPropagation());
  }
  handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      this.closeModal("escape");
    }
    if (e.key === "Tab" && this.modalElement) {
      const focusableElements = this.modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement == null ? void 0 : lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement == null ? void 0 : firstElement.focus();
      }
    }
  }
  openModal() {
    if (modalState.active && modalState.active !== this) {
      modalState.active.closeModal("button");
    }
    if (!this.modalElement) return;
    this.previousActiveElement = document.activeElement;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", this.boundHandleKeyDown);
    void this.modalElement.offsetHeight;
    this.modalElement.classList.add("miso-modal--open");
    modalState.active = this;
    const firstFocusable = this.modalElement.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable == null ? void 0 : firstFocusable.focus();
  }
  closeModal(reason = "button") {
    if (!this.modalElement) return;
    document.removeEventListener("keydown", this.boundHandleKeyDown);
    this.modalElement.classList.remove("miso-modal--open");
    setTimeout(() => {
      var _a, _b, _c;
      document.body.style.overflow = "";
      if (modalState.active === this) {
        modalState.active = null;
      }
      (_a = this.previousActiveElement) == null ? void 0 : _a.focus();
      (_c = (_b = this.options).onClose) == null ? void 0 : _c.call(_b, reason);
    }, 300);
  }
  destroy() {
    if (modalState.active === this) {
      document.removeEventListener("keydown", this.boundHandleKeyDown);
      document.body.style.overflow = "";
      modalState.active = null;
    }
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    this.container.innerHTML = "";
  }
}
const iconEditBlack = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M0%2012.6671V16H3.33287L13.1626%206.17026L9.82975%202.83739L0%2012.6671V12.6671ZM15.7399%203.59283C16.0866%203.24622%2016.0866%202.68629%2015.7399%202.33967L13.6602%200.259964C13.3136%20-0.0866546%2012.7537%20-0.0866546%2012.4071%200.259964L10.7806%201.8864L14.1135%205.21928L15.7399%203.59283V3.59283Z'%20fill='black'%20fill-opacity='0.65'/%3e%3c/svg%3e";
const iconEditWhite = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M0%2012.6671V16H3.33287L13.1626%206.17026L9.82975%202.83739L0%2012.6671V12.6671ZM15.7399%203.59283C16.0866%203.24622%2016.0866%202.68629%2015.7399%202.33967L13.6602%200.259964C13.3136%20-0.0866546%2012.7537%20-0.0866546%2012.4071%200.259964L10.7806%201.8864L14.1135%205.21928L15.7399%203.59283V3.59283Z'%20fill='white'/%3e%3c/svg%3e";
const iconCheck = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M5.33333%2014.5333L0%209.2L1.86667%207.33333L5.33333%2010.8L14.1333%202L16%203.86667L5.33333%2014.5333Z'%20fill='black'%20fill-opacity='0.95'/%3e%3c/svg%3e";
const iconAdd = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M16%209.14286H9.14286V16H6.85714V9.14286H0V6.85714H6.85714V0H9.14286V6.85714H16V9.14286V9.14286Z'%20fill='black'%20fill-opacity='0.65'/%3e%3c/svg%3e";
class MoveModal {
  constructor(options) {
    this.modal = null;
    this.currentRecipe = null;
    this.currentRecipeIndex = -1;
    this.editingSlotLabel = null;
    this.addingNewSlot = false;
    this.container = document.createElement("div");
    document.body.appendChild(this.container);
    this.options = options;
  }
  /**
   * Opens the move modal for a specific recipe
   */
  open(recipe, recipeIndex, slotLabels, editSlotLabel) {
    var _a;
    (_a = this.modal) == null ? void 0 : _a.destroy();
    this.currentRecipe = recipe;
    this.currentRecipeIndex = recipeIndex;
    this.editingSlotLabel = editSlotLabel || null;
    this.addingNewSlot = false;
    this.modal = new ModalWidget(this.container, {
      content: () => this.createContent(recipe, recipeIndex, slotLabels),
      onClose: () => {
        this.editingSlotLabel = null;
        this.addingNewSlot = false;
        this.modal = null;
      }
    });
    this.modal.render();
    this.modal.openModal();
  }
  /**
   * Closes the modal
   */
  close() {
    var _a;
    (_a = this.modal) == null ? void 0 : _a.closeModal("button");
  }
  /**
   * Resets all slots that are currently in edit mode
   */
  resetAllEditingSlots() {
    const editingSlots = document.querySelectorAll(".miso-move-modal__slot-item--editing");
    editingSlots.forEach((slot) => {
      const originalLabel = slot.dataset.originalLabel;
      if (originalLabel) {
        this.exitEditMode(slot, originalLabel);
      }
    });
  }
  /**
   * Destroys the modal and removes its container from the DOM
   */
  destroy() {
    var _a;
    (_a = this.modal) == null ? void 0 : _a.destroy();
    this.container.remove();
  }
  /**
   * Creates the modal content with slot selection buttons
   * Uses 2-column layout for m+ (>= 768px)
   */
  createContent(recipe, recipeIndex, slotLabels) {
    const container = document.createElement("div");
    container.className = "miso-move-modal";
    const isMPlus = window.matchMedia("(min-width: 768px)").matches;
    if (isMPlus) {
      const leftColumn = document.createElement("div");
      leftColumn.className = "miso-move-modal__left-column";
      const modalName = document.createElement("div");
      modalName.className = "miso-move-modal__name";
      modalName.textContent = "QUICK MOVE";
      leftColumn.appendChild(modalName);
      const title = document.createElement("h2");
      title.className = "miso-move-modal__title";
      title.textContent = recipe.title;
      leftColumn.appendChild(title);
      const previewCard = document.createElement("div");
      previewCard.className = "miso-modal__recipe-preview";
      const previewImage = document.createElement("img");
      previewImage.className = "miso-modal__recipe-preview-image";
      previewImage.src = recipe.cover_image || "";
      previewImage.alt = recipe.title;
      previewImage.onerror = () => {
        previewImage.style.backgroundColor = "rgba(0, 0, 0, 0.15)";
        previewImage.style.display = "block";
      };
      previewCard.appendChild(previewImage);
      const previewTitle = document.createElement("div");
      previewTitle.className = "miso-modal__recipe-preview-title";
      previewTitle.textContent = recipe.title;
      previewCard.appendChild(previewTitle);
      leftColumn.appendChild(previewCard);
      container.appendChild(leftColumn);
      const rightColumn = document.createElement("div");
      rightColumn.className = "miso-move-modal__right-column";
      const slotsContainer = document.createElement("div");
      slotsContainer.className = "miso-move-modal__slots";
      slotLabels.forEach((slotLabel) => {
        const slotItem = this.createSlotItem(slotLabel, recipe, recipeIndex, slotLabels);
        slotsContainer.appendChild(slotItem);
      });
      const addNewItem = this.createAddNewItem(recipe, recipeIndex, slotLabels);
      slotsContainer.appendChild(addNewItem);
      rightColumn.appendChild(slotsContainer);
      container.appendChild(rightColumn);
    } else {
      const modalName = document.createElement("div");
      modalName.className = "miso-move-modal__name";
      modalName.textContent = "QUICK MOVE";
      container.appendChild(modalName);
      const title = document.createElement("h2");
      title.className = "miso-move-modal__title";
      title.textContent = recipe.title;
      container.appendChild(title);
      const slotsContainer = document.createElement("div");
      slotsContainer.className = "miso-move-modal__slots";
      slotLabels.forEach((slotLabel) => {
        const slotItem = this.createSlotItem(slotLabel, recipe, recipeIndex, slotLabels);
        slotsContainer.appendChild(slotItem);
      });
      const addNewItem = this.createAddNewItem(recipe, recipeIndex, slotLabels);
      slotsContainer.appendChild(addNewItem);
      container.appendChild(slotsContainer);
    }
    return container;
  }
  createSlotItem(slotLabel, recipe, recipeIndex, allSlotLabels) {
    const slotItem = document.createElement("div");
    slotItem.className = "miso-move-modal__slot-item";
    const isActive = slotLabel === recipe.slot_label;
    if (isActive) {
      slotItem.classList.add("miso-move-modal__slot-item--active");
    }
    const labelText = document.createElement("span");
    labelText.className = "miso-move-modal__slot-label";
    labelText.textContent = slotLabel;
    slotItem.appendChild(labelText);
    const editBtn = document.createElement("button");
    editBtn.className = "miso-move-modal__edit-btn";
    editBtn.innerHTML = `<img src="${isActive ? iconEditWhite : iconEditBlack}" alt="Edit" />`;
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.enterEditMode(slotItem, slotLabel, allSlotLabels);
    });
    slotItem.appendChild(editBtn);
    slotItem.addEventListener("click", async () => {
      if (slotItem.classList.contains("miso-move-modal__slot-item--editing")) {
        return;
      }
      if (slotLabel === recipe.slot_label) {
        this.close();
        return;
      }
      try {
        await this.options.onMoveRecipe(recipeIndex, slotLabel);
        this.close();
      } catch (error) {
        console.error("Failed to move recipe:", error);
      }
    });
    if (this.editingSlotLabel === slotLabel) {
      setTimeout(() => this.enterEditMode(slotItem, slotLabel, allSlotLabels), 0);
    }
    return slotItem;
  }
  createAddNewItem(recipe, recipeIndex, allSlotLabels) {
    const addNewItem = document.createElement("div");
    addNewItem.className = "miso-move-modal__add-new";
    const addBtn = document.createElement("button");
    addBtn.className = "miso-move-modal__add-new-btn";
    addBtn.innerHTML = `<img src="${iconAdd}" alt="Add" /> <span>Add New</span>`;
    addBtn.addEventListener("click", () => {
      this.enterAddNewMode(addNewItem, allSlotLabels);
    });
    addNewItem.appendChild(addBtn);
    return addNewItem;
  }
  enterEditMode(slotItem, originalLabel, allSlotLabels) {
    this.resetAllEditingSlots();
    slotItem.classList.add("miso-move-modal__slot-item--editing");
    slotItem.dataset.originalLabel = originalLabel;
    const labelSpan = slotItem.querySelector(".miso-move-modal__slot-label");
    const editBtn = slotItem.querySelector(".miso-move-modal__edit-btn");
    if (!labelSpan || !editBtn) return;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "miso-move-modal__slot-input";
    input.value = originalLabel;
    labelSpan.replaceWith(input);
    input.focus();
    input.select();
    const saveBtn = document.createElement("button");
    saveBtn.className = "miso-move-modal__save-btn";
    saveBtn.innerHTML = `<img src="${iconCheck}" alt="Save" />`;
    const errorMsg = document.createElement("div");
    errorMsg.className = "miso-move-modal__error";
    slotItem.appendChild(errorMsg);
    const validateAndUpdateSaveBtn = () => {
      const newValue = input.value.trim();
      const isEmpty = newValue === "";
      const isUnchanged = newValue === originalLabel;
      const isDuplicate = newValue !== originalLabel && allSlotLabels.includes(newValue);
      const isInvalid = isEmpty || isUnchanged || isDuplicate;
      saveBtn.disabled = isInvalid;
      saveBtn.classList.toggle("miso-move-modal__save-btn--disabled", isInvalid);
      if (isDuplicate) {
        errorMsg.textContent = "Slot name already exists.";
        errorMsg.style.display = "block";
      } else {
        errorMsg.textContent = "";
        errorMsg.style.display = "none";
      }
    };
    input.addEventListener("input", validateAndUpdateSaveBtn);
    validateAndUpdateSaveBtn();
    saveBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (saveBtn.disabled) return;
      const newLabel = input.value.trim();
      saveBtn.disabled = true;
      saveBtn.classList.add("miso-move-modal__save-btn--disabled");
      try {
        await this.options.onRenameSlot(originalLabel, newLabel);
        this.close();
      } catch (error) {
        console.error("Failed to rename slot:", error);
        saveBtn.disabled = false;
        saveBtn.classList.remove("miso-move-modal__save-btn--disabled");
      }
    });
    const cancelEdit = () => {
      this.exitEditMode(slotItem, originalLabel);
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        cancelEdit();
      } else if (e.key === "Enter" && !saveBtn.disabled) {
        saveBtn.click();
      }
    });
    const handleClickOutside = (e) => {
      const target = e.target;
      if (!slotItem.contains(target) && slotItem.classList.contains("miso-move-modal__slot-item--editing")) {
        cancelEdit();
        const modalDialog = document.querySelector(".miso-modal__dialog");
        modalDialog == null ? void 0 : modalDialog.removeEventListener("click", handleClickOutside);
      }
    };
    setTimeout(() => {
      const modalDialog = document.querySelector(".miso-modal__dialog");
      modalDialog == null ? void 0 : modalDialog.addEventListener("click", handleClickOutside);
    }, 0);
    editBtn.replaceWith(saveBtn);
  }
  exitEditMode(slotItem, originalLabel) {
    slotItem.classList.remove("miso-move-modal__slot-item--editing");
    delete slotItem.dataset.originalLabel;
    const input = slotItem.querySelector(".miso-move-modal__slot-input");
    const saveBtn = slotItem.querySelector(".miso-move-modal__save-btn");
    const errorMsg = slotItem.querySelector(".miso-move-modal__error");
    if (!input || !saveBtn) return;
    const labelSpan = document.createElement("span");
    labelSpan.className = "miso-move-modal__slot-label";
    labelSpan.textContent = originalLabel;
    input.replaceWith(labelSpan);
    const isActive = slotItem.classList.contains("miso-move-modal__slot-item--active");
    const editBtn = document.createElement("button");
    editBtn.className = "miso-move-modal__edit-btn";
    editBtn.innerHTML = `<img src="${isActive ? iconEditWhite : iconEditBlack}" alt="Edit" />`;
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const allSlotLabels = this.getAllSlotLabels();
      this.enterEditMode(slotItem, originalLabel, allSlotLabels);
    });
    saveBtn.replaceWith(editBtn);
    if (errorMsg) {
      errorMsg.remove();
    }
  }
  enterAddNewMode(addNewItem, allSlotLabels) {
    this.resetAllEditingSlots();
    addNewItem.classList.add("miso-move-modal__add-new--editing");
    const addBtn = addNewItem.querySelector(".miso-move-modal__add-new-btn");
    if (!addBtn) return;
    const inputContainer = document.createElement("div");
    inputContainer.className = "miso-move-modal__slot-item miso-move-modal__slot-item--editing";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "miso-move-modal__slot-input";
    input.placeholder = "New Slot Name";
    inputContainer.appendChild(input);
    const saveBtn = document.createElement("button");
    saveBtn.className = "miso-move-modal__save-btn miso-move-modal__save-btn--disabled";
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<img src="${iconCheck}" alt="Save" />`;
    inputContainer.appendChild(saveBtn);
    const errorMsg = document.createElement("div");
    errorMsg.className = "miso-move-modal__error";
    inputContainer.appendChild(errorMsg);
    addBtn.replaceWith(inputContainer);
    input.focus();
    const validateAndUpdateSaveBtn = () => {
      const newValue = input.value.trim();
      const isEmpty = newValue === "";
      const isDuplicate = allSlotLabels.includes(newValue);
      const isInvalid = isEmpty || isDuplicate;
      saveBtn.disabled = isInvalid;
      saveBtn.classList.toggle("miso-move-modal__save-btn--disabled", isInvalid);
      if (isDuplicate && newValue !== "") {
        errorMsg.textContent = "Slot name already exists.";
        errorMsg.style.display = "block";
      } else {
        errorMsg.textContent = "";
        errorMsg.style.display = "none";
      }
    };
    input.addEventListener("input", validateAndUpdateSaveBtn);
    saveBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (saveBtn.disabled) return;
      const newLabel = input.value.trim();
      saveBtn.disabled = true;
      saveBtn.classList.add("miso-move-modal__save-btn--disabled");
      try {
        await this.options.onMoveRecipe(this.currentRecipeIndex, newLabel);
        this.close();
      } catch (error) {
        console.error("Failed to create new slot:", error);
        saveBtn.disabled = false;
        saveBtn.classList.remove("miso-move-modal__save-btn--disabled");
      }
    });
    const cancelAdd = () => {
      this.exitAddNewMode(addNewItem);
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        cancelAdd();
      } else if (e.key === "Enter" && !saveBtn.disabled) {
        saveBtn.click();
      }
    });
    const handleClickOutside = (e) => {
      const target = e.target;
      if (!inputContainer.contains(target)) {
        cancelAdd();
        const modalDialog = document.querySelector(".miso-modal__dialog");
        modalDialog == null ? void 0 : modalDialog.removeEventListener("click", handleClickOutside);
      }
    };
    setTimeout(() => {
      const modalDialog = document.querySelector(".miso-modal__dialog");
      modalDialog == null ? void 0 : modalDialog.addEventListener("click", handleClickOutside);
    }, 0);
  }
  exitAddNewMode(addNewItem) {
    addNewItem.classList.remove("miso-move-modal__add-new--editing");
    const inputContainer = addNewItem.querySelector(".miso-move-modal__slot-item");
    if (!inputContainer) return;
    const addBtn = document.createElement("button");
    addBtn.className = "miso-move-modal__add-new-btn";
    addBtn.innerHTML = `<img src="${iconAdd}" alt="Add" /> <span>Add New</span>`;
    addBtn.addEventListener("click", () => {
      const allSlotLabels = this.getAllSlotLabels();
      this.enterAddNewMode(addNewItem, allSlotLabels);
    });
    inputContainer.replaceWith(addBtn);
  }
  getAllSlotLabels() {
    const recipes = this.options.getCurrentRecipes();
    const labels = /* @__PURE__ */ new Set();
    recipes.forEach((recipe) => labels.add(recipe.slot_label));
    return Array.from(labels);
  }
}
class SwapModal {
  constructor(options) {
    this.modal = null;
    this.currentRecipe = null;
    this.currentRecipeIndex = null;
    this.suggestions = null;
    this.isSwapping = false;
    this.container = document.createElement("div");
    document.body.appendChild(this.container);
    this.options = options;
  }
  /**
   * Opens the swap modal for a specific recipe
   */
  async open(recipe, recipeIndex) {
    var _a;
    this.currentRecipe = recipe;
    this.currentRecipeIndex = recipeIndex;
    this.suggestions = null;
    this.isSwapping = false;
    (_a = this.modal) == null ? void 0 : _a.destroy();
    this.modal = new ModalWidget(this.container, {
      content: () => this.createContent(),
      onClose: () => {
        this.reset();
      }
    });
    this.modal.render();
    this.modal.openModal();
    this.attachSaveButtonListeners();
    try {
      this.suggestions = await this.options.onFetchSuggestions(recipeIndex);
      this.updateContent();
      this.attachSaveButtonListeners();
    } catch (error) {
      console.error("Failed to fetch swap suggestions:", error);
      this.close();
      this.options.onError("Failed to load swap suggestions. Please try again.");
    }
  }
  /**
   * Closes the modal
   */
  close() {
    var _a;
    (_a = this.modal) == null ? void 0 : _a.closeModal("button");
  }
  /**
   * Destroys the modal and removes its container from the DOM
   */
  destroy() {
    var _a;
    (_a = this.modal) == null ? void 0 : _a.destroy();
    this.container.remove();
  }
  /**
   * Resets modal state
   */
  reset() {
    this.modal = null;
    this.suggestions = null;
    this.currentRecipe = null;
    this.currentRecipeIndex = null;
    this.isSwapping = false;
  }
  /**
   * Updates the modal content (when suggestions are loaded)
   */
  updateContent() {
    if (!this.modal) return;
    const modalContent = this.container.querySelector(".miso-swap-modal");
    if (modalContent) {
      const newContent = this.createContent();
      modalContent.replaceWith(newContent);
    }
  }
  /**
   * Creates the modal content
   * Uses 2-column layout for m+ (>= 768px)
   */
  createContent() {
    const container = document.createElement("div");
    container.className = "miso-swap-modal";
    if (!this.currentRecipe) return container;
    const isMPlus = window.matchMedia("(min-width: 768px)").matches;
    if (isMPlus) {
      const leftColumn = document.createElement("div");
      leftColumn.className = "miso-swap-modal__left-column";
      const modalName = document.createElement("div");
      modalName.className = "miso-swap-modal__name";
      modalName.textContent = "SWAP";
      leftColumn.appendChild(modalName);
      const title = document.createElement("h2");
      title.className = "miso-swap-modal__title";
      title.textContent = this.currentRecipe.title;
      leftColumn.appendChild(title);
      const previewCard = document.createElement("div");
      previewCard.className = "miso-modal__recipe-preview";
      const previewImage = document.createElement("img");
      previewImage.className = "miso-modal__recipe-preview-image";
      previewImage.src = this.currentRecipe.cover_image || "";
      previewImage.alt = this.currentRecipe.title;
      previewImage.onerror = () => {
        previewImage.style.backgroundColor = "rgba(0, 0, 0, 0.15)";
        previewImage.style.display = "block";
      };
      previewCard.appendChild(previewImage);
      const previewTitle = document.createElement("div");
      previewTitle.className = "miso-modal__recipe-preview-title";
      previewTitle.textContent = this.currentRecipe.title;
      previewCard.appendChild(previewTitle);
      leftColumn.appendChild(previewCard);
      container.appendChild(leftColumn);
      const rightColumn = document.createElement("div");
      rightColumn.className = "miso-swap-modal__right-column";
      if (!this.suggestions) {
        rightColumn.appendChild(this.createLoading());
      } else {
        rightColumn.appendChild(this.createSuggestionsList());
      }
      container.appendChild(rightColumn);
    } else {
      const modalName = document.createElement("div");
      modalName.className = "miso-swap-modal__name";
      modalName.textContent = "SWAP";
      container.appendChild(modalName);
      const title = document.createElement("h2");
      title.className = "miso-swap-modal__title";
      title.textContent = this.currentRecipe.title;
      container.appendChild(title);
      if (!this.suggestions) {
        container.appendChild(this.createLoading());
      } else {
        container.appendChild(this.createSuggestionsList());
      }
    }
    return container;
  }
  /**
   * Creates the loading indicator
   */
  createLoading() {
    const loading = document.createElement("div");
    loading.className = "miso-swap-modal__loading";
    loading.innerHTML = `<img src="${iconLoading}" alt="Loading" class="miso-swap-modal__loading-icon" />`;
    return loading;
  }
  /**
   * Creates the suggestions list
   */
  createSuggestionsList() {
    const suggestionsContainer = document.createElement("div");
    suggestionsContainer.className = "miso-swap-modal__suggestions";
    if (!this.suggestions) return suggestionsContainer;
    this.suggestions.recipes.forEach((suggestedRecipe, index2) => {
      var _a;
      const suggestionItem = document.createElement("div");
      suggestionItem.className = "miso-swap-modal__suggestion-item";
      const card = document.createElement("div");
      card.className = "miso-swap-modal__card";
      const imageContainer = document.createElement("div");
      imageContainer.className = "miso-swap-modal__card-image";
      imageContainer.style.backgroundImage = `url('${suggestedRecipe.cover_image}')`;
      const savedRecipes = this.options.getSavedRecipes();
      const isSaved = savedRecipes.includes(suggestedRecipe.id);
      const saveBtn = document.createElement("button");
      saveBtn.className = `miso-plan-detail__save-btn${isSaved ? " miso-plan-detail__save-btn--active" : ""}`;
      saveBtn.dataset.recipeId = suggestedRecipe.id;
      saveBtn.innerHTML = `
        <img src="${iconLike}" class="miso-plan-detail__save-icon miso-plan-detail__save-icon--default" alt="Save" />
        <img src="${iconLikeActive}" class="miso-plan-detail__save-icon miso-plan-detail__save-icon--active" alt="Saved" />
      `;
      imageContainer.appendChild(saveBtn);
      card.appendChild(imageContainer);
      const content2 = document.createElement("div");
      content2.className = "miso-swap-modal__card-content";
      const recipeTitle = document.createElement("div");
      recipeTitle.className = "miso-swap-modal__card-title";
      recipeTitle.textContent = suggestedRecipe.title;
      content2.appendChild(recipeTitle);
      const swapButton = document.createElement("button");
      swapButton.className = "miso-swap-modal__swap-btn";
      swapButton.textContent = "Swap";
      swapButton.dataset.suggestionIndex = String(index2);
      swapButton.addEventListener("click", () => {
        this.handleSwap(suggestedRecipe, swapButton);
      });
      content2.appendChild(swapButton);
      card.appendChild(content2);
      suggestionItem.appendChild(card);
      const reason = (_a = this.suggestions) == null ? void 0 : _a.reasons[index2];
      if (reason) {
        const reasonText = document.createElement("p");
        reasonText.className = "miso-swap-modal__reason";
        reasonText.textContent = reason;
        suggestionItem.appendChild(reasonText);
      }
      suggestionsContainer.appendChild(suggestionItem);
    });
    return suggestionsContainer;
  }
  /**
   * Handles the swap button click
   */
  async handleSwap(newRecipe, button) {
    if (this.currentRecipeIndex === null || this.isSwapping) return;
    this.isSwapping = true;
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `<img src="${iconLoading}" alt="Loading" class="miso-swap-modal__btn-loading" />`;
    try {
      await this.options.onSwap(this.currentRecipeIndex, newRecipe);
      this.close();
    } catch (error) {
      console.error("Failed to swap recipe:", error);
      button.disabled = false;
      button.textContent = originalText;
      this.isSwapping = false;
      this.options.onError("Failed to swap recipe. Please try again.");
    }
  }
  /**
   * Attaches event listeners to save buttons
   */
  attachSaveButtonListeners() {
    if (!this.container) return;
    this.container.querySelectorAll(".miso-plan-detail__save-btn").forEach((btn) => {
      const handler = (e) => {
        e.stopPropagation();
        const recipeId = btn.dataset.recipeId;
        if (recipeId) {
          this.options.onSaveRecipe(recipeId);
          btn.classList.toggle("miso-plan-detail__save-btn--active");
        }
      };
      btn.removeEventListener("click", handler);
      btn.addEventListener("click", handler);
    });
  }
}
const iconCloseSquare = "data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M16%201.61143L14.3886%200L8%206.38857L1.61143%200L0%201.61143L6.38857%208L0%2014.3886L1.61143%2016L8%209.61143L14.3886%2016L16%2014.3886L9.61143%208L16%201.61143Z'%20fill='white'/%3e%3c/svg%3e";
class RenameModal {
  constructor(options) {
    this.overlay = null;
    this.modalElement = null;
    this.options = options;
  }
  /**
   * Opens the rename modal
   */
  open(planId, currentTitle) {
    this.close();
    this.overlay = document.createElement("div");
    this.overlay.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    this.modalElement = this.createContent(planId, currentTitle);
    this.overlay.appendChild(this.modalElement);
    document.body.appendChild(this.overlay);
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }
  /**
   * Closes the modal
   */
  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.modalElement = null;
    }
  }
  /**
   * Destroys the modal and removes its container from the DOM
   */
  destroy() {
    this.close();
  }
  /**
   * Creates the modal content
   */
  createContent(planId, currentTitle) {
    const container = document.createElement("div");
    container.className = "miso-rename-modal";
    container.style.width = "21.5rem";
    container.style.backgroundColor = "#fff";
    const titleSection = document.createElement("div");
    titleSection.className = "miso-rename-modal__header";
    titleSection.style.cssText = "height: 3rem; background-color: #000; padding: 0 1rem; display: flex; justify-content: space-between; align-items: center;";
    const titleText = document.createElement("h2");
    titleText.className = "miso-rename-modal__title";
    titleText.textContent = "Rename Meal Plan";
    titleText.style.cssText = "font-size: 1.125rem; line-height: 1.4; color: #fff; font-weight: 800; margin: 0;";
    titleSection.appendChild(titleText);
    const closeBtn = document.createElement("button");
    closeBtn.className = "miso-rename-modal__close-btn";
    closeBtn.style.cssText = "background: transparent; border: none; cursor: pointer; padding: 0; display: flex; align-items: center;";
    closeBtn.innerHTML = `<img src="${iconCloseSquare}" alt="Close" style="width: 1rem; height: 1rem;" />`;
    closeBtn.addEventListener("click", () => this.close());
    titleSection.appendChild(closeBtn);
    container.appendChild(titleSection);
    const contentSection = document.createElement("div");
    contentSection.className = "miso-rename-modal__content";
    contentSection.style.cssText = "background-color: #fff; padding: 1.5rem 1rem;";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "miso-rename-modal__input";
    input.value = currentTitle;
    input.style.cssText = "padding: 0.75rem 1rem; font-size: 1rem; line-height: 1.4; color: rgba(0, 0, 0, 0.95); border: 1px solid rgba(0, 0, 0, 0.95); width: 100%; box-sizing: border-box; outline: none;";
    contentSection.appendChild(input);
    const actionArea = document.createElement("div");
    actionArea.className = "miso-rename-modal__actions";
    actionArea.style.cssText = "display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; margin-top: 1.5rem;";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "miso-rename-modal__cancel-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = "height: 2.25rem; border: 1px solid #000; padding: 0 1rem; font-size: 0.875rem; line-height: 1.4; color: #000; font-weight: 800; border-radius: 0.375rem; background-color: #fff; cursor: pointer;";
    cancelBtn.addEventListener("click", () => this.close());
    actionArea.appendChild(cancelBtn);
    const saveBtn = document.createElement("button");
    saveBtn.className = "miso-rename-modal__save-btn";
    saveBtn.textContent = "Save";
    saveBtn.style.cssText = "height: 2.25rem; border: 1px solid #000; padding: 0 1rem; font-size: 0.875rem; line-height: 1.4; color: #000; font-weight: 800; border-radius: 0.375rem; background-color: #FF3FA4; cursor: pointer;";
    const updateSaveButton = () => {
      const isEmpty = input.value.trim() === "";
      const isUnchanged = input.value.trim() === currentTitle.trim();
      saveBtn.disabled = isEmpty || isUnchanged;
      saveBtn.style.opacity = saveBtn.disabled ? "0.5" : "1";
    };
    input.addEventListener("input", updateSaveButton);
    updateSaveButton();
    saveBtn.addEventListener("click", async () => {
      const newTitle = input.value.trim();
      if (!newTitle || newTitle === currentTitle.trim()) return;
      saveBtn.disabled = true;
      saveBtn.style.opacity = "0.5";
      input.disabled = true;
      try {
        await this.options.onRename(planId, newTitle);
        this.close();
      } catch (error) {
        console.error("Failed to rename plan:", error);
        this.options.onError("Failed to rename plan. Please try again.");
        saveBtn.disabled = false;
        saveBtn.style.opacity = "1";
        input.disabled = false;
      }
    });
    actionArea.appendChild(saveBtn);
    contentSection.appendChild(actionArea);
    container.appendChild(contentSection);
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);
    return container;
  }
}
class DeleteModal {
  constructor(options) {
    this.overlay = null;
    this.modalElement = null;
    this.options = options;
  }
  /**
   * Opens the delete modal
   */
  open(planId) {
    this.close();
    this.overlay = document.createElement("div");
    this.overlay.style.cssText = "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;";
    this.modalElement = this.createContent(planId);
    this.overlay.appendChild(this.modalElement);
    document.body.appendChild(this.overlay);
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }
  /**
   * Closes the modal
   */
  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.modalElement = null;
    }
  }
  /**
   * Destroys the modal and removes its container from the DOM
   */
  destroy() {
    this.close();
  }
  /**
   * Creates the modal content
   */
  createContent(planId) {
    const container = document.createElement("div");
    container.className = "miso-delete-modal";
    container.style.width = "21.5rem";
    container.style.backgroundColor = "#fff";
    const titleSection = document.createElement("div");
    titleSection.className = "miso-delete-modal__header";
    titleSection.style.cssText = "height: 3rem; background-color: #000; padding: 0 1rem; display: flex; justify-content: space-between; align-items: center;";
    const titleText = document.createElement("h2");
    titleText.className = "miso-delete-modal__title";
    titleText.textContent = "Delete Meal Plan";
    titleText.style.cssText = "font-size: 1.125rem; line-height: 1.4; color: #fff; font-weight: 800; margin: 0;";
    titleSection.appendChild(titleText);
    const closeBtn = document.createElement("button");
    closeBtn.className = "miso-delete-modal__close-btn";
    closeBtn.style.cssText = "background: transparent; border: none; cursor: pointer; padding: 0; display: flex; align-items: center;";
    closeBtn.innerHTML = `<img src="${iconCloseSquare}" alt="Close" style="width: 1rem; height: 1rem;" />`;
    closeBtn.addEventListener("click", () => this.close());
    titleSection.appendChild(closeBtn);
    container.appendChild(titleSection);
    const contentSection = document.createElement("div");
    contentSection.className = "miso-delete-modal__content";
    contentSection.style.cssText = "background-color: #fff; padding: 1.5rem 1rem;";
    const warningText = document.createElement("p");
    warningText.className = "miso-delete-modal__text";
    warningText.textContent = "Are you sure you want to permanently delete this meal plan?";
    warningText.style.cssText = "font-size: 1rem; line-height: 1.4; color: rgba(0, 0, 0, 0.95); margin: 0 0 1.5rem 0;";
    contentSection.appendChild(warningText);
    const actionArea = document.createElement("div");
    actionArea.className = "miso-delete-modal__actions";
    actionArea.style.cssText = "display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem;";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "miso-delete-modal__cancel-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = "height: 2.25rem; border: 1px solid #000; padding: 0 1rem; font-size: 0.875rem; line-height: 1.4; color: #000; font-weight: 800; border-radius: 0.375rem; background-color: #fff; cursor: pointer;";
    cancelBtn.addEventListener("click", () => this.close());
    actionArea.appendChild(cancelBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "miso-delete-modal__delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.style.cssText = "height: 2.25rem; border: 1px solid #B10E0E; padding: 0 1rem; font-size: 0.875rem; line-height: 1.4; color: #fff; font-weight: 800; border-radius: 0.375rem; background-color: #B10E0E; cursor: pointer;";
    deleteBtn.addEventListener("click", async () => {
      deleteBtn.disabled = true;
      deleteBtn.style.opacity = "0.5";
      try {
        await this.options.onDelete(planId);
        this.close();
      } catch (error) {
        console.error("Failed to delete plan:", error);
        this.options.onError("Failed to delete plan. Please try again.");
        deleteBtn.disabled = false;
        deleteBtn.style.opacity = "1";
      }
    });
    actionArea.appendChild(deleteBtn);
    contentSection.appendChild(actionArea);
    container.appendChild(contentSection);
    return container;
  }
}
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function getRandomDelay() {
  return 3e3 + Math.random() * 2e3;
}
class PlanDetailWidget {
  constructor(container, instance2, planId, options) {
    this.widgetElement = null;
    this.dropdownElement = null;
    this.creationTimeout = null;
    this.shuffledMessages = null;
    this.buildingMessageIndex = 0;
    this.previousPlan = null;
    this.previousMessageCount = 0;
    this.recipeScrollHandler = null;
    this.resizeObserver = null;
    this.handleOutsideClick = (event) => {
      var _a;
      if (!this.dropdownElement) return;
      const target = event.target;
      const dotsIcon = (_a = this.widgetElement) == null ? void 0 : _a.querySelector(".miso-plan-detail__dots-icon");
      if ((dotsIcon == null ? void 0 : dotsIcon.contains(target)) || this.dropdownElement.contains(target)) {
        return;
      }
      this.closeDropdown();
    };
    this.container = container;
    this.instance = instance2;
    this.options = options || null;
    const initialFavorites = instance2.getUserInfo().favoriteRecipes;
    this.state = createState$1(
      { ...createInitialState(planId, options == null ? void 0 : options.initialMessage, options == null ? void 0 : options.mode), favoriteRecipes: initialFavorites },
      {
        favoriteRecipes: () => this.updateSaveButtons(),
        errorMessage: () => this.updateErrorDisplay(),
        suggestions: () => this.updateSuggestionsDisplay(),
        isUpdating: () => this.updateLoadingOverlay(),
        creationMessage: () => this.updateCreationMessage(),
        isThinking: () => this.updateMessageArea(),
        plan: (newPlan, state) => this.handlePlanUpdate(newPlan, state)
      },
      () => this.renderContent()
    );
    this.moveModal = new MoveModal({
      onMoveRecipe: (recipeIndex, targetSlotLabel) => this.handleMoveRecipe(recipeIndex, targetSlotLabel),
      onRenameSlot: (oldLabel, newLabel) => this.handleRenameSlot(oldLabel, newLabel),
      getCurrentRecipes: () => {
        var _a;
        return ((_a = this.state.get().plan) == null ? void 0 : _a.recipes) || [];
      }
    });
    this.swapModal = new SwapModal({
      onFetchSuggestions: (recipeIndex) => this.fetchSwapSuggestions(recipeIndex),
      onSwap: (recipeIndex, newRecipe) => this.handleSwapRecipe(recipeIndex, newRecipe),
      onError: (message) => this.state.set({ errorMessage: message }),
      getSavedRecipes: () => this.state.get().favoriteRecipes,
      onSaveRecipe: (recipeId) => this.handleSaveFavorite(recipeId)
    });
    this.renameModal = new RenameModal({
      onRename: (planId2, newTitle) => this.handleRenamePlan(planId2, newTitle),
      onError: (message) => this.state.set({ errorMessage: message })
    });
    this.deleteModal = new DeleteModal({
      onDelete: (planId2) => this.handleDeletePlan(planId2),
      onError: (message) => this.state.set({ errorMessage: message })
    });
  }
  // ============================================================
  // Public API
  // ============================================================
  async render() {
    this.renderContent();
    const { planId, initialMessage } = this.state.get();
    if (planId) {
      await this.loadPlan();
    } else {
      await this.loadSuggestions();
      if (initialMessage) {
        this.submitInitialMessage(initialMessage);
      }
    }
  }
  setFavoriteRecipes(recipeIds) {
    this.state.set({ favoriteRecipes: recipeIds });
  }
  handleSaveFavorite(recipeId) {
    var _a;
    const { favoriteRecipes } = this.state.get();
    if (!favoriteRecipes.includes(recipeId)) {
      this.state.set({ favoriteRecipes: [...favoriteRecipes, recipeId] });
    }
    this.instance.addToFavorites(recipeId);
    this.instance.emit("save-favorite", recipeId);
    if ((_a = this.options) == null ? void 0 : _a.onSaveFavorite) {
      this.options.onSaveFavorite(recipeId);
    }
  }
  async checkRecipeFavorites() {
    const { plan } = this.state.get();
    if (!(plan == null ? void 0 : plan.recipes)) return;
    const recipeIds = plan.recipes.map((r) => r.id).filter((id) => !!id);
    if (recipeIds.length > 0) {
      await this.instance.checkIsInFavorite(recipeIds);
    }
  }
  destroy() {
    this.stopCreationSequence();
    this.moveModal.destroy();
    this.swapModal.destroy();
    this.renameModal.destroy();
    this.deleteModal.destroy();
    this.closeDropdown();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.widgetElement) {
      this.container.removeChild(this.widgetElement);
      this.widgetElement = null;
    }
  }
  // ============================================================
  // Data Loading
  // ============================================================
  async loadPlan() {
    var _a, _b, _c;
    const { planId } = this.state.get();
    if (!planId) return;
    this.state.set({ isLoading: true });
    try {
      const response = await this.instance.apiService.getPlan(planId);
      this.state.set({ plan: response.data });
      await this.loadSuggestions();
      this.checkRecipeFavorites();
    } catch (error) {
      console.error("Failed to load plan:", error);
      const errorObj = error;
      const is404 = ((_a = errorObj == null ? void 0 : errorObj.message) == null ? void 0 : _a.toLowerCase().includes("not found")) || (errorObj == null ? void 0 : errorObj.status) === 404 || ((_b = errorObj == null ? void 0 : errorObj.response) == null ? void 0 : _b.status) === 404;
      if (is404) {
        this.state.set({ planNotFound: true });
        this.instance.emit("plan-not-found", planId);
        if ((_c = this.options) == null ? void 0 : _c.onPlanNotFound) {
          this.options.onPlanNotFound(planId);
        }
      } else {
        this.state.set({ errorMessage: "Failed to load plan. Please try again." });
      }
    } finally {
      this.state.set({ isLoading: false });
    }
  }
  async loadSuggestions() {
    try {
      const { plan } = this.state.get();
      const response = await this.instance.apiService.getSuggestedPrompts(plan);
      this.state.set({ suggestions: response.data });
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      this.state.set({ suggestions: [] });
    }
  }
  // ============================================================
  // Rendering
  // ============================================================
  renderContent() {
    const state = this.state.get();
    if (state.planNotFound) {
      this.container.innerHTML = renderPlanNotFound();
      this.widgetElement = this.container.firstElementChild;
      this.attachNotFoundListeners();
      return;
    }
    if (state.isLoading && state.planId && !state.plan) {
      this.container.innerHTML = renderFullLoading();
      this.widgetElement = this.container.firstElementChild;
      return;
    }
    if (state.mode === "view" && state.plan) {
      this.container.innerHTML = renderPlanView({ state });
      this.widgetElement = this.container.firstElementChild;
      this.attachViewModeListeners();
    } else {
      this.container.innerHTML = renderPlanEditor({ state });
      this.widgetElement = this.container.firstElementChild;
      this.attachEventListeners();
      this.updateScrollState();
      this.updateLoadingOverlay();
    }
  }
  // ============================================================
  // Partial DOM Updates
  // ============================================================
  updateSaveButtons() {
    if (!this.widgetElement) return;
    const { favoriteRecipes } = this.state.get();
    const saveBtns = this.widgetElement.querySelectorAll(".miso-plan-detail__save-btn");
    saveBtns.forEach((btn) => {
      const recipeId = btn.dataset.recipeId;
      if (recipeId) {
        const isSaved = favoriteRecipes.includes(recipeId);
        btn.classList.toggle("miso-plan-detail__save-btn--active", isSaved);
      }
    });
  }
  updateErrorDisplay() {
    if (!this.widgetElement) return;
    const { errorMessage } = this.state.get();
    const form = this.widgetElement.querySelector(".miso-plan-detail__input-form");
    let errorEl = form == null ? void 0 : form.querySelector(".miso-plan-detail__error");
    if (errorMessage) {
      if (!errorEl) {
        errorEl = document.createElement("div");
        errorEl.className = "miso-plan-detail__error";
        form == null ? void 0 : form.appendChild(errorEl);
      }
      errorEl.textContent = errorMessage;
    } else {
      errorEl == null ? void 0 : errorEl.remove();
    }
  }
  updateSuggestionsDisplay() {
    if (!this.widgetElement) return;
    const state = this.state.get();
    const container = this.widgetElement.querySelector(".miso-plan-detail__prompt-section");
    if (!container) return;
    const currentScrollTop = this.widgetElement.scrollTop;
    const currentScrollHeight = this.widgetElement.scrollHeight;
    const existingSuggestions = container.querySelector(".miso-plan-detail__suggestions");
    existingSuggestions == null ? void 0 : existingSuggestions.remove();
    if (state.suggestions.length > 0) {
      const form = container.querySelector(".miso-plan-detail__input-form");
      if (form) {
        const suggestionsHtml = renderSuggestions({ state });
        form.insertAdjacentHTML("beforebegin", suggestionsHtml);
        this.attachSuggestionListeners();
      }
    }
    requestAnimationFrame(() => {
      if (this.widgetElement) {
        const newScrollHeight = this.widgetElement.scrollHeight;
        const heightDiff = newScrollHeight - currentScrollHeight;
        this.widgetElement.scrollTop = currentScrollTop + heightDiff;
      }
    });
  }
  updateLoadingOverlay() {
    if (!this.widgetElement) return;
    const { isUpdating } = this.state.get();
    const topSection = this.widgetElement.querySelector(".miso-plan-detail__top");
    if (!topSection) return;
    const existingOverlay = topSection.querySelector(".miso-plan-detail__updating-overlay");
    existingOverlay == null ? void 0 : existingOverlay.remove();
    const input = this.widgetElement.querySelector(".miso-plan-detail__input");
    if (input) {
      input.disabled = isUpdating;
    }
    this.widgetElement.querySelectorAll(".miso-plan-detail__suggestion-btn").forEach((btn) => {
      btn.disabled = isUpdating;
    });
    if (isUpdating) {
      const overlay = document.createElement("div");
      overlay.className = "miso-plan-detail__updating-overlay";
      topSection.appendChild(overlay);
    }
  }
  updateCreationMessage() {
    if (!this.widgetElement) return;
    const { creationMessage, creationPhase } = this.state.get();
    const messageArea = this.widgetElement.querySelector(".miso-plan-detail__message-area");
    if (!messageArea) return;
    if (creationPhase === "idle") {
      return;
    }
    const newMessageEl = document.createElement("div");
    newMessageEl.className = "miso-plan-detail__creation-message";
    newMessageEl.textContent = creationMessage;
    messageArea.innerHTML = "";
    messageArea.appendChild(newMessageEl);
  }
  updateMessageArea() {
    var _a;
    if (!this.widgetElement) return;
    const state = this.state.get();
    const messageArea = this.widgetElement.querySelector(".miso-plan-detail__message-area");
    if (!messageArea) return;
    if (state.creationPhase !== "idle") return;
    const messages = ((_a = state.plan) == null ? void 0 : _a.messages) || [];
    const currentCount = messages.length;
    if (state.initialMessage && messages.length === 0) {
      const messageContent = renderMessageHistory({ state });
      messageArea.innerHTML = messageContent;
      this.previousMessageCount = 0;
      return;
    }
    if (currentCount < this.previousMessageCount || this.previousMessageCount === 0) {
      const messageContent = renderMessageHistory({ state });
      messageArea.innerHTML = messageContent;
      this.previousMessageCount = currentCount;
    } else if (currentCount > this.previousMessageCount) {
      const newMessages = messages.slice(this.previousMessageCount);
      let hasNewUserMessage = false;
      const thinkingIndicator = messageArea.querySelector(".miso-plan-detail__thinking-indicator");
      thinkingIndicator == null ? void 0 : thinkingIndicator.remove();
      for (const message of newMessages) {
        const messageDiv = document.createElement("div");
        if (message.role === "user") {
          messageDiv.className = "miso-plan-detail__user-message";
          messageDiv.textContent = message.content;
          hasNewUserMessage = true;
        } else {
          messageDiv.className = "miso-plan-detail__assistant-message";
          messageDiv.innerHTML = parseMarkdownSync(message.content);
        }
        messageArea.appendChild(messageDiv);
      }
      this.previousMessageCount = currentCount;
      const { shouldPreserveScroll } = this.state.get();
      if (hasNewUserMessage && !shouldPreserveScroll) {
        setTimeout(() => {
          if (this.widgetElement) {
            this.widgetElement.scrollTo({ top: this.widgetElement.scrollHeight, behavior: "smooth" });
          }
        }, 100);
      }
    }
    if (state.isThinking) {
      const existingThinking = messageArea.querySelector(".miso-plan-detail__thinking-indicator");
      if (!existingThinking) {
        const thinkingDiv = document.createElement("div");
        thinkingDiv.className = "miso-plan-detail__thinking-indicator";
        thinkingDiv.innerHTML = `
          <img src="${iconLightbulb}" alt="Thinking" class="miso-plan-detail__thinking-icon" />
          <span>Thinking...</span>
        `;
        messageArea.appendChild(thinkingDiv);
      }
    } else {
      const thinkingIndicator = messageArea.querySelector(".miso-plan-detail__thinking-indicator");
      thinkingIndicator == null ? void 0 : thinkingIndicator.remove();
    }
    this.updateScrollState();
  }
  handlePlanUpdate(newPlan, _state) {
    if (!this.widgetElement) return;
    const oldPlan = this.previousPlan;
    this.previousPlan = newPlan;
    if (!oldPlan || !newPlan) {
      this.renderContent();
      return;
    }
    const messagesChanged = JSON.stringify(oldPlan.messages) !== JSON.stringify(newPlan.messages);
    const recipesChanged = JSON.stringify(oldPlan.recipes) !== JSON.stringify(newPlan.recipes);
    const titleChanged = oldPlan.title !== newPlan.title;
    if (titleChanged) {
      this.updateTitle(newPlan.title);
    }
    if (recipesChanged) {
      this.updateRecipes(oldPlan.recipes, newPlan.recipes);
    }
    if (messagesChanged) {
      this.updateMessageArea();
    }
  }
  updateTitle(newTitle) {
    if (!this.widgetElement) return;
    const titleElement = this.widgetElement.querySelector(".miso-plan-detail__title");
    if (titleElement) {
      titleElement.textContent = newTitle;
    }
  }
  updateRecipes(oldRecipes, newRecipes) {
    if (!this.widgetElement) return;
    const recipeArea = this.widgetElement.querySelector(".miso-plan-detail__recipe-area");
    if (!recipeArea) {
      if (newRecipes.length > 0) {
        this.renderContent();
      }
      return;
    }
    const state = this.state.get();
    const existingSlots = Array.from(recipeArea.querySelectorAll(".miso-plan-detail__recipe-slot"));
    newRecipes.forEach((recipe, index2) => {
      const existingSlot = existingSlots[index2];
      const newSlotHtml = renderRecipeSlot(recipe, index2, { state });
      if (existingSlot) {
        const oldRecipe = oldRecipes[index2];
        if (JSON.stringify(oldRecipe) !== JSON.stringify(recipe)) {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = newSlotHtml;
          const newSlot = tempDiv.firstElementChild;
          if (newSlot) {
            existingSlot.replaceWith(newSlot);
            this.attachSlotEventListeners(newSlot, index2);
          }
        }
      } else {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = newSlotHtml;
        const newSlot = tempDiv.firstElementChild;
        if (newSlot) {
          recipeArea.appendChild(newSlot);
          this.attachSlotEventListeners(newSlot, index2);
        }
      }
    });
    if (existingSlots.length > newRecipes.length) {
      for (let i = newRecipes.length; i < existingSlots.length; i++) {
        existingSlots[i].remove();
      }
    }
    this.updateRecipeScrollButtons();
  }
  attachSlotEventListeners(slot, index2) {
    const saveBtn = slot.querySelector(".miso-plan-detail__save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const recipeId = saveBtn.dataset.recipeId;
        if (recipeId) {
          this.handleSaveFavorite(recipeId);
        }
      });
    }
    const moveBtn = slot.querySelector(".miso-plan-detail__move-btn");
    if (moveBtn) {
      moveBtn.addEventListener("click", () => {
        this.openMoveModal(index2);
      });
    }
    const swapBtn = slot.querySelector(".miso-plan-detail__swap-btn");
    if (swapBtn) {
      swapBtn.addEventListener("click", () => {
        this.openSwapModal(index2);
      });
    }
    const slotLabel = slot.querySelector(".miso-plan-detail__slot-label");
    if (slotLabel) {
      slotLabel.addEventListener("click", () => {
        this.openMoveModal(index2, true);
      });
    }
  }
  // ============================================================
  // Event Listeners
  // ============================================================
  attachEventListeners() {
    var _a, _b, _c, _d, _e, _f;
    if (!this.widgetElement) return;
    (_a = this.widgetElement.querySelector(".miso-plan-detail__back-btn")) == null ? void 0 : _a.addEventListener("click", () => {
      var _a2;
      this.instance.emit("plan-closed");
      if ((_a2 = this.options) == null ? void 0 : _a2.onPlanClosed) {
        this.options.onPlanClosed();
      }
    });
    (_b = this.widgetElement.querySelector(".miso-plan-detail__dots-icon")) == null ? void 0 : _b.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });
    this.attachSuggestionListeners();
    const input = this.widgetElement.querySelector(".miso-plan-detail__input");
    if (input) {
      const { planId } = this.state.get();
      if (!planId) input.focus();
      input.addEventListener("input", () => this.updateClearButtonVisibility());
    }
    (_c = this.widgetElement.querySelector(".miso-plan-detail__clear-btn")) == null ? void 0 : _c.addEventListener("click", () => {
      var _a2;
      const input2 = (_a2 = this.widgetElement) == null ? void 0 : _a2.querySelector(".miso-plan-detail__input");
      if (input2) {
        input2.value = "";
        this.updateClearButtonVisibility();
        input2.focus();
      }
    });
    const form = this.widgetElement.querySelector(".miso-plan-detail__input-form");
    form == null ? void 0 : form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
    this.attachRecipeScrollButtonListeners();
    this.widgetElement.addEventListener("scroll", () => this.updateScrollState());
    (_d = this.widgetElement.querySelector(".miso-plan-detail__scroll-top-btn")) == null ? void 0 : _d.addEventListener("click", () => {
      var _a2;
      (_a2 = this.widgetElement) == null ? void 0 : _a2.scrollTo({ top: 0, behavior: "smooth" });
    });
    (_e = this.widgetElement.querySelector(".miso-plan-detail__scroll-top-fixed-btn")) == null ? void 0 : _e.addEventListener("click", () => {
      var _a2;
      (_a2 = this.widgetElement) == null ? void 0 : _a2.scrollTo({ top: 0, behavior: "smooth" });
    });
    (_f = this.widgetElement.querySelector(".miso-plan-detail__scroll-bottom-btn")) == null ? void 0 : _f.addEventListener("click", () => {
      if (this.widgetElement) {
        this.widgetElement.scrollTo({ top: this.widgetElement.scrollHeight, behavior: "smooth" });
      }
    });
    this.widgetElement.querySelectorAll(".miso-plan-detail__save-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const recipeId = btn.dataset.recipeId;
        if (recipeId) {
          this.handleSaveFavorite(recipeId);
        }
      });
    });
    this.widgetElement.querySelectorAll(".miso-plan-detail__move-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const recipeIndex = parseInt(btn.dataset.recipeIndex || "-1", 10);
        if (recipeIndex >= 0) this.openMoveModal(recipeIndex);
      });
    });
    this.widgetElement.querySelectorAll(".miso-plan-detail__swap-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const recipeIndex = parseInt(btn.dataset.recipeIndex || "-1", 10);
        if (recipeIndex >= 0) this.openSwapModal(recipeIndex);
      });
    });
    this.widgetElement.querySelectorAll(".miso-plan-detail__slot-label").forEach((btn) => {
      btn.addEventListener("click", () => {
        const recipeIndex = parseInt(btn.dataset.recipeIndex || "-1", 10);
        if (recipeIndex >= 0) this.openMoveModal(recipeIndex, true);
      });
    });
  }
  attachSuggestionListeners() {
    if (!this.widgetElement) return;
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
      this.filterVisibleSuggestions();
    }
    this.widgetElement.querySelectorAll(".miso-plan-detail__suggestion-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        var _a;
        const suggestion = btn.dataset.suggestion;
        if (suggestion) {
          const input = (_a = this.widgetElement) == null ? void 0 : _a.querySelector(".miso-plan-detail__input");
          if (input) {
            input.value = suggestion;
            this.updateClearButtonVisibility();
            input.focus();
          }
        }
      });
    });
  }
  filterVisibleSuggestions() {
    if (!this.widgetElement) return;
    const suggestionsContainer = this.widgetElement.querySelector(".miso-plan-detail__suggestions");
    if (!suggestionsContainer) return;
    const containerRect = suggestionsContainer.getBoundingClientRect();
    const buttons = Array.from(suggestionsContainer.querySelectorAll(".miso-plan-detail__suggestion-btn"));
    buttons.forEach((btn) => {
      const btnElement = btn;
      const btnRect = btnElement.getBoundingClientRect();
      const isFullyVisible = btnRect.left >= containerRect.left && btnRect.right <= containerRect.right;
      if (isFullyVisible) {
        btnElement.style.display = "";
      } else {
        btnElement.style.display = "none";
      }
    });
  }
  attachNotFoundListeners() {
    var _a;
    if (!this.widgetElement) return;
    (_a = this.widgetElement.querySelector('[data-action="back-to-home"]')) == null ? void 0 : _a.addEventListener("click", () => {
      var _a2;
      this.instance.emit("plan-closed");
      if ((_a2 = this.options) == null ? void 0 : _a2.onPlanClosed) {
        this.options.onPlanClosed();
      }
    });
  }
  attachViewModeListeners() {
    var _a, _b, _c;
    if (!this.widgetElement) return;
    (_a = this.widgetElement.querySelector(".miso-plan-detail__back-btn")) == null ? void 0 : _a.addEventListener("click", () => {
      var _a2;
      this.instance.emit("plan-closed");
      if ((_a2 = this.options) == null ? void 0 : _a2.onPlanClosed) {
        this.options.onPlanClosed();
      }
    });
    (_b = this.widgetElement.querySelector(".miso-plan-detail__edit-plan-btn")) == null ? void 0 : _b.addEventListener("click", () => {
      this.switchToEditMode();
    });
    (_c = this.widgetElement.querySelector(".miso-plan-detail__dots-icon")) == null ? void 0 : _c.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });
  }
  // ============================================================
  // Mode Switching
  // ============================================================
  switchToEditMode() {
    const { planId } = this.state.get();
    this.state.set({ mode: "edit" });
    this.instance.emit("edit-plan", planId);
  }
  switchToViewMode() {
    const { planId } = this.state.get();
    this.state.set({ mode: "view" });
    this.instance.emit("view-plan", planId);
  }
  // ============================================================
  // UI Helpers
  // ============================================================
  updateClearButtonVisibility() {
    if (!this.widgetElement) return;
    const input = this.widgetElement.querySelector(".miso-plan-detail__input");
    const clearBtn = this.widgetElement.querySelector(".miso-plan-detail__clear-btn");
    if (input && clearBtn) {
      clearBtn.style.display = input.value ? "block" : "none";
    }
  }
  updateScrollState() {
    if (!this.widgetElement) return;
    const el = this.widgetElement;
    const hasScroll = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 1;
    const isAtTop = el.scrollTop === 0;
    el.classList.toggle("has-scroll", hasScroll && !isAtBottom);
    el.classList.toggle("has-content-above", hasScroll && !isAtTop);
    el.classList.toggle("has-content-below", hasScroll && !isAtBottom);
    const topSection = el.querySelector(".miso-plan-detail__top");
    if (topSection) {
      const topSectionRect = topSection.getBoundingClientRect();
      const topSectionHidden = topSectionRect.bottom <= 0;
      el.classList.toggle("top-section-hidden", topSectionHidden);
    }
  }
  attachRecipeScrollButtonListeners() {
    if (!this.widgetElement) return;
    const recipeArea = this.widgetElement.querySelector(".miso-plan-detail__recipe-area");
    const leftBtn = this.widgetElement.querySelector(".miso-plan-detail__scroll-btn--left");
    const rightBtn = this.widgetElement.querySelector(".miso-plan-detail__scroll-btn--right");
    if (!recipeArea || !leftBtn || !rightBtn) return;
    const getScrollAmount = () => {
      const slot = recipeArea.querySelector(".miso-plan-detail__recipe-slot");
      if (slot) {
        return slot.offsetWidth + 8;
      }
      return 208;
    };
    const updateButtonVisibility = () => {
      const { scrollLeft, clientWidth, scrollWidth } = recipeArea;
      leftBtn.classList.toggle("miso-plan-detail__scroll-btn--visible", scrollLeft > 0);
      rightBtn.classList.toggle("miso-plan-detail__scroll-btn--visible", scrollLeft + clientWidth < scrollWidth - 1);
    };
    leftBtn.addEventListener("click", () => {
      recipeArea.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
    });
    rightBtn.addEventListener("click", () => {
      recipeArea.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
    });
    this.recipeScrollHandler = updateButtonVisibility;
    recipeArea.addEventListener("scroll", this.recipeScrollHandler);
    window.addEventListener("resize", updateButtonVisibility);
    this.resizeObserver = new ResizeObserver(() => {
      updateButtonVisibility();
    });
    this.resizeObserver.observe(recipeArea);
    updateButtonVisibility();
  }
  updateRecipeScrollButtons() {
    if (!this.widgetElement) return;
    const recipeArea = this.widgetElement.querySelector(".miso-plan-detail__recipe-area");
    const leftBtn = this.widgetElement.querySelector(".miso-plan-detail__scroll-btn--left");
    const rightBtn = this.widgetElement.querySelector(".miso-plan-detail__scroll-btn--right");
    if (!recipeArea || !leftBtn || !rightBtn) return;
    const { scrollLeft, clientWidth, scrollWidth } = recipeArea;
    leftBtn.classList.toggle("miso-plan-detail__scroll-btn--visible", scrollLeft > 0);
    rightBtn.classList.toggle("miso-plan-detail__scroll-btn--visible", scrollLeft + clientWidth < scrollWidth - 1);
  }
  // ============================================================
  // Form Submission
  // ============================================================
  async submitInitialMessage(userMessage) {
    var _a;
    this.state.set({ isLoading: true, isUpdating: true, errorMessage: "" });
    this.startCreationSequence();
    try {
      const messages = [{ role: "user", content: userMessage }];
      const response = await this.instance.apiService.createPlan(messages);
      this.stopCreationSequence();
      this.state.set({ plan: response.data, planId: response.data.id, initialMessage: void 0 });
      this.instance.emit("plan-created", response.data);
      if ((_a = this.options) == null ? void 0 : _a.onPlanCreated) {
        this.options.onPlanCreated(response.data);
      }
      this.checkRecipeFavorites();
      await this.loadSuggestions();
      this.state.set({ isLoading: false });
      setTimeout(() => this.state.set({ isUpdating: false }), 600);
    } catch (error) {
      console.error("Failed to create plan:", error);
      this.stopCreationSequence();
      this.state.set({ errorMessage: "Sorry, something went wrong. Please try again.", isLoading: false, isUpdating: false, initialMessage: void 0 });
    }
  }
  async handleSubmit() {
    var _a, _b, _c, _d, _e;
    if (!this.widgetElement) return;
    const input = this.widgetElement.querySelector(".miso-plan-detail__input");
    if (!(input == null ? void 0 : input.value.trim())) return;
    const userMessage = input.value.trim();
    const state = this.state.get();
    const isEditing = !!state.planId;
    input.disabled = true;
    input.blur();
    input.value = "";
    this.updateClearButtonVisibility();
    if (!isEditing) {
      this.state.set({ isLoading: true, isUpdating: true, isThinking: true, errorMessage: "" });
      this.startCreationSequence();
    } else {
      const existingMessages = ((_a = state.plan) == null ? void 0 : _a.messages) || [];
      const optimisticMessages = [...existingMessages, { role: "user", content: userMessage }];
      const optimisticPlan = state.plan ? { ...state.plan, messages: optimisticMessages } : null;
      this.state.set({
        plan: optimisticPlan,
        isLoading: true,
        isUpdating: true,
        isThinking: true,
        errorMessage: ""
      });
      setTimeout(() => {
        if (this.widgetElement) {
          this.widgetElement.scrollTo({ top: this.widgetElement.scrollHeight, behavior: "smooth" });
        }
      }, 100);
    }
    try {
      if (isEditing) {
        const existingMessages = ((_b = state.plan) == null ? void 0 : _b.messages) || [];
        const messages = [...existingMessages, { role: "user", content: userMessage }];
        const response = await this.instance.apiService.sendCompletion(state.planId, messages);
        this.state.set({ plan: response.data, isThinking: false });
        this.instance.emit("plan-updated", response.data);
        if ((_c = this.options) == null ? void 0 : _c.onPlanUpdated) {
          this.options.onPlanUpdated(response.data);
        }
        this.checkRecipeFavorites();
      } else {
        const messages = [{ role: "user", content: userMessage }];
        const response = await this.instance.apiService.createPlan(messages);
        this.stopCreationSequence();
        this.state.set({ plan: response.data, planId: response.data.id, isThinking: false });
        this.instance.emit("plan-created", response.data);
        if ((_d = this.options) == null ? void 0 : _d.onPlanCreated) {
          this.options.onPlanCreated(response.data);
        }
        this.checkRecipeFavorites();
      }
      await this.loadSuggestions();
      this.state.set({ isLoading: false });
      setTimeout(() => this.state.set({ isUpdating: false }), 600);
    } catch (error) {
      console.error(isEditing ? "Failed to update plan:" : "Failed to create plan:", error);
      this.stopCreationSequence();
      this.state.set({ errorMessage: "Sorry, something went wrong. Please try again.", isLoading: false, isUpdating: false, isThinking: false });
      const newInput = (_e = this.widgetElement) == null ? void 0 : _e.querySelector(".miso-plan-detail__input");
      if (newInput) {
        newInput.disabled = false;
        newInput.value = userMessage;
        this.updateClearButtonVisibility();
      }
    }
  }
  // ============================================================
  // Creation Loading Sequence
  // ============================================================
  startCreationSequence() {
    this.shuffledMessages = {
      searching: shuffleArray([...loadingSteps.searching]),
      validating: shuffleArray([...loadingSteps.validating]),
      building: shuffleArray([...loadingSteps.building])
    };
    this.buildingMessageIndex = 0;
    this.state.set({
      creationPhase: "searching",
      creationMessage: this.shuffledMessages.searching[0]
    });
    this.scheduleNextPhase("validating");
  }
  scheduleNextPhase(nextPhase) {
    if (this.creationTimeout) {
      clearTimeout(this.creationTimeout);
    }
    this.creationTimeout = setTimeout(() => {
      if (!this.shuffledMessages) return;
      const { creationPhase } = this.state.get();
      if (creationPhase === "idle") return;
      if (nextPhase === "validating") {
        this.state.set({
          creationPhase: "validating",
          creationMessage: this.shuffledMessages.validating[0]
        });
        this.scheduleNextPhase("building");
      } else if (nextPhase === "building") {
        this.showNextBuildingMessage();
      }
    }, getRandomDelay());
  }
  showNextBuildingMessage() {
    if (!this.shuffledMessages) return;
    const { creationPhase } = this.state.get();
    if (creationPhase === "idle") return;
    const buildingMessages = this.shuffledMessages.building;
    const message = buildingMessages[this.buildingMessageIndex];
    this.state.set({
      creationPhase: "building",
      creationMessage: message
    });
    if (this.buildingMessageIndex < buildingMessages.length - 1) {
      this.buildingMessageIndex++;
      this.creationTimeout = setTimeout(() => {
        this.showNextBuildingMessage();
      }, getRandomDelay());
    }
  }
  stopCreationSequence() {
    if (this.creationTimeout) {
      clearTimeout(this.creationTimeout);
      this.creationTimeout = null;
    }
    this.shuffledMessages = null;
    this.buildingMessageIndex = 0;
    this.state.set({
      creationPhase: "idle",
      creationMessage: ""
    });
  }
  // ============================================================
  // Recipe Update Helper
  // ============================================================
  /**
   * Common pattern for recipe update operations with loading state and error handling
   */
  async performRecipeUpdate(updateFn, errorMessage) {
    var _a;
    this.state.set({ isUpdating: true, shouldPreserveScroll: true });
    try {
      const response = await updateFn();
      this.state.set({ plan: response.data });
      this.instance.emit("plan-updated", response.data);
      if ((_a = this.options) == null ? void 0 : _a.onPlanUpdated) {
        this.options.onPlanUpdated(response.data);
      }
      this.checkRecipeFavorites();
      this.loadSuggestions();
      setTimeout(() => this.state.set({ isUpdating: false, shouldPreserveScroll: false }), 600);
    } catch (error) {
      console.error(errorMessage, error);
      this.state.set({ errorMessage, isUpdating: false, shouldPreserveScroll: false });
      throw error;
    }
  }
  // ============================================================
  // Modal Operations
  // ============================================================
  openMoveModal(recipeIndex, editMode) {
    const { plan } = this.state.get();
    if (!(plan == null ? void 0 : plan.recipes)) return;
    const recipe = plan.recipes[recipeIndex];
    if (!recipe) return;
    const slotLabels = [...new Set(plan.recipes.map((r) => r.slot_label))];
    const editSlotLabel = editMode ? recipe.slot_label : void 0;
    this.moveModal.open(recipe, recipeIndex, slotLabels, editSlotLabel);
  }
  /**
   * Handles renaming a slot (affects ALL recipes with that slot_label)
   */
  async handleRenameSlot(oldLabel, newLabel) {
    const { plan, planId } = this.state.get();
    if (!(plan == null ? void 0 : plan.recipes) || !planId) return;
    const updatedRecipes = plan.recipes.map((recipe) => ({
      ...recipe,
      slot_label: recipe.slot_label === oldLabel ? newLabel : recipe.slot_label
    }));
    await this.performRecipeUpdate(
      () => this.instance.apiService.updatePlanRecipes(planId, updatedRecipes),
      "Failed to rename slot. Please try again."
    );
  }
  /**
   * Handles moving a single recipe to a different slot (with reordering if needed)
   */
  async handleMoveRecipe(recipeIndex, targetSlotLabel) {
    const { plan, planId } = this.state.get();
    if (!(plan == null ? void 0 : plan.recipes) || !planId) return;
    const recipe = plan.recipes[recipeIndex];
    if (!recipe) return;
    const prevRecipe = plan.recipes[recipeIndex - 1];
    const nextRecipe = plan.recipes[recipeIndex + 1];
    const isSiblingMove = (prevRecipe == null ? void 0 : prevRecipe.slot_label) === targetSlotLabel || (nextRecipe == null ? void 0 : nextRecipe.slot_label) === targetSlotLabel;
    if (!isSiblingMove) {
      const updatedRecipes = [...plan.recipes];
      let firstTargetIndex = -1;
      let lastTargetIndex = -1;
      for (let i = 0; i < updatedRecipes.length; i++) {
        if (updatedRecipes[i].slot_label === targetSlotLabel) {
          if (firstTargetIndex === -1) firstTargetIndex = i;
          lastTargetIndex = i;
        }
      }
      updatedRecipes.splice(recipeIndex, 1);
      const movedRecipe = { ...recipe, slot_label: targetSlotLabel };
      let insertIndex;
      if (firstTargetIndex !== -1) {
        if (recipeIndex < firstTargetIndex) {
          insertIndex = firstTargetIndex - 1;
        } else if (recipeIndex > lastTargetIndex) {
          insertIndex = lastTargetIndex + 1;
        } else {
          insertIndex = firstTargetIndex;
        }
      } else {
        const slotOrder = [...new Set(plan.recipes.map((r) => r.slot_label))];
        const originalTargetIndex = slotOrder.indexOf(targetSlotLabel);
        insertIndex = updatedRecipes.length;
        if (originalTargetIndex !== -1) {
          for (let i = 0; i < updatedRecipes.length; i++) {
            const currentSlotIndex = slotOrder.indexOf(updatedRecipes[i].slot_label);
            if (currentSlotIndex > originalTargetIndex) {
              insertIndex = i;
              break;
            }
          }
        }
      }
      updatedRecipes.splice(insertIndex, 0, movedRecipe);
      await this.performRecipeUpdate(
        () => this.instance.apiService.updatePlanRecipes(planId, updatedRecipes),
        "Failed to move recipe. Please try again."
      );
    } else {
      const updatedRecipes = plan.recipes.map(
        (r, i) => i === recipeIndex ? { ...r, slot_label: targetSlotLabel } : { ...r }
      );
      await this.performRecipeUpdate(
        () => this.instance.apiService.updatePlanRecipes(planId, updatedRecipes),
        "Failed to move recipe. Please try again."
      );
    }
  }
  openSwapModal(recipeIndex) {
    const { plan } = this.state.get();
    if (!(plan == null ? void 0 : plan.recipes)) return;
    const recipe = plan.recipes[recipeIndex];
    if (!recipe) return;
    this.swapModal.open(recipe, recipeIndex);
  }
  async fetchSwapSuggestions(recipeIndex) {
    const { planId } = this.state.get();
    if (!planId) throw new Error("No plan ID");
    const response = await this.instance.apiService.getSwapSuggestion(planId, recipeIndex);
    return response.data;
  }
  async handleSwapRecipe(recipeIndex, newRecipe) {
    const { plan, planId } = this.state.get();
    if (!(plan == null ? void 0 : plan.recipes) || !planId) return;
    const updatedRecipes = [...plan.recipes];
    const currentRecipe = updatedRecipes[recipeIndex];
    updatedRecipes[recipeIndex] = {
      ...newRecipe,
      slot_label: currentRecipe.slot_label
    };
    await this.performRecipeUpdate(
      () => this.instance.apiService.updatePlanRecipes(planId, updatedRecipes),
      "Failed to swap recipe. Please try again."
    );
  }
  // ============================================================
  // Rename and Delete Handlers
  // ============================================================
  async handleRenamePlan(planId, newTitle) {
    var _a, _b;
    try {
      await this.instance.apiService.updatePlanTitle(planId, newTitle);
      const { plan } = this.state.get();
      if (plan) {
        const updatedPlan = { ...plan, title: newTitle };
        this.state.set({ plan: updatedPlan });
        this.instance.emit("rename-plan", updatedPlan);
        if ((_a = this.options) == null ? void 0 : _a.onPlanRenamed) {
          this.options.onPlanRenamed(updatedPlan);
        }
      }
    } catch (error) {
      console.error("Failed to rename plan:", error);
      const errorMsg = "Failed to rename plan. Please try again.";
      this.instance.emit("rename-plan-error", errorMsg);
      if ((_b = this.options) == null ? void 0 : _b.onPlanRenameError) {
        this.options.onPlanRenameError(errorMsg);
      }
      throw error;
    }
  }
  async handleDeletePlan(planId) {
    var _a, _b;
    try {
      await this.instance.apiService.deletePlan(planId);
      this.instance.emit("delete-plan", planId);
      if ((_a = this.options) == null ? void 0 : _a.onPlanDeleted) {
        this.options.onPlanDeleted(planId);
      }
      setTimeout(() => {
        var _a2;
        this.instance.emit("plan-closed");
        if ((_a2 = this.options) == null ? void 0 : _a2.onPlanClosed) {
          this.options.onPlanClosed();
        }
      }, 300);
    } catch (error) {
      console.error("Failed to delete plan:", error);
      const errorMsg = "Failed to delete plan. Please try again.";
      this.instance.emit("delete-plan-error", errorMsg);
      if ((_b = this.options) == null ? void 0 : _b.onPlanDeleteError) {
        this.options.onPlanDeleteError(errorMsg);
      }
      throw error;
    }
  }
  // ============================================================
  // Dropdown Menu
  // ============================================================
  toggleDropdown() {
    if (this.dropdownElement) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }
  openDropdown() {
    var _a;
    if (!this.widgetElement) return;
    this.closeDropdown();
    const { mode, plan, planId } = this.state.get();
    if (!plan || !planId) return;
    const dotsIcon = this.widgetElement.querySelector(".miso-plan-detail__dots-icon");
    if (!dotsIcon) return;
    const rect = dotsIcon.getBoundingClientRect();
    const dropdown = document.createElement("div");
    dropdown.className = "miso-plan-detail__dropdown";
    dropdown.style.left = `${rect.right - 160}px`;
    dropdown.style.top = `${rect.bottom + 8}px`;
    const renameBtn = document.createElement("button");
    renameBtn.className = "miso-plan-detail__dropdown-item";
    renameBtn.textContent = "Rename";
    renameBtn.addEventListener("click", () => {
      this.closeDropdown();
      this.renameModal.open(planId, plan.title);
    });
    dropdown.appendChild(renameBtn);
    const viewEditBtn = document.createElement("button");
    viewEditBtn.className = "miso-plan-detail__dropdown-item";
    viewEditBtn.textContent = mode === "view" ? "Edit Plan" : "View Plan";
    viewEditBtn.addEventListener("click", () => {
      this.closeDropdown();
      if (mode === "view") {
        this.switchToEditMode();
      } else {
        this.switchToViewMode();
      }
    });
    dropdown.appendChild(viewEditBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "miso-plan-detail__dropdown-item";
    deleteBtn.textContent = "Delete Plan";
    deleteBtn.addEventListener("click", () => {
      this.closeDropdown();
      this.deleteModal.open(planId);
    });
    dropdown.appendChild(deleteBtn);
    document.body.appendChild(dropdown);
    this.dropdownElement = dropdown;
    const updatePosition = () => {
      const rect2 = dotsIcon.getBoundingClientRect();
      dropdown.style.left = `${rect2.right - 160}px`;
      dropdown.style.top = `${rect2.bottom + 8}px`;
    };
    (_a = this.widgetElement) == null ? void 0 : _a.addEventListener("scroll", updatePosition);
    setTimeout(() => {
      document.addEventListener("click", this.handleOutsideClick);
    }, 0);
  }
  closeDropdown() {
    if (this.dropdownElement) {
      this.dropdownElement.remove();
      this.dropdownElement = null;
      document.removeEventListener("click", this.handleOutsideClick);
    }
  }
}
const API_BASE_URL = "https://api.askmiso.com/v1/ask";
class RealApiService {
  constructor(token) {
    this.eventListeners = /* @__PURE__ */ new Map();
    this.token = token;
  }
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
    }
    this.eventListeners.get(event).add(callback);
  }
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  emit(event, error) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(error));
    }
  }
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    });
    if (!response.ok) {
      const apiError = {
        status: response.status,
        message: response.statusText || `Request failed with status ${response.status}`,
        endpoint
      };
      if (response.status === 401) {
        this.emit("unauthenticated", apiError);
      } else {
        this.emit("apiError", apiError);
      }
      throw apiError;
    }
    if (response.status === 204) {
      return void 0;
    }
    return response.json();
  }
  async getPlans() {
    return this.request("/myr/plan", {
      method: "GET"
    });
  }
  async getPlan(planId) {
    return this.request(`/myr/plan/${planId}`, {
      method: "GET"
    });
  }
  async getSuggestedPrompts(plan) {
    return this.request("/myr/prompt-suggestion", {
      method: "POST",
      body: JSON.stringify({ plan })
    });
  }
  async createPlan(messages) {
    return this.request("/myr/plan", {
      method: "POST",
      body: JSON.stringify({ messages })
    });
  }
  async getSwapSuggestion(planId, recipeIndex) {
    return this.request(
      `/myr/plan/${planId}/swap-suggestion?recipe_index=${recipeIndex}`,
      { method: "GET" }
    );
  }
  async updatePlanRecipes(planId, recipes) {
    return this.request(`/myr/plan/${planId}`, {
      method: "PATCH",
      body: JSON.stringify({ recipes })
    });
  }
  async sendCompletion(planId, messages) {
    return this.request(`/myr/plan/${planId}/completion`, {
      method: "POST",
      body: JSON.stringify({ messages })
    });
  }
  async deletePlan(planId) {
    await this.request(`/myr/plan/${planId}`, {
      method: "DELETE"
    });
  }
  async updatePlanTitle(planId, title) {
    return this.request(`/myr/plan/${planId}`, {
      method: "PATCH",
      body: JSON.stringify({ title })
    });
  }
}
function createApiService(token) {
  return new RealApiService(token);
}
const STORAGE_KEY_PREFIX = "misoForMyR:";
const USER_INFO_KEY = `${STORAGE_KEY_PREFIX}userInfo`;
class MisoWidgetInstance {
  constructor(config) {
    this.eventListeners = /* @__PURE__ */ new Map();
    this._planListingWidget = null;
    this._planDetailWidget = null;
    this._planListingCallbacks = null;
    this._planDetailCallbacks = null;
    this._userInfo = { favoriteRecipes: [] };
    this._checkedRecipeIds = /* @__PURE__ */ new Set();
    this.apiService = null;
    this.config = config || { token: "" };
    this.loadUserInfo();
    if (config == null ? void 0 : config.token) {
      this.initApiService(config.token);
    }
  }
  initApiService(token) {
    this.config.token = token;
    this.apiService = createApiService(token);
    this.apiService.on("unauthenticated", (error) => {
      this.emit("unauthenticated", error);
      this.invokePlanListingCallback("onUnauthenticated", error);
      this.invokePlanDetailCallback("onUnauthenticated", error);
    });
    this.apiService.on("apiError", (error) => {
      this.emit("apiError", error);
      this.invokePlanListingCallback("onApiError", error);
      this.invokePlanDetailCallback("onApiError", error);
    });
  }
  loadUserInfo() {
    try {
      const stored = sessionStorage.getItem(USER_INFO_KEY);
      if (stored) {
        this._userInfo = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load user info from sessionStorage:", e);
    }
  }
  saveUserInfo() {
    try {
      sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(this._userInfo));
    } catch (e) {
      console.error("Failed to save user info to sessionStorage:", e);
    }
  }
  // ============================================================
  // Public API - Token and User Info Management
  // ============================================================
  setAuthToken(token) {
    this.initApiService(token);
    return this;
  }
  clearAuthToken() {
    this.destroyPlanListingWidget();
    this.destroyPlanDetailWidget();
    this.apiService = null;
    this.config.token = "";
    return this;
  }
  setUserInfo(info) {
    this._userInfo = { ...this._userInfo, ...info };
    this.saveUserInfo();
    info.favoriteRecipes.forEach((id) => this._checkedRecipeIds.add(id));
    if (this._planDetailWidget) {
      this._planDetailWidget.setFavoriteRecipes(this._userInfo.favoriteRecipes);
    }
    return this;
  }
  clearUserInfo() {
    this._userInfo = { favoriteRecipes: [] };
    this._checkedRecipeIds.clear();
    sessionStorage.removeItem(USER_INFO_KEY);
    if (this._planDetailWidget) {
      this._planDetailWidget.setFavoriteRecipes([]);
    }
    return this;
  }
  getUserInfo() {
    return { ...this._userInfo };
  }
  getCheckedRecipeIds() {
    return this._checkedRecipeIds;
  }
  addToFavorites(recipeId) {
    if (!this._userInfo.favoriteRecipes.includes(recipeId)) {
      this._userInfo.favoriteRecipes.push(recipeId);
      this._checkedRecipeIds.add(recipeId);
      this.saveUserInfo();
    }
  }
  mergeFavorites(recipeIds, isFavorite) {
    for (let i = 0; i < recipeIds.length; i++) {
      const recipeId = recipeIds[i];
      this._checkedRecipeIds.add(recipeId);
      if (isFavorite[i] && !this._userInfo.favoriteRecipes.includes(recipeId)) {
        this._userInfo.favoriteRecipes.push(recipeId);
      }
    }
    this.saveUserInfo();
  }
  // ============================================================
  // Public API - Widget Access
  // ============================================================
  get planListingWidget() {
    return this._planListingWidget;
  }
  get planDetailWidget() {
    return this._planDetailWidget;
  }
  // ============================================================
  // Events
  // ============================================================
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
    }
    this.eventListeners.get(event).add(callback);
  }
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  emit(event, ...args) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(...args));
    }
  }
  // ============================================================
  // Widget Rendering
  // ============================================================
  renderPlanListingWidget(container, callbacks) {
    if (!this.apiService) {
      throw new Error("Auth token not set. Call setAuthToken() before rendering widgets.");
    }
    this.destroyPlanListingWidget();
    this._planListingCallbacks = callbacks || null;
    this._planListingWidget = new PlanListingWidget(container, this, callbacks);
    this._planListingWidget.render();
  }
  destroyPlanListingWidget() {
    if (this._planListingWidget) {
      this._planListingWidget.destroy();
      this._planListingWidget = null;
      this._planListingCallbacks = null;
    }
  }
  renderPlanDetailWidget(container, planId, options) {
    if (!this.apiService) {
      throw new Error("Auth token not set. Call setAuthToken() before rendering widgets.");
    }
    this.destroyPlanDetailWidget();
    this._planDetailCallbacks = options || null;
    this._planDetailWidget = new PlanDetailWidget(container, this, planId, options);
    this._planDetailWidget.render();
  }
  destroyPlanDetailWidget() {
    if (this._planDetailWidget) {
      this._planDetailWidget.destroy();
      this._planDetailWidget = null;
      this._planDetailCallbacks = null;
    }
  }
  // ============================================================
  // Plan Data Access
  // ============================================================
  async getPlans() {
    if (!this._planListingWidget) {
      return [];
    }
    return this._planListingWidget.getPlans();
  }
  async refreshPlans() {
    if (this._planListingWidget) {
      await this._planListingWidget.refreshPlans();
    }
  }
  getConfig() {
    return this.config;
  }
  // ============================================================
  // Callback Invocation Helpers
  // ============================================================
  invokePlanListingCallback(name, ...args) {
    var _a;
    const callback = (_a = this._planListingCallbacks) == null ? void 0 : _a[name];
    if (callback) {
      callback(...args);
    }
  }
  invokePlanDetailCallback(name, ...args) {
    var _a;
    const callback = (_a = this._planDetailCallbacks) == null ? void 0 : _a[name];
    if (callback && typeof callback === "function") {
      callback(...args);
    }
  }
  async checkIsInFavorite(recipeIds) {
    var _a;
    const callback = (_a = this._planDetailCallbacks) == null ? void 0 : _a.isInFavorite;
    if (!callback) return;
    const uncheckedIds = recipeIds.filter((id) => !this._checkedRecipeIds.has(id));
    if (uncheckedIds.length === 0) return;
    try {
      const results = await callback(uncheckedIds);
      this.mergeFavorites(uncheckedIds, results);
      if (this._planDetailWidget) {
        this._planDetailWidget.setFavoriteRecipes(this._userInfo.favoriteRecipes);
      }
    } catch (e) {
      console.error("isInFavorite callback failed:", e);
    }
  }
}
let instance = null;
function getOrCreateInstance() {
  if (!instance) {
    instance = new MisoWidgetInstance();
  }
  return instance;
}
const misoForMyRSDK = {
  setAuthToken(token) {
    return getOrCreateInstance().setAuthToken(token);
  },
  clearAuthToken() {
    return getOrCreateInstance().clearAuthToken();
  },
  setUserInfo(info) {
    return getOrCreateInstance().setUserInfo(info);
  },
  clearUserInfo() {
    return getOrCreateInstance().clearUserInfo();
  },
  on(event, callback) {
    getOrCreateInstance().on(event, callback);
  },
  off(event, callback) {
    getOrCreateInstance().off(event, callback);
  },
  renderPlanListingWidget(container, callbacks) {
    getOrCreateInstance().renderPlanListingWidget(container, callbacks);
  },
  destroyPlanListingWidget() {
    getOrCreateInstance().destroyPlanListingWidget();
  },
  renderPlanDetailWidget(container, planId, options) {
    getOrCreateInstance().renderPlanDetailWidget(container, planId, options);
  },
  destroyPlanDetailWidget() {
    getOrCreateInstance().destroyPlanDetailWidget();
  },
  getPlans() {
    return getOrCreateInstance().getPlans();
  },
  refreshPlans() {
    return getOrCreateInstance().refreshPlans();
  },
  get planListingWidget() {
    return getOrCreateInstance().planListingWidget;
  },
  get planDetailWidget() {
    return getOrCreateInstance().planDetailWidget;
  }
};
if (typeof window !== "undefined") {
  window.misoForMyR = misoForMyRSDK;
}
export {
  misoForMyRSDK as default
};
//# sourceMappingURL=miso-myrecipe-widget.esm.js.map
