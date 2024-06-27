<template>
  <div class="progress-ring">
    <svg width="100" height="100">
      <circle class="progress-ring__circle-bg" cx="50" cy="50" r="40"></circle>
      <circle class="progress-ring__circle" :stroke-dasharray="circumference" :stroke-dashoffset="offset" cx="50" cy="50" r="40"></circle>
    </svg>
    <div class="progress-ring__label">{{ labelName }}</div>
  </div>
</template>

<script>
export default {
  props: {
    label: String,
    progress: Number,
    num: [Number, String]
  },
  computed: {
    circumference() {
      return 2 * Math.PI * 40;
    },
    offset() {
      return this.circumference - (this.progress / 100) * this.circumference;
    },
    labelName() {
      return this.num === 'N/A' ? `${this.num}` : `${this.num} ${this.label}`;
    }
  }
};
</script>

<style scoped>
.progress-ring {
    width: 100px;
    position: relative;
    margin: 10px;
    text-align: center;
}

.progress-ring svg {
    position: relative;
}

.progress-ring circle {
    fill: none;
    stroke-width: 10;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
}

.progress-ring__circle-bg {
    stroke: #e0e0e0;
}

.progress-ring__circle {
    stroke: #007bff;
    transition: stroke-dasharray 0.3s;
}

.progress-ring__text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    fill: #333;
}
</style>