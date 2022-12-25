import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { API } from '@aws-amplify/api';
import { PubSub } from '@aws-amplify/pubsub';
import awsconfig from './aws-exports';
API.configure(awsconfig);
PubSub.configure(awsconfig);
// Vue.config.productionTip = false

createApp(App).mount('#app')
