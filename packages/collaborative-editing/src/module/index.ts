import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './settings.vue';

export default defineModule({
  id: 'collab-module',
  name: 'Collaborative Editing',
  icon: 'communication',
  routes: [
    {
      path: '',
      component: ModuleComponent,
    },
  ],
});
