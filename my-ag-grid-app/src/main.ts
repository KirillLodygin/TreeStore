import { createApp } from 'vue'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import './style.css'
import App from './App.vue'

import { ModuleRegistry } from 'ag-grid-community'
import { AllEnterpriseModule } from 'ag-grid-enterprise'

import { LicenseManager } from 'ag-grid-enterprise'
import { licenseKey } from './license/ag-grid-license'

import { provideGlobalGridOptions } from 'ag-grid-community'

ModuleRegistry.registerModules([AllEnterpriseModule])
provideGlobalGridOptions({ theme: 'legacy' })

if (licenseKey) {
  LicenseManager.setLicenseKey(licenseKey)
} else {
  console.warn('AG Grid license key is missing!')
}

const app = createApp(App)

app.mount('#app')
