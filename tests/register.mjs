import * as module from 'node:module';
import {load} from './runtime-loader.mjs';
if(module.registerHooks)module.registerHooks({load});
else module.register('./runtime-loader.mjs',import.meta.url);
