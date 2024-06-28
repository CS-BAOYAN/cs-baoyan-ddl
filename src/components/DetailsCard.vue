<template>
  <div class="details-card" @click.stop>
    <div>
      <h2>{{ updatedSchool.name }} {{ updatedSchool.institute }}</h2>
      <p>{{ updatedSchool.description }}</p>
      <p><strong>日期:</strong> {{ updatedSchool.date }}</p>
      <p><strong>网址:</strong> <a :href="updatedSchool.website" target="_blank">{{ updatedSchool.website }}</a></p>
      <div class="tags">
        <span v-for="tag in updatedSchool.tags" :key="tag" :style="{color: hashColor(tag), borderColor: hashColor(tag)}">{{ tag }}</span>
      </div>
      <div class="progress-container" v-if="countdownType === 'ring'">
        <ProgressRing v-for="(progress, label) in updatedSchool.progress" :key="label" :label="label" :progress="progress" :num="updatedSchool.times[label]"></ProgressRing>
      </div>
      <div class="text-countdown" v-else>
        {{ updatedSchool.countdown }}
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
    school: Object,
    countdownType: String
  },
  data() {
    return {
      intervalId: null,
    };
  },
  computed: {
    updatedSchool() {
      const now = new Date();
      const school = this.school; // 创建学校对象的副本
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
    }
  }
};
</script>

<style scoped>
.details-card {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.75);
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  border-radius: 15px;
  pointer-events: auto;
}

.details-card a {
  color: #007bff;
  word-break: break-all;
  text-decoration: none;
}

.tags {
  margin-top: 10px;
}

.tags span {
  display: inline-block;
  padding: 5px;
  margin-right: 5px;
  border: 1px solid;
  border-radius: 5px;
}

.progress-container {
  margin-top: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.text-countdown {
  font-size: 18px;
  color: #333;
}

@media screen and (max-width: 768px) {
  .details-card {
    width: 90%; /* 在手机上增加宽度 */
    padding: 10px; /* 减少内边距以适应手机屏幕 */
    flex-direction: column;
  }

  .progress-container {
    flex-direction: row; /* 保持水平排列 */
    flex-wrap: wrap; /* 允许换行以避免溢出 */
    justify-content: center; /* 居中对齐 */
  }

  .progress-container > * {
    flex: 1 1 45%; /* 允许每个进度环占据大约一半宽度 */
    margin: 5px; /* 增加间距以避免内容过于拥挤 */
  }
}
</style>
