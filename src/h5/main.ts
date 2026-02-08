import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'vant/lib/index.css'
// 引入 Vant 函数式组件样式
import 'vant/es/toast/style';
import 'vant/es/dialog/style';
import 'vant/es/notify/style';
import 'vant/es/image-preview/style';

import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
