import { condenser } from './condenser';
import { custom } from './custom';
import { editor } from './editor';
import { expander } from './expander';
import { microblog } from './microblog';
import { seo } from './seo';
import type { Prompt } from '../types';

const Prompts: Record<string, Prompt>  = {
  condenser,
  custom,
  editor,
  expander,
  microblog,
  seo,
};

export default Prompts;