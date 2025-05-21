<template>
  <div class="tree-table">
    <div class="controls">
      <button @click="toggleEditMode" class="mode-button">
        {{ isEditMode ? 'View Mode' : 'Edit Mode' }}
      </button>
      <div v-if="isEditMode" class="history-controls">
        <button @click="undo" :disabled="!canUndo" class="undo-button">Undo</button>
        <button @click="redo" :disabled="!canRedo" class="redo-button">Redo</button>
      </div>
    </div>

    <ag-grid-vue
      class="ag-theme-quartz custom-grid"
      style="height: 80vh; width: 100%"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :gridOptions="gridOptions"
      @grid-ready="onGridReady"
      @cell-clicked="onCellClicked"
      @cell-editing-stopped="onCellEditingStopped"
    >
    </ag-grid-vue>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineOptions, onMounted, onUnmounted, watch } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { Item, TreeStore } from '../services/TreeStore'
import {
  BUTTON_BASE_CLASS,
  BUTTON_ADD_CLASS,
  BUTTON_DELETE_CLASS,
  BUTTON_ADD_STYLES,
  BUTTON_DELETE_STYLES,
} from '../styles/buttonStyles'
import '../styles/tree-table.css'

defineOptions({
  components: {
    AgGridVue,
  },
})

const store = new TreeStore()
const storeState = computed(() => store.reactiveState)
const isEditMode = ref(false)
const gridApi = ref<any>(null)
const expandedGroups = ref(new Set<string>())
const rowData = computed(() => {
  const expandedSet = isEditMode.value
    ? new Set(
        store
          .getAll()
          .filter((item) => store.getChildren(item.id).length > 0)
          .map((item) => String(item.id)),
      )
    : expandedGroups.value

  return getTreeData(expandedSet)
})

const getTreeData = (expandedSet: Set<string>) => {
  const rootItems = store.getAll().filter((item) => item.parent === null)
  const result: Item[] = []

  const addItems = (items: Item[]) => {
    for (const item of items) {
      result.push(item)
      if (expandedSet.has(String(item.id))) {
        const children = store.getOrderedChildren(item.id, expandedSet)
        addItems(children)
      }
    }
  }

  addItems(rootItems)
  return result
}

const updateColumnWidths = () => {
  if (!gridApi.value) return

  const container = document.querySelector('.ag-root-wrapper')
  if (!container) return

  const gridRect = container.getBoundingClientRect()
  const totalWidth = gridRect.width

  gridApi.value.setColumnWidths(
    [
      { colId: 'id', width: Math.floor(totalWidth * 0.08) },
      { colId: 'category', width: Math.floor(totalWidth * 0.22) },
      { colId: 'label', width: Math.floor(totalWidth * 0.7) },
    ],
    true,
  )
}

const onGridReady = (params: any) => {
  gridApi.value = params.api
  console.log('Grid API initialized:', params.api)

  console.log('Available methods:', {
    setColumnDefs: typeof params.api.setColumnDefs,
    setColumnWidths: typeof params.api.setColumnWidths,
  })

  gridApi.value.sizeColumnsToFit()
}

const handleResize = () => {
  if (gridApi.value) {
    setTimeout(updateColumnWidths, 100)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  setTimeout(updateColumnWidths, 500)

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

watch(
  () => store.reactiveState,
  () => {
    if (gridApi.value) {
      gridApi.value.refreshCells({
        columns: ['category'],
        force: true,
      })
    }
  },
  { deep: true },
)

const gridOptions = {
  animateRows: true,
  suppressCellFocus: true,
  groupDefaultExpanded: -1,
  getRowId: (params) => String(params.data.id),
  autoGroupColumnDef: {
    headerName: 'Group',
    minWidth: 250,
    cellRendererParams: {
      suppressCount: true,
    },
  },
  defaultColDef: {
    suppressHeaderMenuButton: true,
    cellStyle: {
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
    },
    resizable: false,
    sortable: false,
    filter: false,
    headerClass: 'custom-header',
  },
}

const createCategoryRenderer = (params: any, isEditMode: boolean) => {
  const isGroup = store.getChildren(params.data.id).length > 0
  const parents = store.getAllParents(params.data.id)
  const level = Math.max(0, parents.length - 1)
  const arrowWidth = 16
  const perLevelPadding = 20
  const groupId = String(params.data.id)
  const isExpanded = expandedGroups.value.has(groupId)
  const hasChildren = store.getChildren(params.data.id).length > 0

  const levelPadding = level * perLevelPadding
  const textPadding = isGroup ? 8 : 0

  const status = computed(() => (store.getChildren(params.data.id).length > 0 ? 'Группа' : 'Элемент'))

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;height:100%;width:300px;box-sizing:border-box;
    padding-left:${levelPadding}px">
      <div>
        ${
          isGroup && hasChildren
            ? `<span style="display:inline-block;width:${arrowWidth}px;text-align:center;font-weight:bold;">
                  ${isExpanded ? '▼' : '▶'}
               </span>`
            : ''
        }
        <span style="margin-left:${isGroup && hasChildren ? textPadding : arrowWidth + textPadding}px;font-weight:${isGroup && hasChildren ? 'bold' : ''};">${status.value}</span>
      </div>
      ${
        isEditMode
          ? `
        <div style="margin-left:auto;display:flex;gap:4px;">
          <button
            class="${BUTTON_BASE_CLASS} ${BUTTON_ADD_CLASS}"
            style="${BUTTON_ADD_STYLES}"
          >+</button>
          <button
            class="${BUTTON_BASE_CLASS} ${BUTTON_DELETE_CLASS}"
            style="${BUTTON_DELETE_STYLES}"
          >×</button>
        </div>
      `
          : ''
      }
    </div>
  `
}

const columnDefs = computed(() => {
  return [
    {
      headerName: '№ п\\п',
      field: 'id',
      width: 80,
      suppressMovable: true,
      valueFormatter: (params) => String(params.value ?? ''),
    },
    {
      headerName: 'Категория',
      colId: 'category',
      width: 150,
      cellRenderer: (params) => createCategoryRenderer(params, isEditMode.value),
      suppressMovable: true,
    },
    {
      headerName: 'Наименование',
      field: 'label',
      suppressMovable: true,
    },
  ]
})

const onCellClicked = (params: any) => {
  if (!params.data || !params.column) return

  const groupId = String(params.data.id)
  const hasChildren = store.getChildren(params.data.id).length > 0
  const event = params.event
  const target = event?.target as HTMLElement
  const isRoot = store.getAllParents(params.data.id).length === 0

  if (isEditMode.value && target?.classList) {
    if (target.classList.contains(BUTTON_ADD_CLASS)) {
      event?.stopPropagation()
      const newId = store.generateNewId()
      store.addItem({
        parent: params.data.id,
        id: newId,
        label: `Новый элемент ${newId}`,
      })
      updateTableData()
      return
    }

    if (target.classList.contains(BUTTON_DELETE_CLASS) && !isRoot) {
      event?.stopPropagation()
      store.removeItem(params.data.id)
      updateTableData()
      return
    }
  }

  if (!isEditMode.value && hasChildren && params.column.getColId() === 'category') {
    const newExpandedGroups = new Set(expandedGroups.value)
    if (newExpandedGroups.has(groupId)) {
      newExpandedGroups.delete(groupId)
    } else {
      newExpandedGroups.add(groupId)
    }
    expandedGroups.value = newExpandedGroups

    refreshCategoryCells()
    return
  }
}

const updateTableData = () => {
  if (!gridApi.value) return

  const expanded = isEditMode.value
    ? new Set(
        store
          .getAll()
          .filter((item) => store.getChildren(item.id).length > 0)
          .map((item) => String(item.id)),
      )
    : expandedGroups.value

  gridApi.value.setGridOption('rowData', getTreeData(expanded))
}

const refreshCategoryCells = () => {
  if (gridApi.value) {
    gridApi.value.refreshCells({
      columns: ['category'],
      force: true,
    })
  }
}

const onCellEditingStopped = (params: any) => {
  const item = rowData.value.find((i) => i.id === params.data.id)
  if (item) {
    store.updateItem({ ...item, label: params.newValue })
  }
}

const toggleEditMode = async () => {
  isEditMode.value = !isEditMode.value

  if (!gridApi.value) return

  const newColumnDefs = [
    {
      headerName: '№ п\\п',
      field: 'id',
      width: 80,
      suppressMovable: true,
      valueFormatter: (params) => String(params.value),
    },
    {
      headerName: 'Категория',
      colId: 'category',
      width: 150,
      cellRenderer: (params: any) => createCategoryRenderer(params, isEditMode.value),
      suppressMovable: true,
    },
    {
      headerName: 'Наименование',
      field: 'label',
      suppressMovable: true,
    },
  ]

  if (gridApi.value) {
    gridApi.value.setGridOption('columnDefs', newColumnDefs)
    gridApi.value.setGridOption(
      'rowData',
      getTreeData(
        isEditMode.value
          ? new Set(
              store
                .getAll()
                .filter((item) => store.getChildren(item.id).length > 0)
                .map((item) => String(item.id)),
            )
          : expandedGroups.value,
      ),
    )
    gridApi.value.refreshCells({
      columns: ['category'],
      force: true,
    })
  } else {
    console.warn('Grid API is not initialized yet')
  }
  gridApi.value.refreshCells({
    columns: ['category'],
    force: true,
  })
  gridApi.value.sizeColumnsToFit()
  gridApi.value.refreshCells({ force: true })
}

const undo = () => {
  store.undo()
  updateTableData()
}

const redo = () => {
  store.redo()
  updateTableData()
}

const canUndo = computed(() => store.historyIndex >= 0)
const canRedo = computed(() => store.historyIndex < store.history.length - 1)
</script>

<style scoped>
@import '../styles/tree-table.css';
</style>
