import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TreeTable from '../../src/components/TreeTable.vue'
import { TreeStore } from '@/services/TreeStore'

describe('TreeTable', () => {
  let wrapper: any
  let store: TreeStore

  beforeEach(() => {
    store = new TreeStore()
    wrapper = mount(TreeTable, {
      global: {
        provide: {
          store,
        },
      },
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Mode Switching', () => {
    it('should toggle between edit and view mode', async () => {
      expect(wrapper.vm.isEditMode).toBe(false)

      const modeButton = wrapper.find('.mode-button')
      await modeButton.trigger('click')
      expect(wrapper.vm.isEditMode).toBe(true)

      await modeButton.trigger('click')
      expect(wrapper.vm.isEditMode).toBe(false)
    })

    it('should show history controls in edit mode', async () => {
      const modeButton = wrapper.find('.mode-button')
      await modeButton.trigger('click')

      const historyControls = wrapper.find('.history-controls')
      expect(historyControls.exists()).toBe(true)
    })
  })

  describe('Edit Mode', () => {
    beforeEach(async () => {
      const modeButton = wrapper.find('.mode-button')
      await modeButton.trigger('click')
    })

    it('should show undo/redo buttons', () => {
      const undoButton = wrapper.find('.undo-button')
      const redoButton = wrapper.find('.redo-button')
      expect(undoButton.exists()).toBe(true)
      expect(redoButton.exists()).toBe(true)
    })

    it('should disable undo/redo buttons when not available', () => {
      const undoButton = wrapper.find('.undo-button')
      const redoButton = wrapper.find('.redo-button')
      expect(undoButton.attributes()).toHaveProperty('disabled')
      expect(redoButton.attributes()).toHaveProperty('disabled')
    })

    it('should enable undo button after making changes', async () => {
      store.addItem({ id: 'new-item', label: 'New Item', parent: null })
      await wrapper.vm.$nextTick()

      const undoButton = wrapper.find('.undo-button')
      expect(undoButton.attributes('disabled')).toBeFalsy()
    })
  })
})
