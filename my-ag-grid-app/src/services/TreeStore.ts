import { items } from '../constants/items'
import { reactive } from 'vue'

export type Item = {
  id: number | string
  parent: null | number | string
  label: string
}

export class TreeStore {
  private state = reactive({
    items: [] as Item[],
    history: [] as { action: string; data: any }[],
    historyIndex: -1,
  })

  private refs = reactive({
    map: new Map<number | string, Item>(),
    childrenMap: new Map<number | string, Item[]>(),
  })

  constructor() {
    this.initializeStore()
  }

  get reactiveState() {
    return this.state
  }

  private initializeStore() {
    this.state.items = [...items]
    this.rebuildMaps()
  }

  private rebuildMaps() {
    const map = new Map<number | string, Item>()
    const childrenMap = new Map<number | string, Item[]>()

    for (const item of this.state.items) {
      map.set(item.id, item)
      if (item.parent) {
        if (!childrenMap.has(item.parent)) {
          childrenMap.set(item.parent, [])
        }
        childrenMap.get(item.parent)?.push(item)
      }
    }

    this.refs.map = map
    this.refs.childrenMap = childrenMap
  }

  getAll(): Item[] {
    return this.state.items
  }

  getItem(id: number | string): Item | undefined {
    return this.refs.map.get(id)
  }

  getChildren(id: number | string): Item[] {
    return this.refs.childrenMap.get(id) || []
  }

  getAllChildren(id: number | string): Item[] {
    const result: Item[] = []
    const stack = [...this.getChildren(id)]

    while (stack.length > 0) {
      const item = stack.pop()!
      result.push(item)
      stack.push(...this.getChildren(item.id))
    }

    return result
  }

  getOrderedChildren(id: number | string, expandedGroups: Set<string>): Item[] {
    const children = this.getChildren(id)
    const result: Item[] = []

    for (const child of children) {
      result.push(child)
      if (expandedGroups.has(String(child.id))) {
        result.push(...this.getOrderedChildren(child.id, expandedGroups))
      }
    }

    return result
  }

  getAllParents(id: number | string): Item[] {
    const result: Item[] = []
    let currentId: number | string | null = id

    while (currentId !== null) {
      const item = this.getItem(currentId)
      if (item) {
        result.unshift(item)
        currentId = item.parent
      } else {
        break
      }
    }

    return result
  }

  private recordHistory(action: string, data: any) {
    this.state.history = [
      ...this.state.history.slice(0, ++this.state.historyIndex),
      { action, data },
    ]
  }

  addItem(item: { parent: number | string; id: number; label: string }): void {
    const newItem = { ...item }
    this.state.items.push(newItem)

    this.refs.map.set(newItem.id, newItem)

    if (!this.refs.childrenMap.has(newItem.parent)) {
      this.refs.childrenMap.set(newItem.parent, [])
    }
    this.refs.childrenMap.get(newItem.parent)?.push(newItem)

    this.recordHistory('add', newItem)
    this._forceStateUpdate()
  }

  generateNewId(): number {
    const ids = Array.from(this.refs.map.keys())
      .map((id) => Number(id))
      .filter((id) => !isNaN(id))

    return ids.length ? Math.max(...ids) + 1 : 1
  }

  removeItem(id: number | string): void {
    const item = this.getItem(id)
    if (!item) return

    const children = this.getAllChildren(id)
    const allToRemove = [item, ...children]

    this.state.items = this.state.items.filter((i) => !allToRemove.some((r) => r.id === i.id))

    allToRemove.forEach((item) => {
      this.refs.map.delete(item.id)
      this.refs.childrenMap.delete(item.id)
    })

    this.refs.childrenMap.forEach((children, parentId) => {
      const filtered = children.filter((child) => !allToRemove.some((r) => r.id === child.id))
      if (filtered.length !== children.length) {
        this.refs.childrenMap.set(parentId, filtered)
      }
    })

    this.recordHistory('remove', { id, item, children })
    this._forceStateUpdate()
  }

  updateItem(updatedItem: { parent: null | number | string; id: number | string; label: any }): void {
    const index = this.state.items.findIndex((item) => item.id === updatedItem.id)
    if (index === -1) return

    const oldItem = { ...this.state.items[index] }
    this.state.items.splice(index, 1, { ...updatedItem })
    this.refs.map.set(updatedItem.id, updatedItem)

    if (oldItem.parent && updatedItem.parent && oldItem.parent !== updatedItem.parent) {
      const oldParentChildren = this.refs.childrenMap.get(oldItem.parent) || []
      this.refs.childrenMap.set(
        oldItem.parent,
        oldParentChildren.filter((child) => child.id !== updatedItem.id)
      )

      if (!this.refs.childrenMap.has(updatedItem.parent)) {
        this.refs.childrenMap.set(updatedItem.parent, [])
      }
      this.refs.childrenMap.get(updatedItem.parent)?.push(updatedItem)
    }

    this.recordHistory('update', { old: oldItem, new: updatedItem })
    this._forceStateUpdate()
  }

  undo(): boolean {
    if (this.state.historyIndex < 0) return false

    const lastAction = this.state.history[this.state.historyIndex]
    this.state.historyIndex--

    try {
      switch (lastAction.action) {
        case 'add':
          this._removeItemWithoutHistory(lastAction.data.id)
          break
        case 'remove':
          const { item, children } = lastAction.data
          this._addItemWithoutHistory(item)
          children.forEach((child: Item) => this._addItemWithoutHistory(child))
          break
        case 'update':
          this._updateItemWithoutHistory(lastAction.data.old)
          break
        default:
          return false
      }
    } finally {
      this._forceStateUpdate()
    }

    return true
  }

  redo(): boolean {
    if (this.state.historyIndex >= this.state.history.length - 1) return false
    const lastAction = this.state.history[++this.state.historyIndex]

    try {
      switch (lastAction.action) {
        case 'add':
          this._addItemWithoutHistory(lastAction.data)
          break
        case 'remove':
          this._removeItemWithoutHistory(lastAction.data.id)
          break
        case 'update':
          this._updateItemWithoutHistory(lastAction.data.new)
          break
        default:
          return false
      }
    } finally {
      this._forceStateUpdate()
    }

    return true
  }

  private _forceStateUpdate() {
    this.state.items = [...this.state.items]
  }

  private _addItemWithoutHistory(item: Item): void {
    this.state.items.push(item)
    this.refs.map.set(item.id, item)

    if (item.parent) {
      if (!this.refs.childrenMap.has(item.parent)) {
        this.refs.childrenMap.set(item.parent, [])
      }
      this.refs.childrenMap.get(item.parent)?.push(item)
    }
  }

  private _removeItemWithoutHistory(id: number | string): void {
    const item = this.getItem(id)
    if (!item) return

    const children = this.getAllChildren(id)
    const allToRemove = [item, ...children]

    this.state.items = this.state.items.filter((i) => !allToRemove.some((r) => r.id === i.id))

    allToRemove.forEach((item) => {
      this.refs.map.delete(item.id)
      this.refs.childrenMap.delete(item.id)
    })

    this.refs.childrenMap.forEach((children, parentId) => {
      const filtered = children.filter((child) => !allToRemove.some((r) => r.id === child.id))
      if (filtered.length !== children.length) {
        this.refs.childrenMap.set(parentId, filtered)
      }
    })
  }

  private _updateItemWithoutHistory(updatedItem: Item): void {
    const index = this.state.items.findIndex((item) => item.id === updatedItem.id)
    if (index === -1) return

    const oldItem = { ...this.state.items[index] }
    this.state.items.splice(index, 1, updatedItem)
    this.refs.map.set(updatedItem.id, updatedItem)

    if (updatedItem.parent !== oldItem.parent) {
      if (oldItem.parent !== null) {
        const oldParentChildren = this.refs.childrenMap.get(oldItem.parent) || []
        this.refs.childrenMap.set(
          oldItem.parent,
          oldParentChildren.filter((child) => child.id !== updatedItem.id)
        )
      }

      const newParent = updatedItem.parent
      if (newParent !== null) {
        if (!this.refs.childrenMap.has(newParent)) {
          this.refs.childrenMap.set(newParent, [])
        }
        this.refs.childrenMap.get(newParent)?.push(updatedItem)
      }
    }
  }

  get historyIndex(): number {
    return this.state.historyIndex
  }

  get history(): { action: string; data: any }[] {
    return [...this.state.history]
  }
}