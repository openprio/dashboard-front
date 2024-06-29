import './app.css'
import App from './App.svelte'
// Import the functions you need from the SDKs you need
import Dashboard from "./views/Dashboard.svelte";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const app = new App({
  target: document.getElementById('app'),
})

window.component = Dashboard;
export default app
