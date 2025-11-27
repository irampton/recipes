<template>
  <div class="relative" data-cookbook-select>
    <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div class="flex flex-1 cursor-pointer items-center gap-2" @click="openList">
        <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: selectedColor }"></span>
        <input
        ref="inputRef"
        :value="selectedLabel"
        type="text"
        class="w-full cursor-pointer bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        :class="{ 'caret-transparent select-none': open }"
        :placeholder="placeholder"
        :disabled="disabled"
        readonly
        :style="{ caretColor: open ? 'transparent' : '' }"
        @focus="openList"
        @keydown.down.prevent="highlight(1)"
        @keydown.up.prevent="highlight(-1)"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc.prevent="closeList"
          @keydown="handleType"
        />
      </div>
      <button
        type="button"
        class="text-slate-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="disabled"
        @click.stop="toggleList"
        aria-label="Toggle list"
      >
        ▾
      </button>
    </div>

    <div v-if="open" class="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
      <div v-if="query" class="px-2 pb-1 text-xs text-slate-500">Filtering by "{{ query }}"</div>
      <div v-if="filteredItems.length">
        <button
          v-for="(item, idx) in filteredItems"
          :key="item.id"
          type="button"
          class="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition hover:bg-orange-50"
          :class="{ 'bg-orange-50': idx === highlighted }"
          @click="select(item)"
        >
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: item.color || '#fb923c' }"></span>
            <span class="font-semibold text-slate-800">{{ item.name }}</span>
          </div>
          <span class="text-xs text-slate-500">{{ item.ownerUsername || 'You' }}</span>
        </button>
      </div>
      <div v-else class="px-3 py-2 text-sm text-slate-500">No matches</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CookbookSelect',
  props: {
    modelValue: {
      type: Object,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    items: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: 'Choose a cookbook',
    },
  },
  data() {
    return {
      open: false,
      highlighted: -1,
      query: '',
    };
  },
  computed: {
    selectedItem() {
      return this.modelValue || null;
    },
    selectedLabel() {
      return this.selectedItem?.name || '';
    },
    selectedColor() {
      if (this.selectedItem?.color) return this.selectedItem.color;
      return '#e2e8f0';
    },
    filteredItems() {
      const term = this.query.trim().toLowerCase();
      const list = this.items || [];
      if (!term) return list;
      return list.filter((item) => {
        const name = (item.name || '').toLowerCase();
        const owner = (item.ownerUsername || '').toLowerCase();
        return name.includes(term) || owner.includes(term);
      });
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    emitSelection(item) {
      this.$emit('update:modelValue', item);
    },
    openList() {
      if (this.disabled) return;
      this.open = true;
      this.query = '';
      this.highlighted = this.filteredItems.length ? 0 : -1;
    },
    closeList() {
      this.open = false;
      this.highlighted = -1;
      this.query = '';
    },
    toggleList() {
      if (this.disabled) return;
      if (this.open) {
        this.closeList();
      } else {
        this.openList();
        this.focusInput();
      }
    },
    focusInput() {
      const input = this.$refs.inputRef;
      if (input && input.focus) input.focus();
    },
    select(item) {
      if (this.disabled) return;
      this.emitSelection(item);
      this.closeList();
    },
    highlight(delta) {
      if (this.disabled || !this.filteredItems.length) return;
      const next = (this.highlighted + delta + this.filteredItems.length) % this.filteredItems.length;
      this.highlighted = next;
    },
    selectHighlighted() {
      if (this.highlighted >= 0 && this.highlighted < this.filteredItems.length) {
        this.select(this.filteredItems[this.highlighted]);
      }
    },
    handleType(event) {
      if (this.disabled) return;
      if (!this.open) this.openList();
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Backspace') {
        this.query = this.query.slice(0, -1);
        this.highlighted = this.filteredItems.length ? 0 : -1;
        event.preventDefault();
        return;
      }
      if (event.key.length === 1) {
        this.query += event.key;
        this.highlighted = this.filteredItems.length ? 0 : -1;
        event.preventDefault();
      }
    },
    handleClickOutside(event) {
      if (!(event.target.closest && event.target.closest('[data-cookbook-select]'))) {
        this.closeList();
      }
    },
  },
};
</script>
