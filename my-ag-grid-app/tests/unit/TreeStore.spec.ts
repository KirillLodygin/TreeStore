import { describe, it, expect, beforeEach } from 'vitest'
import { TreeStore, Item } from '@/services/TreeStore'

describe('TreeStore', () => {
  let store: TreeStore

  beforeEach(() => {
    store = new TreeStore()
  })

  describe('Initialization', () => {
    it('should initialize with items', () => {
      const items = store.getAll()
      expect(items.length).toBeGreaterThan(0)
    })

    it('should have root items with null parent', () => {
      const items = store.getAll()
      const rootItems = items.filter((item) => item.parent === null)
      expect(rootItems.length).toBeGreaterThan(0)
    })
  })

  describe('Item Management', () => {
    it('should get item by id', () => {
      const items = store.getAll()
      const firstItem = items[0]
      const retrievedItem = store.getItem(firstItem.id)
      expect(retrievedItem).toEqual(firstItem)
    })

    it('should get children of an item', () => {
      const items = store.getAll()
      const children = store.getChildren(items[0].id)
      expect(Array.isArray(children)).toBe(true)
    })

    it('should get all children recursively', () => {
      const items = store.getAll()
      const allChildren = store.getAllChildren(items[0].id)
      expect(Array.isArray(allChildren)).toBe(true)
      expect(allChildren.length).toBeGreaterThan(0)
    })

    it('should get ordered children with expanded groups', () => {
      const items = store.getAll()
      const expandedGroups = new Set(['1', '2'])
      const orderedChildren = store.getOrderedChildren(items[0].id, expandedGroups)
      expect(Array.isArray(orderedChildren)).toBe(true)
      expect(orderedChildren.length).toBeGreaterThan(0)
    })
  })

  describe('Parent Management', () => {
    it('should get all parents of an item', () => {
      const items = store.getAll()
      const item = items[1]
      const parents = store.getAllParents(item.id)
      expect(Array.isArray(parents)).toBe(true)
      expect(parents.length).toBeGreaterThan(0)
      expect(parents[0].id).not.toEqual(item.id)
    })
  })
})