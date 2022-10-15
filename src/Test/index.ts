import {createApp} from 'vue';
import {StoreManager} from "@idevelopthings/vue-class-stores/vue";
import App from './App.vue';
import './index.css';

const app = createApp(App);

StoreManager.extend(() => ({
	someGlobalFunc : () => 'hello!',
	someGlobalVar  : 'hello two!',
}));

app.use(StoreManager, import.meta.glob('./Stores/*', {eager : true}));
app.mount('#app');
