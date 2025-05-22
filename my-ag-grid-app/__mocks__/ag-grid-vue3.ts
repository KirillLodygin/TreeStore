import { defineComponent, h } from 'vue'

export const AgGridVue = defineComponent({
  name: 'AgGridVue',
  props: ['rowData', 'columnDefs'],
  setup(props, { slots }) {
    return () => h('div', { class: 'ag-grid-mock' }, [props.rowData?.length ? 'Grid data loaded' : 'No data'])
  },
})
