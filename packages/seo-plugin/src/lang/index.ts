import deDE from './de-DE';
import enUS from './en-US';
import esES from './es-ES';
import frFR from './fr-FR';
import itIT from './it-IT';
import jaJP from './ja-JP';
import koKR from './ko-KR';
import nlNL from './nl-NL';
import plPL from './pl-PL';
import ptBR from './pt-BR';
import viVN from './vi-VN';
import zhCN from './zh-CN';

// Locale codes match Directus's own (app/src/lang/translations). Missing keys fall back to en-US.
export default [
	{ language: 'en-US', translation: enUS },
	{ language: 'de-DE', translation: deDE },
	{ language: 'es-ES', translation: esES },
	// Regional variants reuse the closest translation instead of falling back to English
	{ language: 'es-419', translation: esES },
	{ language: 'es-CL', translation: esES },
	{ language: 'es-MX', translation: esES },
	{ language: 'fr-FR', translation: frFR },
	{ language: 'fr-CA', translation: frFR },
	{ language: 'it-IT', translation: itIT },
	{ language: 'ja-JP', translation: jaJP },
	{ language: 'ko-KR', translation: koKR },
	{ language: 'nl-NL', translation: nlNL },
	{ language: 'pl-PL', translation: plPL },
	{ language: 'pt-BR', translation: ptBR },
	{ language: 'pt-PT', translation: ptBR },
	{ language: 'vi-VN', translation: viVN },
	{ language: 'zh-CN', translation: zhCN },
];
