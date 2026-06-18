<script setup lang="ts">
import { ref } from 'vue';
const data = [
  {
    id: 1,
    time: "09:00",
    draw: "avcda",
    country: "America-USA",
    score: "1-0",
    court: "The club of Malmoe"
  }];
const matches = ref(data)
</script>

<template>
  <div class="page">
    <div class="table_container">
      <table class="match_table">
        <thead>
          <tr>
            <th style="padding-right: 50px">Time</th>
            <th style="padding-right: 100px">Draw</th>
            <th style="padding-right: 100px">Countries</th>
            <th style="padding-right: 100px">Score</th>
            <th style="padding-right: 50px">Court</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="match in matches" :key="match.id">
            <td>{{ match.time }}</td>
            <td>{{ match.draw }}</td>
            <td>{{match.country}}</td>
            <td>{{match.score}}</td>
            <td>{{match.court}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped></style>
