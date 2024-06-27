<template>
  <div class="details-card" @click.stop>
    <div>
      <h2>{{ school.name }} {{ school.institute }}</h2>
      <p>{{ school.description }}</p>
      <p><strong>日期:</strong> {{ school.date }}</p>
      <p><strong>网址:</strong> <a :href="school.website" target="_blank">{{ school.website }}</a></p>
      <div class="tags">
        <span v-for="tag in school.tags" :key="tag" :style="{color: hashColor(tag), borderColor: hashColor(tag)}">{{ tag }}</span>
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
    school: Object
  },
  methods: {
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
</style>
