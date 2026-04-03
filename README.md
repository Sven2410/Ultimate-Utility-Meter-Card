# Ultimate Meter Card

A custom Lovelace card for Home Assistant that displays electricity and gas meter readings in an elegant glass-style layout. Designed for Dutch smart meters (DSMR) but works with any energy sensor.

## Features

- **Electricity readings** — displays delivered and returned energy for both low and high tariffs
- **Optional gas meter** — toggle gas on/off in the editor; hidden when not needed
- **Dutch number formatting** — values displayed with comma decimals and dot thousands separators (e.g. 1.234,56 kWh)
- **Glass morphism style** — frosted glass design consistent with the Ultimate Card series
- **GUI Editor** — visual configuration with entity pickers for each meter and a gas toggle switch
- **Clean layout** — delivered and returned readings side by side with a vertical separator

## Installation

### HACS (recommended)

1. Open HACS in Home Assistant
2. Go to **Frontend** → click the **⋮** menu → **Custom repositories**
3. Add `https://github.com/Sven2410/ultimate-meter-card` with category **Dashboard**
4. Click **Install**
5. Refresh your browser (hard refresh: Ctrl+Shift+R)

### Manual

1. Download `ultimate-meter-card.js` from the [latest release](https://github.com/Sven2410/ultimate-meter-card/releases/latest)
2. Copy it to `/config/www/ultimate-meter-card.js`
3. Add the resource in **Settings → Dashboards → ⋮ → Resources**:
   - URL: `/local/ultimate-meter-card.js`
   - Type: JavaScript Module

## Configuration

### Visual Editor

1. Add a card to your dashboard
2. Search for **Ultimate Meter Card**
3. Fill in the four electricity sensor entities
4. Toggle "Gebruik je gas?" if you have a gas meter
5. Fill in the gas sensor entity

### YAML

```yaml
type: custom:ultimate-meter-card
name: Meterstanden
delivered_low: sensor.electricity_meter_energy_tariff_1
delivered_high: sensor.electricity_meter_energy_tariff_2
returned_low: sensor.electricity_meter_returned_tariff_1
returned_high: sensor.electricity_meter_returned_tariff_2
show_gas: true
gas_entity: sensor.gas_meter
```

| Option           | Type    | Required | Default        | Description                              |
|------------------|---------|----------|----------------|------------------------------------------|
| `name`           | string  | No       | Meterstanden   | Card title                               |
| `delivered_low`  | string  | **Yes**  |                | Sensor for delivered energy, low tariff   |
| `delivered_high` | string  | **Yes**  |                | Sensor for delivered energy, high tariff  |
| `returned_low`   | string  | **Yes**  |                | Sensor for returned energy, low tariff    |
| `returned_high`  | string  | **Yes**  |                | Sensor for returned energy, high tariff   |
| `show_gas`       | boolean | No       | `false`        | Whether to show the gas meter section     |
| `gas_entity`     | string  | No       |                | Sensor for gas meter reading              |

## Screenshots

_Coming soon_

## License

MIT
