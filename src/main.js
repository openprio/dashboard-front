import './app.css'
import App from './App.svelte'

import { mount } from "svelte";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const app = mount(App, {
  target: document.getElementById('app'),
})

window.component = Dashboard;
export default app
