/**
 * Ultimate Meter Card
 * A custom Lovelace card for Home Assistant
 * Displays electricity meter readings (delivered/returned, low/high tariff) and optional gas
 *
 * Version: 1.0.2
 */

/* ============================================================
   EDITOR
   ============================================================ */
class UltimateMeterCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._rendered = false;
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._buildDOM();
    } else {
      this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((p) => (p.hass = hass));
    }
  }

  setConfig(config) {
    this._config = { ...config };
    if (this._rendered) this._updateValues();
  }

  _val(key, fallback) {
    return this._config[key] !== undefined ? this._config[key] : (fallback !== undefined ? fallback : "");
  }

  _buildDOM() {
    if (!this._hass) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        .row { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
        .row.hidden { display:none; }
        label { font-size:13px; font-weight:500; color:var(--primary-text-color); }
        ha-entity-picker, ha-textfield { display:block; width:100%; }
        .section-title {
          font-size:12px; font-weight:700; color:var(--primary-text-color);
          text-transform:uppercase; letter-spacing:0.05em;
          margin:8px 0 4px; opacity:0.6;
        }
        .toggle-row {
          display:flex; align-items:center; gap:12px;
          margin-bottom:16px; padding:10px 12px;
          background: var(--card-background-color, #1c1c1c);
          border:1px solid var(--divider-color, #333);
          border-radius:10px;
        }
        .toggle-row label { flex:1; margin:0; }
        .toggle-switch {
          position:relative; width:42px; height:24px; flex-shrink:0;
        }
        .toggle-switch input {
          opacity:0; width:0; height:0; position:absolute;
        }
        .toggle-slider {
          position:absolute; cursor:pointer; inset:0;
          background:rgba(255,255,255,0.15); border-radius:12px;
          transition:background .2s;
        }
        .toggle-slider:before {
          content:""; position:absolute; height:18px; width:18px;
          left:3px; bottom:3px; background:#fff; border-radius:50%;
          transition:transform .2s;
        }
        .toggle-switch input:checked + .toggle-slider {
          background: var(--primary-color, #03a9f4);
        }
        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(18px);
        }
      </style>

      <div class="section-title">Geleverd</div>

      <div class="row">
        <label>Tarief laag</label>
        <ha-entity-picker id="delivered_low" allow-custom-entity></ha-entity-picker>
      </div>
      <div class="row">
        <label>Tarief hoog</label>
        <ha-entity-picker id="delivered_high" allow-custom-entity></ha-entity-picker>
      </div>

      <div class="section-title">Teruggeleverd</div>

      <div class="row">
        <label>Tarief laag</label>
        <ha-entity-picker id="returned_low" allow-custom-entity></ha-entity-picker>
      </div>
      <div class="row">
        <label>Tarief hoog</label>
        <ha-entity-picker id="returned_high" allow-custom-entity></ha-entity-picker>
      </div>

      <div class="section-title">Gas</div>

      <div class="toggle-row" id="gasToggleRow" style="cursor:pointer;">
        <label style="cursor:pointer;">Gebruik je gas?</label>
        <div class="toggle-switch">
          <input type="checkbox" id="show_gas">
          <span class="toggle-slider"></span>
        </div>
      </div>

      <div class="row" id="row-gas">
        <label>Gasmeter</label>
        <ha-entity-picker id="gas_entity" allow-custom-entity></ha-entity-picker>
      </div>
    `;

    // --- Wire entity pickers ---
    const fields = ["delivered_low", "delivered_high", "returned_low", "returned_high", "gas_entity"];
    fields.forEach((key) => {
      const picker = this.shadowRoot.getElementById(key);
      picker.hass = this._hass;
      picker.value = this._val(key);
      picker.includeDomains = ["sensor"];
      picker.addEventListener("value-changed", (ev) => {
        if (ev.detail.value !== this._val(key)) {
          this._config = { ...this._config, [key]: ev.detail.value };
          this._fireChanged();
        }
      });
    });

    // --- Wire gas toggle ---
    const gasToggle = this.shadowRoot.getElementById("show_gas");
    const gasToggleRow = this.shadowRoot.getElementById("gasToggleRow");
    gasToggle.checked = this._val("show_gas", false);
    this._toggleGasRow(gasToggle.checked);

    // Click anywhere on the row to toggle
    gasToggleRow.addEventListener("click", (e) => {
      if (e.target === gasToggle) return; // let native checkbox handle itself
      gasToggle.checked = !gasToggle.checked;
      gasToggle.dispatchEvent(new Event("change"));
    });
    gasToggle.addEventListener("change", () => {
      this._config = { ...this._config, show_gas: gasToggle.checked };
      this._toggleGasRow(gasToggle.checked);
      this._fireChanged();
    });

    this._rendered = true;
  }

  _toggleGasRow(show) {
    const row = this.shadowRoot.getElementById("row-gas");
    if (row) row.classList.toggle("hidden", !show);
  }

  _updateValues() {
    ["delivered_low", "delivered_high", "returned_low", "returned_high", "gas_entity"].forEach((key) => {
      const picker = this.shadowRoot.getElementById(key);
      if (picker) picker.value = this._val(key);
    });

    const gasToggle = this.shadowRoot.getElementById("show_gas");
    if (gasToggle) {
      gasToggle.checked = this._val("show_gas", false);
      this._toggleGasRow(gasToggle.checked);
    }
  }

  _fireChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }
}
customElements.define("ultimate-meter-card-editor", UltimateMeterCardEditor);

/* ============================================================
   MAIN CARD
   ============================================================ */
class UltimateMeterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  static getConfigElement() {
    return document.createElement("ultimate-meter-card-editor");
  }

  static getStubConfig() {
    return {
      delivered_low: "",
      delivered_high: "",
      returned_low: "",
      returned_high: "",
      show_gas: false,
      gas_entity: "",
    };
  }

  setConfig(config) {
    this._config = { ...config };
    this._buildStructure();
    if (this._hass) this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  getCardSize() {
    return this._config.show_gas ? 3 : 2;
  }

  /* --- Build DOM once --- */
  _buildStructure() {
    const showGas = this._config.show_gas || false;

    this.shadowRoot.innerHTML = `
      <div class="mc">
        <div class="section">
          <div class="col">
            <div class="ch">
              <ha-icon icon="mdi:transmission-tower-import" style="--mdc-icon-size:16px;color:rgba(255,255,255,0.4);display:flex;"></ha-icon>
              <span class="cl">Geleverd</span>
            </div>
            <div class="ri">
              <span class="rl">Laag</span>
              <span class="rv" id="valDL">-- kWh</span>
            </div>
            <div class="ri">
              <span class="rl">Hoog</span>
              <span class="rv" id="valDH">-- kWh</span>
            </div>
          </div>
          <div class="sep"></div>
          <div class="col">
            <div class="ch">
              <ha-icon icon="mdi:transmission-tower-export" style="--mdc-icon-size:16px;color:rgba(255,255,255,0.4);display:flex;"></ha-icon>
              <span class="cl">Teruggeleverd</span>
            </div>
            <div class="ri">
              <span class="rl">Laag</span>
              <span class="rv" id="valRL">-- kWh</span>
            </div>
            <div class="ri">
              <span class="rl">Hoog</span>
              <span class="rv" id="valRH">-- kWh</span>
            </div>
          </div>
        </div>

        <div class="divider" id="gasDivider" style="${showGas ? "" : "display:none;"}"></div>

        <div class="gas" id="gasRow" style="${showGas ? "" : "display:none;"}">
          <ha-icon icon="mdi:meter-gas-outline" style="--mdc-icon-size:18px;color:rgba(255,255,255,0.4);display:flex;"></ha-icon>
          <span class="gl">Gas</span>
          <span class="gv" id="valGas">-- m³</span>
        </div>
      </div>
      ${this._styles()}
    `;

    this._els = {
      valDL: this.shadowRoot.getElementById("valDL"),
      valDH: this.shadowRoot.getElementById("valDH"),
      valRL: this.shadowRoot.getElementById("valRL"),
      valRH: this.shadowRoot.getElementById("valRH"),
      valGas: this.shadowRoot.getElementById("valGas"),
      gasRow: this.shadowRoot.getElementById("gasRow"),
      gasDivider: this.shadowRoot.getElementById("gasDivider"),
    };
  }

  _styles() {
    return `<style>
      :host { display:block; }
      .mc {
        border-radius: 28px;
        background: none;
        overflow: hidden;
        backdrop-filter: blur(3px) saturate(120%);
        -webkit-backdrop-filter: blur(3px) saturate(120%);
        box-shadow:
          inset 0 1px 2px rgba(255,255,255,.35),
          inset 0 2px 4px rgba(0,0,0,.15),
          0 2px 6px rgba(0,0,0,.45);
        padding: 16px 20px;
        font-family: var(--primary-font-family, sans-serif);
      }
      .section {
        display: flex;
        gap: 0;
      }
      .col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .sep {
        width: 1px;
        background: rgba(255,255,255,0.08);
        margin: 0 16px;
        flex-shrink: 0;
      }
      .ch {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }
      .cl {
        font-size: 12px;
        font-weight: 700;
        color: rgba(255,255,255,0.65);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .ri {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }
      .rl {
        font-size: 11px;
        font-weight: 600;
        color: rgba(255,255,255,0.4);
        width: 36px;
        flex-shrink: 0;
      }
      .rv {
        font-size: 13px;
        font-weight: 600;
        color: rgba(255,255,255,0.85);
      }
      .divider {
        height: 1px;
        background: rgba(255,255,255,0.08);
        margin: 14px 0;
      }
      .gas {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gl {
        font-size: 12px;
        font-weight: 700;
        color: rgba(255,255,255,0.65);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .gv {
        font-size: 13px;
        font-weight: 600;
        color: rgba(255,255,255,0.85);
        margin-left: auto;
      }
    </style>`;
  }

  /* --- Update values only --- */
  _update() {
    if (!this._els || !this._hass) return;

    // Electricity values
    this._els.valDL.textContent = this._fmtKwh(this._config.delivered_low);
    this._els.valDH.textContent = this._fmtKwh(this._config.delivered_high);
    this._els.valRL.textContent = this._fmtKwh(this._config.returned_low);
    this._els.valRH.textContent = this._fmtKwh(this._config.returned_high);

    // Gas
    const showGas = this._config.show_gas || false;
    this._els.gasRow.style.display = showGas ? "" : "none";
    this._els.gasDivider.style.display = showGas ? "" : "none";
    if (showGas) {
      this._els.valGas.textContent = this._fmtM3(this._config.gas_entity);
    }
  }

  _getVal(entityId) {
    if (!entityId || !this._hass.states[entityId]) return null;
    return parseFloat(this._hass.states[entityId].state);
  }

  _formatNL(num) {
    // Dutch formatting: 1.234,56
    if (isNaN(num)) return "--";
    const parts = num.toFixed(2).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return intPart + "," + parts[1];
  }

  _fmtKwh(entityId) {
    const v = this._getVal(entityId);
    return v !== null ? this._formatNL(v) + " kWh" : "-- kWh";
  }

  _fmtM3(entityId) {
    const v = this._getVal(entityId);
    return v !== null ? this._formatNL(v) + " m³" : "-- m³";
  }
}

customElements.define("ultimate-meter-card", UltimateMeterCard);

/* ============================================================
   REGISTER WITH HA
   ============================================================ */
window.customCards = window.customCards || [];
window.customCards.push({
  type: "ultimate-meter-card",
  name: "Ultimate Meter Card",
  description:
    "Een stijlvolle meterstandenkaart die elektriciteit (geleverd/teruggeleverd, laag/hoog tarief) en optioneel gas toont.",
  preview: true,
  documentationURL: "https://github.com/Sven2410/ultimate-meter-card",
});

console.info(
  "%c ULTIMATE-METER-CARD %c v1.0.2 ",
  "color:#fff;background:#2196F3;font-weight:bold;padding:2px 6px;border-radius:4px 0 0 4px;",
  "color:#2196F3;background:#f0f0f0;font-weight:bold;padding:2px 6px;border-radius:0 4px 4px 0;"
);
