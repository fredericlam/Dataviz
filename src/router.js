import { createWebHistory, createRouter } from "vue-router";

const history = createWebHistory();

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/Cervix.vue') , 
    meta: { breadcrumb: [ { name: 'home' } ] }
  },
  {
    path: '/thyroid',
    name: 'thyroid',
    component: () => import('./pages/Thyroid.vue') , 
    meta: { breadcrumb: [ { name: 'thyroid' } ] }
  }/*,
  {
    path: '/thyroid-age-specific',
    name: 'thyroid-age-specific',
    component: () => import('./pages/Thyroid.vue') , 
    meta: { breadcrumb: [ { name: 'thyroid-age-specific' } ] }
  }*/,
  // aliases
  { path: "/:catchAll(.*)", redirect: '/404' }
] ; 

const Router = createRouter({ history, routes });

export default Router ; 