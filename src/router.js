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
  },
  {
    path: '/thyroid_age',
    name: 'thyroid_age',
    component: () => import('./pages/Thyroid.vue') , 
    meta: { breadcrumb: [ { name: 'thyroid-age-specific' } ] }
  },
  {
    path: '/china_hdi',
    name: 'china_hdi',
    component: () => import('./pages/ChinaHDI.vue') , 
    meta: { breadcrumb: [ { name: 'china_hdi' } ] }
  },
  {
    path: '/prostate_2023',
    name: 'prostate_2023',
    component: () => import('./pages/2023_Prostate.vue') , 
    meta: { breadcrumb: [ { name: 'prostate_2023' } ] }
  },
  {
    path: '/cost',
    name: 'cost',
    component: () => import('./pages/Cost.vue') , 
    meta: { breadcrumb: [ { name: 'cost' } ] }
  },
  // aliases
  { path: "/:catchAll(.*)", redirect: '/404' }
] ; 

const Router = createRouter({ history, routes });

export default Router ; 