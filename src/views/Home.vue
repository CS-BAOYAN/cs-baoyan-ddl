<template>
  <div class="container">
    <div :class="{ 'blur-background': selectedSchool }">
      <HeaderComponent @source-change="onSourceChange" @toggle-countdown="onToggleCountdown"></HeaderComponent>
      <FiltersComponent @filter-change="onFilterChange"></FiltersComponent>
      <SearchComponent @search="onSearch"></SearchComponent>
      <SchoolList :schools="schools" :selectedFilters="selectedFilters" :searchQuery="searchQuery" :countdownType="countdownType" @show-details="showDetails"></SchoolList>
    </div>
    <div v-if="selectedSchool" class="overlay" @click="hideDetails"></div>
    <DetailsCard v-if="selectedSchool" :school="selectedSchool" :countdownType="countdownType"></DetailsCard>
  </div>
</template>

<script>
import HeaderComponent from '../components/Header.vue';
import FiltersComponent from '../components/Filters.vue';
import SearchComponent from '../components/Search.vue';
import SchoolList from '../components/SchoolList.vue';
import DetailsCard from '../components/DetailsCard.vue';

export default {
  name: 'HomeView',
  components: {
    HeaderComponent,
    FiltersComponent,
    SearchComponent,
    SchoolList,
    DetailsCard
  },
  data() {
    return {
      schools: [],
      selectedFilters: [],
      searchQuery: '',
      currentSource: 'yutuimian2024',
      selectedSchool: null,
      countdownType: 'text' // 初始倒计时类型
    };
  },
  methods: {
    loadData(source) {
      fetch('/cs-baoyan-ddl/config/schools.json')
      // fetch('/config/schools.json')
        .then(response => response.json())
        .then(data => {
          this.schools = data[source];
          this.updateSelectedSchool();
        });
    },
    onSourceChange(source) {
      this.currentSource = source;
      this.loadData(source);
    },
    onFilterChange(filters) {
      this.selectedFilters = filters;
    },
    onSearch(query) {
      this.searchQuery = query;
    },
    showDetails(school) {
      this.selectedSchool = school;
    },
    hideDetails() {
      this.selectedSchool = null;
    },
    onToggleCountdown(type) {
      this.countdownType = type;
    },
    updateSelectedSchool() {
      if (this.selectedSchool) {
        const updatedSchool = this.schools.find(school => school.name === this.selectedSchool.name && school.institute === this.selectedSchool.institute);
        if (updatedSchool) {
          this.selectedSchool = updatedSchool;
        }
      }
    }
  },
  mounted() {
    this.loadData(this.currentSource);
    this.intervalId = setInterval(() => {
      this.loadData(this.currentSource);
    }, 1000); // 10秒更新一次
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

.blur-background {
  filter: blur(10px);
  pointer-events: none;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 999;
  pointer-events: auto;
}
</style>
