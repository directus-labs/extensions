import InterfaceComponent from './interface.vue';

export default {
	id: 'ai-researcher',
	name: 'AI_Research',
	icon: 'box',
	description: 'Interface for AI Researcher!',
	component: InterfaceComponent,
  options: (ctx) => {
    return {
      standard: [
        { 
					field: 'apiKey',
					name: 'OpenAI API Key',
					type: 'string',
					meta: {
						required: true,
						options: {
							masked: true,
						},
						width: 'full',
						interface: 'input',
					},
				},
      ]
    }
  },
	types: ['string'],
};
