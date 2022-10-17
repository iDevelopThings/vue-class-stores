import {StoreManager} from "@idevelopthings/vue-class-stores/vue";
import {createApp} from 'vue';
import {Logger, LoggerLevel} from "../Lib/Logger";
import App from './App.vue';
import './index.css';

const app = createApp(App);

Logger.setLevel(LoggerLevel.Debug);

StoreManager.extend(() => ({
	someGlobalFunc : () => 'hello!',
	someGlobalVar  : 'hello two!',
}));

app.use(StoreManager.boot());

app.mount('#app');

(window as any).app = app;
