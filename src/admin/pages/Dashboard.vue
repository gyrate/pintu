<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import * as echarts from 'echarts';

const stats = ref({
  users: 0,
  tasks: 0,
  images: 0,
  results: 0
});

const taskChartRef = ref();
const loginChartRef = ref();

onMounted(async () => {
  try {
    const data = await api.getDashboardStats();
    stats.value = data.counts;

    // Render Charts
    initChart(taskChartRef.value, '生成任务趋势', data.trends.tasks);
    initChart(loginChartRef.value, '用户登录趋势', data.trends.logins);

  } catch (error) {
    console.error(error);
  }
});

const initChart = (dom: HTMLElement, title: string, data: any[]) => {
    if (!dom) return;
    
    // 如果没有数据，渲染一个空图表
    const safeData = data || [];
    const chart = echarts.init(dom);
    const dates = safeData.map(item => item.date);
    const values = safeData.map(item => item.count);

    chart.setOption({
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dates },
        yAxis: { type: 'value' },
        series: [{ data: values, type: 'line', smooth: true }]
    });

    window.addEventListener('resize', () => chart.resize());
};
</script>

<template>
  <div class="dashboard">
    <!-- 概览卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header">总用户数</div></template>
          <div class="card-value">{{ stats.users }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header">总任务数</div></template>
          <div class="card-value">{{ stats.tasks }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header">媒体文件数</div></template>
          <div class="card-value">{{ stats.images }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header">生成结果数</div></template>
          <div class="card-value">{{ stats.results }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
            <el-card>
                <div ref="taskChartRef" style="height: 300px;"></div>
            </el-card>
        </el-col>
        <el-col :span="12">
            <el-card>
                <div ref="loginChartRef" style="height: 300px;"></div>
            </el-card>
        </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.card-header {
    font-size: 14px;
    color: #666;
}
.card-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  text-align: center;
}
</style>
