<template>
  <div class="search-container">
    <input type="text" v-model="searchQuery" @input="onSearch" placeholder="搜索学校或学院..." class="search-input">
    <button @click="clearSearch" class="clear-search">清空搜索</button>
  </div>
</template>

<script>
export default {
  name: 'SearchComponent',
  data() {
    return {
      searchQuery: ''
    };
  },
  methods: {
    onSearch() {
      this.$emit('search', this.searchQuery);
    },
    clearSearch() {
      this.searchQuery = '';
      this.$emit('search', this.searchQuery);
    }
  }
};
</script>

<style scoped>
.search-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.search-input {
  padding: 10px;
  font-size: 16px;
  width: 300px;
  max-width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-right: 10px;
}

.clear-search {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.clear-search:hover {
  background-color: #0056b3;
}
</style>
