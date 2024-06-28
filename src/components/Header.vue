<template>
  <header>
    <div id="toggle-container">
      <div class="toggle-switch" :class="{ 'toggle-switch-text': countdownType === 'text' }" @click="toggleCountdownType">
        <div class="toggle-knob" :class="{ 'toggle-knob-text': countdownType === 'text' }"></div>
        <span class="toggle-label">文</span>
        <span class="toggle-label">〇</span>
      </div>
    </div>
    <h1>CS BAOYAN Deadlines</h1>
    <p>
      计算机保研DDL，
      <a href="https://github.com/CS-BAOYAN/cs-baoyan-ddl">GitHub链接</a>，
      欢迎PR。
    </p>
    <p>
      <strong>声明:</strong> 本网站排序使用时间+字典序排序，DDL均为人为收集，起到参考作用，如有错误不承担任何责任。
    </p>
    <p>
      全部DDL的显示使用 Asia/Shanghai 时间。一切20XX年XX月XX日截至的夏令营/预推免，在DDL中均显示为20XX年XX月XX+1日零点。
    </p>
    <div id="dropdown-container">
      <label for="source-select">选择数据源:</label>
      <select v-model="selectedSource" @change="onSourceChange" id="source-select">
        <option value="camp2024">夏令营2024</option>
        <option value="yutuimian2024">预推免2024</option>
      </select>
    </div>
  </header>
</template>

<script>
export default {
  name: 'HeaderComponent',
  data() {
    return {
      selectedSource: 'camp2024',
      countdownType: 'text'
    };
  },
  methods: {
    onSourceChange() {
      this.$emit('source-change', this.selectedSource);
    },
    toggleCountdownType() {
      this.countdownType = this.countdownType === 'ring' ? 'text' : 'ring';
      this.$emit('toggle-countdown', this.countdownType);
    }
  }
};
</script>

<style scoped>
header {
  margin-bottom: 20px;
  text-align: center;
  position: relative;
}

#toggle-container {
  position: absolute;
  top: 10px;
  left: 10px;
}

.toggle-switch {
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: #ddd;
  width: 60px;
  height: 30px;
  border-radius: 15px;
  position: relative;
  transition: background-color 0.3s;
}

.toggle-switch-text {
  background-color: #4CAF50; /* 文模式的背景色 */
}

.toggle-knob {
  width: 28px;
  height: 28px;
  background-color: #fff;
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: all 0.3s;
}

.toggle-knob-text {
  transform: translateX(30px);
}

.toggle-label {
  font-size: 14px;
  color: #666;
  user-select: none;
  width: 50%;
  text-align: center;
}

#dropdown-container {
  display: flex;
  align-items: center;
  gap: 10px;
  position: absolute;
  top: 10px;
  right: 10px;
}

#source-select {
  padding: 5px;
  font-size: 16px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

@media screen and (max-width: 768px) {
  #dropdown-container {
    position: static; /* 取消绝对定位 */
    margin-top: 10px; /* 增加顶部外边距 */
    justify-content: center; /* 居中对齐 */
  }

  .toggle-switch {
    width: 50px;
    height: 25px;
  }

  .toggle-knob {
    width: 23px;
    height: 23px;
  }

  .toggle-knob-text {
    transform: translateX(25px);
  }

  .toggle-label {
    font-size: 12px;
  }

  #dropdown-container {
    position: static;
    margin-top: 10px;
    justify-content: center;
  }
}
</style>
