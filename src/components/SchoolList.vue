<template>
  <div id="school-list">
    <div v-for="school in filteredSchools" :key="school.id" :class="['school', school.timeRemaining === Infinity ? 'red' : 'green']" @click="showDetails(school)">
      <div>
        <h2>{{ school.name }} {{ school.institute }}</h2>
        <p>{{ school.description }}</p>
        <p><strong>日期:</strong> {{ school.date }}</p>
        <p><strong>网址:</strong> <a :href="school.website" target="_blank">{{ school.website }}</a></p>
        <div class="tags">
          <span v-for="tag in school.tags" :key="tag" :style="{color: hashColor(tag), borderColor: hashColor(tag)}">{{ tag }}</span>
        </div>
      </div>
      <div class="progress-container">
        <ProgressRing v-for="(progress, label) in school.progress" :key="label" :label="label" :progress="progress" :num="school.times[label]"></ProgressRing>
      </div>
    </div>
  </div>
</template>

<script>
import ProgressRing from './ProgressRing.vue';

export default {
  components: {
    ProgressRing
  },
  props: {
    schools: Array,
    selectedFilters: Array,
    searchQuery: String
  },
  computed: {
    filteredSchools() {
      const now = new Date();
      return this.schools
        .filter(school => {
          const matchesTags = this.selectedFilters.length === 0 || this.selectedFilters.every(tag => school.tags.includes(tag));
          const matchesSearch = this.searchQuery === '' || school.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || school.institute.toLowerCase().includes(this.searchQuery.toLowerCase());
          return matchesTags && matchesSearch;
        })
        .map(school => {
          if (school.deadline !== 'N/A' && school.deadline !== '') {
            const deadlineDate = new Date(school.deadline);
            const timeRemaining = deadlineDate - now;
            if (timeRemaining >= 0) {
              const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
              const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
              school.date = this.formatDate(deadlineDate);
              school.timeRemaining = timeRemaining;
              school.countdown = `${days} 天 ${hours} 小时 ${minutes} 分钟 ${seconds} 秒`;
              school.times = { days, hours, minutes, seconds };
              school.progress = {
                days: (days / 90) * 100,
                hours: (hours / 24) * 100,
                minutes: (minutes / 60) * 100,
                seconds: (seconds / 60) * 100
              };
            } else {
              school.timeRemaining = Infinity;
              school.countdown = '已经结束';
              school.date = this.formatDate(deadlineDate);
              school.times = { days: 0, hours: 0, minutes: 0, seconds: 0 };
              school.progress = { days: 100, hours: 100, minutes: 100, seconds: 100 };
            }
          } else {
            school.timeRemaining = 10000000000;
            school.countdown = 'N/A';
            school.date = 'N/A';
            school.times = { days: 'N/A', hours: 'N/A', minutes: 'N/A', seconds: 'N/A' };
            school.progress = { days: 0, hours: 0, minutes: 0, seconds: 0 };
          }
          return school;
        })
        .sort((a, b) => {
          if (a.timeRemaining === b.timeRemaining) {
            return a.name.localeCompare(b.name);
          }
          return a.timeRemaining - b.timeRemaining;
        });
    }
  },
  methods: {
    formatDate(date) {
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      return new Intl.DateTimeFormat('zh-CN', options).format(date);
    },
    hashColor(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
      return "#" + "00000".substring(0, 6 - color.length) + color;
    },
    showDetails(school) {
      this.$emit('show-details', school);
    }
  }
};
</script>

<style scoped>
.school {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.school:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.school h2 {
  margin-top: 0;
  font-size: 24px;
  color: #333;
}

.school p {
  margin: 10px 0;
  font-size: 16px;
  color: #666;
}

.school a {
  color: #007bff;
  word-break: break-all;
  text-decoration: none;
}

.school a:hover {
  text-decoration: underline;
}

.school .tags {
  display: flex;
  flex-wrap: wrap;
}

.school .tags span {
  background: #f4f4f9;
  border-radius: 3px;
  padding: 5px 10px;
  margin-right: 10px;
  margin-bottom: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
}

.progress-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.school.green {
  background-color: #e6ffed;
}

.school.red {
  background-color: #ffe6e6;
}

@media screen and (max-width: 768px) {
  .school {
    flex-direction: column;
  }

  .progress-container {
    flex-wrap: wrap;
  }
}
</style>
