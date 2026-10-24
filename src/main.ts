import { createApp } from 'vue';
import './assets/Audio.css';
import './assets/video.css';
import './assets/music.css';
import './assets/app.css'
import App from './App.vue';
import router from './router';
import './assets/login.css';

// import axios from "axios"

createApp(App).use(router).mount('#app')
