<template>
  <div class="filters">
    <label v-for="filter in filters" :key="filter">
      <input type="checkbox" :value="filter" v-model="selectedFilters" @change="onFilterChange"> {{ filter }}
    </label>
  </div>
</template>

<script>
export default {
    name: 'FiltersComponent',
  data() {
    return {
      filters: ['TOP2', '港三', '华五', 'C9', '985', '211', '双非', '四非', '研究院', '联培', '已开营', '已结营'],
      selectedFilters: []
    };
  },
  methods: {
    onFilterChange() {
      this.$emit('filter-change', this.selectedFilters);
    }
  }
};
</script>

<style scoped>
.filters {
    display: flex;
    justify-content: center;
    column-gap: 20px; /* 控制标签之间的间距 */
    flex-wrap: wrap;
}

.filters label {
    display: flex;
    align-items: center;
    font-family: 'Courier New', monospace; /* 使用等宽字体 */
    font-size: 16px;
    font-weight: bold;
    line-height: 1.5;
}
</style>