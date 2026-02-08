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
const imageChartRef = ref();
const imageChartRange = ref(12); // 默认 12 个月
const taskChartRange = ref(30); // 默认 30 天

const loadData = async () => {
  try {
    const data = await api.getDashboardStats(imageChartRange.value, taskChartRange.value);
    stats.value = data.counts;

    // Render Charts
    initChart(taskChartRef.value, `生成任务趋势 (近${taskChartRange.value}天)`, data.trends.tasks);
    initChart(imageChartRef.value, `图片上传量 (近${imageChartRange.value}个月)`, data.trends.images);

  } catch (error) {
    console.error(error);
  }
};

const handleRangeChange = () => {
    loadData();
};

onMounted(loadData);

const initChart = (dom: HTMLElement, title: string, data: any[]) => {
    if (!dom) return;
    
    // 如果没有数据，渲染一个空图表
    const safeData = data || [];
    const chart = echarts.init(dom);
    const dates = safeData.map(item => item.date);
    const values = safeData.map(item => item.count);

    chart.setOption({ 
        grid: { top: 20, right: 20, left: 20, bottom: 20, containLabel: true },
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
                <template #header>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>生成任务趋势</span>
                        <el-radio-group v-model="taskChartRange" size="small" @change="handleRangeChange">
                            <el-radio-button :label="7">近7天</el-radio-button>
                            <el-radio-button :label="30">近30天</el-radio-button>
                            <el-radio-button :label="90">近3个月</el-radio-button>
                        </el-radio-group>
                    </div>
                </template>
                <div ref="taskChartRef" style="height: 300px;"></div>
            </el-card>
        </el-col>
        <el-col :span="12">
            <el-card>
                <template #header>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>图片上传趋势</span>
                        <el-radio-group v-model="imageChartRange" size="small" @change="handleRangeChange">
                            <el-radio-button :label="1">近1个月</el-radio-button>
                            <el-radio-button :label="3">近3个月</el-radio-button>
                            <el-radio-button :label="6">近半年</el-radio-button>
                            <el-radio-button :label="12">近一年</el-radio-button>
                        </el-radio-group>
                    </div>
                </template>
                <div ref="imageChartRef" style="height: 300px;"></div>
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
