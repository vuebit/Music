import { creatApp } from 'vue';
import { creatPinia } from "pinia";
import App from './App.vue'
import { onMounted, ref } from 'vue'

const app = creatApp(App)
const pinia = creatPinia()

app.use(pinia)
app.mount('#app')


// خط axios قبلی را حذف یا کامنت کنید
// const res = await axios(...)

  